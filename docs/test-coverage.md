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
| TypeScript     | lines (Node `--experimental-test-coverage`) | **94.3 %** |
| TypeScript     | branches | **88.2 %** |
| TypeScript     | functions | **89.6 %** |
| Go — library (`package aontu`) | statements (`go test -cover`) | **78.5 %** |
| Go — CLI (`cmd/aontu`)         | statements | **44.4 %** |

Both suites pass in full: **TypeScript 361/361 tests**, **Go all tests**
(library + CLI + shared spec), via `make test`.

The `cmd/aontu` figure is lower because its uncovered lines are the
process/terminal glue — `main`, stdin-pipe detection, and the `emit`
exit-code path — which need a real process or TTY to exercise. The core
`render` and `repl` logic *is* unit-tested (`go/cmd/aontu/main_test.go`).
The TypeScript CLI is the same shape: `cli.ts` sits at ~62 % because its
`evalSource` core is unit-tested while the `readline` REPL loop and
argument/stdin plumbing run only in a spawned binary (whose coverage the
in-process tool does not count).

## What the suites exercise

### Shared, cross-language spec

`test/spec/*.tsv` — **184 cases across 16 files** — is run by *both*
implementations and is the contract that defines shared behaviour:

| File | Cases | File | Cases |
|------|------:|------|------:|
| `func.tsv`     | 28 | `plus.tsv`     | 9 |
| `scalar.tsv`   | 17 | `close.tsv`    | 9 |
| `ref.tsv`      | 17 | `file.tsv`     | 9 |
| `spread.tsv`   | 16 | `var.tsv`      | 8 |
| `marks.tsv`    | 15 | `disjunct.tsv` | 7 |
| `map.tsv`      | 13 | `list.tsv`     | 7 |
| `conjunct.tsv` | 11 | `optional.tsv` | 7 |
| `pref.tsv`     |  7 | `error.tsv`    | 4 |

Each row asserts a canonical form (`canon`), a generated value (`gen`),
or an error substring (`err`). Because both implementations load the same
rows, every line of language behaviour described in the
[language reference](reference-language.md) is checked on both sides.

### TypeScript-native tests

In addition to the shared spec, `ts/test/*.test.ts` contributes the bulk
of the 350-test suite — rich, implementation-specific cases:

| Suite | Focus |
|-------|-------|
| `aontu.test.ts`        | public API: parse/unify/generate, file loading, options |
| `func.test.ts`         | every built-in function, in depth (largest suite) |
| `val-basic.test.ts`    | scalars, maps, lists, core value behaviour |
| `val-ref.test.ts`      | references and path resolution |
| `val-pref.test.ts`     | preferences/defaults and ranking |
| `val-conjunct` / `val-disjunct` | conjunction / disjunction edge cases |
| `scalar` / `lang` / `op` / `unify` / `error` / `example` | kinds, parsing, operators, the fixpoint, errors, worked examples |
| `cli.test.ts`          | the command-line tool: `evalSource` core + spawned-binary integration |
| `spec.test.ts`         | loads and runs the shared `test/spec/*.tsv` |

### Go-native tests

`go/aontu_test.go` adds five sanity tests — `TestBasicCanon`,
`TestParseCanon`, `TestGenerate`, `TestConflictErrors`, `TestEmpty` —
and `go/spec_test.go`'s `TestSpec` runs all 184 shared rows as subtests.
The Go library suite is therefore **shared-spec-dominated**: it
guarantees parity but adds comparatively few Go-specific cases.
`go/cmd/aontu/main_test.go` separately covers the CLI's `render` and
`repl` logic (JSON/canon/error rendering and a scripted REPL session),
and `go/construct_test.go` exercises the exported value constructors via
`GenerateVars`/`UnifyVars` (the external-caller variable path).

## Where the coverage goes

### TypeScript (per source area)

Most of `ts/src` is very well covered (the language core sits at
92–99 %). The lower-covered files are overwhelmingly **diagnostic and
debug tooling**, not language semantics:

| Area | Lines | Why the gap |
|------|------:|-------------|
| `utility.ts`        | 55 % | `formatExplain` / explain-trace formatting (debug aid) |
| `val/VarVal.ts`     | 68 % | variable code paths beyond the shared `$name` cases |
| `val/OpBaseVal.ts`  | 72 % | operator base machinery / unused branches |
| `val/Val.ts`        | 82 % | `inspect`/debug rendering and rarely-hit clone paths |
| `val/ExpectVal.ts`  | 83 % | internal assertion value |
| core (`aontu`, `ctx`, `err`, `lang`, `unify`, scalar/map/list/ref vals) | 86–99 % | exercised heavily by the native suites |

### Go (per file)

The Go statement coverage is lower mainly because the suite is
spec-dominated and because a set of **internal helper methods are never
called by the test paths** — chiefly `superior()` (the lattice-ordering
helper used in sorting/preference resolution) and `Canon`/`Gen`
implementations on value types the `gen`/`canon` specs do not reach, plus
small formatters (`numStr`, `formatNumber`) and accessors (`setPos`,
`vpath`).

| File | Stmts | File | Stmts |
|------|------:|------|------:|
| `conjunct.go` | 39 % | `func.go`   | 64 % |
| `op.go`       | 47 % | `pref.go`   | 73 % |
| `listval.go`  | 52 % | `mapval.go` | 75 % |
| `ref.go`      | 57 % | `val.go`    | 77 % |
| `scalar.go`   | 78 % | `lang.go`   | 87 % |
| `disjunct.go` | 81 % | `unify.go`  | 82 % |
| `clone.go`    | 92 % | `ctx.go`    | 95 % |
| `aontu.go`    | 94 % | `marks.go`  | 83 % |

The uncovered lines are predominantly unreached helpers and defensive
branches rather than untested language features — the *behaviour* of
every feature is pinned by the shared spec, which passes on both sides.

## Reading the gap

The headline difference (TS ~95 % vs Go ~78 %) is explained by **suite
composition, not by behavioural blind spots**:

- The TypeScript side carries ~350 targeted tests that walk private
  branches, debug/inspect output, and option permutations.
- The Go side is intentionally a port and leans on the 183-row shared
  spec plus a handful of sanity tests; its remaining uncovered code is
  mostly internal lattice/diagnostic helpers.

If raising the Go number is a goal, the highest-value additions are
direct unit tests for `superior()` ordering, the `Canon`/`Gen` paths on
conjunct/op/list values, and `ref.go` resolution branches — all
behaviour that is currently asserted only indirectly through generation.
