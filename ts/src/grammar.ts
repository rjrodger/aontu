/* Copyright (c) 2026 Richard Rodger, MIT License */

// The grammar seam, ADR-033. Twin of go/grammar.go.

import { Tabnas } from '@tabnas/parser'
import { abnf } from '@tabnas/abnf'

import { AontuContext } from './ctx'


// A constant, not a trust knob: this bounds a third party's grammar.
const PARSE_STEP_MAX = 100000

const PARSE_CHECK_EVERY = 100


const cache = new Map<string, [any, string | undefined]>()


const steps = { n: 0 }


function compileGrammar(src: string): [any, string | undefined] {
  const hit = cache.get(src)
  if (undefined !== hit) {
    return hit
  }

  let out: [any, string | undefined]
  try {
    // Lexing off, or the engine reads `1 . 2 . 3` as `1.2.3`. The hook
    // is installed here because the engine takes it at construction.
    const tn = new Tabnas({
      space: { lex: false },
      parse: {
        budget: {
          checkEveryN: PARSE_CHECK_EVERY,
          onCheck: () => (steps.n += PARSE_CHECK_EVERY) <= PARSE_STEP_MAX,
        }
      }
    })
    tn.use(abnf)
    tn.abnf(src)
    out = [tn, undefined]
  }
  catch (e: any) {
    out = [undefined, String(e?.message ?? e).split('\n')[0]]
  }

  cache.set(src, out)
  return out
}


function parseWith(grammar: any, text: string, _ctx: AontuContext):
  [any, string | undefined] {
  steps.n = 0
  try {
    return [grammar.parse(text), undefined]
  }
  catch (e: any) {
    return [undefined, String(e?.message ?? e).split('\n')[0]]
  }
} /* node:coverage ignore next 8 */


export {
  compileGrammar,
  parseWith,
  PARSE_STEP_MAX,
  PARSE_CHECK_EVERY,
}
