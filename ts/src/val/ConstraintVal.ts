/* Copyright (c) 2025 Richard Rodger, MIT License */

/*
 * The constraint algebra's residual value (G1 phase 1: bounds and neq;
 * docs/reference-language.md, "The constraint algebra"). A
 * ConstraintVal is the normal form of any meet of Band A atoms over
 * one domain: an interval (endpoints with open/closed flags), an
 * exclusion set (from neq), and an optional numeric-leaf kind
 * narrowing (from meeting `integer` etc.). Its rules, decided in
 * phase 0 and mirrored by go/constraint.go:
 *
 *  - Order is a property of the number line: a numeric bound admits
 *    ANY numeric leaf at an admissible position, compared exactly
 *    (numcmp.ts), and never narrows the peer's leaf by itself.
 *  - Endpoints keep their written leaf (canon renders the stored
 *    scalar); two endpoints at the SAME point keep the tower-lowest
 *    leaf. No endpoint rewriting, ever (lazy endpoints).
 *  - neq excludes by scalar identity — leaf AND value.
 *  - Emptiness is decided eagerly where it is exact: empty interval,
 *    integral gap under an integer/biginteger narrowing, point
 *    deletion under a narrowed leaf, domain mixing. Representability
 *    holes of the int64-window integer leaf are deliberately NOT
 *    modelled (sound — no false conflicts; incomplete — those
 *    contradictions surface against data), matching the algebra's
 *    regex-approximation philosophy.
 *  - Canonical atom order: kind, lower bound, upper bound, neq
 *    (arguments sorted); `parse(canon(v)) == v` holds because the
 *    reparse is a conjunct of atoms that normalises back to the
 *    identical residual.
 *
 * A constraint violation raises the registered `constraint` code
 * (class conflict), with the admissible set in NilVal.details.
 */

import type {
  Val,
  ValSpec,
} from '../type'

import {
  DONE,
} from '../type'

import {
  AontuContext,
} from '../ctx'

import {
  explainOpen,
  explainClose,
  propagateMarks,
} from '../utility'

import { makeNilErr } from '../err'

import { FeatureVal } from './FeatureVal'

import {
  BigDecimal,
  BigInteger,
  Float,
  Integer,
} from './ScalarKindVal'

import {
  cmpNumeric,
  cmpCodePoints,
  towerRank,
  scaledOfNumeric,
  scaledIsIntegral,
  scaledFloor,
} from './numcmp'


type Bound = {
  v: any          // the stored endpoint scalar Val (leaf preserved)
  open: boolean   // true for above/below, false for min/max
}

type ReAtom = {
  v: any          // the stored pattern StringVal (canon renders the literal)
  src: string     // the pattern text
  re: RegExp      // compiled by the host engine
}

type ConstraintState = {
  domain?: 'number' | 'string'
  kind?: any      // numeric leaf marker (Integer | Float | ...) or undefined
  lo?: Bound
  hi?: Bound
  neqs: any[]     // excluded scalars, identity per leaf+value
  res: ReAtom[]   // accumulated patterns, sorted by source (never simplified)
  invalid?: string  // why-code when the atom's arguments were unusable
}


// THE PORTABLE PATTERN SUBSET (G1 phase 2).
//
// `re(p)` must mean the same thing in both engines, and cost about the
// same to evaluate. Neither is free: TypeScript compiles with
// JavaScript's BACKTRACKING RegExp, Go with RE2, which is a different
// language with a different complexity class. Each accepts patterns the
// other rejects; each accepts patterns the other reads DIFFERENTLY; and
// one of them can be made to run for hours on a short input. So the
// pattern is checked against one shared syntactic subset BEFORE either
// host engine sees it, and this scanner is mirrored statement for
// statement in go/constraint.go.
//
// Everything here is a WHITELIST. The first draft of this scanner
// blacklisted the constructs known to differ and handed the rest to the
// host engines, and review found two escapes it had never heard of that
// silently diverge -- `\A` and `\z` are anchors in RE2 and identity
// escapes matching a literal "A"/"z" in JavaScript, so `re("\A") & "x"`
// held in Go and failed in TypeScript. A blacklist admits the next
// divergence by construction; only a whitelist fails safe.
//
// The three rules:
//
//  1. GROUPS. `(?` opens only the non-capturing group `(?:` -- which
//     refuses lookaround, atomic groups, conditionals, recursion,
//     inline flags, and named groups (spelled `(?P<n>` in RE2 and
//     `(?<n>` in JavaScript) in one line.
//
//  2. ESCAPES. Only escapes with identical meaning in both engines pass
//     (portableEscape below). Notably ABSENT: `\s`/`\S`, because
//     JavaScript's whitespace class includes Unicode spaces that RE2's
//     ASCII-only class does not -- `re("^\s$")` matches U+00A0 in
//     TypeScript and refuses it in Go. Write `[ \t\n\r\f\v]`.
//
//  3. QUANTIFIER NESTING. A quantifier may not be applied to a group
//     that itself contains a quantifier or an alternation. This is the
//     catastrophic-backtracking rule, and it is about TIME rather than
//     meaning: `(a+)+$` against 29 a-characters and a `!` takes 45
//     SECONDS in JavaScript and 0.065s under RE2, growing exponentially
//     from there. A regex match is not counted by any evaluator budget
//     (docs/trust.md clause 2 counts engine events), so an untrusted
//     schema could otherwise stall the TypeScript evaluator indefinitely
//     -- which is precisely the unattended-agent case the language is
//     for. Refusing the shape that causes it keeps the clause true.
//     `(?:a|b)+` is refused too, though it is safe, because deciding
//     that two alternation branches cannot both match is real work;
//     write `[ab]+`.
//
// A pattern that passes all three still goes to the host engine, whose
// own compile failure is the same refusal under the same code. The
// subset is deliberately SMALLER than the true intersection of the two
// engines: sound, not complete, exactly as the algebra treats regex
// emptiness. Widening it later is a compatible change; narrowing it
// would not be.

// Escape letters whose meaning is identical in JavaScript (no flags)
// and RE2: the ASCII digit/word classes, the control characters, and
// the ASCII word boundary. Each was verified by probing both engines.
const RE_ESCAPE_LETTERS = 'dDwWtnrfvbB'

// Metacharacters that may be escaped to mean themselves. Both engines
// read `\<punct>` as the literal for these; other punctuation is left
// out because RE2 rejects some identity escapes JavaScript allows.
const RE_ESCAPE_PUNCT = '\\.+*?()[]{}|^$/-'

function isHexDigit(c: string | undefined): boolean {
  return null != c && (
    ('0' <= c && c <= '9') || ('a' <= c && c <= 'f') || ('A' <= c && c <= 'F'))
}

// portableEscape reports why `\<n>` is not in the subset, or undefined
// when it is. Returns the number of EXTRA source characters consumed
// beyond the backslash and `n` via the second element (for `\xHH`).
function portableEscape(n: string | undefined, src: string, i: number):
  [string | undefined, number] {
  if (null == n) {
    return ['a trailing backslash', 0]
  }
  if ('1' <= n && n <= '9') {
    return ['a backreference (\\' + n + '), which RE2 has no equivalent for', 0]
  }
  if ('k' === n) {
    return ['a named backreference (\\k), which RE2 has no equivalent for', 0]
  }
  if ('u' === n) {
    return ['a \\u escape, which RE2 spells \\x{...}', 0]
  }
  if ('p' === n || 'P' === n) {
    return ['a Unicode class (\\' + n + '), which JavaScript reads as a literal here', 0]
  }
  if ('s' === n || 'S' === n) {
    // JavaScript's \s is Unicode whitespace; RE2's is ASCII-only, so
    // U+00A0 matches in one engine and not the other.
    return ['\\' + n + ', whose whitespace set differs between the engines' +
      ' (write [ \\t\\n\\r\\f\\v])', 0]
  }
  if ('A' === n || 'z' === n || 'Z' === n) {
    return ['\\' + n + ', an anchor in RE2 but a literal "' + n +
      '" in JavaScript', 0]
  }
  if ('x' === n) {
    if ('{' === src[i + 2]) {
      return ['a \\x{...} escape, which JavaScript spells \\u', 0]
    }
    if (!isHexDigit(src[i + 2]) || !isHexDigit(src[i + 3])) {
      return ['an \\x escape without two hex digits', 0]
    }
    return [undefined, 2]
  }
  if (RE_ESCAPE_LETTERS.includes(n) || RE_ESCAPE_PUNCT.includes(n)) {
    return [undefined, 0]
  }
  return ['\\' + n + ', an escape whose meaning the two engines do not share', 0]
}


function nonPortableRe(src: string): string | undefined {
  let inClass = false

  // One frame per open group, recording whether the group contains a
  // quantifier or an alternation. A group carrying either may not
  // itself be quantified (rule 3); containment is transitive, so a
  // frame hands its flags up to its parent when it closes.
  const groups: { q: boolean, alt: boolean }[] = []
  const mark = (k: 'q' | 'alt') => {
    if (0 < groups.length) {
      groups[groups.length - 1][k] = true
    }
  }

  for (let i = 0; i < src.length; i++) {
    const c = src[i]

    if ('\\' === c) {
      const [why, extra] = portableEscape(src[i + 1], src, i)
      if (null != why) {
        return why
      }
      i += 1 + extra
      continue
    }

    // A POSIX class opener, anywhere. Checked BEFORE the in-class
    // branch because the POSIX form lives inside an ordinary class
    // (`[[:alpha:]]`), and refused everywhere rather than only there:
    // one rule is easier to mirror exactly than two, and a literal
    // `[:` costs an author nothing to rewrite.
    if ('[' === c && ':' === src[i + 1]) {
      return 'a POSIX class ([:...:]), which JavaScript does not have'
    }

    if (inClass) {
      if (']' === c) {
        inClass = false
      }
      continue
    }

    if ('[' === c) {
      // An empty class: `[]` in JS is a class that never matches, in
      // RE2 it does not compile. `[^]` is the same disagreement one
      // character along — everything in JS, a parse error in RE2.
      const first = '^' === src[i + 1] ? src[i + 2] : src[i + 1]
      if (']' === first) {
        return 'an empty character class, which RE2 refuses'
      }
      inClass = true
      continue
    }

    if ('(' === c) {
      if ('?' === src[i + 1]) {
        if (':' !== src[i + 2]) {
          return 'a (?...) group other than the non-capturing (?:'
        }
        i += 2
      }
      groups.push({ q: false, alt: false })
      continue
    }

    if (')' === c) {
      const g = groups.pop()
      if (null == g) {
        return 'an unbalanced group'
      }
      const nx = src[i + 1]
      const quantified =
        '*' === nx || '+' === nx || '?' === nx || '{' === nx
      if (quantified && (g.q || g.alt)) {
        return 'a quantifier applied to a group containing ' +
          (g.q ? 'another quantifier' : 'an alternation') +
          ', which backtracks exponentially in JavaScript'
      }
      // Containment is transitive: the parent inherits.
      if (g.q) mark('q')
      if (g.alt) mark('alt')
      continue
    }

    if ('|' === c) {
      mark('alt')
      continue
    }

    if ('*' === c || '+' === c || '?' === c || '{' === c) {
      mark('q')
      continue
    }
  }

  if (inClass) {
    return 'an unterminated character class'
  }
  if (0 < groups.length) {
    return 'an unclosed group'
  }

  return undefined
}


// True for a scalar Val the algebra can order: a numeric leaf or a
// string. (Booleans and null have no order and no bounds.)
function numericLeaf(v: any): boolean {
  return true === v?.isScalar &&
    (v.isInteger || v.isNumber || v.isBigInteger || v.isBigDecimal) &&
    !(v.isNumber && Number.isNaN(v.peg))
}

function stringLeaf(v: any): boolean {
  return true === v?.isScalar && 'string' === typeof v.peg && v.isString
}


// Scalar identity: leaf AND value, the lattice's own rule (1 and 1.0
// are different scalars). Exact numeric comparison decides the value
// half for numeric leaves.
function sameScalar(a: any, b: any): boolean {
  if (numericLeaf(a) && numericLeaf(b)) {
    return towerRank(a) === towerRank(b) && 0 === cmpNumeric(a, b)
  }
  if (stringLeaf(a) && stringLeaf(b)) {
    return a.peg === b.peg
  }
  return false
}


// Domain-aware value comparison for bounds and neq ordering.
function cmpVal(domain: 'number' | 'string', a: any, b: any): number {
  return 'number' === domain ? cmpNumeric(a, b) : cmpCodePoints(a.peg, b.peg)
}


// The numeric leaf marker a concrete scalar carries, for the kind
// narrowing check.
function leafMarker(v: any): any {
  return v.isBigDecimal ? BigDecimal : v.isBigInteger ? BigInteger :
    v.isInteger ? Integer : Float
}


class ConstraintVal extends FeatureVal {
  isConstraint = true
  cjo = 50000

  domain?: 'number' | 'string'
  kind?: any
  lo?: Bound
  hi?: Bound
  neqs: any[] = []
  res: ReAtom[] = []
  invalid?: string
  invalidWhy?: string

  constructor(
    spec: ValSpec & { atom?: string, state?: ConstraintState },
    ctx?: AontuContext
  ) {
    super({ ...spec, peg: spec.peg ?? [] }, ctx)

    if (spec.state) {
      this.domain = spec.state.domain
      this.kind = spec.state.kind
      this.lo = spec.state.lo
      this.hi = spec.state.hi
      this.neqs = spec.state.neqs
      // A state built by an embedder (or by a per-port test) may predate
      // the pattern field; an absent one means "no patterns", not undefined.
      this.res = spec.state.res ?? []
      this.invalid = spec.state.invalid
    }
    else if (spec.atom) {
      this.fromAtom(spec.atom, (spec.peg as any[]) ?? [])
    }

    // A residual constraint is stable, like a ScalarKindVal.
    this.dc = DONE
  }


  // Normalise one atom call (min/max/above/below/neq) into state.
  // Arguments must be concrete orderable scalars in phase 1;
  // reference-valued arguments are phase 4 (residuation).
  private fromAtom(atom: string, args: any[]) {
    // Mark the residual invalid and report so (a plain boolean, so no
    // void value is consumed by the callers' `return` statements).
    const bad = (why: string): boolean => {
      this.invalid = why
      return true
    }

    if ('neq' === atom) {
      // Multiple arguments arrive from the func-paren grammar as one
      // entry holding the comma group: a raw array of Vals (or an
      // implicit ListVal via some spellings). `neq(3,1,2)` therefore
      // has peg [[3,1,2]], and `neq([3,1,2])` means the same thing.
      if (1 === args.length && Array.isArray(args[0])) {
        args = args[0]
      }
      else if (1 === args.length && true === (args[0] as any)?.isList) {
        args = (args[0] as any).peg
      }
      if (0 === args.length) {
        return bad('arg')
      }
      let domain: 'number' | 'string' | undefined = undefined
      for (const a of args) {
        const d = numericLeaf(a) ? 'number' : stringLeaf(a) ? 'string' : undefined
        if (null == d || (null != domain && d !== domain)) {
          return bad('invalid-arg')
        }
        domain = d
      }
      this.domain = domain
      this.neqs = dedupSorted(domain as any, args)
      return
    }

    if (1 !== args.length) {
      return bad('arg')
    }
    const a = args[0]

    // `re` is the one atom whose argument is not an ORDER point: a
    // pattern is a membership test, so it takes the string domain
    // outright rather than inferring a domain from the argument's leaf.
    if ('re' === atom) {
      if (!stringLeaf(a)) {
        return bad('invalid-arg')
      }
      const src = a.peg as string
      const why = nonPortableRe(src)
      if (null != why) {
        this.invalidWhy = why
        return bad('constraint_pattern')
      }
      let re: RegExp
      try {
        re = new RegExp(src)
      }
      catch (e: any) {
        // The host engine refuses what the subset scanner passed — a
        // malformed quantifier, an unbalanced group. Same refusal under
        // the same code: the author gets one rule, not two. The message
        // is the host's, so it is NOT pinned by a shared row; the code
        // and the located frame are.
        this.invalidWhy = 'not a valid pattern'
        return bad('constraint_pattern')
      }
      this.domain = 'string'
      this.res = [{ v: a, src, re }]
      return
    }

    const domain = numericLeaf(a) ? 'number' : stringLeaf(a) ? 'string' : undefined
    if (null == domain) {
      return bad('invalid-arg')
    }
    this.domain = domain

    const open = 'above' === atom || 'below' === atom
    const bound: Bound = { v: a, open }
    if ('min' === atom || 'above' === atom) {
      this.lo = bound
    }
    else {
      this.hi = bound
    }
  }


  unify(peer: Val, ctx: AontuContext): Val {
    const te = ctx.explain && explainOpen(ctx, ctx.explain, 'Constraint', this, peer)

    // Every branch of the ladder assigns, so no initialiser: a
    // residual is stable and the ladder is total.
    let out: Val

    if (null != this.invalid) {
      out = makeNilErr(ctx, this.invalid, this, undefined, 'constrain',
        null == this.invalidWhy ? undefined : { reason: this.invalidWhy })
    }
    else if (null == peer || (peer as any).isTop) {
      out = this
    }
    else if ((peer as any).isNil) {
      out = peer
    }
    else if ((peer as any).isConstraint) {
      out = this.meetConstraint(peer as ConstraintVal, ctx)
    }
    else if ((peer as any).isScalarKind) {
      out = this.meetKind(peer, ctx)
    }
    else if ((peer as any).isScalar) {
      out = this.admit(peer, ctx)
    }
    else {
      // Maps, lists, and every other non-scalar shape: no order, no
      // membership — a conflict of the constraint family.
      out = this.fail(ctx, peer)
    }

    ctx.explain && explainClose(te, out)

    return out
  }


  // Membership: the peer scalar passes every part of the residual, or
  // the whole meet is a located conflict.
  private admit(peer: any, ctx: AontuContext): Val {
    const domainOf = numericLeaf(peer) ? 'number' :
      stringLeaf(peer) ? 'string' : undefined

    if (domainOf !== this.domain) {
      return this.fail(ctx, peer)
    }
    if (null != this.kind && leafMarker(peer) !== this.kind) {
      return this.fail(ctx, peer)
    }
    const d = this.domain as 'number' | 'string'
    if (null != this.lo) {
      const c = cmpVal(d, peer, this.lo.v)
      if (c < 0 || (0 === c && this.lo.open)) {
        return this.fail(ctx, peer)
      }
    }
    if (null != this.hi) {
      const c = cmpVal(d, peer, this.hi.v)
      if (c > 0 || (0 === c && this.hi.open)) {
        return this.fail(ctx, peer)
      }
    }
    for (const n of this.neqs) {
      if (sameScalar(peer, n)) {
        return this.fail(ctx, peer)
      }
    }
    // Every accumulated pattern must match: the meet of two `re` atoms
    // is conjunction, and matching is UNANCHORED in both engines
    // (JS RegExp.test, Go regexp.MatchString), so `re("el")` admits
    // "hello". Anchor with ^ and $ to mean the whole string.
    for (const r of this.res) {
      if (!r.re.test(peer.peg)) {
        return this.fail(ctx, peer)
      }
    }
    return peer
  }


  // Meet with a kind: `number` (or `string` on the string domain) is
  // already implied; a numeric LEAF narrows the residual; anything
  // else has an empty intersection with the constraint's domain.
  private meetKind(peer: any, ctx: AontuContext): Val {
    const marker = peer.peg

    if (Number === marker) {
      return 'number' === this.domain ? this : this.fail(ctx, peer)
    }
    if (String === marker) {
      return 'string' === this.domain ? this : this.fail(ctx, peer)
    }
    const isLeaf = Integer === marker || Float === marker ||
      BigInteger === marker || BigDecimal === marker
    if (!isLeaf || 'number' !== this.domain) {
      return this.fail(ctx, peer)
    }
    if (null != this.kind && this.kind !== marker) {
      return this.fail(ctx, peer)
    }
    const merged = this.cloneState()
    merged.kind = marker
    return this.finish(merged, ctx, peer)
  }


  // Meet with another residual: interval intersection, exclusion
  // union, kind union — then the eager emptiness rules.
  private meetConstraint(peer: ConstraintVal, ctx: AontuContext): Val {
    if (null != peer.invalid) {
      return makeNilErr(ctx, peer.invalid, peer, undefined, 'constrain',
        null == peer.invalidWhy ? undefined : { reason: peer.invalidWhy })
    }
    if (null != this.domain && null != peer.domain && this.domain !== peer.domain) {
      return this.fail(ctx, peer)
    }
    if (null != this.kind && null != peer.kind && this.kind !== peer.kind) {
      return this.fail(ctx, peer)
    }

    const d = (this.domain ?? peer.domain) as 'number' | 'string'
    const merged = this.cloneState()
    merged.domain = d
    merged.kind = this.kind ?? peer.kind
    merged.lo = tighter(d, this.lo, peer.lo, true)
    merged.hi = tighter(d, this.hi, peer.hi, false)
    merged.neqs = dedupSorted(d, [...this.neqs, ...peer.neqs])
    merged.res = dedupSortedRes([...this.res, ...peer.res])

    return this.finish(merged, ctx, peer)
  }


  // Build the merged residual, applying the eager emptiness rules.
  private finish(state: ConstraintState, ctx: AontuContext, peer: Val): Val {
    const d = state.domain as 'number' | 'string'

    if (null != state.lo && null != state.hi) {
      const c = cmpVal(d, state.hi.v, state.lo.v)
      if (c < 0 || (0 === c && (state.lo.open || state.hi.open))) {
        return this.fail(ctx, peer)
      }
    }

    const integral = Integer === state.kind || BigInteger === state.kind

    // Integral gap: an integer-narrowed interval containing no whole
    // number is empty (integer & above(1) & below(2)).
    if (integral && null != state.lo && null != state.hi) {
      const lo = scaledOfNumeric(state.lo.v)
      const hi = scaledOfNumeric(state.hi.v)
      if (!lo.inf && !hi.inf) {
        // Smallest admissible integer above/at the lower bound.
        let n = scaledFloor(lo)
        if (!scaledIsIntegral(lo) || state.lo.open) {
          n += 1n
        }
        // Largest admissible integer below/at the upper bound.
        let m = scaledFloor(hi)
        if (state.hi.open && scaledIsIntegral(hi)) {
          m -= 1n
        }
        if (m < n) {
          return this.fail(ctx, peer)
        }
      }
    }

    // Point deletion under a narrowed leaf: a closed point interval
    // whose single value of the narrowed leaf is excluded is empty
    // (integer & min(3) & max(3) & neq(3)). Without a narrowing the
    // point survives in the other leaves.
    if (null != state.kind && null != state.lo && null != state.hi &&
      !state.lo.open && !state.hi.open &&
      0 === cmpVal(d, state.lo.v, state.hi.v)) {
      for (const n of state.neqs) {
        if (leafMarker(n) === state.kind && 0 === cmpNumeric(n, state.lo.v)) {
          return this.fail(ctx, peer)
        }
      }
    }

    const out = new ConstraintVal({ peg: [], state }, ctx)
    out.path = this.path
    out.site.row = this.site.row
    out.site.col = this.site.col
    out.site.url = this.site.url
    // Marks ratchet across a meet (the propagateMarks rule): a fresh
    // residual must carry both operands' type/hide marks, or a
    // `type(min(0)) & max(10)` merge would silently unmark the field
    // (the Go fold re-ratchets from its terms; this is the TS twin).
    propagateMarks(this, out)
    propagateMarks(peer, out)
    return out
  }


  private fail(ctx: AontuContext, peer: Val): Val {
    return makeNilErr(ctx, 'constraint', this, peer, undefined, {
      expected: this.canon,
      actual: (peer as any)?.canon,
    })
  }


  private cloneState(): ConstraintState {
    return {
      domain: this.domain,
      kind: this.kind,
      lo: this.lo,
      hi: this.hi,
      neqs: [...this.neqs],
      res: [...this.res],
      invalid: this.invalid,
    }
  }


  clone(ctx: AontuContext, spec?: ValSpec): Val {
    let out = (super.clone(ctx, {
      ...(spec || {}),
      peg: this.peg,
    }) as ConstraintVal)
    out.domain = this.domain
    out.kind = this.kind
    out.lo = this.lo
    out.hi = this.hi
    out.neqs = [...this.neqs]
    out.res = [...this.res]
    out.invalid = this.invalid
    out.invalidWhy = this.invalidWhy
    return out
  }


  // The fixed canonical atom order: kind, lower, upper, neq (arguments
  // sorted). No spaces; reparses to a conjunct that normalises back to
  // this exact residual.
  get canon() {
    const parts: string[] = []
    if (null != this.kind) {
      parts.push((this.kind as any).name.toLowerCase())
    }
    if (null != this.lo) {
      parts.push((this.lo.open ? 'above(' : 'min(') + this.lo.v.canon + ')')
    }
    if (null != this.hi) {
      parts.push((this.hi.open ? 'below(' : 'max(') + this.hi.v.canon + ')')
    }
    if (0 < this.neqs.length) {
      parts.push('neq(' + this.neqs.map((n: any) => n.canon).join(',') + ')')
    }
    for (const r of this.res) {
      parts.push('re(' + r.v.canon + ')')
    }
    if (0 === parts.length) {
      // Raw invalid atom: render the call so the error frame shows it.
      return 'constraint()'
    }
    return parts.join('&')
  }


  same(peer: any): boolean {
    return true === peer?.isConstraint && this.canon === peer.canon
  }

}


// The tighter of two like-direction bounds: the higher lower bound (or
// lower upper bound); on the same point the OPEN bound wins, and on a
// full tie the tower-lowest endpoint spelling survives.
function tighter(
  domain: 'number' | 'string',
  a: Bound | undefined,
  b: Bound | undefined,
  lower: boolean
): Bound | undefined {
  if (null == a) return b
  if (null == b) return a
  const c = cmpVal(domain, a.v, b.v)
  if (0 !== c) {
    return (lower ? 0 < c : c < 0) ? a : b
  }
  if (a.open !== b.open) {
    return a.open ? a : b
  }
  if ('number' === domain && towerRank(b.v) < towerRank(a.v)) {
    return b
  }
  return a
}


// Sort excluded scalars for canon (numeric: by point then tower rank;
// string: code-point order) and drop identity duplicates.
function dedupSorted(domain: 'number' | 'string', neqs: any[]): any[] {
  const sorted = [...neqs].sort((a: any, b: any) => {
    const c = cmpVal(domain, a, b)
    if (0 !== c) return c
    return 'number' === domain ? towerRank(a) - towerRank(b) : 0
  })
  const out: any[] = []
  for (const n of sorted) {
    if (0 === out.length || !sameScalar(out[out.length - 1], n)) {
      out.push(n)
    }
  }
  return out
}


// Sort accumulated patterns by source in code-point order and drop
// exact duplicates. Patterns are NEVER simplified or compared for
// containment: deciding `re("a")` subsumes `re("a|b")` is regex
// containment, which the algebra deliberately does not do (emptiness
// stays approximate — sound, incomplete). Two spellings of one language
// therefore both survive, and both are tested.
function dedupSortedRes(res: ReAtom[]): ReAtom[] {
  const sorted = [...res].sort((a, b) => cmpCodePoints(a.src, b.src))
  const out: ReAtom[] = []
  for (const r of sorted) {
    if (0 === out.length || out[out.length - 1].src !== r.src) {
      out.push(r)
    }
  }
  return out
}


// The six atom classes registered in the parser's funcMap: each is a
// ConstraintVal that knows its atom name. Constructed by the
// func-paren handler as `new funcval({peg: args})`.
class MinConstraintVal extends ConstraintVal {
  constructor(spec: ValSpec, ctx?: AontuContext) {
    super({ ...spec, atom: 'min' }, ctx)
  }
}

class MaxConstraintVal extends ConstraintVal {
  constructor(spec: ValSpec, ctx?: AontuContext) {
    super({ ...spec, atom: 'max' }, ctx)
  }
}

class AboveConstraintVal extends ConstraintVal {
  constructor(spec: ValSpec, ctx?: AontuContext) {
    super({ ...spec, atom: 'above' }, ctx)
  }
}

class BelowConstraintVal extends ConstraintVal {
  constructor(spec: ValSpec, ctx?: AontuContext) {
    super({ ...spec, atom: 'below' }, ctx)
  }
}

class NeqConstraintVal extends ConstraintVal {
  constructor(spec: ValSpec, ctx?: AontuContext) {
    super({ ...spec, atom: 'neq' }, ctx)
  }
}

class ReConstraintVal extends ConstraintVal {
  constructor(spec: ValSpec, ctx?: AontuContext) {
    super({ ...spec, atom: 're' }, ctx)
  }
} /* node:coverage ignore next 12 */


export {
  ConstraintVal,
  MinConstraintVal,
  MaxConstraintVal,
  AboveConstraintVal,
  BelowConstraintVal,
  NeqConstraintVal,
  ReConstraintVal,
}
