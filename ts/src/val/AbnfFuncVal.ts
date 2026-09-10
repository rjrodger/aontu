/* Copyright (c) 2026 Richard Rodger, MIT License */

// THE GRAMMAR PAIR: `abnf(src)` and `parse(g, v)` -- G9.
//
// `abnf(src)` COMPILES an RFC 5234 grammar and answers the grammar
// SOURCE, so a parser is an ordinary string value: it canons, it hashes
// and it unifies with no new kind in the lattice. The compile is what
// the call is for -- a grammar that does not compile is refused HERE,
// at the declaration, rather than at every site that parses with it.
//
// `parse(g, v)` applies the grammar to a string and answers the tabnas
// AST -- `{rule, src, kids}` all the way down -- as ordinary maps and
// lists. A FAILURE TO PARSE IS A FAILURE TO UNIFY: the call answers a
// located nil, so `v: parse($.G, "1.2.x")` refuses the field rather
// than yielding a value that says "no".
//
// `parse(g)` -- the one-argument form -- is the same grammar as a
// CONSTRAINT on whatever meets it, which is what a schema position
// wants where there is no value yet to hand the call. It is
// VALUE-PRESERVING, like every other atom in the algebra: it admits
// the string it was written with and answers that string, so it stays
// idempotent and order-independent under a meet. A TRANSFORMING
// constraint -- one answering the tree while also being a constraint --
// is the step this stops short of: the result would have to carry the
// grammar that produced it for a second meet to mean anything, and
// nothing needs that while the tree is what the two-argument form is
// for.
//
// Twin of go/abnf.go.

import type { Val, ValSpec } from '../type'
import { DONE } from '../type'
import { AontuContext } from '../ctx'
import { FuncBaseVal } from './FuncBaseVal'
import { StringVal } from './StringVal'
import { MapVal } from './MapVal'
import { ListVal } from './ListVal'
import { ConjunctVal } from './ConjunctVal'
import { makeNilErr } from '../err'
import { compileGrammar, parseWith } from '../grammar'


// `abnf(src)` -- compile a grammar, answer its source.
class AbnfFuncVal extends FuncBaseVal {
  isAbnfFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
  }

  funcname() {
    return 'abnf'
  }

  resolve(ctx: AontuContext, args: Val[]): Val {
    const a: any = args[0]

    // NOT AN ARITY CHECK -- the arity gate refuses a short call before a
    // Val exists, and the signature gate refuses a settled non-string as
    // `func_arg`. What reaches here is a NIL argument, which both gates
    // pass over so the original refusal is the one a reader sees.
    if ('string' !== typeof a?.peg) {
      return this.place(makeNilErr(ctx, 'abnf_grammar', this, undefined,
        'abnf'))
    }

    // The compile is CACHED by source, so a grammar named at many sites
    // is built once -- and refused once, with the compiler's own reason.
    const [, why] = compileGrammar(a.peg)
    if (undefined !== why) {
      return this.place(makeNilErr(ctx, 'abnf_grammar', this, undefined,
        'abnf', { reason: why }))
    }

    return this.place(new StringVal({ peg: a.peg }, ctx))
  }
}


// The AST as ordinary aontu values. `kids` is always present and always
// a list, because the vocabulary a caller writes against should not have
// to ask whether a leaf has the key at all.
function astVal(node: any, ctx: AontuContext): Val {
  // Every host node carries all three keys -- a leaf has `kids: []`
  // rather than no `kids` -- so there is nothing to default here. The
  // guarantee this function makes is about the SHAPE it answers, and
  // that is the ListVal below.
  const kids: Val[] = node.kids.map(
    (k: any, i: number) => astVal(k, ctx.descend('kids').descend(String(i))))
  return new MapVal({
    peg: {
      rule: new StringVal({ peg: node.rule }, ctx),
      src: new StringVal({ peg: node.src }, ctx),
      kids: new ListVal({ peg: kids }, ctx),
    }
  }, ctx)
}


// `parse(g, v)` -- apply a grammar to a string.
// `parse(g)` -- the same grammar as a CONSTRAINT on whatever meets it.
//
// The one-argument form is what a schema position wants, where there is
// no value yet to hand the call: `*"" | parse(G)` says the field is
// either the default or a string this grammar accepts. It is
// VALUE-PRESERVING, like every other constraint in the algebra -- the
// field keeps the string it was written with, and the tree is what the
// two-argument form is for. That is also what keeps it idempotent: a
// meet that returns its peer can be applied twice in any order.
class ParseFuncVal extends FuncBaseVal {
  isParseFunc = true

  constructor(spec: ValSpec, ctx?: AontuContext) {
    super(spec, ctx)
  }

  funcname() {
    return 'parse'
  }


  // THE CONSTRAINT FORM MEETS ITS PEER rather than resolving, so it has
  // to see the peer before the base drives to resolve(). The grammar
  // argument is driven first -- it is normally a reference to an
  // `abnf()` call -- and until it settles the call HOLDS, exactly as an
  // unmet `min(3)` does. A settled string peer is then the check; every
  // other peer keeps the residual, so the constraint survives to meet a
  // value on a later pass.
  unify(peer: Val, ctx: AontuContext): Val {
    if (1 !== this.peg.length) {
      return super.unify(peer, ctx)
    }

    this.driveStagedArgs(ctx, 1)

    // A STRING PEG IS A SETTLED GRAMMAR, so this is also the doneness
    // test: nothing carrying one is still resolving.
    const g: any = this.peg[0]
    if ('string' !== typeof g?.peg) {
      return this.residuate(peer, ctx)
    }

    // A SETTLED CONSTRAINT IS A STABLE VALUE, exactly as the residual
    // a constraint atom answers is (`this.dc = DONE` in ConstraintVal,
    // "a residual constraint is stable, like a ScalarKindVal"). Without
    // it the call was never done, so a `type()` holding one never
    // resolved and the whole schema it belonged to was ungeneratable --
    // `$.aontu.System.Semver & [1]` reported mapval_no_gen over the
    // schema itself.
    this.dc = DONE

    const p: any = peer
    if (true !== p?.isString || 'string' !== typeof p?.peg) {
      return this.hold(peer, ctx)
    }

    const [grammar, why] = compileGrammar(g.peg)
    if (undefined !== why) {
      return makeNilErr(ctx, 'abnf_grammar', this, peer, 'parse',
        { reason: why })
    }
    if ('' === p.peg) {
      return makeNilErr(ctx, 'parse_failed', this, peer, 'parse',
        { reason: 'the empty string parses under no grammar' })
    }
    const [, err] = parseWith(grammar, p.peg, ctx)
    if (undefined !== err) {
      return makeNilErr(ctx, 'parse_failed', this, peer, 'parse',
        { reason: err })
    }

    // ADMITTED: the peer stands, unchanged.
    return peer
  }


  // THE STABLE TWIN OF residuate: the same cases, without the
  // `notdone()` -- a constraint whose grammar has settled is DONE and
  // stays DONE while it waits for a value (see the note in unify).
  //
  // THREE cases and not residuate's four: there is no nil arm, because
  // a NIL never arrives as this call's peer. A conjunct or a map
  // absorbs one before the func is driven against it, and this method
  // is reached only once the grammar has SETTLED -- a staged residual
  // is entered before that, which is why residuate's nil arm is live
  // and this one would be dead. A nil that did arrive would fall to
  // the conjunct below and be absorbed by it, which is the same
  // answer.
  hold(peer: Val, ctx: AontuContext): Val {
    if (peer.isTop || peer.id === this.id) {
      // Cloned rather than returned, for the reason residuate clones:
      // a driver meeting the same object twice in one pass would
      // charge the revisit budget and report `unify_cycle`.
      const out: Val = this.clone(ctx)
      out.dc = DONE
      return out
    }

    if (peer.isFunc
      && (peer as any).funcname() === this.funcname()
      && peer.path.join('.') === this.path.join('.')
      && peer.canon === this.canon) {
      return this
    }

    return new ConjunctVal({ peg: [this, peer] }, ctx)
  }


  resolve(ctx: AontuContext, args: Val[]): Val {
    const g: any = args[0]
    const v: any = args[1]

    // NOT AN ARITY CHECK, for the reason `abnf`'s is not: the
    // one-argument form never reaches here (it returns from `unify`),
    // and a settled argument of the wrong kind is the signature gate's.
    // A NIL argument is what is left.
    if ('string' !== typeof g?.peg || 'string' !== typeof v?.peg) {
      return this.place(makeNilErr(ctx, 'parse_arg', this, undefined, 'parse'))
    }

    const [grammar, why] = compileGrammar(g.peg)
    if (undefined !== why) {
      return this.place(makeNilErr(ctx, 'abnf_grammar', this, undefined,
        'parse', { reason: why }))
    }

    // THE EMPTY STRING IS NOT A PARSE. Both engines answer an empty
    // tree for empty input rather than refusing it, which would make
    // `parse(g, "")` succeed under every grammar; a validator whose
    // whole job is to refuse malformed input cannot have that.
    if ('' === v.peg) {
      return this.place(makeNilErr(ctx, 'parse_failed', this, undefined,
        'parse', { reason: 'the empty string parses under no grammar' }))
    }

    const [node, err] = parseWith(grammar, v.peg, ctx)
    if (undefined !== err) {
      return this.place(makeNilErr(ctx, 'parse_failed', this, undefined,
        'parse', { reason: err }))
    }

    return this.place(astVal(node, ctx))
  }
} /* node:coverage ignore next 6 */


export {
  AbnfFuncVal,
  ParseFuncVal,
}
