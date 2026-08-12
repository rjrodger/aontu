# Test coverage

How test coverage is measured for both implementations, the current
numbers, what the suites exercise, and — because the numbers are now
close to the ceiling — an explicit accounting of every uncovered
statement that remains. The figures below were produced with the
dependency versions current at the time of writing and the toolchains
noted in each section; re-run the commands to refresh them.

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
| TypeScript     | lines (Node `--experimental-test-coverage`) | **98.6 %** |
| TypeScript     | branches | **93.8 %** |
| TypeScript     | functions | **96.9 %** |
| Go — library (`package aontu`) | statements (`go test -cover`) | **99.2 %** |
| Go — CLI (`cmd/aontu`)         | statements | **97.8 %** |
| Go — LSP library (`lsp`)       | statements | **100.0 %** |
| Go — LSP server (`cmd/aontu-lsp`) | statements | **98.0 %** |

`make cov-go` prints one combined figure over all four Go packages of
**99.3 %** — and that run now covers the literal `main()` functions
too: the target builds both command binaries with `go build -cover`,
runs them for real (version, a piped document, an immediate-EOF LSP
session) under `GOCOVERDIR`, and unions the binary-run profile into
the unit-test profile with `go/scripts/covmerge`.

Both suites pass in full via `make test` (1877 TypeScript tests; the
Go packages run the same shared rows plus 130+ native test functions).

The coverage-driving method is spec-first: every gap reachable FROM
SOURCE INPUT gets a shared row — `test/spec/edge.tsv` exists precisely
for coverage-driven parity edges, every row probed byte-identical in
both engines before pinning — so a covering test usually lifts BOTH
engines at once. Only paths a source cannot reach get per-port unit
tests (`go/coverage_test.go`, `go/coverage3_test.go` and the ts/test
suites): comparison-internal binary64 infinities, deliberately-dead
mirrored branches, grammar-action guards driven with constructed
rules, tooling walks, debug/inspect rendering, and the CLI/LSP process
plumbing. What still cannot be reached that way is not waved off — it
is itemised in [The remainder, documented](#the-remainder-documented).

## What the suites exercise

### Shared, cross-language spec

`test/spec/*.tsv` — **1570 cases across 54 files** — is run by *both*
implementations and is the contract that defines shared behaviour:

| File | Cases | File | Cases |
|------|------:|------|------:|
| `number-tower.tsv`        | 388 | `map.tsv`        | 20 |
| `edge.tsv`                | 284 | `file.tsv`       | 18 |
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
topic per file. `divergent.tsv` is the divergence ledger: commentary
only, no data rows, so it contributes zero cases (see
[the shared spec](shared-spec.md#the-divergence-ledger)).

`edge.tsv` is the coverage drive's own file: parity edges found by
reading uncovered engine code and probing candidate sources through
both engines byte-for-byte before pinning. Its eight batches cover
constraint ties, junction folding, reference/variable path parts of
every kind, canon escapes, expects, lexer edges (based literals,
overflow, exactness windows, separator refusals), comment starters
inside text tokens, dangling operators, list-spread merging,
duplicate-key merges of every bag shape, optional pairs in list
position, and implicit top-level lists of every raw scalar kind.

The three `number-*.tsv` files are 559 of the 1570 rows — over a
third of the suite. That is the number tower's doing: the leaves are
disjoint, so every kind rule needs pinning in both directions, and
`number-cross-product.tsv` pins the `+` operand table exhaustively in
both operand orders.

Each row asserts a canonical form (`canon`, 472 rows), a generated
value (`gen`, 428), the exact serialised bytes (`gens`, 256), an error
substring (`err`, 208), an exact error code (`errc`, 141), or an
error-code registry entry (`errcode`, 65). Because both
implementations load the same rows, every line of language behaviour
described in the [language reference](reference-language.md) is
checked on both sides.

### TypeScript-native tests

`spec.test.ts` accounts for 1575 of the 1877 TypeScript tests: the
1570 shared rows, a sanity check that the rows loaded, and tests of
the `gens` mode's own machinery. The other ~300 are rich,
implementation-specific cases: every built-in function in depth
(`func.test.ts`), the exact leaves (`bignum.test.ts`), the public API
(`aontu.test.ts`), LSP diagnostics/hover/completion/framing
(`lsp.test.ts`), the CLI core and spawned binary (`cli.test.ts`),
error rendering, references, parsing, the fixpoint, worked examples —
and `coverage.test.ts` / `coverage2.test.ts`, the rounds that walk
what no source reaches: the explain-trace formatters and `walk`
guards in `utility.ts`, raw (non-Val) variable bindings in `VarVal`,
`OpBaseVal`'s base machinery and `primatize`, `Val`'s inspect/debug
rendering, the LSP server's frame codec and wiring fed malformed
input, the exact-comparison edges, the spread-clone arms, the
unify-cycle counter and internal-exception catch, and the whole CLI —
help/version/file/canon/REPL/stdin — driven in-process on a swapped
stdin, so even the readline loop and the version fallback are
counted.

### Go-native tests

`go/spec_test.go`'s `TestSpec` runs all 1570 shared rows as subtests,
and `TestSpecGensMode` checks the byte-exact runner itself. Around
them, `package aontu` has 114 test functions in twelve files — the
representation-level invariants (`exact_test.go`), `Generate`'s native
exact types (`generate_test.go`), the kind lattice (`kind_test.go`),
file loading, constructors, concurrency, `formatNumber` parity, and
two dedicated coverage files:

- `coverage_test.go` (rounds 1–2): scaled-comparison infinities,
  tower ranks, ExpectVal contracts, unite dispatch arms, constraint
  internals, lexer helpers, residue paths, clone flags.
- `coverage3_test.go` (round 3): the `Check`/`Spans` walkers on
  constructed trees, `RefVal`/`VarVal` internals (computed path
  segments, chain-defer arms, cycle-proof walk failures), grammar
  actions driven with hand-built `jsonic.Rule` values, `evaluate`
  outside any parse, `snipExprCycles` on real back-edges, and the
  custom lex matchers on a hand-built lexer.

Outside the library, `go/lsp` is at 100 % (its own suite plus
`coverage_test.go` covering the marshal fallbacks, parameter guards,
positionless diagnostics, and line-index clamps), and both commands
are tested end-to-end in-process: `cmd/aontu`'s `main` is a one-line
`os.Exit(run(...))` and `run` is driven with in-memory pipes through
every mode (help/version/bad option/file/canon/stdin/REPL);
`cmd/aontu-lsp`'s `serve` loop is driven through framing errors, bad
JSON, write failures, and the shutdown/exit handshake.

## The remainder, documented

The gap to literal 100 % is small enough to enumerate. Every entry
below is code we keep ON PURPOSE — a defensive guard, an API-mandated
error return, or process glue — and this list is the ruling on why a
test does not exist. If a change makes one of these reachable, it
moves out of this list and into a test.

### Go library (`package aontu`, 23 statements)

| Site | Why it cannot be reached |
|------|--------------------------|
| `lang.go` `makeLang`/`mustMakeLang`/`langForBase`/`parseBase` error returns (84, 101, 273, 277, 459, 1823) | jsonic plugin-registration errors. The grammar is static — no input can make registration fail — but the plugin API returns errors and refusing to check them would be worse. |
| `lang.go` `big.Int.SetString` guards (762, 781, 884, 942, 952) | The digit strings are pre-validated by `basedNumeric`/`allDigits`/the decimal regex, so `SetString` cannot fail on them. |
| `func.go` resolve-pending arms (178–193) | The Go port's `resolve()` never returns nil or the func itself; TS `FuncBaseVal.resolve` can, and the arms mirror that shape so the two ports read the same. |
| `clone.go` 300 | `clonePathRec`'s type-switch default: every concrete Val type has a case. |
| `conjunct.go` 120 | `outvals` cannot be empty when `upeer` is non-empty — the last fold iteration always appends. |
| `disjunct.go` 161 | An equal-rank pref merge wraps a conflict in a PrefVal; it never returns a bare nil, so the nil check cannot fire. |
| `op.go` 163 | `operate`'s result switch: `plusAdd` only produces strings and floats. |
| `unify.go` 106 | The `"$"` fallback for an empty residue-path list needs a non-bag root still refining at budget exhaustion; no source form produces one. |
| `val.go` 364 | `rowCol` clamps columns to ≥ 1, so the caret clamp below it cannot fire. |

### Go commands (1 statement)

`cmd/aontu`'s `json.Encoder.Encode` error guard: `Generate` output is
always encodable, and the guard is the API contract. The two `main()`
functions are no longer in this list — `make cov-go` executes them for
real via `GOCOVERDIR` binary runs and merges that profile in.

### TypeScript

| File | Remaining | What it is |
|------|-----------|------------|
| every file's `export { … }` block, the two shebangs, the two `require.main` guard calls | ~60 lines total | Counter artifacts and entry-point glue: V8+source-maps report export blocks as unexecuted, and the guarded `main(process.argv)` call only runs in a spawned binary, whose coverage the in-process tool cannot count. This is the floor under the TypeScript line number. |
| `lang.ts` `rawToVal` arms, the resolver empty-path guards, the list `___merge` branch | ~20 lines | Kept for engine states the current jsonic grammar does not hand back (the implicit-list rows exercise the Go twin; TS routes those shapes through the Val rules). The resolver guard is shadowed by the `@""` syntax refusal — the divergence tracked as #38. |
| `lsp.ts` `nilMessage` primary arms | 5 lines | Diagnostics carry a prebuilt `msg`, so the fallback formatter's canon arms never fire. |
| `utility.ts` `walk` `Array.isArray` arm | 7 lines | Dead — arrays take the `typeof === 'object'` for-in path above it. Kept because the TS source is the canonical reading. |
| a handful of one-line val branches (`OpBaseVal` result-null mirror, `Decimal` scale arm, `numkind` zero-coefficient window) | <10 lines | Mirror-dead or shadowed by an earlier fast path; each has a Go twin with the same ruling. |

## Reading the gap

The headline difference (TS ~98.6 % of lines vs Go ~99.3 % of statements)
is a measurement difference, not a quality signal: V8 counts every
line of the file (exports, process glue, the REPL that only a real
TTY runs), while Go counts statements in functions. In both ports the
behaviour of every language feature is pinned by the 1570-row shared
spec, which passes byte-identically on both sides; the per-port tests
exist for what a TSV row cannot express. When raising a number
further, the order of preference stays: shared row first (probe both
engines, pin the agreement, ledger the divergence), per-port unit
test only for engine internals, and a documented ruling only for what
no test can reach.
