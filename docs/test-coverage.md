# Test coverage

How test coverage is measured for both implementations, the current
numbers, what the suites exercise, and where the gaps are. The figures
below were produced with the dependency versions current at the time of
writing and the toolchains noted in each section; re-run the commands to
refresh them.

## How to reproduce

From the repository root:

```sh
make cov        # both implementations
make cov-ts     # TypeScript only
make cov-go     # Go only
```

Equivalently, by hand:

```sh
# TypeScript — Node's built-in V8 coverage over the compiled tests
cd ts && npm run build && npm run test-cov

# Go — statement coverage for package aontu
cd go && go test -cover -coverprofile=coverage.out ./... \
      && go tool cover -func=coverage.out      # per-function
cd go && go tool cover -html=coverage.out      # annotated source in a browser
```

> The two numbers are **not directly comparable**: Node reports V8
> line/branch/function coverage (including the test files), while Go
> reports *statement* coverage of the package. Read each within its own
> tool, not against the other.

## Summary

| Implementation | Metric (tool) | Coverage |
|----------------|---------------|----------|
| TypeScript     | lines (Node `--experimental-test-coverage`) | **95.2 %** |
| TypeScript     | branches | **89.8 %** |
| TypeScript     | functions | **92.7 %** |
| Go — library (`package aontu`) | statements (`go test -cover`) | **91.3 %** |
| Go — CLI (`cmd/aontu`)         | statements | **48.3 %** |
| Go — LSP library (`lsp`)       | statements | **89.1 %** |
| Go — LSP server (`cmd/aontu-lsp`) | statements | **76.0 %** |

`make cov-go` prints one combined figure over all four Go packages:
**89.8 %**.

Both suites pass in full via `make test` (see the run output for the
current counts; the shared spec suite alone is ~900 rows, executed by
both engines).

The coverage-driving method is spec-first: every gap reachable FROM
SOURCE INPUT gets a shared row — `test/spec/edge.tsv` exists precisely
for coverage-driven parity edges, every row probed byte-identical in
both engines before pinning — so a covering test usually lifts BOTH
engines at once. Only paths a source cannot reach get per-port unit
tests (`go/coverage_test.go` and the ts/test suites): the
comparison-internal binary64 infinities, deliberately-dead mirrored
branches (`ExpectVal.Gen`, the list spread-required arm), tooling
walks, defensive type-switch fallbacks, and the parse-depth guard.

The `cmd/aontu` figure is lower because its uncovered lines are the
process/terminal glue — `main`, stdin-pipe detection, and the `emit`
exit-code path — which need a real process or TTY to exercise. The core
`render` and `repl` logic *is* unit-tested (`go/cmd/aontu/main_test.go`).
The TypeScript CLI is the same shape: `cli.ts` sits at ~67 % because its
`evalSource` core is unit-tested while the `readline` REPL loop and
argument/stdin plumbing run only in a spawned binary (whose coverage the
in-process tool does not count).

## What the suites exercise

### Shared, cross-language spec

`test/spec/*.tsv` — **961 cases across 49 files** — is run by *both*
implementations and is the contract that defines shared behaviour:

| File | Cases | File | Cases |
|------|------:|------|------:|
| `number-tower.tsv`        | 364 | `op-chars.tsv`   | 13 |
| `number-model.tsv`        | 112 | `disjunct.tsv`   | 11 |
| `number-cross-product.tsv`|  59 | `file.tsv`       | 11 |
| `func.tsv`                |  55 | `close.tsv`      |  9 |
| `scalar.tsv`              |  29 | `incomplete.tsv` |  9 |
| `var.tsv`                 |  21 | `error.tsv`      |  7 |
| `ref.tsv`                 |  19 | `list.tsv`       |  7 |
| `optional.tsv`            |  18 | `comment.tsv`    |  6 |
| `marks.tsv`               |  17 | `elision.tsv`    |  5 |
| `pref.tsv`                |  17 | `divergent.tsv`  |  0 |
| `plus.tsv`                |  14 |                  |    |
| `conjunct.tsv`            |  13 |                  |    |
| `engine-parity.tsv`       |  13 |                  |    |
| `map.tsv`                 |  13 |                  |    |

plus the `spread*.tsv` family — **25 files, 119 cases**, one spread
topic per file. `divergent.tsv` is the divergence ledger: commentary
only, no data rows, so it contributes zero cases (see
[the shared spec](shared-spec.md#the-divergence-ledger)).

The three `number-*.tsv` files are 535 of the 961 rows — over half the
suite. That is the number tower's doing: the leaves are disjoint, so
every kind rule needs pinning in both directions, and
`number-cross-product.tsv` pins the `+` operand table exhaustively in
both operand orders.

Each row asserts a canonical form (`canon`, 360 rows), a generated value
(`gen`, 413), the exact serialised bytes (`gens`, 54), or an error
substring (`err`, 134). Because both implementations load the same rows,
every line of language behaviour described in the
[language reference](reference-language.md) is checked on both sides.

### TypeScript-native tests

`spec.test.ts` accounts for 965 of the 1203 TypeScript tests: the 961
shared rows, a sanity check that the rows loaded, and three tests of the
`gens` mode's own machinery. On top of it, `ts/test/*.test.ts`
contributes the remaining 238 — rich, implementation-specific cases:

| Suite | Tests | Focus |
|-------|------:|-------|
| `spec.test.ts`         | 965 | loads and runs the shared `test/spec/*.tsv` |
| `func.test.ts`         |  55 | every built-in function, in depth (largest native suite) |
| `bignum.test.ts`       |  25 | the exact leaves: `Decimal`, the two Vals on it, the `0d` literal, lossy-literal refusal |
| `val-basic.test.ts`    |  24 | scalars, maps, lists, core value behaviour |
| `lsp.test.ts`          |  22 | diagnostics, hover, completion, handler, stdio framing |
| `aontu.test.ts`        |  21 | public API: parse/unify/generate, file loading, options |
| `val-ref.test.ts`      |  12 | references and path resolution |
| `lang.test.ts`         |  12 | parsing |
| `exactjson.test.ts`    |  11 | `generate`'s native exact types and the `exactJSON` emitter |
| `error.test.ts`        |  11 | error reporting |
| `cli.test.ts`          |  10 | the command-line tool: `evalSource` core + spawned-binary integration |
| `unify.test.ts` / `example.test.ts` | 8 each | the fixpoint; worked examples |
| `val-conjunct` / `val-pref` / `scalar` / `version` / `val-disjunct` / `op` | 6, 4, 3, 2, 2, 2 | conjunction, preference/ranking, kinds, the version constant, disjunction, operators |

### Go-native tests

`go/spec_test.go`'s `TestSpec` runs all 961 shared rows as subtests, and
`TestSpecGensMode` checks the byte-exact runner itself. Around them,
`package aontu` has 44 test functions in nine files:

| File | Tests | Focus |
|------|------:|-------|
| `exact_test.go`         | 15 | the tower's representation-level invariants: `Decimal` normal form, identity by value not pointer, the budget boundary, exact `+` |
| `generate_test.go`      |  9 | `Generate`'s native exact types (`*big.Int`, `*Decimal`), their marshalling, lossy-literal refusal |
| `aontu_test.go`         |  7 | sanity: `TestBasicCanon`, `TestParseCanon`, `TestGenerate`, `TestConflictErrors`, `TestEmpty`, `TestReservedKeyPrefixRejected`, `TestVersionFormat` |
| `kind_test.go`          |  4 | the kind lattice, and that `number` is a supertype no value carries |
| `source_test.go`        |  3 | relative/absolute `@"file"` loading against a base |
| `construct_test.go`     |  2 | the exported value constructors via `GenerateVars`/`UnifyVars` |
| `spec_test.go`          |  2 | the shared spec, and the `gens` runner |
| `concurrent_test.go`    |  1 | concurrent `New()` use |
| `scalar_format_test.go` |  1 | `formatNumber` reproducing JavaScript `Number.toString` |

The Go library suite is therefore still **shared-spec-dominated** — 961
of its 1047 results are spec rows — but the tower brought three files
(`kind_test.go`, `exact_test.go`, `generate_test.go`) that pin what a
TSV row cannot reach: the kind lattice, the internal representation, and
the concrete type `Generate` hands back. Outside the library,
`go/cmd/aontu/main_test.go` covers the CLI's `render` and `repl` logic in
7 tests — including rows pinning the exact bytes the TypeScript CLI
emits for the same source — and the LSP packages add 22 more.

## Where the coverage goes

### TypeScript (per source area)

Most of `ts/src` is very well covered (the language core sits at
86–99 %). The lower-covered files are overwhelmingly **diagnostic and
debug tooling**, not language semantics:

| Area | Lines | Why the gap |
|------|------:|-------------|
| `utility.ts`        | 56 % | `formatExplain` / explain-trace formatting (debug aid) |
| `cli.ts`            | 67 % | the REPL loop and process plumbing (see above) |
| `val/VarVal.ts`     | 68 % | variable code paths beyond the shared `$name` cases |
| `val/OpBaseVal.ts`  | 76 % | operator base machinery / unused branches |
| `val/ExpectVal.ts`  | 82 % | internal assertion value |
| `val/Val.ts`        | 82 % | `inspect`/debug rendering and rarely-hit clone paths |
| `lsp.ts` / `lsp-server.ts` | 88 % / 77 % | editor-facing paths and stdio framing |
| the exact leaves (`val/Decimal.ts`, `val/BigIntegerVal.ts`, `val/BigDecimalVal.ts`, `src/exactjson.ts`) | 92–98 % | new with the number tower, and carrying their own suites |
| core (`aontu`, `ctx`, `err`, `lang`, `unify`, scalar/map/list/ref vals) | 86–99 % | exercised heavily by the native suites |

### Go (per file)

What is left uncovered is mostly **internal helper methods no test path
calls** — chiefly `superior()` (the lattice-ordering helper used in
sorting/preference resolution, uncovered on five value types) and
`Canon`/`Gen` implementations the `gen`/`canon` specs do not reach, plus
small formatters (`numStr`) and accessors (`setPos`).

| File | Stmts | File | Stmts |
|------|------:|------|------:|
| `check.go`    | 26 % | `lang.go`      | 86 % |
| `ref.go`      | 70 % | `ctx.go`       | 88 % |
| `marks.go`    | 77 % | `mapval.go`    | 89 % |
| `func.go`     | 82 % | `clone.go`     | 90 % |
| `listval.go`  | 83 % | `val.go`       | 91 % |
| `op.go`       | 83 % | `conjunct.go`  | 93 % |
| `scalar.go`   | 84 % | `pref.go`      | 94 % |
| `unify.go`    | 86 % | `decimal.go`   | 95 % |
| `disjunct.go` | 86 % | `aontu.go`     | 96 % |
|               |      | `construct.go` | 100 % |
|               |      | `source.go`    | 100 % |

`check.go` is the outlier and is an artefact of the measurement rather
than a gap: `Check`/`CheckVars` exist for the language server, which
lives in the separate `lsp` package, and `go test -cover` attributes
statements only to the package under test. Its own suite covers it.

The uncovered lines are otherwise unreached helpers and defensive
branches rather than untested language features — the *behaviour* of
every feature is pinned by the shared spec, which passes on both sides.

## Reading the gap

The headline difference (TS ~95 % vs Go ~84 %) is explained by **suite
composition, not by behavioural blind spots**:

- The TypeScript side carries 238 targeted tests that walk private
  branches, debug/inspect output, and option permutations.
- The Go side is intentionally a port and leans on the 961-row shared
  spec plus its own targeted files; its remaining uncovered code is
  mostly internal lattice/diagnostic helpers.

The gap narrowed as the number tower landed — `conjunct.go` 39 → 93 %,
`op.go` 47 → 83 %, `listval.go` 52 → 83 % — with its 535 spec rows
driving the lattice and `+` paths, and `exact_test.go` /
`generate_test.go` reaching representation-level code no TSV row can
address.

If raising the Go number further is a goal, the highest-value additions
are direct unit tests for `superior()` ordering and `ref.go` resolution
branches — behaviour that is currently asserted only indirectly through
generation.
