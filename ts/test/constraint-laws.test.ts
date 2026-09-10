/* Copyright (c) 2025 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import Assert from 'node:assert'
import Fs from 'node:fs'
import Path from 'node:path'

import { Aontu } from '../dist/aontu'


const ATOMS = Fs
  .readFileSync(
    Path.join(__dirname, '..', '..', 'test', 'spec', 'files',
      'constraint-atoms.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => '' !== line && !line.startsWith('#'))

// Associativity is cubic, so it runs over a representative prefix.
const TRIPLE_ATOMS = ATOMS.slice(0, 8)


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
