# Test coverage

Aontu holds **100 % coverage in both implementations** — Go statement
coverage, TypeScript line, branch and function coverage — as a
[recorded decision](../ADR.md#adr-002--test-coverage-stays-at-100--in-both-implementations),
not an aspiration. This page explains how that is measured, what the
suites actually exercise, and — because 100 % is only meaningful if the
exclusions are honest — every place where code is excluded from the
denominator and why.

## How to reproduce

From the repository root:

```sh
make cov        # both implementations, and fail if either is under 100 %
make cov-ts     # TypeScript only
make cov-go     # Go only
```

Each target ends in a **gate**, not just a report: `make cov` exits
non-zero and names the offending lines if anything is uncovered. That is
the ADR-002 floor made checkable.

Equivalently, by hand:

```sh
# TypeScript — Node's V8 coverage over the compiled tests, checked by
# ts/test/covcheck.js against the lcov report
cd ts && npm run build && npm run test-cov-check

# the human-readable table (not the gate)
cd ts && npm run test-cov

# Go — statement coverage, unit tests plus the GOCOVERDIR binary runs
cd go && go tool cover -func=coverage.out   # after `make cov-go`
cd go && go tool cover -html=coverage.out   # annotated source
```

> The two numbers are still **not the same measurement**: Node reports
> V8 line/branch/function coverage, Go reports *statement* coverage.
> Both now read 100 %, but they are 100 % of different things.

## Summary

| Implementation | Metric (tool) | Coverage |
|----------------|---------------|----------|
| TypeScript — `ts/src` | lines (Node `--experimental-test-coverage`) | **100.00 %** (11327/11327) |
| TypeScript — `ts/src` | branches | **100.00 %** (2527/2527) |
| TypeScript — `ts/src` | functions | **100.00 %** (466/466) |
| Go — all four packages | statements (`go test -cover` + `GOCOVERDIR`) | **100.0 %** |

Both suites pass in full via `make test`: **1952 TypeScript tests** and
four green Go packages, including the **1592-row shared spec** that both
engines execute.

### What the measurement includes

Getting an honest 100 % needed the measurement itself to be sound, not
just the tests:

- **Go `main()` functions really run.** `make cov-go` builds both
  command binaries with `go build -cover`, runs them for real (version,
  a piped document, an immediate-EOF LSP session) under `GOCOVERDIR`,
  converts with `go tool covdata textfmt`, and unions that profile into
  the unit profile with `go/scripts/covmerge`.
- **TypeScript entry points are thin wrappers.** `bin/aontu.js` and
  `bin/aontu-lsp.js` hold the shebang and the `main(process.argv)` call
  — the two things no in-process run can execute — so `src/cli.ts` and
  `src/lsp-server.ts` are ordinary, fully-measurable modules.
- **The gate reads lcov, not the summary table.** Node's built-in
  coverage reporter attributes the accessors `tsc` emits for
  `export { X }` to the import lines and then counts one of them unhit
  even when V8 recorded a call. The lcov reporter and the raw
  `NODE_V8_COVERAGE` data agree with each other at 100 %, so
  `ts/test/covcheck.js` reads lcov. The summary table remains a useful
  human report; it is simply not the thing CI checks.
- **The run is deterministic.** Coverage merged across concurrently
  running test-file processes proved lossy under load — single items
  would drop in roughly one run in six. The gate therefore runs with
  `--test-concurrency=1`, and the spawned-binary cases in `cli.test.ts`
  no longer pass `NODE_V8_COVERAGE` to their children: those cases
  assert the packaged binary's behaviour, while the same code paths are
  measured in-process.

## What the suites exercise

### Shared, cross-language spec

`test/spec/*.tsv` — **1592 cases across 54 files** — is run by *both*
implementations and is the contract that defines shared behaviour
([ADR-001](../ADR.md#adr-001--typescript-and-go-stay-at-full-parity-driven-by-a-shared-spec)):

| File | Cases | File | Cases |
|------|------:|------|------:|
| `number-tower.tsv`        | 388 | `map.tsv`        | 20 |
| `edge.tsv`                | 306 | `file.tsv`       | 18 |
| `number-model.tsv`        | 112 | `plus.tsv`       | 14 |
| `func.tsv`                |  91 | `conjunct.tsv`   | 13 |
| `errcodes.tsv`            |  65 | `op-chars.tsv`   | 13 |
| `number-cross-product.tsv`|  59 | `budget.tsv`     | 11 |
| `constraint-bound.tsv`    |  57 | `close.tsv`      |  9 |
| `ref.tsv`                 |  40 | `incomplete.tsv` |  9 |
| `scalar.tsv`              |  40 | `list.tsv`       |  7 |
| `error.tsv`               |  34 | `comment.tsv`    |  6 |
| `optional.tsv`            |  27 | `elision.tsv`    |  5 |
| `pref.tsv`                |  27 | `divergent.tsv`  |  0 |
| `disjunct.tsv`            |  24 |                  |    |
| `engine-parity.tsv`       |  23 |                  |    |
| `marks.tsv` / `var.tsv`   |  23 each |             |    |

plus the `spread*.tsv` family — **26 files, 128 cases**, one spread
topic per file. `divergent.tsv` is the parity ledger: commentary only,
no data rows (see [the shared spec](shared-spec.md#the-divergence-ledger)).

`edge.tsv` is the coverage drive's own file: parity edges found by
reading uncovered engine code and probing candidate sources through both
engines byte-for-byte before pinning. Its ten batches cover constraint
ties and the residual algebra (leaf narrowing, bound tightening in both
orders, exclusion dedup and tie-breaks), junction folding,
reference/variable path parts of every scalar kind, canon escapes,
expects, lexer edges (based literals, overflow, exactness windows,
separator refusals), comment starters inside text tokens, dangling
operators, list-spread merging, duplicate-key merges of every bag shape,
optional pairs in list position, implicit top-level lists of every raw
scalar kind, and double negation of exact literals.

Each row asserts a canonical form (`canon`), a generated value (`gen`),
the exact serialised bytes (`gens`), an error substring (`err`), an exact
error code (`errc`), or an error-code registry entry (`errcode`).

### Per-port tests

Only what a shared row cannot express gets a per-port test — ADR-001
prefers a row precisely because one row lifts both engines:

**TypeScript** (`ts/test/*.test.ts`, 1952 tests, 1597 of them shared
rows): every built-in function in depth, the exact leaves, the public
API, LSP diagnostics/hover/completion/framing, the CLI, error rendering,
references, parsing, the fixpoint, worked examples — plus three
coverage-driven files (`coverage.test.ts`, `coverage2.test.ts`,
`coverage3.test.ts`) that reach what no source can: the explain-trace
formatters, raw (non-Val) variable bindings, `OpBaseVal` machinery,
`Val`'s inspect rendering, `unite`'s internal-exception catch and cycle
counter, spread-clone arms, constraint internals, the whole CLI driven
in-process on a swapped stdin (readline REPL included), and the LSP
server's frame codec and stream defaults.

**Go** (`go/*_test.go`, plus `lsp` and both commands): the
representation-level invariants, `Generate`'s native exact types, the
kind lattice, file loading, constructors, concurrency, `formatNumber`
parity — plus four coverage-driven files (`coverage_test.go` through
`coverage4_test.go`) covering scaled-comparison infinities, the
`Check`/`Spans` walkers on constructed trees, `RefVal`/`VarVal`
internals, defer and ratchet arms across the Val types, grammar actions
driven with hand-built `jsonic.Rule` values, the custom lex matchers on
a hand-built lexer, and the budget/clone paths that need a Val the
engine never builds.

## The exclusions, in full

100 % is only meaningful if what was excluded is visible. Twenty Go
statements carry a `//coverage:ignore` marker; TypeScript carries none
at all beyond the export blocks (see below). Every marker states, in
the source, what state would be required and why nothing can produce it
— a marker without that justification is a defect
([ADR-002](../ADR.md#adr-002--test-coverage-stays-at-100--in-both-implementations),
rule 3).

### Go — 20 statements

| Site | Why it cannot be reached |
|------|--------------------------|
| `lang.go` × 5 — `langForBase`, `mustMakeLang`, and the three `j.Use(...)` registrations | Plugin registration takes compile-time literal options and ignores the base; the same registrations already succeed at package init, so a failure would panic at load rather than reach these arms. |
| `lang.go` × 4 — `big.Int.SetString` guards in `isLossyIntegerLiteral`, `exactLiteral`, `exactDecimal` | The digit strings are pre-vetted by `allDigits` or by the literal regex before the call, so `SetString` cannot reject them. |
| `lang.go` — `parseBase`'s `langForBase` error arm | Same as `langForBase`: it has no failure mode. |
| `func.go` × 2 — `resolve() == nil` and the whole `result == Val(f)` block | No `FuncVal.resolve` arm returns nil or the receiver. The block mirrors TS `FuncBaseVal`, where `resolve()` can return `this` — kept for the ADR-001 shape correspondence. |
| `conjunct.go` — `case 0` of the outvals switch | A fold over ≥ 1 term always appends; the empty case returned 30 lines earlier. |
| `disjunct.go` — the nil check after an equal-rank pref merge | `PrefVal.Unify` with a pref peer always yields a pref, never a bare nil. |
| `op.go` — the trailing `return nil` of `operate` | `peg` is provably one of string, bool or float64, all handled above. |
| `val.go` — the caret-column clamp in `NilVal.frame` | `rowCol` never returns a column below 1. |
| `cmd/aontu/main.go`, `cmd/aontu-lsp/main.go` — `main()` | Executed for real by the `GOCOVERDIR` leg of `make cov-go`; the marker keeps the unit-only profile honest rather than excusing an untested function. |

The markers are implemented by `go/scripts/covmerge`, which parses the
marked sources and drops those blocks from the merged profile. Two
properties keep it from flattering the number: a marked block is dropped
**only when its count is zero**, so a coarse marker can never hide
executed code; and a file it cannot find or parse simply has no markers,
so the merge degrades to a plain union rather than silently dropping
everything.

### TypeScript — export blocks only

`ts/src` carries one directive per file, on the trailing
`export { … }` block, because V8 reports those lines as unexecuted in
every run. Nothing else is excluded.

Everything else that was unreachable is **gone rather than excused**,
per ADR-002 rule 4. The round deleted: a `null == resolved` branch that
`?? this` had already made impossible (`RefVal`), the same shape in
`OpBaseVal`, a `null == ctx` guard nine lines after `ctx` was
dereferenced, an `undefined === child` guard after `propagateMarks`
dereferenced the child (`MapVal` and `ListVal`), a `done` flag that was
never set false (`PrefVal`), an array arm unreachable because
`typeof [] === 'object'` (`utility.walk`), `Site` fallbacks that its own
constructor makes impossible, a `___merge` list branch multisource
cannot produce, and the two container arms of `lsp.valKind` — whose
removal also brings it back into line with `valKind` in `go/check.go`.
Two dot-operator handlers were folded onto one guarded builder so the
missing-operand guard has a single, reachable site.

## Keeping it

The floor holds because `make cov` fails when it is breached, and the
order of preference for closing a gap is fixed: a shared spec row first
(it lifts both engines), then a per-port unit test, then — only with a
written justification — a marker, and preferably a deletion instead. A
test that exists only to move the number is worse than the gap it
closes, because it makes the counter lie.

The probing that drives new rows also keeps finding real parity
differences rather than hiding them: this round filed #39, #40 and #41,
each registered rather than pinned or papered over.
