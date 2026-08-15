/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


// import { performance } from 'node:perf_hooks'

import {
  Jsonic,
  Tabnas,
  Plugin,
  Rule,
  RuleSpec,
  Context as JsonicContext,
  JsonicError,
} from '@tabnas/jsonic'


import { Debug } from '@tabnas/debug'

import {
  MultiSource
} from '@tabnas/multisource'

// TODO: @tabnas/multisource should support virtual fs

import {
  makeFileResolver
} from '@tabnas/multisource/resolver/file'

import {
  makePkgResolver
} from '@tabnas/multisource/resolver/pkg'

import {
  makeMemResolver
} from '@tabnas/multisource/resolver/mem'

import {
  Expr,
  Op,
} from '@tabnas/expr'

import {
  Path
} from '@tabnas/path'

import type {
  Val,
  AontuOptions,
} from './type'

import {
  SPREAD,
  DEFAULT_OPTS,
} from './type'

import {
  Site
} from './site'

import {
  top
} from './val/top'



import {
  ScalarKindVal,
  BigDecimal,
  BigInteger,
  Float,
  Integer,
} from './val/ScalarKindVal'


import { BigDecimalVal } from './val/BigDecimalVal'
import { BigIntegerVal } from './val/BigIntegerVal'
import { BIG_LITERAL_RE, readBigLiteral } from './val/Decimal'
import { BooleanVal } from './val/BooleanVal'
import { ConjunctVal } from './val/ConjunctVal'
import { DisjunctVal } from './val/DisjunctVal'
import { IntegerVal } from './val/IntegerVal'
import { ListVal } from './val/ListVal'
import { MapVal } from './val/MapVal'
import { NilVal } from './val/NilVal'
import { NullVal } from './val/NullVal'
import { NumberVal } from './val/NumberVal'
import { isIntegerKind, isLossyIntegerLiteral } from './val/numkind'
import { PrefVal } from './val/PrefVal'
import { RefVal } from './val/RefVal'
import { StringVal } from './val/StringVal'
import { VarVal } from './val/VarVal'
import { PlusOpVal } from './val/PlusOpVal'
import { UpperFuncVal } from './val/UpperFuncVal'
import { LowerFuncVal } from './val/LowerFuncVal'
import { CopyFuncVal } from './val/CopyFuncVal'
import { KeyFuncVal } from './val/KeyFuncVal'
import { TypeFuncVal } from './val/TypeFuncVal'
import { HideFuncVal } from './val/HideFuncVal'
import { MoveFuncVal } from './val/MoveFuncVal'
import { PathFuncVal } from './val/PathFuncVal'
import { PrefFuncVal } from './val/PrefFuncVal'
import { CloseFuncVal } from './val/CloseFuncVal'
import { OpenFuncVal } from './val/OpenFuncVal'
import { SuperFuncVal } from './val/SuperFuncVal'
import {
  MinConstraintVal,
  MaxConstraintVal,
  AboveConstraintVal,
  BelowConstraintVal,
  NeqConstraintVal,
  ReConstraintVal,
  LenConstraintVal,
  UniqueConstraintVal,
} from './val/ConstraintVal'


const asPlugin = (p: unknown): Plugin => p as Plugin


// Build the Val for a matched `0d` literal (see the `0d` value matcher
// below). Leaf by source: digits only is a biginteger, a `.` or an
// exponent makes it a bigdecimal.
//
// A literal over the D6 exactness budget becomes a LOCATED ERROR here
// and not a rounded or expanded value: `0d1e1000000000` has a one-digit
// coefficient, so only the scale bound catches it, and it is caught at
// parse -- before plain-form rendering would try to materialise a
// gigabyte of zeros.
// The source text of a negated exact literal. `-` is a prefix OPERATOR,
// not part of the literal, so the text has to be rebuilt here to keep
// `src` meaning "how this value is spelled" (see bigVal).
function negsrc(src: string): string {
  // src is never empty here: it is a BIG_LITERAL_RE match (at minimum
  // the two chars `0d`) or an already-negated spelling. Computed exact
  // values do carry src '', but they are built at unify time, long
  // after this parse-time opmap.
  return src.startsWith('-') ? src.slice(1) : '-' + src
}


function bigVal(res: RegExpExecArray): Val {
  const lit = readBigLiteral(res)
  // `src` is the literal's own text, and it is not decoration: a path
  // segment is spelled text, so `$.a.0d1` must address the key `0d1` --
  // the same key `a:{0d1:7}` creates -- rather than the number 1. See
  // RefVal.append. Without it the segment was empty and the reference
  // silently resolved to its own container.
  const src = res[0]
  return 'biginteger' === lit.leaf ? new BigIntegerVal({ peg: lit.int, src }) :
    'bigdecimal' === lit.leaf ? new BigDecimalVal({ peg: lit.dec, src }) :
      new NilVal({ why: lit.code })
}


// Char codes of the literal's fixed opening, for the guard below.
const CC_0 = 48
const CC_d = 100
const CC_D = 68

let AontuJsonic: Plugin = function AontuLang(jsonic: Jsonic) {

  jsonic.use(asPlugin(Path))

  // Only # line comments are valid Aontu syntax (see
  // docs/reference-language.md; go/lang.go sets the same). Clear the
  // underlying jsonic comment markers entirely, then define # directly,
  // so the comment set is hash-only regardless of those defaults.
  let dotRef = (r: Rule, ctx: JsonicContext, terms: any, prefix: boolean) => {
    terms = dropUnfilled(terms)
    if (0 === terms.length) return incompleteNil(r, ctx)
    return addsite(new RefVal({ peg: terms, prefix }), r, ctx)
  }

  jsonic.options({ comment: { def: null } })
  jsonic.options({
    comment: {
      lex: true,
      def: {
        hash: { line: true, start: '#', lex: true },
      },
    },
  })

  // Digit separators are legal only as a SINGLE separator BETWEEN
  // digits (the rule test/spec/engine-parity.tsv records as the engine's
  // adjudication; pinned by the sep-* rows in
  // test/spec/number-model.tsv). The engine's number matcher
  // enforces most of that already — `1_`, `_1`, `1_.5`, `1._5`, `1e_2`,
  // `1e2_` all fall through to text — but two gaps remain: a REPEATED
  // separator (`1__0` lexed as 10) and a separator at the edge of a
  // base-prefixed digit run (`0x_ff`, `0xff_` lexed as 255). Both
  // silently accept a typo as a different number, so aontu declines the
  // whole run instead and it lexes as text ("1__0"), exactly as `1_`
  // already does.
  //
  // `number.exclude` is tested against the matched number source and,
  // when it matches, makes the matcher decline the entire span. Kept in
  // lock-step with sepInvalid in go/lang.go, which is wired to the
  // equivalent `Number.Exclude` hook (and to the Check hook, which
  // constructs big base-prefixed tokens itself and so bypasses Exclude).
  jsonic.options({
    number: {
      // `__` repeated separator; `0x_`/`0o_`/`0b_` separator opening a
      // base-prefixed run; `_` closing any run. The prefix letter is
      // matched case-insensitively so the rule does not depend on which
      // prefix spellings the engine accepts.
      exclude: /__|^[-+]?0[xXoObB]_|_$/,
    },
  })

  // D3 -- the `0d` literal, the only route to the exact leaves
  // (biginteger and bigdecimal). See BIG_LITERAL_RE for the grammar and
  // the leaf-by-source rule.
  //
  // The literal is claimed by the TEXT MATCHER'S CHECK HOOK (the sibling
  // of the `Number.Check` hook the Go port already uses for big
  // base-prefixed literals), not by a `value.def` entry, because a `0d`
  // run may contain a `.` and the two claim source differently:
  //
  //   - A value def -- even a consuming one, matched against the full
  //     forward source -- is applied INSIDE the text matcher, AFTER its
  //     ender regexp has already carved the run at the `.`. The def
  //     claims `0d1.5` whole, but the matcher then still emits the
  //     ender's `.` as a fixed token, so `x:0d1.5` lexed as the
  //     bigdecimal FOLLOWED BY a dangling member-access dot (a path
  //     cycle). Verified, not theorised.
  //   - The check hook runs BEFORE that ender regexp and returns the
  //     token outright, so the run is claimed whole and nothing else is
  //     emitted.
  //
  // A `match.value` matcher (which runs ahead of every other matcher)
  // also claims it correctly, but it is a candidate at EVERY lex
  // position and materializes the forward source there: ~8% on a
  // text-heavy document, for a syntax almost none of them use. The check
  // hook only runs where the text matcher already runs, and measures at
  // parity with not having it.
  //
  // The number matcher never sees these runs at all: it declines `0d…`
  // outright, since `d` is not an ender.
  jsonic.options({
    text: {
      check: (lex: any) => {
        // Guard first, on char codes: this hook runs at every text
        // position, and the common case (any run that cannot be a `0d`
        // literal) must cost two char reads and no allocation.
        const pnt = lex.pnt
        const src = lex.src
        if (CC_0 !== src.charCodeAt(pnt.sI)) {
          return undefined
        }
        const c1 = src.charCodeAt(pnt.sI + 1)
        if (CC_d !== c1 && CC_D !== c1) {
          return undefined
        }

        // BIG_LITERAL_RE is `^`-anchored and read against the forward
        // source (memoized per position by refwd), which is what lets
        // it claim the `.` of `0d1.5`.
        const res = BIG_LITERAL_RE.exec(lex.refwd())
        if (null == res) {
          return undefined
        }

        const msrc = res[0]
        // The token value is a FUNCTION so Val construction happens at
        // parse time, where the rule and context needed for the site
        // exist (jsonic calls a #VL token's function value with them).
        // A `0d` literal never spans a line, so only the source and
        // column positions advance.
        const tkn = lex.token(
          '#VL',
          (r: Rule, ctx: JsonicContext) => addsite(bigVal(res), r, ctx),
          msrc,
          pnt)
        pnt.sI += msrc.length
        pnt.cI += msrc.length
        return { done: true, token: tkn }
      },
    },
  })

  // TODO: refactor Val constructor
  // let addsite = (v: Val, p: string[]) => (v.path = [...(p || [])], v)
  let addsite = (v: Val, r: Rule, ctx: JsonicContext) => {

    v.site.row = null == r.o0 ? -1 : r.o0.rI
    v.site.col = null == r.o0 ? -1 : r.o0.cI
    v.site.url = ctx.meta.multisource ? ctx.meta.multisource.path : ''
    // A keyed rule always carries a path array; a keyless one has none.
    v.path = r.k ? [...r.k.path] : []

    return v
  }


  jsonic.options({
    hint: {
      unknown: `
Since the error is unknown, this is probably a bug. Please consider
posting a github issue - thanks!

Code: {code}, Details: 
{details}`,

      unexpected: `
The character(s) {src} were not expected at this point as they do not
match the expected syntax. Use the # character to comment out lines to
help isolate the syntax error.`,

    },
    errmsg: {
      name: 'aontu',
      suffix: false,
    },
    fixed: {
      token: {
        '#QM': '?'
      },
    },
    value: {
      def: {
        // NOTE: specify with functions as jsonic/deep will
        // remove class prototype as options are assumed plain
        // (except for functions).
        // TODO: jsonic should be able to pass context into these
        'string': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: String }), r, ctx)
        },
        // `number` is a pure supertype: it matches a concrete value of
        // any numeric leaf and never tags one itself. `integer` and
        // `float` are the leaves (see ScalarKindVal for the lattice).
        'number': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: Number }), r, ctx)
        },
        'integer': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: Integer }), r, ctx)
        },
        'float': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: Float }), r, ctx)
        },
        // The two exact leaves. Their keywords are the marker class
        // names lowercased, which is also how ScalarKindVal canons them.
        'biginteger': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: BigInteger }), r, ctx)
        },
        'bigdecimal': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: BigDecimal }), r, ctx)
        },

        'boolean': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: Boolean }), r, ctx)
        },
        'nil': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new NilVal({ why: 'literal_nil' }), r, ctx)
        },

        // TODO: FIX: need a TOP instance to hold path
        'top': { val: () => top() },
      }
    },

    map: {
      merge: (prev: any, curr: any, _r: Rule, ctx: JsonicContext) => {
        let pval = (prev as Val)
        let cval = (curr as Val)

        if (pval?.isVal && cval?.isVal) {

          // TODO: test multi element conjuncts work
          if (pval.isConjunct && cval.isConjunct) {
            (pval as ConjunctVal).append(cval)
            return pval
          }
          else if (pval.isConjunct) {
            (pval as ConjunctVal).append(cval)
            return pval
          }
          else {
            return addsite(new ConjunctVal({ peg: [pval, cval] }), prev, ctx)
          }
        }

        // Handle defered conjuncts, where MapVal does not yet
        // exist, by creating ConjunctVal later.
        else {
          prev.___merge = (prev.___merge || [])
          prev.___merge.push(curr)
          return prev
        }
      }
    }
  })


  const funcMap: Record<string, any> = {
    upper: UpperFuncVal,
    lower: LowerFuncVal,
    copy: CopyFuncVal,
    key: KeyFuncVal,
    type: TypeFuncVal,
    hide: HideFuncVal,
    move: MoveFuncVal,
    path: PathFuncVal,
    pref: PrefFuncVal,
    close: CloseFuncVal,
    open: OpenFuncVal,
    super: SuperFuncVal,

    // The constraint algebra's Band A atoms (G1 phase 1;
    // docs/reference-language.md, "The constraint algebra"): bounds
    // and exclusion enter through the function registry — the
    // established extension point — with zero grammar change.
    min: MinConstraintVal,
    max: MaxConstraintVal,
    above: AboveConstraintVal,
    below: BelowConstraintVal,
    neq: NeqConstraintVal,

    // G1 phase 2: pattern membership, over the portable subset both
    // host regex engines agree on (nonPortableRe in ConstraintVal.ts).
    re: ReConstraintVal,

    // G1 phase 3: the sizing atoms. Both are properties of a CONTAINER
    // (or, for len, of a string) rather than comparisons against a
    // value, which is why `unique` is the one built-in taking no
    // argument at all.
    len: LenConstraintVal,
    unique: UniqueConstraintVal,
  }


  // A dangling operator (`a:1|`, `a:$`, `a:*` at end of input) leaves
  // null/undefined unfilled terms. Junction ops drop them (so `a:1&`
  // and `a:1|` are just 1); ops missing a required operand become an
  // incomplete_expression nil, surfaced by generate() as a "Cannot
  // resolve value" error (the Go port mirrors this in lang.go).
  const dropUnfilled = (terms: any) => terms.filter((t: any) => null != t)

  const incompleteNil = (r: Rule, ctx: JsonicContext) =>
    addsite(new NilVal({ why: 'incomplete_expression' }), r, ctx)

  let opmap: any = {
    'conjunct-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) =>
      addsite(new ConjunctVal({ peg: dropUnfilled(terms) }), r, ctx),

    'disjunct-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) =>
      addsite(new DisjunctVal({ peg: dropUnfilled(terms) }), r, ctx),

    // `.a` (prefix) and `a.b` (infix) build the same reference; only the
    // prefix flag differs, and both need the same missing-operand guard,
    // so they share one builder.
    'dot-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) =>
      dotRef(r, ctx, terms, true),

    'dot-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) =>
      dotRef(r, ctx, terms, false),

    'star-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      if (null == terms[0]) return incompleteNil(r, ctx)
      return addsite(new PrefVal({ peg: terms[0] }), r, ctx)
    },

    'dollar-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      if (null == terms[0]) return incompleteNil(r, ctx)
      // $.a.b absolute path
      if (terms[0] instanceof RefVal) {
        terms[0].absolute = true
        return terms[0]
      }
      return addsite(new VarVal({ peg: terms[0] }), r, ctx)
    },

    'plus-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      if (null == terms[0] || null == terms[1]) return incompleteNil(r, ctx)
      return addsite(new PlusOpVal({ peg: [terms[0], terms[1]] }), r, ctx)
    },

    'negative-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      let val = terms[0]
      if (null == val) return incompleteNil(r, ctx)
      // The exact leaves negate exactly and never change kind. R2/D5
      // holds here too: bigint has a single zero, and Decimal's
      // normalising constructor sends every zero to the same form, so
      // `-0d0` is `0d0` and `-0d0.0` is `0d0.0`.
      if (val instanceof BigIntegerVal) {
        return addsite(new BigIntegerVal(
          { peg: -val.peg, src: negsrc(val.src) }), r, ctx)
      }
      if (val instanceof BigDecimalVal) {
        return addsite(new BigDecimalVal(
          { peg: val.peg.negate(), src: negsrc(val.src) }), r, ctx)
      }
      // Negating a non-numeric operand (`k-x` splits into k, -x) is an
      // error nil, not NaN (mirrors negate() in go/lang.go).
      if (!(val instanceof IntegerVal) && !(val instanceof NumberVal)) {
        return addsite(new NilVal({ why: 'negative' }), r, ctx)
      }
      // Build a fresh Val rather than mutating in place: the expr plugin
      // can evaluate the same node twice (e.g. inside `*-1` or a
      // disjunct member), and an in-place `peg = -peg` applied twice
      // silently un-negates the number.
      let peg = -1 * val.peg
      // Normalize -0 to 0 (keeps the AST and canon free of negative zero).
      if (0 === peg) peg = 0
      // Negation never narrows the kind: a number stays a number. An
      // integer stays an integer unless the negation leaves the int64
      // range (only -(-2^63), which no literal can express), in which
      // case it widens to a number rather than failing.
      const out = val instanceof IntegerVal && isIntegerKind(peg)
        ? new IntegerVal({ peg })
        : new NumberVal({ peg })
      return addsite(out, r, ctx)
    },

    'positive-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      let val = terms[0]
      if (null == val) return incompleteNil(r, ctx)
      return addsite(val, r, ctx)
    },

    'func-paren': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      let val = terms[1]
      const fname = terms[0]
      if ('' !== fname) {
        const funcval = funcMap[fname]
        // Arity is known for every built-in, so a surplus or missing
        // argument is a mistake in the SOURCE, refused here where the
        // author can see it (issue #51). It was previously left to each
        // function to notice or not: the two ports disagreed on `upper()`
        // and on `close()`, and `min(1,2)` noticed nothing at all -- it
        // built a constraint that merely refused to generate later, with
        // a message about the map rather than about the call.
        //
        // Counted BEFORE the rawToVal pass below, which is what makes the
        // count possible: a comma group arrives as a RAW array and a
        // written list literal as a ListVal, and rawToVal turns the first
        // into the second.
        const arity = funcArity[fname]
        if (null != arity) {
          const got = writtenArgCount(terms.slice(1))
          if (got < arity[0] || (-1 !== arity[1] && got > arity[1])) {
            // details is assigned AFTER construction: the NilVal
            // constructor does not read it from its spec (only
            // NilVal.make does), so passing it in the spec left the
            // hint's {func}/{want}/{got} placeholders un-injected and
            // printed literally.
            const nil: any = new NilVal({ why: 'func_arity' })
            nil.details = {
              func: fname,
              want: arityText(arity[0], arity[1]),
              got: '' + got,
            }
            return addsite(nil, r, ctx)
          }
        }
        // rawToVal EVERY argument. A degenerate expression can hand this
        // handler raw parse values rather than Vals -- `pref(1-3)` arrives
        // as the plain numbers 1 and -3 -- and a func's peg is unified
        // element by element, so a raw one reached `arg.unify(...)` and
        // threw. The unifier's catch-all turned that into an `internal`
        // verdict: a crash reported as a unification result (issue #49).
        // The Go port has always converted here (asVal in evaluate).
        const args = terms.slice(1).map(rawToVal)
        val = null == funcval ?
          new NilVal({ why: 'unknown_function' }) :
          new funcval({
            peg: args
          })
      }
      // `a:()` — grouping parens with nothing inside.
      if (null == val) return incompleteNil(r, ctx)
      // ... and the same for a GROUPING paren, whose value is passed
      // straight through: `(([]%))` yielded a raw array, and addsite went
      // on to write a site onto it, throwing a TypeError that escaped the
      // unifier entirely ("Cannot set properties of undefined").
      const out = addsite(rawToVal(val), r, ctx)
      return out
    },
  }


  jsonic
    .use(asPlugin(Expr), {
      op: {
        // disjunct < conjunct: c & b | a -> (c & b) | a
        'conjunct': {
          infix: true, src: '&', left: 16_000_000, right: 17_000_000
        },

        'disjunct': {
          infix: true, src: '|', left: 14_000_000, right: 15_000_000
        },

        'plus-infix': {
          src: '+',
          infix: true,
          left: 20_000_000,
          right: 21_000_000,
        },

        // Re-base the unary prefixes for the same reason. Every aontu
        // operator sits far above the @tabnas/expr defaults, so the
        // default prefix binding power of 4_000_000 left unary `-`/`+`
        // LOOSER than every infix operator: `-1 & integer` parsed as
        // `-(1 & integer)`, and negative-prefix (below) then rejected
        // the composite operand as a `negative` error nil (likewise
        // `-2+3`, `-1|2`). Unary minus must bind tighter than `+`, `&`
        // and `|` — but still looser than `.` (dot-infix left is
        // 25_000_000), so `-0xFF.5` stays `-(0xFF.5)` and `$`.
        // Kept in lock-step with the op table in go/lang.go.
        'negative': {
          src: '-',
          prefix: true,
          right: 22_000_000,
        },

        'positive': {
          src: '+',
          prefix: true,
          right: 22_000_000,
        },

        'dollar-prefix': {
          src: '$',
          prefix: true,
          right: 31_000_000,
        },

        'dot-infix': {
          src: '.',
          infix: true,
          left: 25_000_000,
          right: 24_000_000,
        },

        'dot-prefix': {
          src: '.',
          prefix: true,
          right: 24_000_000,
        },

        'star': {
          src: '*',
          prefix: true,
          right: 24_000_000,
        },

        'func': {
          paren: true,
          preval: {
            active: true,
            // allow: ['floor'], //Object.keys(funcMap)
          },
          osrc: '(',
          csrc: ')',
        },

        plain: null,
        addition: null,
        subtraction: null,
        multiplication: null,
        division: null,
        remainder: null,
      },
      evaluate: (r: Rule, ctx: JsonicContext, op: Op, terms: any) => {
        // // console.log('EVAL-START', r.u)

        if (
          'func-paren' === op.name
          // && !r.parent.prev?.u?.paren_preval
          && !r.u?.paren_preval
        ) {
          // terms = [new StringVal({ peg: '' }), ...terms]
          terms = ['', ...terms]
        }


        let val: Val = opmap[op.name](r, ctx, op, terms)

        // // console.log('EVAL', terms, '->', val)

        return val
      }
    })


  const CJ = jsonic.token['#E&']
  const CL = jsonic.token.CL
  const ST = jsonic.token.ST
  const TX = jsonic.token.TX
  const NR = jsonic.token.NR

  const QM = jsonic.token.QM

  const OPTKEY = [TX, ST, NR]


  jsonic.rule('expr', (rs: RuleSpec) => {
    rs.close([
      // A `&` followed by `:` after an expression value belongs to the
      // enclosing map as a spread, not to the expression as a conjunct
      // — backtrack both tokens so the expression completes (and
      // evaluates to a Val) and the map's spread alts take over. This
      // is what makes `k1:$flag &:boolean` parse: without it the expr
      // plugin consumes the `&` as an infix conjunct, chokes on the
      // `:`, and leaves the raw unevaluated expr node in the map
      // (mirrors the expr-rule PrependClose in go/lang.go). The
      // `n: { expr: 0 }` reset matches the plugin's own expr-end alts —
      // the evaluation after-close only fires when the counter is 0.
      { s: [CJ, CL], b: 2, n: { expr: 0 }, g: 'expr,expr-end,spread' },
    ])
    return rs
  })


  jsonic.rule('val', (rs: RuleSpec) => {

    rs
      .open([
        {
          s: [CJ, CL], p: 'map', b: 2, n: { pk: 1 },
          // @tabnas seeds a descended rule's node from its parent; without
          // a fresh node here the nested spread map (`a:&:{x:1}`) would
          // share the parent map's node object and self-reference.
          a: (r: Rule) => { r.node = {} },
          g: 'spread'
        },

        {
          s: [OPTKEY, QM],
          c: (r) => 0 == r.d,
          p: 'map',
          b: 2,
          // Fresh node (see spread alt above): the optional dive descends
          // to a map and must not share the parent's node object.
          a: (r: Rule) => { r.node = {} },
          g: 'pair,jsonic,top,aontu-optional',
        },

        {
          s: [OPTKEY, QM],
          p: 'map',
          b: 2,
          n: { pk: 1 },
          a: (r: Rule) => { r.node = {} },
          g: 'pair,jsonic,top,dive,aontu-optional',
        },

      ])

      .ac((r: Rule, ctx: JsonicContext) => {

        let valnode: Val = r.node
        let valtype = typeof valnode

        if ('string' === valtype) {
          valnode = addsite(new StringVal({ peg: r.node }), r, ctx)
        }
        else if ('number' === valtype) {
          // An overflowing literal (1e999) lexes to Infinity; that is an
          // error value, not a number (mirrors not_number in go/lang.go).
          if (!Number.isFinite(r.node)) {
            valnode = addsite(new NilVal({ why: 'not_number' }), r, ctx)
          }
          // D7 -- A LOSSY INTEGER LITERAL IS REFUSED, NOT ROUNDED. The
          // token above is already a double, so a literal the double
          // cannot hold exactly (2^53+1, 0x7fffffffffffffff,
          // 0xffffffffffffffff) has ALREADY become a different number by
          // the time it gets here. Storing it would mean the document
          // silently means something other than what it says, so the
          // literal becomes a located error whose hint names the escape:
          // write it `0d…` and get the exact value.
          //
          // The rule is EXACTNESS, not magnitude -- 10^20 and 2^124 are
          // both far outside the int64 window and both land exactly on a
          // binary64, so both stay values (see isLossyIntegerLiteral).
          else if (isLossyIntegerLiteral(r.node, r.o0.src)) {
            const nil = new NilVal({ why: 'lossy_integer_literal' })
            nil.details = { src: r.o0.src }
            valnode = addsite(nil, r, ctx)
          }
          // A literal is integer kind only if its source has no '.', its
          // value is integral, and it fits the int64 range: `1.0` is a
          // number, and so are 1e21 and 100000000000000000000 (see
          // isIntegerKind).
          else if (isIntegerKind(r.node, r.o0.src)) {
            valnode = addsite(new IntegerVal({ peg: r.node, src: r.o0.src }), r, ctx)
          }
          else {
            valnode = addsite(new NumberVal({ peg: r.node, src: r.o0.src }), r, ctx)
          }
        }
        else if ('boolean' === valtype) {
          valnode = addsite(new BooleanVal({ peg: r.node }), r, ctx)
        }
        else if (null === valnode) {
          valnode = addsite(new NullVal({ peg: r.node }), r, ctx)
        }

        if (null != valnode && 'object' === typeof valnode && valnode.site) {
          let st = r.o0
          valnode.site.row = st.rI
          valnode.site.col = st.cI
          valnode.site.url = ctx.meta.multisource && ctx.meta.multisource.path
        }
        // else { ERROR? }

        r.node = valnode

        return undefined
      })

      .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])

    return rs
  })


  jsonic.rule('map', (rs: RuleSpec) => {
    rs
      .open([
        { s: [CJ, CL], p: 'pair', b: 2, g: 'spread' },

        { s: [OPTKEY, QM], p: 'pair', b: 2, g: 'pair,list,val,imp,jsonic,aontu-optional' },
      ])

      .bc((r: Rule, ctx: JsonicContext) => {
        const optionalKeys = r.u.aontu_optional_keys ?? []

        let mo = r.node

        // An elided value (`a:`) leaves a raw null/undefined that never
        // passed through the val rule. It is REFUSED rather than made a
        // null (issue #48): a key with nothing after the colon is a
        // mistake in the source, and turning it into a value made that
        // mistake indistinguishable from a deliberate `a:null`.
        //
        // A colon chain (`a: b:1`) is not an elision -- the value is the
        // nested pair, which the val rule does produce -- and neither is
        // a trailing comma.
        for (const k in mo) {
          if (null == mo[k] && '___merge' !== k) {
            // Pathed at the KEY, not at the enclosing map. addsite takes
            // the rule's path, which here is the map's, so the error
            // would otherwise name the container and leave the reader to
            // work out which key was elided.
            const en: any = addsite(new NilVal({ why: 'elided_value' }), r, ctx)
            en.path = [...(r.k?.path ?? []), k]
            mo[k] = en

            // An elided value under an OPTIONAL key stops being optional.
            // Optionality is about a value that may be absent at
            // GENERATE; it does not excuse a source that stops after the
            // colon. Left optional, the refusal was dropped with the key
            // and `a?:` generated `{}` -- a silent nothing, which is
            // worse than either the old null or the error.
            const oi = optionalKeys.indexOf(k)
            if (-1 !== oi) {
              optionalKeys.splice(oi, 1)
            }
          }
        }

        // ... and the OPTIONAL spelling, `a?:`, which does not leave a
        // null behind to be found: its value never reaches the node at
        // all, so the key is simply absent and the map generated without
        // it. A key recorded as optional but missing from the node was
        // written with nothing after its colon.
        for (const k of optionalKeys) {
          if (!(k in mo)) {
            mo[k] = addsite(new NilVal({ why: 'elided_value' }), r, ctx)
          }
        }

        // An elided SPREAD (`x:$obj&:` with nothing after the colon)
        // refuses the whole map, not a key (issue #48). A spread is not a
        // child, so a refusal stored in its place has nothing to attach
        // to: `x:&:` has no children for the spread to apply to, and the
        // map would generate as `{}` with the mistake silently gone.
        // Refusing the container is what makes it visible at all.
        const sp: any = (mo as any)[SPREAD]
        if (sp && sp.v.some((sv: any) => null == sv)) {
          r.node = addsite(new NilVal({ why: 'elided_value' }), r, ctx)
          return undefined
        }

        //  Handle defered conjuncts, e.g. `{x:1 @"foo"}`
        if (mo.___merge) {
          let mop = { ...mo }
          delete mop.___merge

          // TODO: needs addpath?
          let mopv = new MapVal({ peg: mop })
          mopv.optionalKeys = optionalKeys

          r.node =
            addsite(new ConjunctVal({ peg: [mopv, ...mo.___merge] }), r, ctx)
        }
        else {
          r.node = addsite(new MapVal({ peg: mo }), r, ctx)
          r.node.optionalKeys = optionalKeys
        }

        return undefined
      })

      .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])

    return rs
  })



  jsonic.rule('list', (rs: RuleSpec) => {
    rs
      // .open([{ s: [CJ, CL], p: 'pair', b: 2, g: 'spread' }])

      .bc((r: Rule, ctx: JsonicContext) => {
        const optionalKeys = r.u.aontu_optional_keys ?? []

        let ao = r.node

        // An elided ELEMENT (`[,]`, `[1,,2]`) is refused for the same
        // reason as an elided map value (issue #48). A trailing comma
        // (`[1,]`) is not an elision and never reaches here.
        for (let i = 0; i < ao.length; i++) {
          if (null == ao[i]) {
            // Pathed at the INDEX, for the same reason as the map case.
            const en: any = addsite(new NilVal({ why: 'elided_value' }), r, ctx)
            en.path = [...(r.k?.path ?? []), '' + i]
            ao[i] = en
          }
        }

        // No ___merge arm here: the deferred map.merge that writes it
        // only ever fires for a `pair` rule, whose parent is always a
        // `map` rule with a plain-object node — never a list.
        {
          r.node = addsite(new ListVal({ peg: ao }), r, ctx)
          r.node.optionalKeys = optionalKeys
        }

        return undefined
      })

    // .close([{ s: [CJ, CL], b: 2, g: 'spread,json,more' }])

    return rs
  })


  // TODO: copied from jsonic grammar
  // jsonic should provide a way to export this
  const pairkey = (r: Rule) => {
    // Get key string value from first matching token of `Open` state.
    const key_token = r.o0
    const key =
      ST === key_token.tin || TX === key_token.tin
        ? key_token.val // Was text
        : key_token.src // Was number, use original text

    r.u.key = key
  }


  // A pair in LIST position writes its value at `node[key]` like any
  // other pair, and the enclosing list's node is an ARRAY -- so a numeric
  // key lands on an index and becomes an element, and may land on an
  // index a real element already holds (`[5,0:1]`). Since the pair must
  // contribute nothing (issue #40), the slot is photographed before the
  // value is parsed and put back afterwards. Restoring beats deleting for
  // exactly the overwrite case: deleting `[5,0:1]`'s index 0 would take
  // the 5 with it, where restoring gives back the list the pair was
  // never part of.
  //
  // `length` is saved too: writing past the end grows an array, and
  // `[5,1?:9]` must be [5] again and not [5, <hole>].
  // Typed as a string bag deliberately: the slot may be named by a
  // non-numeric key (`[x:1]`), which the array type would refuse. Both
  // helpers run only from the elem rule, whose node is the enclosing
  // list, so neither guards against a non-array node — a guard there
  // proved unreachable and dead code is worse than none.
  const asSlots = (r: Rule): Record<string, any> => r.node as any

  const snapshotPairSlot = (r: Rule, key: string) => {
    const node = asSlots(r)
    r.u.aontu_pair_slot = {
      key,
      had: Object.prototype.hasOwnProperty.call(node, key),
      was: node[key],
      len: node.length,
    }
  }

  const restorePairSlot = (r: Rule) => {
    const slot: any = r.u.aontu_pair_slot
    if (null == slot) {
      return
    }
    const node = asSlots(r)
    if (slot.had) {
      node[slot.key] = slot.was
    }
    else {
      delete node[slot.key]
    }
    node.length = slot.len
  }


  jsonic.rule('pair', (rs: RuleSpec) => {
    rs
      .open([
        {
          s: [CJ, CL], p: 'val',
          u: { spread: true },
          g: 'spread'
        },

        {
          s: [OPTKEY, QM], b: 1, r: 'pair', u: { aontu_optional: true },
          g: 'aontu-optional-key'
        },

        {
          s: [QM, CL],
          c: (r) => r.prev.u.aontu_optional,
          p: 'val',
          u: { pair: true },
          a: (r) => {
            pairkey(r.prev)
            r.u.key = r.prev.u.key

            r.parent.u.aontu_optional_keys = (r.parent.u.aontu_optional_keys || [])
            r.parent.u.aontu_optional_keys.push('' + r.u.key)
          },
          g: 'aontu-optional-pair'
        }
      ])

      // NOTE: manually adjust path - @tabnas/path ignores as not pair:true
      .ao((r) => {
        if (0 < r.d && r.u.spread) {
          r.child.k.path = [...r.k.path, '&']
          r.child.k.key = '&'
        }
      })

      .bc((rule: Rule) => {
        // TRAVERSE PARENTS TO GET PATH

        if (rule.u.spread) {
          rule.node[SPREAD] =
            (rule.node[SPREAD] || { o: rule.o0.src, v: [] })

          rule.node[SPREAD].v.push(rule.child.node)
        }

        return undefined
      })

      .close([
        // A following `&:` starts a sibling spread pair in the current
        // map: directly inside a braced map (pk<=0) at any depth, or in
        // the implicit top-level map (dmap<=1). Inside an implicit
        // colon-chain map (pk>0) it bubbles up instead (second alt), so
        // `a:b:1 &:2` attaches the spread to a's map, not b's.
        { s: [CJ, CL], c: (r) => r.lte('pk', 0) || r.lte('dmap', 1), r: 'pair', b: 2, g: 'spread,json,pair' },
        { s: [CJ, CL], b: 2, g: 'spread,json,more' }
      ])


    return rs
  })


  jsonic.rule('elem', (rs: RuleSpec) => {
    rs
      .open([
        {
          s: [CJ, CL],
          p: 'val',
          n: { pk: 1, dmap: 1 },
          u: { spread: true, done: true, list: true },
          g: 'spread'
        },

        {
          s: [OPTKEY, QM], b: 1, r: 'elem', u: { aontu_optional: true },
          g: 'aontu-optional-key-elem'
        },

        {
          s: [QM, CL],
          c: (r) => r.prev.u.aontu_optional,
          p: 'val',
          u: { spread: true, done: true, list: true, pair: true },
          a: (r) => {
            pairkey(r.prev)
            r.u.key = r.prev.u.key
            snapshotPairSlot(r, '' + r.u.key)
          },
          g: 'aontu-optional-elem'
        },

        // A PLAIN pair in list position, `[k:v]`. It contributes no
        // element either -- a key:value pair is simply not a list element,
        // which is the rule the optional form above already followed, and
        // the two spellings must not disagree (issue #40).
        //
        // It needed an alt of its own because only a NON-NUMERIC key was
        // already inert: jsonic writes the pair at `node[key]`, and the
        // node is an array, so `[x:1]` set a property that never showed up
        // (`length` stays 0) while `[0:1]` set an INDEX and became an
        // element -- `[1:2]` even filling the gap with a null. That is the
        // shape of a JavaScript array, not a decision about the language,
        // and it made the two ports disagree on generate as well as canon.
        {
          s: [OPTKEY, CL], p: 'val',
          u: { spread: true, done: true, list: true, pair: true },
          a: (r) => {
            pairkey(r)
            snapshotPairSlot(r, '' + r.u.key)
          },
          g: 'aontu-plain-pair-elem'
        }
      ])


      .bc((rule: Rule) => {
        // TRAVERSE PARENTS TO GET PATH

        if (rule.u.spread) {
          rule.node[SPREAD] =
            (rule.node[SPREAD] || { o: rule.o0.src, v: [] })
          rule.node[SPREAD].v.push(rule.child.node)
        }

        restorePairSlot(rule)

        return undefined
      })

      .close([{ s: [CJ, CL], r: 'elem', b: 2, g: 'spread,json,more' }])

    return rs
  })

}



// SECURITY: the default resolver reads any file/package the process can
// reach — @"path" follows relative paths (`@"../../etc/passwd"`) and
// symlinks with no containment check, and @"pkg" can require() arbitrary
// installed modules. This is intentional for the CLI, but it means a
// `.aon` source can read referenced files; the LSP uses this same
// resolver, so treat opening an untrusted source as running it. Pass a
// confined `options.resolver` to restrict reads in less-trusted contexts.
function makeModelResolver(options: any) {
  const useRequire = options.require || require

  let memResolver = makeMemResolver({
    ...(options.resolver?.mem || {})
  })

  // TODO: make this consistent with other resolvers
  let fileResolver = makeFileResolver((spec: any) => {
    return 'string' === typeof spec ? spec : spec?.peg
  })

  let pkgResolver = makePkgResolver({
    require: useRequire,
    ...(options.resolver?.pkg || {})
  })

  return function ModelResolver(
    spec: any,
    popts: any,
    rule: Rule,
    ctx: JsonicContext,
    jsonic: Tabnas
  ) {

    // The aontu val rule's ac has already wrapped every raw string node
    // as a StringVal, so spec is a Val here (or a raw object from a
    // .json/.js include, whose peg is undefined -> not found).
    let path = spec?.peg

    // A bare `@` with no path (`a:@`) has nothing to resolve; report
    // not-found instead of crashing in the underlying resolvers.
    if (null == path || '' === path) {
      return { found: false, path: '' + (path ?? ''), search: [] }
    }

    let search: any = []
    let res = memResolver(path, popts, rule, ctx, jsonic)
    res.path = path
    if (res.found) {
      return res
    }

    search = search.concat(res.search)

    res = fileResolver(path, popts, rule, ctx, jsonic)
    res.path = path
    if (res.found) {
      return res
    }

    search = search.concat(res.search)

    res = pkgResolver(path, popts, rule, ctx, jsonic)
    res.path = path
    if (res.found) {
      return res
    }

    res.search = search.concat(res.search)
    return res
  }
}


// funcArity is the permitted WRITTEN argument count of each built-in, as
// [min, max]; a max of -1 is unbounded. Every name in funcMap has an
// entry, and the arity is a property of the language rather than of
// either port -- go/func.go carries the same table.
//
// Nearly everything takes exactly one. The three exceptions earn their
// place: key() names how many levels UP the path to read, defaulting to
// the parent when omitted, neq takes a whole set of exclusions, and
// unique() is a property of the container rather than a comparison
// against anything, so there is nothing for it to take.
const funcArity: Record<string, [number, number]> = {
  upper: [1, 1], lower: [1, 1], copy: [1, 1], pref: [1, 1],
  super: [1, 1], type: [1, 1], hide: [1, 1], close: [1, 1],
  open: [1, 1], move: [1, 1], path: [1, 1],
  min: [1, 1], max: [1, 1], above: [1, 1], below: [1, 1], re: [1, 1],
  len: [1, 1],
  key: [0, 1],
  unique: [0, 0],
  neq: [1, -1],
}


// writtenArgCount counts the arguments as the AUTHOR wrote them.
//
// It cannot simply be terms.length: a comma group reaches the func-paren
// handler as ONE term holding a raw array, so `upper("a","b")` and
// `upper(["a","b"])` both arrive as a single argument. They are still
// distinguishable, and that is what makes an arity check possible at
// all -- the comma group is a RAW array, while a written list literal
// has already been built into a ListVal by the list rule.
function writtenArgCount(terms: any[]): number {
  if (1 === terms.length) {
    // `terms[0]` is re-read rather than reusing a narrowed local:
    // Array.isArray narrows an `any` to `any[]`, which then has no
    // `isVal` to test.
    const t: any = terms[0]
    if (Array.isArray(t) && true !== (terms[0] as any).isVal) {
      return t.length
    }
  }
  return terms.length
}


// arityText renders a built-in's permitted count for the error message.
// The fixed-arity case says "one" outright rather than counting: every
// fixed arity in the table IS one, and a phrasing for a count no entry
// carries would be untested prose pretending to be tested.
function arityText(lo: number, hi: number): string {
  if (-1 === hi) {
    return 'one or more arguments'
  }
  if (lo !== hi) {
    return 'no arguments or one'
  }
  if (0 === hi) {
    return 'no arguments'
  }
  return 'exactly one argument'
}


// rawToVal converts a raw parse node (or raw elements inside one) into
// the matching Val. Used for implicit top-level lists, whose nodes skip
// the aontu val rule conversions (mirrors asVal in go/lang.go; like
// there, source text is unavailable, so an integral number is an
// integer).
// The targeted parse hint for CUE-trained authors and models: `>` and
// `<` are not Aontu operators (the op-chars reservation stands), and an
// agent that emits `number > 0` should be redirected to the bound
// atoms, not left with a bare "unexpected character". Appended to a
// parse error's message when the source carries an unquoted `<` or
// `>`; the Go twin is opCharHint in go/lang.go, byte-identical text.
function opCharHint(src: string): string {
  let q = ''
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if ('' !== q) {
      if (c === q && '\\' !== src[i - 1]) {
        q = ''
      }
      continue
    }
    if ('"' === c || '\'' === c || '`' === c) {
      q = c
    }
    else if ('<' === c || '>' === c) {
      return '\nThe > and < characters are not Aontu operators: write the ' +
        'bound functions min(x), max(x), above(x), below(x) instead.'
    }
  }
  return ''
}


function rawToVal(n: any): Val {
  if (null == n) {
    return new NullVal({ peg: null })
  }
  if (true === n.isVal) {
    return n
  }
  if (Array.isArray(n)) {
    return new ListVal({ peg: n.map(rawToVal) })
  }
  const t = typeof n
  if ('string' === t) {
    return new StringVal({ peg: n })
  }
  if ('number' === t) {
    // No source text here, so the "no '.'" condition is vacuous and the
    // integral + int64-range conditions decide (same helper as the val
    // rule, so the two paths cannot drift).
    return isIntegerKind(n) ?
      new IntegerVal({ peg: n }) : new NumberVal({ peg: n })
  }
  if ('boolean' === t) {
    return new BooleanVal({ peg: n })
  }
  if ('object' === t) {
    // An expr-plugin internal (operator descriptor) leaking through a
    // degenerate parse (`k2.b K:1`) is not data — reject it rather
    // than emitting raw internals in generated output.
    if (undefined !== (n as any).OP_MARK) {
      return new NilVal({ why: 'parse_unknown' })
    }
    const peg: Record<string, Val> = {}
    for (const k in n) {
      peg[k] = rawToVal(n[k])
    }
    return new MapVal({ peg })
  }
  return new NilVal({ why: 'parse_unknown' })
}


class Lang {
  jsonic: Jsonic
  opts: AontuOptions
  idcount: number | undefined


  constructor(options?: Partial<AontuOptions>) {
    // const start = performance.now()

    this.opts = Object.assign(DEFAULT_OPTS(), options) as AontuOptions

    const modelResolver = makeModelResolver(this.opts)

    this.jsonic = Jsonic.make()

    if (this.opts.debug) {
      this.jsonic.use(asPlugin(Debug), {
        trace: this.opts.trace
      })
    }

    this.jsonic
      .use(asPlugin(MultiSource), {
        resolver: options?.resolver || modelResolver,
        // `.aon` is the preferred Aontu source extension; `.aontu` also
        // works. `.jsonic` is retired (no longer auto-resolved); the
        // default `['jsonic','jsc','json','js']` is overridden here.
        // (Upstream option name is the misspelled `implictExt`.)
        implictExt: ['aon', 'aontu'],
        processor: {
          aontu: 'jsonic',
          aon: 'jsonic',
        }
      })
      .use(AontuJsonic)
  }


  parse(src: string, opts?: Partial<AontuOptions>): Val {
    // const start = performance.now()

    // JSONIC-UPDATE - check meta
    let jm: any = {
      fs: opts?.fs,
      fileName: opts?.path ?? this.opts.path,
      multisource: {
        path: opts?.path ?? this.opts.path,
        deps: (opts && opts.deps) || undefined
      }
    }

    if (null != opts?.idcount) {
      this.idcount = opts.idcount
    }

    // Pass through Jsonic debug log value
    if (opts && null != opts.log && Number.isInteger(opts.log)) {
      jm.log = opts.log
    }

    // jm.log = -1

    let val: Val

    try {
      val = this.jsonic(src, jm)

      // An implicit top-level list (`a b`, `1,2`) is built by the core
      // jsonic grammar without passing through the aontu val/list rules,
      // so the root (and its elements) arrive as raw JS values. Convert
      // them the same way the Go port's asVal post-walk does.
      if (null != val && true !== (val as any).isVal) {
        val = rawToVal(val)
      }
    }
    catch (e: any) {
      if (e instanceof JsonicError || 'JsonicError' === e.constructor.name) {
        val = new NilVal({
          why: 'parse',
          err: new NilVal({
            why: 'syntax',
            msg: e.message + opCharHint(src),
            err: e,
          })
        })
      }
      else {
        throw e
      }
    }

    return val
  }
} /* node:coverage ignore next 6 */

export {
  Lang,
  Site,
}
