/* Copyright (c) 2025 Richard Rodger, MIT License */

// MODULES (G6 phase 2, docs/capability-review/g6-distribution.md). The
// shared contract rows are test/spec/mod.tsv (both runners,
// root-confined to the fixtures directory, which is also why they never
// reach the user cache); what is per-port — the cache location, the
// host-injected filesystem, the verification depth bound — is here,
// with go/mod_test.go as the twin.

import { describe, test } from 'node:test'
import * as Assert from 'node:assert'
import * as Fs from 'node:fs'
import * as Os from 'node:os'
import * as Path from 'node:path'

import { Aontu, canonHash } from '../dist/aontu'


// Forward slashes for paths EMBEDDED IN SOURCE text: inside an @"..."
// include a backslash is an ESCAPE character (trust.test.ts's `sp`).
const sp = (p: string): string => p.split('\\').join('/')

const MODULE = 'name: string\nport: *8080 | integer\n'


// A project whose main.aon imports one module, and the module itself,
// placed wherever the caller says. Answers the paths and the module's
// canon-hash — which is what a pin IS, so a test that wants to pin
// something has to compute it the same way `aontu hash` does.
function world(store: 'vendor' | 'cache'): {
  dir: string, main: string, hash: string, cache: string
} {
  const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'aontu-mod-'))
  const cache = Path.join(dir, 'cache')

  const hash = canonHash(new Aontu().unify(MODULE))

  const moddir = 'vendor' === store
    ? Path.join(dir, 'aon_vendor', 'corp.example', 'schemas', 'service@1')
    : Path.join(cache, hash)
  Fs.mkdirSync(moddir, { recursive: true })
  Fs.writeFileSync(Path.join(moddir, 'mod.aon'),
    'mod: {path: "corp.example/schemas/service", main: "service.aon"}\n')
  Fs.writeFileSync(Path.join(moddir, 'service.aon'), MODULE)

  Fs.writeFileSync(Path.join(dir, 'mod.aon'), 'mod: {path: "corp.example/app"}\n')
  const main = Path.join(dir, 'main.aon')
  Fs.writeFileSync(main,
    'svc: @"corp.example/schemas/service@1#' + hash + '"\nsvc: name: "auth"\n')

  return { dir, main, hash, cache }
}


describe('mod', () => {

  test('cache-is-content-addressed', () => {
    // No vendor copy at all: the module is in the user cache, under its
    // OWN HASH. That is what content-addressed means — a cache hit is
    // already the right meaning before anything is read from it, which
    // is also why the cache is consulted only when a pin is known.
    const w = world('cache')
    const a0 = new Aontu({ mod: { cache: w.cache } } as any)
    Assert.deepEqual(
      a0.generate('x: @"' + sp(w.main) + '"'),
      { x: { svc: { name: 'auth', port: 8080 } } })
  })


  test('cache-is-not-consulted-under-a-root', () => {
    // A confined evaluation sees the project's own aon_vendor/ and
    // nothing else: the cache lives outside any root, so a rooted
    // profile that would have to reach it reports the module missing
    // instead. (docs/trust.md: confinement is about what may be READ.)
    const w = world('cache')
    const a0 = new Aontu({
      mod: { cache: w.cache },
      trust: { include: { root: w.dir } },
    } as any)
    Assert.throws(
      () => a0.generate('x: @"' + sp(w.main) + '"'),
      (err: any) => String(err.message).includes('module not fetched:'))
  })


  test('cache-defaults-to-the-platform-location', () => {
    // With no host-named cache the platform's own is used. Pointed at a
    // temporary directory through XDG_CACHE_HOME so the test never
    // reads the developer's real cache — the point is the LOOKUP, not
    // where a particular machine keeps it.
    const w = world('cache')
    const xdg = Path.join(w.dir, 'xdg')
    Fs.mkdirSync(Path.join(xdg, 'aontu'), { recursive: true })
    Fs.renameSync(w.cache, Path.join(xdg, 'aontu', 'mod'))

    const saved = process.env.XDG_CACHE_HOME
    process.env.XDG_CACHE_HOME = xdg
    try {
      Assert.deepEqual(
        new Aontu().generate('x: @"' + sp(w.main) + '"'),
        { x: { svc: { name: 'auth', port: 8080 } } })
    }
    finally {
      if (undefined === saved) {
        delete process.env.XDG_CACHE_HOME
      }
      else {
        process.env.XDG_CACHE_HOME = saved
      }
    }
  })


  test('cache-falls-back-to-the-home-directory', () => {
    // No XDG_CACHE_HOME: `~/.cache/aontu/mod` is the platform default
    // this falls back to, and HOME is pointed at a temporary directory
    // for the same reason XDG was above.
    const w = world('cache')
    const home = Path.join(w.dir, 'home')
    Fs.mkdirSync(Path.join(home, '.cache', 'aontu'), { recursive: true })
    Fs.renameSync(w.cache, Path.join(home, '.cache', 'aontu', 'mod'))

    const savedXdg = process.env.XDG_CACHE_HOME
    const savedHome = process.env.HOME
    delete process.env.XDG_CACHE_HOME
    process.env.HOME = home
    try {
      Assert.deepEqual(
        new Aontu().generate('x: @"' + sp(w.main) + '"'),
        { x: { svc: { name: 'auth', port: 8080 } } })
    }
    finally {
      if (undefined !== savedXdg) {
        process.env.XDG_CACHE_HOME = savedXdg
      }
      if (undefined === savedHome) {
        delete process.env.HOME
      }
      else {
        process.env.HOME = savedHome
      }
    }
  })


  test('no-home-means-no-cache', () => {
    // A host with no home directory has no cache, and that is a MISS
    // rather than a failure: the module is simply not in any store this
    // evaluation can read, which is what the message says.
    const w = world('cache')
    const savedXdg = process.env.XDG_CACHE_HOME
    const savedHome = process.env.HOME
    delete process.env.XDG_CACHE_HOME
    delete process.env.HOME
    try {
      Assert.throws(
        () => new Aontu().generate('x: @"' + sp(w.main) + '"'),
        (err: any) => String(err.message).includes('module not fetched:'))
    }
    finally {
      if (undefined !== savedXdg) {
        process.env.XDG_CACHE_HOME = savedXdg
      }
      if (undefined !== savedHome) {
        process.env.HOME = savedHome
      }
    }
  })


  test('host-filesystem-reports-a-missing-module', () => {
    // The same channel, missing: a store the host's filesystem does not
    // have is a module that is not fetched, not a crash on the stat.
    const w = world('vendor')
    Fs.rmSync(Path.join(w.dir, 'aon_vendor'), { recursive: true })
    const a0 = new Aontu({ fs: Fs } as any)
    Assert.throws(
      () => a0.generate('x: @"' + sp(w.main) + '"'),
      (err: any) => String(err.message).includes('module not fetched:'))
  })


  test('host-filesystem-is-the-one-modules-are-read-from', () => {
    // An injected `fs` is the filesystem the host gave this evaluation,
    // and a module store read through any other one would escape it.
    // Injecting the real fs proves the channel: the module leg reads
    // through the host's handle rather than importing its own.
    const w = world('vendor')
    const a0 = new Aontu({ fs: Fs } as any)
    Assert.deepEqual(
      a0.generate('x: @"' + sp(w.main) + '"'),
      { x: { svc: { name: 'auth', port: 8080 } } })
  })


  test('a-vendor-store-outside-the-root-is-denied', () => {
    // Confinement is about what may be READ (docs/trust.md), and a
    // project root found by walking UP can sit above the confinement
    // root — so the vendor store it names is outside, and reading it
    // would be the escape the root exists to refuse.
    const w = world('vendor')
    const sub = Path.join(w.dir, 'sub')
    Fs.mkdirSync(sub)
    const main = Path.join(sub, 'main.aon')
    Fs.copyFileSync(w.main, main)

    const a0 = new Aontu({ trust: { include: { root: sub } } } as any)
    Assert.throws(
      () => a0.generate('x: @"' + sp(main) + '"'),
      (err: any) => String(err.message).includes('include denied:'))
  })


  test('verification-depth-is-bounded', () => {
    // A pinned module is verified by EVALUATING it, and that evaluation
    // resolves the module's own imports — so a vendor tree that led
    // back to itself would recurse until the host's stack gave out. The
    // bound makes it a stated refusal instead, exactly as unify_cycle
    // does, because a verdict that depends on the machine is what
    // docs/trust.md forbids. Entered at the bound directly: building a
    // sixteen-deep vendor tree would prove the same thing and nothing
    // more.
    const w = world('vendor')
    const a0 = new Aontu({ mod: { depth: 16 } } as any)
    Assert.throws(
      () => a0.generate('x: @"' + sp(w.main) + '"'),
      (err: any) => String(err.message).includes('module depth:'))
  })

})
