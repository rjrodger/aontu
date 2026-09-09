/* Copyright (c) 2026 Richard Rodger, MIT License */

// `translate` -- per-character substitution and deletion (SPIKE,
// ts/src/val/TranslateFuncVal.ts). TypeScript only, so the cases live
// here rather than in test/spec/*.tsv.
//
// The `upper`/`lower` CASE RANGE is not here: it landed in both ports,
// so its cases are shared rows in test/spec/func.tsv. What is here is
// the two argument shapes those rows cannot reach from source.

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'

import { Aontu } from '..'
import { caseSpan } from '../dist/val/caserange'


const A = new Aontu()
const G = (src: string) => A.generate(src)

const E = (src: string): string | undefined => {
  try {
    A.generate(src)
  }
  catch (err: any) {
    const errs = 'function' === typeof err?.errs ? err.errs() : []
    return errs[0]?.why
  }
  return undefined
}


describe('translate', () => {

  test('maps-each-character', () => {
    Assert.equal(G('a: translate("hello world", "lo", "01")').a, 'he001 w1r0d')
  })


  // THE OPERATION `rep` CANNOT DO. A per-character map spelled as N
  // `rep` calls composes wrongly, because each pass sees the previous
  // one's output: rep(rep(x,"a","b"),"b","a") maps every original `a`
  // back to `a`. `translate` reads the source once.
  test('swaps', () => {
    Assert.equal(G('a: translate("abab", "ab", "ba")').a, 'baba')
    Assert.equal(G('a: rep(rep("abab", "a", "b"), "b", "a")').a, 'aaaa')
  })


  // An empty or absent `to` deletes: there is no last character to pad
  // with, so the two are the same rule read twice.
  test('deletes', () => {
    Assert.equal(G('a: translate("hello", "l")').a, 'heo')
    Assert.equal(G('a: translate("hello", "l", "")').a, 'heo')
    Assert.equal(G('a: translate("a1b2c3", "0-9")').a, 'abc')
  })


  test('a-short-to-pads-with-its-last', () => {
    Assert.equal(G('a: translate("abc", "abc", "x")').a, 'xxx')
    Assert.equal(G('a: translate("abcd", "abcd", "xy")').a, 'xyyy')
  })


  test('ranges', () => {
    Assert.equal(G('a: translate("Hello", "a-z", "A-Z")').a, 'HELLO')
    Assert.equal(G('a: translate("secret", "a-y", "b-z")').a, 'tfdsfu')
    Assert.equal(G('a: translate("2026-09-09", "0-9", "x")').a, 'xxxx-xx-xx')

    // A `-` first or last in a set is itself: the sets take no escape,
    // so this is the only way to mean a literal one.
    Assert.equal(G('a: translate("a-b", "-", "_")').a, 'a_b')
    Assert.equal(G('a: translate("a-b", "-x", "_y")').a, 'a_b')
    Assert.equal(G('a: translate("axb", "x-", "y_")').a, 'ayb')
  })


  // A character named twice takes its LAST mapping: the table is built
  // left to right, as `tr` builds it.
  test('a-repeated-source-takes-its-last-mapping', () => {
    Assert.equal(G('a: translate("aaa", "aa", "xy")').a, 'yyy')
  })


  // Code points, not UTF-16 units: an astral character is one entry.
  test('astral-characters-are-one-entry', () => {
    Assert.equal(G('a: translate("a😀b", "😀", "!")').a, 'a!b')
    Assert.equal(G('a: translate("a😀b", "😀")').a, 'ab')
  })


  test('refusals', () => {
    // A descending range is always a mistake, so it is refused rather
    // than read as empty.
    Assert.equal(E('x: translate("abc", "z-a", "x")'), 'invalid-arg')
    Assert.equal(E('x: translate("abc", "a", "z-a")'), 'invalid-arg')

    // Arity: two or three, never one or four.
    Assert.equal(E('x: translate("abc")'), 'invalid-arg')
    Assert.equal(E('x: translate("abc", "a", "b", "c")'), 'invalid-arg')

    // Every argument is text.
    Assert.equal(E('x: translate(1, "a", "b")'), 'invalid-arg')
    Assert.equal(E('x: translate("abc", 1, "b")'), 'invalid-arg')
    Assert.equal(E('x: translate("abc", "a", 1)'), 'invalid-arg')
  })


  // A CHAINED reference takes the extra pass that makes the call
  // rebuild itself and wait: a one-hop reference to a literal resolves
  // too quickly to show it.
  test('forward-reference', () => {
    Assert.equal(G('x: translate($.n, "l", "L")\nn: $.m\nm: "hello"').x, 'heLLo')
  })


  test('an-unmatched-source-is-returned-whole', () => {
    Assert.equal(G('a: translate("abc", "xyz", "123")').a, 'abc')
    Assert.equal(G('a: translate("", "a", "b")').a, '')
  })

})


// The span arithmetic, at the edges the shared rows reach through
// source but cannot name directly.
describe('caserange', () => {

  test('spans', () => {
    // start BEGINS the run when it is zero or positive ...
    Assert.deepEqual(caseSpan(3, 0, 1), [0, 1])
    Assert.deepEqual(caseSpan(3, 1, -1), [1, 3])
    // ... and STOPS it when it is negative: the character it lands on
    // is the first one not modified.
    Assert.deepEqual(caseSpan(6, -3, -1), [0, 3])
    Assert.deepEqual(caseSpan(6, -1, -1), [0, 5])
    Assert.deepEqual(caseSpan(3, -1, 2), [0, 2])

    // Both ends clamp, and a run wholly outside is empty rather than
    // inverted.
    Assert.deepEqual(caseSpan(3, 10, 1), [3, 3])
    Assert.deepEqual(caseSpan(3, -10, 2), [0, 0])
    Assert.deepEqual(caseSpan(3, -3, 3), [0, 0])
    Assert.deepEqual(caseSpan(0, 0, 1), [0, 0])
    Assert.deepEqual(caseSpan(3, 0, 0), [0, 0])
  })


  // A biginteger index is an index: it is a position in a string, so it
  // is small by construction or it clamps.
  test('a-biginteger-index-is-an-index', () => {
    Assert.equal(G('a: upper("foo", 0d1, 0d1)').a, 'fOo')
  })

})
