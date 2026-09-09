/* Copyright (c) 2025 Richard Rodger, MIT License */

// TRANSFORMATION: `emit(select, table)` (G9 phase 6,
// docs/design/EMIT.0.md). Apply-templates, with the dispatch in the
// engine and none of it in user space.
//
//   emit($.services, [
//     {match: {kind: sqs}, body: [`listen(` + .pin + `)`]}
//     {match: {kind: http}, body: [`serve(` + .path + `)`]}
//   ])
//
// For every node of `select`, in order, the first template whose
// `match` the node unifies with is taken and its `body` instantiated
// AGAINST THAT NODE. The result is one flat list.
//
// WHY THIS CANNOT BE WRITTEN IN THE DOCUMENT (EMIT.0.md, "What it
// takes"). A rule table held as a value cannot be dispatched against:
// a body referenced by path resolves its relative references AT THE
// DEFINITION SITE, and the positional resolution that does exist is a
// dot COUNT that does not survive being consumed by a second dispatch.
// The builtin instantiates a body at the node it matched -- a NAMED
// origin -- which is the whole capability.
//
// THE BODY'S RELATIVE REFERENCES ARE BOUND TO THE NODE. `.pin` inside
// a body is the matched node's `pin`, and `_` is the node itself, as
// it is in every other generator. The binding is done HERE rather than
// left to path resolution: a relative path is a COUNT taken wherever
// the value comes to rest, and the nodes of a computed selection
// (`filter(...)`) come to rest nowhere -- there is no position for a
// count to be taken from. An ABSOLUTE reference is untouched and still
// reads the document root.
//
// The binding stops at a nested generator's own binding argument
// (boundArgStart): a rule table nested in a body is the INNER emit's
// to bind, so `.x` inside it is the inner node. What crosses the
// boundary is the nested call's SELECTOR, which is argument 0 and is
// bound here -- the selector is the channel.
//
// THE RESULT IS FLAT, and that is a constraint rather than a
// convenience: the fragment algebra is flat because the nested
// spelling refuses even a valid instance in both ports, so a dispatch
// returning a tree would undo that ruling. A body element that is
// itself a list SPLICES, which is what makes a nested emit compose.
//
// A VALUE REACHES THE BODY THROUGH `replace`, NOT A DELIMITER
// (docs/design/TEMPLATE.0.md D3, D4; RENDER.0.md P6). A template may
// carry a `replace` map whose key is an exact string the body already
// holds as ordinary target text and whose value is evaluated against
// the matched node, and an `esc` naming the convention every value is
// escaped by -- the C/JSON escape when absent, `none` the one opt-out.
// Three rules: a single left-to-right scan of a literal line taking
// the longest key at each position; a substituted value is never
// re-scanned, so no value can introduce a key; and a template's
// replacements touch its own literal text only, never a result spliced
// in from a nested dispatch. Two checks run on the template before any
// node: a key inside another key (replace_overlap) and a key the body
// does not hold (replace_unused). There is no hole syntax, and that is
// the point: any inline delimiter is somebody's syntax.
//
// NO MATCH IS AN ERROR (`emit_none`). XSLT's built-in rule copies an
// unhandled node's string value into the result, which for code output
// means model data landing silently in the middle of a source file.
// That is the single worst default in the prior art and it is refused.
// An EMPTY selection, by contrast, emits nothing -- which is the whole
// conditional mechanism, and why no `when` directive exists.
//
// A NAMED TABLE IS A PLACEHELD `emit` (`%wire = emit(_, T)`). A table
// written at a document position is DRIVEN there, so its bodies'
// relative references resolve against wherever it sits and miss;
// nothing in the language holds a value unevaluated at such a
// position, and what does hold one is a CALL's template argument.
// `emit(.listen, %wire)` follows the reference and reads the table out
// of the placeheld call; `.listen & %wire` fills the hole. Both are
// the same dispatch, and it is what lets a rule set name ITSELF.
//
// TERMINATION IS THE SELECTION'S. Unlike `pack` and `form`, this one
// recurses -- a nested model walked into nested output is the
// capability the rule layer exists to add -- so the bound is not "it
// cannot call itself" but "each dispatch descends into a finite bag
// that already exists, and a selection that empties emits nothing". A
// rule set that walks into itself WITHOUT descending is charged to the
// depth budget and refused as `unify_cycle`, like any other runaway
// descent.

import type {
  Val,
  ValSpec,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import { unite } from '../unify'
import { makeNilErr } from '../err'
import { isEscVariant, escapeText } from '../escape'
import { cmpCodePoint } from '../keyorder'
import { top } from './top'
import { ListVal } from './ListVal'
import { StringVal } from './StringVal'
import { FuncBaseVal, trialUnify } from './FuncBaseVal'
import { repathInstance } from './Val'
import type { EmitOrigin } from './Val'
import { boundArgStart, fillPlace, rebuild } from './PlaceVal'
import { plusText } from './PlusOpVal'
import { bagMembers } from './members'


// One entry of the rule table: the pattern to try, the body to
// instantiate, and -- TEMPLATE.0.md D3 and D4 -- the `replace` map and
// the `esc` convention its values take, with the literal spots of the
// body the replacements are written into. A table is a LIST of these;
// a single template map is that list of one, told apart by kind,
// exactly as match() tells its patterns apart.
type Template = {
  match: Val,
  body: Val,
  replace?: Val,
  esc: string,
  lits: LitSpot[],
  // The rule's index in its table, which with the table's own address
  // is the address the trace names it by (RENDER.0.md P7).
  idx: number,
}


// One literal string of a body: element `i`, and within a map element
// the `of` index or the `text` key, with the text itself.
type LitSpot = { i: number, of?: number, text?: boolean, s: string }


// What is wrong with a table, with the detail the message carries.
type Refusal = { code: string, details?: Record<string, string> }


// One replacement: the key, and the text it becomes at a node.
type Pair = [string, string]


function isRefusal(x: any): x is Refusal {
  return 'string' === typeof x.code
}


// Read the table. A map is one template; a list is many. The shape is
// checked here rather than at the call, because a table is ordinary
// data and may be computed.
function tableTemplates(table: Val | undefined): Template[] | Refusal {
  const t: any = table

  // A NAMED TABLE IS A PLACEHELD `emit`, and its table is the table.
  // A table written at a document position is DRIVEN there -- a body's
  // relative references resolve against wherever it sits and miss --
  // so the position that holds one unevaluated is the one position the
  // language already never drives: a call's template argument.
  // `%wire = emit(_, [ … ])` is that position with the selection left
  // open, and it reads as what it is, an apply-templates waiting for
  // its nodes: `emit(.listen, %wire)` passes them, `.listen & %wire`
  // fills the hole, and both are the same dispatch.
  if (true === t?.isEmitFunc) {
    return tableTemplates(t.peg[1])
  }

  if (true === t?.isMap) {
    const one = oneTemplate(t, 0)
    return isRefusal(one) ? one : [one]
  }

  if (true === t?.isList) {
    const out: Template[] = []
    for (const el of t.peg as Val[]) {
      const e: any = el
      if (true !== e?.isMap) {
        return { code: 'emit_template' }
      }
      const one = oneTemplate(e, out.length)
      if (isRefusal(one)) {
        return one
      }
      out.push(one)
    }
    return out
  }

  return { code: 'emit_table' }
}


// One rule. Both keys are required: a template with no pattern would
// match everything by accident, and one with no body would emit
// nothing while claiming a node. The two optional keys -- a `replace`
// map and an `esc` naming the convention its values are escaped by,
// `none` the one opt-out -- are the template's shape too, and D3's two
// static checks run here, on the template alone, before any node.
function oneTemplate(m: any, idx: number): Template | Refusal {
  const match: Val = m.peg.match
  const body: any = m.peg.body
  if (null == match || null == body) {
    return { code: 'emit_template' }
  }
  if (true !== body.isList) {
    return { code: 'emit_body' }
  }

  const replace: any = m.peg.replace
  if (null != replace && true !== replace.isMap) {
    return { code: 'emit_template' }
  }

  const escv: any = m.peg.esc
  let esc = ''
  if (null != escv) {
    const name = textOf(escv)
    if (undefined === name || ('none' !== name && !isEscVariant(name))) {
      return { code: 'esc_variant' }
    }
    esc = name
  }

  const lits = literalSpots(body.peg)
  if (null != replace) {
    const bad = checkReplace(Object.keys(replace.peg), lits)
    if (undefined !== bad) {
      return bad
    }
  }

  return { match, body, replace, esc, lits, idx }
}


// The string a value carries, or undefined when it is not a string.
function textOf(v: any): string | undefined {
  return true === v?.isScalar && 'string' === typeof v.peg ? v.peg : undefined
}


// The literal strings of a body -- a string element, and the strings
// written directly in a map element's `of` list or `text` -- which are
// the text the template wrote. A string an expression or a nested
// dispatch computes is not one: D3's third rule (a spliced result is
// finished) and its second (a substituted value is never re-scanned)
// both follow from substituting at these spots and nowhere else.
function literalSpots(elems: Val[]): LitSpot[] {
  const out: LitSpot[] = []
  elems.forEach((el: any, i: number) => {
    const s = textOf(el)
    if (undefined !== s) {
      out.push({ i, s })
      return
    }
    if (true !== el?.isMap) {
      return
    }
    const of: any = el.peg.of
    if (true === of?.isList) {
      (of.peg as any[]).forEach((p: any, j: number) => {
        const ps = textOf(p)
        if (undefined !== ps) {
          out.push({ i, of: j, s: ps })
        }
      })
    }
    const ts = textOf(el.peg.text)
    if (undefined !== ts) {
      out.push({ i, text: true, s: ts })
    }
  })
  return out
}


// D3's two static checks, on the template alone and before any node:
// a key inside another is ambiguous whatever the order
// (replace_overlap), and a key no literal holds means the template
// drifted from its map (replace_unused). Keys are visited in code
// point order, so both ports name the same pair.
function checkReplace(keys: string[], lits: LitSpot[]): Refusal | undefined {
  const sorted = [...keys].sort(cmpCodePoint)
  for (const a of sorted) {
    for (const b of sorted) {
      if (a !== b && b.includes(a)) {
        return { code: 'replace_overlap', details: { key: quoted(a), other: quoted(b) } }
      }
    }
  }
  for (const k of sorted) {
    if ('' === k || !lits.some((l) => l.s.includes(k))) {
      return { code: 'replace_unused', details: { key: quoted(k) } }
    }
  }
  return undefined
}


// D3's first two rules as one scan: at each position the longest key
// that matches is taken and its value written out whole, and the scan
// moves past the KEY -- the value is never looked at again, so no
// value can introduce a key.
function substitute(text: string, pairs: Pair[]): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const hit = pairs.find((p) => text.startsWith(p[0], i))
    if (undefined === hit) {
      out += text[i]
      i += 1
    }
    else {
      out += hit[1]
      i += hit[0].length
    }
  }
  return out
}


// The instance with the template's literal text at element `i`
// rewritten through the pairs -- on the fresh instance, where the
// structure is exactly the template's, and before any binding, so a
// value written in is never scanned again and a spliced result is
// never touched.
function substituted(
  inst: Val, i: number, lits: LitSpot[], pairs: Pair[], ctx: AontuContext
): Val {
  for (const l of lits) {
    if (l.i !== i) {
      continue
    }
    const sv = new StringVal({ peg: substitute(l.s, pairs) }, ctx)
    if (undefined !== l.of) {
      (inst as any).peg.of.peg[l.of] = sv
    }
    else if (true === l.text) {
      (inst as any).peg.text = sv
    }
    else {
      inst = sv
    }
  }
  return inst
}


// A key as the message writes it, quoted so an empty key is visible.
function quoted(s: string): string {
  return '"' + s + '"'
}


function unpref(v: any): any {
  while (true === v.isPref) {
    v = v.peg
  }
  return v
}


// The reference a body named that the node could not answer, kept by
// the walk so `resolve` can report the first one against the node it
// was tried on -- and a refusal a replacement raised.
type Fail = { ref?: string, code?: string, details?: Record<string, string> }


// Every relative reference in `v` replaced by the field of `node` it
// names. Answers `v` unchanged when it holds none, so a body with no
// substitutions is never needlessly rebuilt -- the identity test
// `fillPlace` already relies on.
function bindNode(v: any, node: Val, ctx: AontuContext, fail: Fail): Val {
  if (true === v?.isRef && true !== v.absolute) {
    const found = nodeField(v, node)
    if (undefined === found) {
      fail.ref = undefined === fail.ref ? v.canon : fail.ref
      return v
    }
    const out = found.clone(ctx)
    // A RELATIVE REFERENCE IS A READ TOO (RENDER.0.md P7), and the one
    // read no reference resolution sees: the binding answers it here,
    // from the matched node, rather than letting a path resolve at a
    // position the body never occupies. Without this a nested rule set
    // whose selection is `.handlers` reported its nodes at the address
    // they came to rest, which is in the OUTPUT. A node carries an
    // address only under an instrumented run, which is what makes the
    // second test the whole guard.
    if (null == (out as any).origin && null != (node as any).origin) {
      ; (out as any).origin = (node as any).origin +
        (v.peg as string[]).map((seg: string) => '.' + seg).join('')
    }
    return out
  }

  const peg: any = v?.peg
  const bound = boundArgStart(v)

  if (Array.isArray(peg)) {
    let changed = false
    const out = peg.map((c: any, cI: number) => {
      if (true !== c?.isVal || bound <= cI) {
        return c
      }
      const b = bindNode(c, node, ctx, fail)
      changed = changed || b !== c
      return b
    })
    return changed ? rebuild(v, out, ctx) : v
  }

  if (true === peg?.isVal) {
    const b = bindNode(peg, node, ctx, fail)
    return b === peg ? v : rebuild(v, b, ctx)
  }

  if (null != peg && 'object' === typeof peg) {
    let changed = false
    const out: Record<string, Val> = {}
    for (const k of Object.keys(peg)) {
      const c = peg[k]
      // No isVal guard, for the reason fillPlace gives: a slot holding
      // something that is not a Val answers itself, because the tests
      // above -- is it a reference, has it a peg -- are both false for
      // one.
      const b = bindNode(c, node, ctx, fail)
      changed = changed || b !== c
      out[k] = b
    }
    return changed ? rebuild(v, out, ctx) : v
  }

  return v
}


// The field of `node` a reference names, or undefined when it names
// none. Only a chain of plain NAMES is a field: a parent step has no
// answer at a node that is an origin rather than a position, and a
// variable segment is not a name until something resolves it -- both
// are refused here rather than left to resolve somewhere else, which
// is the failure mode the binding exists to remove.
function nodeField(ref: any, node: Val): Val | undefined {
  let cur: any = node
  for (const seg of ref.peg as any[]) {
    if ('string' !== typeof seg || '.' === seg) {
      return undefined
    }
    const peg: any = cur?.peg
    if (true !== cur?.isBag || null == peg) {
      return undefined
    }
    cur = true === cur.isList ? peg[Number(seg)] : peg[seg]
    if (true !== cur?.isVal) {
      return undefined
    }
  }
  return cur
}


// The address of one matched node: its own read address when it has
// one, else the SELECTION's read address and the node's key under it
// -- a selection is read once and walked, so its members carry no read
// of their own.
//
// A COMPUTED SELECTION HAS NO ADDRESS, AND THE TRACE SAYS SO: an empty
// node. `filter(...)` builds a bag no path in the document names, and
// the only other thing to report is where the bag came to REST -- a
// position inside a template instance, which is not in the document,
// and which the two ports number differently. Publishing that would
// have made the trace a parity break as well as a fiction. The rule
// address answers the same way: `<table>#<index>` for a table a
// reference reached, and `#<index>` alone for one written inline at the
// call site, which has no address of its own. `#` is in no path, so a
// rule's address can never be read as one.
function nodeAddr(sel: string | undefined, key: string, node: any): string {
  if (null != node.origin) {
    return node.origin
  }
  return undefined === sel ? '' : sel + '.' + key
}


// A body element that is itself a list splices, which is what makes a
// nested emit compose into one flat sequence.
function splice(v: Val, out: Val[]): void {
  if (true === (v as any)?.isList) {
    for (const el of (v as any).peg as Val[]) {
      splice(el, out)
    }
    return
  }
  out.push(v)
}


class EmitFuncVal extends FuncBaseVal {
  isEmitFunc = true

  // THE STAGING RULE (G8 phase 0, see AontuContext.settle). The
  // selection is not settled merely by being `done` once -- a sibling
  // conjunct, an include or a spread can still merge nodes into it,
  // and pieces emitted from the half-merged bag would be missing.
  staged = true

  constructor(
    spec: ValSpec,
    ctx?: AontuContext
  ) {
    super(spec, ctx)
  }


  funcname() {
    return 'emit'
  }


  // NEITHER ARGUMENT IS DRIVEN BY THE BASE. The selection is driven by
  // hand below; the TABLE is not driven at all, because a body is a
  // template and driving it would resolve its references at the call
  // site -- the one position a body is never used at.
  prepare(_ctx: AontuContext, _args: Val[]) {
    return null
  }


  unify(peer: Val, ctx: AontuContext): Val {
    // ONE argument is driven: the selection. The table holds bodies,
    // which are templates (see prepare above).
    if (!this.stagedReady(peer, ctx, 1)) {
      return this.residuate(peer, ctx)
    }

    return super.unify(peer, ctx)
  }


  resolve(ctx: AontuContext, args: Val[]) {
    // THE MEMBERS WITH THEIR KEYS, read through the one helper every
    // fold reads a bag by (./members.ts): source order for a list,
    // sorted-key order for a map, a hidden child and an unfilled
    // optional left out. The KEY is what the trace addresses a node by
    // -- it is the node's key IN THE SELECTION, which is the only
    // thing a walk of a computed bag knows about where a node sits.
    const nodes = bagMembers(args?.[0], ctx)
    if (undefined === nodes) {
      return makeNilErr(ctx, 'emit_data', this)
    }

    // A NAMED TABLE IS REACHED BY REFERENCE, and the reference -- not
    // the table -- is what is followed. Followed HERE rather than in
    // the staged drive, which waits for a SETTLED target: a table is a
    // template, a template holding a hole never settles, and waiting
    // for one would mean the dispatch never fires.
    let table: any = args?.[1]
    if (true === table?.isRef) {
      table = table.unify(top(), ctx)
    }

    const templates = tableTemplates(table)
    if (isRefusal(templates)) {
      return this.refuse(ctx, templates)
    }

    // THE TRACE'S TWO ADDRESSES (RENDER.0.md D11, P7), computed once
    // per dispatch and only when the run is instrumented: the table's
    // own, which every rule of it is numbered under, and the
    // selection's, which every node of it is keyed under.
    const rec = undefined !== ctx.reads
    const tableAddr = rec ? ((table as any)?.origin ?? '') : ''
    const selAddr = rec ? (args?.[0] as any)?.origin : undefined

    const peg: Val[] = []

    for (const member of nodes) {
      const node = member.val
      const tmpl = this.dispatch(ctx, node, templates)
      if ('string' === typeof tmpl) {
        return makeNilErr(ctx, 'emit_none', this, undefined, 'resolve', {
          value: node.canon,
          tried: tmpl,
        })
      }
      const fail: Fail = {}
      let mark: EmitOrigin | undefined = undefined
      if (rec) {
        // THE NODE KEEPS ITS ADDRESS (P7). A body passes the node on
        // through `_`, and a nested rule set dispatching over it can
        // then say where it came from -- otherwise the node arrives as
        // an element of a list the body wrote, and the only address
        // left is where that list came to rest.
        const naddr = nodeAddr(selAddr, member.key, node)
        if ('' !== naddr && null == (node as any).origin) {
          ; (node as any).origin = naddr
        }
        mark = { node: naddr, rule: tableAddr + '#' + tmpl.idx }
      }
      this.instantiate(ctx, node, tmpl, peg, fail, mark)
      if (undefined !== fail.ref) {
        return makeNilErr(ctx, 'emit_ref', this, undefined, 'resolve', {
          ref: fail.ref,
          value: node.canon,
        })
      }
      if (undefined !== fail.code) {
        return this.refuse(ctx, { code: fail.code, details: fail.details })
      }
    }

    // THE PIECES ARE PATHED WHERE THEY LAND, once the splicing has
    // settled how many there are. A piece keeps no trace of the body
    // it was written in: the body is a template, and a template's
    // parse position is the one place it is never used.
    for (let i = 0; i < peg.length; i++) {
      repathInstance(peg[i], [...ctx.path, String(i)])
    }

    return new ListVal({ peg }, ctx)
  }


  // The located error for a refusal, with the message's details when
  // the refusal carries them.
  refuse(ctx: AontuContext, r: Refusal): Val {
    return undefined === r.details ? makeNilErr(ctx, r.code, this)
      : makeNilErr(ctx, r.code, this, undefined, 'resolve', r.details)
  }


  // First match wins, in table order, by unifiability -- the same
  // question `match` and `filter` ask, answered the same way. Returns
  // the patterns tried when nothing matched, for the located error.
  dispatch(ctx: AontuContext, node: Val, templates: Template[]): Template | string {
    const tried: string[] = []
    for (const tmpl of templates) {
      tried.push(tmpl.match.canon)
      // The trial is against CLONES: `unite` refines a bag in place
      // against a TOP peer, and a pattern that failed must be untouched
      // for the next node.
      if (undefined !== trialUnify(ctx, node.clone(ctx), tmpl.match.clone(ctx))) {
        return tmpl
      }
    }
    return tried.join(' ')
  }


  // The replacement pairs for one node: the template's `replace` map
  // instantiated at the node -- bound, filled and driven as a body is
  // -- each value as text by the one number-to-text rule (`plusText`,
  // the rule `+` and `join` share), escaped by the template's
  // convention unless that is `none`, and sorted longest key first so
  // the scan takes the longest match at every position (D3's first
  // rule). A value that is not text, or has not settled, is
  // replace_value.
  replacements(ctx: AontuContext, node: Val, tmpl: Template, fail: Fail): Pair[] | undefined {
    if (undefined === tmpl.replace) {
      return undefined
    }
    let inst: any = tmpl.replace.clone(ctx, { dup: true })
    inst = fillPlace(bindNode(inst, node, ctx, fail), node, ctx)
    if (!inst.done) {
      inst = unite(ctx, inst, top(), 'emit')
    }
    const pairs: Pair[] = []
    for (const key of Object.keys(inst.peg)) {
      const v: any = unpref(inst.peg[key])
      const text = plusText(v)
      if (undefined === text) {
        fail.code = 'replace_value'
        fail.details = { key: quoted(key), value: String(v?.canon) }
        return undefined
      }
      pairs.push([key, 'none' === tmpl.esc ? text : escapeText(text, tmpl.esc)])
    }
    pairs.sort((a, b) => b[0].length - a[0].length || cmpCodePoint(a[0], b[0]))
    return pairs
  }


  // Instantiate one body at the node and SPLICE its pieces into the
  // output. A full instance to the leaves (`dup`, ADR-005), because a
  // bare clone shares the inner structure of any call in the body and
  // the first node's resolution would answer for every node; the
  // template's replacements written into the instance's literal text;
  // then the two bindings, relative references and the hole, both to
  // the node.
  instantiate(ctx: AontuContext, node: Val, tmpl: Template,
    out: Val[], fail: Fail, mark?: EmitOrigin): void {
    const pairs = this.replacements(ctx, node, tmpl, fail)
    if (undefined !== fail.code) {
      return
    }

    const elems: Val[] = (tmpl.body as any).peg

    for (let i = 0; i < elems.length; i++) {
      const elctx = ctx.descend(String(out.length))
      let inst = elems[i].clone(elctx, { dup: true })
      if (undefined !== pairs) {
        inst = substituted(inst, i, tmpl.lits, pairs, elctx)
      }
      let piece = fillPlace(bindNode(inst, node, elctx, fail), node, elctx)

      // A NESTED DISPATCH IS DRIVEN HERE, not left for the next pass.
      // Its selection is bound and the model has settled, so it has
      // everything it needs -- and it must answer NOW, because what
      // makes the result flat is splicing its pieces into this one.
      // Left standing, a nested `emit` resolved a pass later, as a
      // list INSIDE the list, and the fragment algebra is flat.
      // Through `unite` rather than by hand: a rule set that walks
      // into itself for ever is charged to the depth budget and
      // refused as `unify_cycle`, like any other runaway descent.
      if (!piece.done) {
        piece = unite(elctx, piece, top(), 'emit')
      }

      // THE INNERMOST DISPATCH OWNS THE PIECE (P7). A body element
      // that is a nested rule set has already stamped what it emitted,
      // and those pieces are spliced into this result here: the rule
      // that WROTE a line is the one the trace names, so a stamp is
      // written only where there is none.
      const at = out.length
      splice(piece, out)
      if (undefined !== mark) {
        for (let k = at; k < out.length; k++) {
          if (null == (out[k] as any).emitted) {
            ; (out[k] as any).emitted = mark
          }
        }
      }
    }
  }

} /* node:coverage ignore next 6 */


export {
  EmitFuncVal,
}
