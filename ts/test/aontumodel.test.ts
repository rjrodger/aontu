/* Copyright (c) 2025 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { AONTU_SCHEME, AONTU_SOURCES, AONTU_MODELS } from '../dist/aontumodel'


const REPO = Path.join(__dirname, '..', '..')
const TREE = Path.join(REPO, 'aontu')


// A module is a directory holding a file named after it: aontu/lang/go
// holds go.aon and is `aontu:lang/go`.
function walk(dir: string, rel: string, found: string[]): string[] {
  for (const entry of Fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) { continue }
    const subrel = rel ? rel + '/' + entry.name : entry.name
    if (Fs.existsSync(Path.join(dir, entry.name, entry.name + '.aon'))) {
      found.push(AONTU_SCHEME + subrel)
    }
    walk(Path.join(dir, entry.name), subrel, found)
  }
  return found
}


function leafOf(name: string): string {
  const rel = name.slice(AONTU_SCHEME.length).split('/')
  return Path.join(TREE, ...rel, rel[rel.length - 1] + '.aon')
}


describe('aontumodel', () => {

  // A generated copy that nothing compares is a second source of truth
  // waiting to drift.
  test('sources-are-identical-with-the-tree', () => {
    Assert.ok(0 < AONTU_MODELS.length, 'no models: has the generator run?')
    for (const name of AONTU_MODELS) {
      const text = Fs.readFileSync(leafOf(name), 'utf8')
        .replaceAll('\r\n', '\n').replaceAll('\r', '\n')
      Assert.equal(AONTU_SOURCES[name], text,
        name + ' is stale against aontu/ — run `make aontu`')
    }
  })

  test('tree-serves-exactly-the-listed-models', () => {
    Assert.deepEqual(AONTU_MODELS, walk(TREE, '', []).sort(),
      'aontu/ and AONTU_MODELS disagree — run `make aontu`')
    Assert.deepEqual(AONTU_MODELS, [...AONTU_MODELS].sort(),
      'AONTU_MODELS is not sorted')
    Assert.deepEqual(Object.keys(AONTU_SOURCES).sort(), AONTU_MODELS)
  })

  test('every-name-carries-the-scheme', () => {
    for (const name of AONTU_MODELS) {
      Assert.ok(name.startsWith(AONTU_SCHEME), name)
    }
  })
})
