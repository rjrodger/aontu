/* Copyright (c) 2025 Richard Rodger, MIT License */

// THE SKILL SOURCES, HELD TO THE ENGINE (G7 phase 6). A skill whose
// examples do not evaluate teaches the wrong language, and it drifts
// the first time the surface moves. Every self-contained document in
// docs/skill/examples.md is evaluated here, so the ladder cannot rot
// unnoticed.

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Path from 'node:path'

import { Aontu } from '../dist/aontu'


const SKILL_DIR = Path.join(__dirname, '..', '..', 'docs', 'skill')


// Fenced blocks, with the two kinds that are not documents left out:
// a shell transcript, and a multi-file example whose `@"..."` include
// only resolves beside its sibling.
function documents(md: string): string[] {
  const out: string[] = []
  for (const block of md.split('```').filter((_, i) => 1 === i % 2)) {
    const body = block.replace(/^[a-z]*\n/, '')
    if (/^\s*aontu /m.test(body) || body.includes('@"')) {
      continue
    }
    out.push(body)
  }
  return out
}


describe('skill', () => {

  test('every-example-document-evaluates', () => {
    const md = Fs.readFileSync(Path.join(SKILL_DIR, 'examples.md'), 'utf8')
    const docs = documents(md)
    Assert.ok(4 < docs.length, `too few example documents: ${docs.length}`)

    for (const src of docs) {
      const aontu = new Aontu()
      const ctx = aontu.ctx({ collect: true })
      aontu.unify(src, undefined, ctx)
      Assert.deepEqual(ctx.err.map((e: any) => e.why), [],
        `example does not evaluate:\n${src}`)
    }
  })

  // The ladder's claims about what generates, checked rather than
  // asserted: rung 3 says the defaults appear, and rung 2 says
  // nothing does.
  test('the-ladder-generates-what-it-claims', () => {
    const truth = 'service: {\n  name: string\n  port: integer\n}'
    Assert.throws(() => new Aontu().generate(truth),
      /not concrete|Cannot|no_gen/i)

    const withDefaults =
      'service: {\n  name: "auth"\n  port: *8080 | integer\n' +
      '  replicas: *1 | integer\n}'
    Assert.deepEqual(new Aontu().generate(withDefaults),
      { service: { name: 'auth', port: 8080, replicas: 1 } })
  })

  // The skill points at files; a pointer that does not resolve is
  // worse than no pointer.
  test('every-linked-file-exists', () => {
    for (const file of Fs.readdirSync(SKILL_DIR)) {
      const md = Fs.readFileSync(Path.join(SKILL_DIR, file), 'utf8')
      for (const m of md.matchAll(/\]\(([^)#][^)]*)\)/g)) {
        const target = Path.resolve(SKILL_DIR, m[1])
        Assert.ok(Fs.existsSync(target), `${file}: broken link ${m[1]}`)
      }
    }
  })

})
