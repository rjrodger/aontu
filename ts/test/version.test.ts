/* Copyright (c) 2025 Richard Rodger, MIT License */

// The exported VERSION constant is maintained by the `version` npm
// lifecycle script (see package.json), which rewrites src/aontu.ts on
// `npm version` / `npm run repo-bump`. That script is easy to break
// silently — it once pointed at a path that no longer existed and went
// unnoticed for many releases — so assert the two agree.

import { describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect } from './expect'

import { VERSION } from '..'


describe('version', () => {

  test('matches package.json', () => {
    // At runtime __dirname is dist-test/, so one level up is ts/.
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

    expect(VERSION).equal(pkg.version)
  })


  test('is a plain semver triple', () => {
    expect(/^\d+\.\d+\.\d+$/.test(VERSION)).equal(true)
  })

})
