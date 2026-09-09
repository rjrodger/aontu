/* Copyright (c) 2025 Richard Rodger, MIT License */

// The role gate (docs/design/ALLOW.0.md): the library's answers, one
// per rule the design states, and every refusal shape. The command
// line around it is held by cli.test.ts; the live model is
// use-cases/18-role-permissions.

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Os from 'node:os'
import * as Path from 'node:path'

import { allow } from '../dist/aontu'
import { ALLOW_AT } from '../dist/allow'


const ROLES = `
roles: {
  admin: { allow: ["$"] }
  dev: {
    allow: ["$.services", "$.deploy.*.replicas"]
    deny: ["$.services.*.tier"]
  }
  product: { allow: ["$.features", "$.services.*.description"] }
  qa: { allow: ["$.tests"] }
}
`


// One decision, with the fields a machine reader destructures.
function decision(role: string, path: string, src: string = ROLES) {
  const r = allow(src, role, [path])
  Assert.equal(r.paths.length, 1)
  return r.paths[0]
}


describe('allow', () => {

  test('the-default-anchor-is-the-roles-map', () => {
    Assert.equal(ALLOW_AT, '$.roles')
  })


  test('an-allow-entry-covers-itself-and-everything-below', () => {
    Assert.deepEqual(decision('product', '$.features'), {
      path: '$.features', allowed: true, reason: 'allow',
      by: '$.roles.product.allow.0', pattern: '$.features',
    })
    Assert.deepEqual(decision('product', '$.features.search.enabled'), {
      path: '$.features.search.enabled', allowed: true, reason: 'allow',
      by: '$.roles.product.allow.0', pattern: '$.features',
    })
    Assert.deepEqual(decision('dev', '$.services.auth.replicas'), {
      path: '$.services.auth.replicas', allowed: true, reason: 'allow',
      by: '$.roles.dev.allow.0', pattern: '$.services',
    })
    // The whole document is covered only by an entry that names it.
    Assert.equal(decision('admin', '$').allowed, true)
    Assert.deepEqual(decision('qa', '$'), {
      path: '$', allowed: false, reason: 'uncovered',
    })
  })


  test('a-star-segment-matches-any-one-key', () => {
    Assert.deepEqual(decision('dev', '$.deploy.eu1.replicas'), {
      path: '$.deploy.eu1.replicas', allowed: true, reason: 'allow',
      by: '$.roles.dev.allow.1', pattern: '$.deploy.*.replicas',
    })
    Assert.equal(decision('product', '$.services.auth.description').allowed, true)
    // One key, not a run of them: the star does not reach further down
    // than the entry does, and it does not cover the map above it.
    Assert.equal(decision('dev', '$.deploy.eu1').allowed, false)
    Assert.equal(decision('dev', '$.deploy').allowed, false)
    Assert.equal(decision('dev', '$.deploy.eu1.replicas.max').allowed, true)
  })


  test('a-deny-entry-refuses-every-path-that-intersects-it', () => {
    // At the denied node.
    Assert.deepEqual(decision('dev', '$.services.auth.tier'), {
      path: '$.services.auth.tier', allowed: false, reason: 'deny',
      by: '$.roles.dev.deny.0', pattern: '$.services.*.tier',
    })
    // Below it: the denied node is an ancestor.
    Assert.equal(decision('dev', '$.services.auth.tier.name').reason, 'deny')
    // Above it: a change here could rewrite the denied node, so an
    // allow that would otherwise cover is beaten.
    Assert.equal(decision('dev', '$.services.auth').reason, 'deny')
    Assert.equal(decision('dev', '$.services').reason, 'deny')
    Assert.equal(decision('dev', '$').reason, 'deny')
    // Beside it: a sibling of the denied node is untouched.
    Assert.equal(decision('dev', '$.services.auth.replicas').reason, 'allow')
  })


  test('deny-wins-over-allow-whatever-the-order', () => {
    const src = 'roles: r: { deny: ["$.a.b"] allow: ["$.a"] }'
    Assert.equal(decision('r', '$.a.b', src).reason, 'deny')
    Assert.equal(decision('r', '$.a.c', src).reason, 'allow')
  })


  test('a-path-nothing-covers-is-refused-uncovered', () => {
    Assert.deepEqual(decision('qa', '$.services.auth'), {
      path: '$.services.auth', allowed: false, reason: 'uncovered',
    })
    // A role with no allow list allows nothing: the shape's empty list
    // is what generates for it.
    Assert.equal(decision('r', '$.a', 'roles: r: {}').reason, 'uncovered')
  })


  test('the-verdict-is-allowed-only-when-every-path-is', () => {
    const both = allow(ROLES, 'dev',
      ['$.services.auth.replicas', '$.deploy.eu1.replicas'])
    Assert.equal(both.verdict, 'allowed')
    Assert.deepEqual(both.findings, [])
    Assert.deepEqual(both.paths.map((d) => d.allowed), [true, true])

    const mixed = allow(ROLES, 'dev', ['$.services.auth.replicas', '$.tests'])
    Assert.equal(mixed.verdict, 'refused')
    Assert.deepEqual(mixed.paths.map((d) => d.reason), ['allow', 'uncovered'])

    // Nothing asked is nothing allowed.
    const none = allow(ROLES, 'admin', [])
    Assert.equal(none.verdict, 'refused')
    Assert.deepEqual(none.paths, [])
  })


  test('paths-are-normalised-the-way-a-reference-reads-them', () => {
    Assert.equal(decision('dev', 'services.auth').path, '$.services.auth')
    Assert.equal(decision('dev', '$.services.auth.').path, '$.services.auth')
    Assert.equal(decision('admin', '').path, '$')
    Assert.equal(decision('admin', '$.').path, '$')
    // Written the same way in the model.
    const src = 'roles: r: { allow: ["a.b"] deny: ["$.a.b.c."] }'
    Assert.equal(decision('r', '$.a.b.d', src).reason, 'allow')
    Assert.equal(decision('r', '$.a.b.c.d', src).reason, 'deny')
  })


  test('an-undeclared-role-is-refused-with-the-nearest-name', () => {
    const r = allow(ROLES, 'de', ['$.services', '$.tests'])
    Assert.equal(r.verdict, 'refused')
    Assert.equal(r.role, 'de')
    Assert.deepEqual(r.paths, [
      { path: '$.services', allowed: false, reason: 'no_role' },
      { path: '$.tests', allowed: false, reason: 'no_role' },
    ])
    Assert.equal(r.findings.length, 1)
    Assert.equal(r.findings[0].code, 'no_path')
    Assert.equal(r.findings[0].path, '$.roles.de')
    Assert.equal(r.findings[0].note, 'did you mean dev?')
  })


  test('a-model-that-does-not-stand-up-is-an-error', () => {
    // The shape is aontu, so a malformed role is the engine's refusal,
    // with the engine's code: a string where the list should be.
    const bad = allow('roles: dev: { allow: "$.a" }', 'dev', ['$.a'])
    Assert.equal(bad.verdict, 'error')
    Assert.deepEqual(bad.paths, [])
    Assert.equal(bad.findings.length, 1)
    Assert.equal(bad.findings[0].code, 'scalar_kind')
    Assert.equal(bad.findings[0].path, '$')

    // A roles map that is not a map.
    Assert.equal(allow('roles: 1', 'dev', ['$.a']).verdict, 'error')

    // A conflict anywhere in the model, roles or not.
    Assert.equal(allow('roles: dev: { allow: ["$"] }\nx: 1\nx: 2', 'dev', ['$.a']).verdict, 'error')

    // A source that ends without a newline meets the shape on a line
    // of its own, so a trailing comment does not swallow it.
    Assert.equal(
      allow('roles: dev: { allow: ["$"] } # all', 'dev', ['$.a']).verdict,
      'allowed')

    // The empty model declares no role.
    const empty = allow('', 'dev', ['$.a'])
    Assert.equal(empty.verdict, 'refused')
    Assert.equal(empty.findings[0].code, 'no_path')
  })


  test('a-role-that-is-not-concrete-is-an-error-at-generation', () => {
    const r = allow('roles: dev: { allow: [string] }', 'dev', ['$.a'])
    Assert.equal(r.verdict, 'error')
    Assert.deepEqual(r.paths, [])
    Assert.equal(r.findings.length, 1)
    Assert.equal(r.findings[0].code, 'listval_no_gen')
    Assert.equal(r.findings[0].path, '$.roles.dev')
    Assert.equal(r.findings[0].class, 'reference')
    Assert.deepEqual(r.findings[0].sites, [])
  })


  test('at-moves-the-roles-map', () => {
    const src = 'policy: { roles: { dev: { allow: ["$.a"] } } }'
    const r = allow(src, 'dev', ['$.a.b'], { at: '$.policy.roles' })
    Assert.equal(r.verdict, 'allowed')
    Assert.equal(r.paths[0].by, '$.policy.roles.dev.allow.0')

    // The roles map may be the document itself, and the shape is then
    // a top-level spread.
    const top = allow('dev: { allow: ["$.a"] deny: ["$.a.x"] }', 'dev',
      ['$.a.b', '$.a.x'], { at: '$' })
    Assert.equal(top.verdict, 'refused')
    Assert.deepEqual(top.paths.map((d) => d.by), ['$.dev.allow.0', '$.dev.deny.0'])

    // Unknown role under a moved anchor names the anchor.
    const miss = allow(src, 'qa', ['$.a'], { at: '$.policy.roles' })
    Assert.equal(miss.findings[0].path, '$.policy.roles.qa')
  })


  test('relative-loads-resolve-from-the-models-own-directory', () => {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-allow-'))
    Fs.writeFileSync(Path.join(dir, 'dev.aon'),
      'roles: dev: { allow: ["$.services"] }')
    const model = Path.join(dir, 'roles.aon')
    const src = '@"dev.aon"\nroles: qa: { allow: ["$.tests"] }'
    Fs.writeFileSync(model, src)

    const r = allow(src, 'dev', ['$.services.auth'], { path: model })
    Assert.equal(r.verdict, 'allowed')

    // Denied the load, the included role is not there to answer.
    const denied = allow(src, 'dev', ['$.services.auth'],
      { path: model, trust: { include: 'none' } })
    Assert.equal(denied.verdict, 'error')
    Assert.equal(denied.findings[0].code, 'include_denied')
  })

})
