/* Copyright (c) 2021-2025 Richard Rodger, MIT License */


// import { performance } from 'node:perf_hooks'

import {
  Jsonic,
  Plugin,
  Rule,
  RuleSpec,
  Context as JsonicContext,
  JsonicError,
} from 'jsonic'


import { Debug } from 'jsonic/debug'

import {
  MultiSource
} from '@jsonic/multisource'

// TODO: @jsonic/multisource should support virtual fs

import {
  makeFileResolver
} from '@jsonic/multisource/resolver/file'

import {
  makePkgResolver
} from '@jsonic/multisource/resolver/pkg'

import {
  makeMemResolver
} from '@jsonic/multisource/resolver/mem'

import {
  Expr,
  Op,
} from '@jsonic/expr'

import {
  Path
} from '@jsonic/path'

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



import { ScalarKindVal, Integer } from './val/ScalarKindVal'


import { BooleanVal } from './val/BooleanVal'
import { ConjunctVal } from './val/ConjunctVal'
import { DisjunctVal } from './val/DisjunctVal'
import { IntegerVal } from './val/IntegerVal'
import { ListVal } from './val/ListVal'
import { MapVal } from './val/MapVal'
import { NilVal } from './val/NilVal'
import { NullVal } from './val/NullVal'
import { NumberVal } from './val/NumberVal'
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


let AontuJsonic: Plugin = function AontuLang(jsonic: Jsonic) {

  jsonic.use(Path)

  // TODO: refactor Val constructor
  // let addsite = (v: Val, p: string[]) => (v.path = [...(p || [])], v)
  let addsite = (v: Val, r: Rule, ctx: JsonicContext) => {

    v.site.row = null == r.o0 ? -1 : r.o0.rI
    v.site.col = null == r.o0 ? -1 : r.o0.cI
    v.site.url = ctx.meta.multisource ? ctx.meta.multisource.path : ''
    v.path = r.k ? [...(r.k.path || [])] : []

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
        'number': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: Number }), r, ctx)
        },
        'integer': {
          val: (r: Rule, ctx: JsonicContext) =>
            addsite(new ScalarKindVal({ peg: Integer }), r, ctx)
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
  }


  let opmap: any = {
    'conjunct-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) =>
      addsite(new ConjunctVal({ peg: terms }), r, ctx),

    'disjunct-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) =>
      addsite(new DisjunctVal({ peg: terms }), r, ctx),

    'dot-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      return addsite(new RefVal({ peg: terms, prefix: true }), r, ctx)
    },

    'dot-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      // // console.log('DOT-INFIX-OP', terms)
      return addsite(new RefVal({ peg: terms }), r, ctx)
    },

    'star-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) =>
      addsite(new PrefVal({ peg: terms[0] }), r, ctx),

    'dollar-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      // $.a.b absolute path
      if (terms[0] instanceof RefVal) {
        terms[0].absolute = true
        return terms[0]
      }
      return addsite(new VarVal({ peg: terms[0] }), r, ctx)
    },

    'plus-infix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      return addsite(new PlusOpVal({ peg: [terms[0], terms[1]] }), r, ctx)
    },

    'negative-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      let val = terms[0]
      val.peg = -1 * val.peg
      return addsite(val, r, ctx)
    },

    'positive-prefix': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      let val = terms[0]
      return addsite(val, r, ctx)
    },

    'func-paren': (r: Rule, ctx: JsonicContext, _op: Op, terms: any) => {
      let val = terms[1]
      const fname = terms[0]
      if ('' !== fname) {
        const funcval = funcMap[fname]
        const args = terms.slice(1)
        val = null == funcval ?
          new NilVal({ why: 'unknown_function' }) :
          new funcval({
            peg: args
          })
      }
      const out = addsite(val, r, ctx)
      return out
    },
  }


  jsonic
    .use(Expr, {
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


  jsonic.rule('val', (rs: RuleSpec) => {

    rs
      .open([
        { s: [CJ, CL], p: 'map', b: 2, n: { pk: 1 }, g: 'spread' },

        {
          s: [OPTKEY, QM],
          c: (r) => 0 == r.d,
          p: 'map',
          b: 2,
          g: 'pair,jsonic,top,aontu-optional',
        },

        {
          s: [OPTKEY, QM],
          p: 'map',
          b: 2,
          n: { pk: 1 },
          g: 'pair,jsonic,top,dive,aontu-optional',
        },

      ])

      .bc((r: Rule, ctx: JsonicContext) => {

        let valnode: Val = r.node
        let valtype = typeof valnode

        if ('string' === valtype) {
          valnode = addsite(new StringVal({ peg: r.node }), r, ctx)
        }
        else if ('number' === valtype) {
          // 1.0 in source is *not* an integer
          if (Number.isInteger(r.node) && !r.o0.src.includes('.')) {
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

        if (ao.___merge) {
          let aop = [...ao]
          delete (aop as any).___merge

          // TODO: needs addpath?
          let aopv = new ListVal({ peg: aop })
          aopv.optionalKeys = optionalKeys

          r.node =
            addsite(new ConjunctVal({ peg: [aopv, ...ao.___merge] }), r, ctx)
        }
        else {
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

      // NOTE: manually adjust path - @jsonic/path ignores as not pair:true
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
        { s: [CJ, CL], c: (r) => r.lte('dmap', 1), r: 'pair', b: 2, g: 'spread,json,pair' },
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

            r.parent.u.aontu_optional_keys = (r.parent.u.aontu_optional_keys || [])
            r.parent.u.aontu_optional_keys.push('' + r.u.key)
          },
          g: 'aontu-optional-elem'
        }
      ])


      .bc((rule: Rule) => {
        // TRAVERSE PARENTS TO GET PATH

        if (rule.u.spread) {
          rule.node[SPREAD] =
            (rule.node[SPREAD] || { o: rule.o0.src, v: [] })
          rule.node[SPREAD].v.push(rule.child.node)
        }

        return undefined
      })

      .close([{ s: [CJ, CL], r: 'elem', b: 2, g: 'spread,json,more' }])

    return rs
  })

}



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
    jsonic: Jsonic
  ) {

    let path = 'string' === typeof spec ? spec : spec?.peg
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
      this.jsonic.use(Debug, {
        trace: this.opts.trace
      })
    }

    this.jsonic
      .use(AontuJsonic)
      .use(MultiSource, {
        resolver: options?.resolver || modelResolver,
        processor: {
          aontu: 'jsonic'
        }
      })
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
    }
    catch (e: any) {
      if (e instanceof JsonicError || 'JsonicError' === e.constructor.name) {
        val = new NilVal({
          why: 'parse',
          err: new NilVal({
            why: 'syntax',
            msg: e.message,
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
}

export {
  Lang,
  Site,
}
