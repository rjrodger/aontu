# test/system — full systems generated with `aontu render`

`test/spec/` pins the language row by row. This directory pins the
other end of the claim: that a model written in aontu, run through
`aontu render`, produces a **complete working system** — not a file
that looks right, but an application that boots, serves its API,
passes an external validation written against a reference
implementation, and shows a human a page.

Every system here is the validation of a design decision recorded in
[`docs/design/RENDER.0.md`](../../docs/design/RENDER.0.md) §10, and a
system that stops passing is a defect in the renderer, the model or
the generator — never a test to relax.

## Layout

```
test/system/<name>/
  README.md        what the system is, what it is held to, how to run it
  model.aon        the model: the ONE source every generated file reads
  gen/             the generator: aontu (or the template surface, P8)
                   producing an @"aontu:code" instance from the model
  ref/             the reference the system is held to, vendored
                   (an OpenAPI spec, a validation script), read-only
  app/             the rendered system, COMMITTED, each generated file
                   carrying a banner; plus the hand-written framework
                   boilerplate the model does not decide
  check.sh         renders (`aontu render --check app`), boots the
                   system, runs the reference validation against it,
                   runs any client-side suite in live mode, fetches the
                   UI pages; exit 1 on any failure
```

Two rules follow from the layout:

- **The rendered tree is committed and checked, not regenerated
  silently.** `aontu render --check app` is the first step of every
  `check.sh`, so a change to the model or the generator shows as a
  reviewable diff to `app/`, and a hand edit to a generated file is
  drift the check reports. Boilerplate the model does not decide is
  hand-written once and is not banner-marked.
- **The API is the reference's, not ours.** A system implements an
  existing API and is validated by that API's own script. What is
  ours is the model, the generator and the framework choice.

## Systems

| system | target | reference | status |
|---|---|---|---|
| [`rb-solar`](rb-solar/) | Ruby on Rails 8, SQLite, Hotwire: the Solar System API (Planet, Moon) and a human UI over the same data | [voxgig-sdk/voxgig-solardemo-sdk](https://github.com/voxgig-sdk/voxgig-solardemo-sdk) — its reference app's OpenAPI spec and `app/validate.ts`, and its Ruby SDK | **LANDED 2026-09-06**: 10 checks, the reference's own 20 tests green |

## Running

**The SDK's own suite was tried and rejected as a check.** The plan
named the Ruby SDK's live tests; run against `rb-solar` they pass with
the server turned off — 246 cases, two HTTP requests, lenient by
design. A system's SDK leg is therefore the SDK's real client with
assertions that fail, not the SDK's test suite. `rb-solar/README.md`
records the measurement.

Each `check.sh` is runnable from any cwd and honours `AONTU` (the
engine command; default the TypeScript CLI in this repository) so the
Go port runs the same check. A system's toolchain (Ruby and Rails for
`rb-solar`) is installed by the CI job that runs it and documented in
its README; `check.sh` skips with a note when the toolchain is absent
rather than failing, so `use-cases/run-all.sh`-style local runs stay
possible without it.
