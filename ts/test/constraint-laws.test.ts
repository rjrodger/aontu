/* Copyright (c) 2025 Richard Rodger, MIT License */

// PROPERTY-BASED DIFFERENTIAL TESTING OF THE CONSTRAINT ALGEBRA
// (docs/capability-review/g1-constraint-algebra.md, "Ongoing": property
// -based differential testing of the algebra laws -- commutativity,
// idempotence, normalisation convergence -- across TS and Go, seeded
// from the atom vocabulary).
//
// The corpus is ENUMERATED, not random: the same atom vocabulary is
// crossed exhaustively here and in go/constraint_laws_test.go, so both
// ports check identical terms and a law that breaks in one port breaks
// visibly in that port's suite. Cross-port AGREEMENT on the results is
// the shared suite's job (test/spec/constraint-bound.tsv); these tests
// guard the laws themselves as the vocabulary grows, which is where a
// hand-written row set stops scaling.
//
// The observable is canon, or the error CODE when the meet is empty --
// both are order-independent by construction, unlike error message text
// (whose primary site is deliberately later-in-source, so it is NOT
// expected to be commutative).

import { describe, test } from 'node:test'
import Assert from 'node:assert'
import Fs from 'node:fs'
import Path from 'node:path'

import { Aontu } from '../dist/aontu'


// The implemented Band A vocabulary (G1 phase 1: bounds and neq), plus
// the kinds and concrete scalars they meet against. Read from the
// SHARED file so this list and the Go twin's cannot drift apart, and so
// the probed cross-product in test/spec/constraint-product.tsv is over
// the same corpus. Extend that file as `re`, `len`, `unique` and `must`
// land -- the laws below then cover them with no new test code.
const ATOMS = Fs
  .readFileSync(
    Path.join(__dirname, '..', '..', 'test', 'spec', 'files',
      'constraint-atoms.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => '' !== line && !line.startsWith('#'))

// Associativity is cubic, so it runs over a representative prefix.
const TRIPLE_ATOMS = ATOMS.slice(0, 8)


// Evaluate to an order-independent observable: the canonical form, or
// the error code when the meet is empty.
//
// The code comes from the collected error, NOT from a regex over the
// message: codes are not all `\w+` (`scalar-type` carries a hyphen), so
// pattern-matching the headline silently truncates them and would make
// two distinct codes compare equal. The Go twin reads `AontuError.Code`
// for the same reason.
function obs(src: string): string {
  try {
    return new Aontu().unify(src).canon
  }
  catch (e: any) {
    const errs = 'function' === typeof e?.errs ? e.errs() : []
    return 'ERR:' + (errs[0]?.why ?? 'unknown')
  }
}


describe('constraint-laws', () => {

  // a & b == b & a
  test('commutativity', () => {
    for (const a of ATOMS) {
      for (const b of ATOMS) {
        Assert.strictEqual(
          obs(`x: ${a} & ${b}`),
          obs(`x: ${b} & ${a}`),
          `commutativity: ${a} & ${b}`)
      }
    }
  })


  // a & a == a
  test('idempotence', () => {
    for (const a of ATOMS) {
      Assert.strictEqual(
        obs(`x: ${a} & ${a}`),
        obs(`x: ${a}`),
        `idempotence: ${a}`)
    }
  })


  // (a & b) & c == a & (b & c)
  test('associativity', () => {
    for (const a of TRIPLE_ATOMS) {
      for (const b of TRIPLE_ATOMS) {
        for (const c of TRIPLE_ATOMS) {
          Assert.strictEqual(
            obs(`x: (${a} & ${b}) & ${c}`),
            obs(`x: ${a} & (${b} & ${c})`),
            `associativity: (${a} & ${b}) & ${c}`)
        }
      }
    }
  })


  // Normalisation converges: re-canonning a residual is a fixpoint, so
  // a constraint's canonical text is stable under round-trip (the
  // property test/spec runners assert for every canon row).
  test('normalisation-convergence', () => {
    for (const a of ATOMS) {
      for (const b of ATOMS) {
        const c1 = obs(`x: ${a} & ${b}`)
        if (c1.startsWith('ERR:')) {
          continue
        }
        Assert.strictEqual(obs(c1), c1, `convergence: ${a} & ${b}`)
      }
    }
  })

})
