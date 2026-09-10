/* Copyright (c) 2021-2026 Richard Rodger, MIT License */


import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { test, describe } from 'node:test'

import { expect } from './expect'

import { parseSigLine, parseSigText, renderSig } from '../dist/sig'
import { SIGDECL } from '../dist/sigdecl'
import { BUILTIN_FUNCS } from '../dist/lsp'


const SHARED = Path.join(__dirname, '..', '..', 'test', 'spec', 'signature.tsv')


describe('sig', () => {

  test('sigdecl-is-the-shared-declaration', () => {
    const norm = (s: string) => s.replace(/\r\n/g, '\n')
    const shared = Fs.readFileSync(SHARED, 'utf8')
    expect(norm(SIGDECL)).equal(norm(shared))
  })


  test('every-declaration-line-round-trips', () => {
    for (const rawline of SIGDECL.split('\n')) {
      const line = rawline.trim()
      if ('' === line || line.startsWith('#')) {
        continue
      }
      const sig = parseSigLine(line)
      expect(renderSig(sig)).equal(line)
    }
  })


  test('declared-names-are-the-builtin-names', () => {
    const reg = parseSigText(SIGDECL)
    const declared = Object.keys(reg).sort()
    const builtin = [...BUILTIN_FUNCS].sort()
    expect(declared).equal(builtin)
  })


  test('malformed-declarations-are-errors', () => {
    const bad = [
      '',
      'upper',
      'upper(s: string)',
      'upper(bogus s: string) : string',
      'upper(s: string) : string trailing',
    ]
    for (const line of bad) {
      expect(() => parseSigLine(line)).throw()
    }
    expect(() => parseSigText(
      'upper(s: string) : string\nupper(s: string) : string\n')).throw()
  })

})
