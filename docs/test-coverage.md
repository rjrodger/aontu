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
| TypeScript — `ts/src` | lines (Node `--experimental-test-coverage`) | **100.00 %** (13658/13658) |
| TypeScript — `ts/src` | branches | **100.00 %** (3074/3074) |
| TypeScript — `ts/src` | functions | **100.00 %** (536/536) |
| Go — all four packages | statements (`go test -cover` + `GOCOVERDIR`) | **100.0 %** |

Both suites pass in full via `make test`: **2669 TypeScript tests** and
four green Go packages, including the **2246-row shared spec** that both
engines execute.

The absolute figures above move with every change and are reproduced,
not remembered — rerun `make cov` and `make test` rather than trusting
this paragraph. The shared-suite total is also quoted, with its
reproduction commands, in the
[capability-review progress register](capability-review/progress.md#the-update-protocol);
if the two disagree, both are stale.

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
- **The run does not flake.** `node --test` runs each test file in its
  own process and merges their coverage at the end; under load that
  merge drops a handful of observations, and which ones it drops moves
  around. The gate therefore goes through `ts/test/covrun.js`, which
  reruns and **unions** reports — a line seen executing in any run did
  execute, the same argument that lets `covmerge` union the Go
  profiles. It cannot mask a real gap: code no test exercises is
  missing from every run, so the union is still short and the gate
  still fails. (Single-process mode was tried first and rejected:
  several cases depend on a fresh module registry, and coverage drops
  to ~99.6 % because they stop exercising what they were written for.)
  The spawned-binary cases in `cli.test.ts` also no longer pass
  `NODE_V8_COVERAGE` to their children: those assert the packaged
  binary's behaviour, while the same paths are measured in-process.

## What the suites exercise

### Shared, cross-language spec

`test/spec/*.tsv` — **2246 cases across 61 files** — is run by *both*
implementations and is the contract that defines shared behaviour
([ADR-001](../ADR.md#adr-001--typescript-and-go-stay-at-full-parity-driven-by-a-shared-spec)):

| File | Cases | File | Cases |
|------|------:|------|------:|
| `number-tower.tsv`          | 388 | `budget.tsv`         | 24 |
| `edge.tsv`                  | 310 | `disjunct.tsv`       | 24 |
| `constraint-product.tsv`    | 256 | `file.tsv`           | 24 |
| `number-model.tsv`          | 112 | `engine-parity.tsv`  | 23 |
| `func.tsv`                  | 110 | `marks.tsv`          | 23 |
| `constraint-length.tsv`     |  92 | `var.tsv`            | 23 |
| `constraint-re.tsv`         |  89 | `elision.tsv`        | 21 |
| `constraint-bound.tsv`      |  74 | `map.tsv`            | 20 |
| `errcodes.tsv`              |  70 | `plus.tsv`           | 14 |
| `number-cross-product.tsv`  |  59 | `conjunct.tsv`       | 13 |
| `ref.tsv`                   |  48 | `merge-conflict.tsv` | 13 |
| `scalar.tsv`                |  40 | `op-chars.tsv`       | 13 |
| `optional.tsv`              |  37 | `close.tsv`          |  9 |
| `vet.tsv`                   |  37 | `incomplete.tsv`     |  9 |
| `constraint-must.tsv`       |  34 | `list.tsv`           |  7 |
| `error.tsv`                 |  34 | `comment.tsv`        |  6 |
| `constraint-cross.tsv`      |  30 | `divergent.tsv`      |  0 |
| `pref.tsv`                  |  30 |                      |    |

plus the `spread*.tsv` family — **26 files, 130 cases**, one spread
topic per file. `divergent.tsv` is the parity ledger: commentary only,
no data rows (see [the shared spec](shared-spec.md#the-divergence-ledger)).

Regenerate the whole table rather than patching cells — it has drifted
before, and an omitted file reads as "this behaviour is not pinned":

```sh
for f in test/spec/*.tsv; do
  printf '%s %s\n' "$(grep -P '\t' "$f" | grep -vc '^#')" "$(basename "$f")"
done | sort -rn
```

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
error code (`errc`), an error-code registry entry (`errcode`), or — in
the one five-column mode — a whole validation report (`vet`, whose extra
column carries the data document that meets the schema in `src`).

### Per-port tests

Only what a shared row cannot express gets a per-port test — ADR-001
prefers a row precisely because one row lifts both engines:

**TypeScript** (`ts/test/*.test.ts`, 2669 tests, 2246 of them shared
rows): every built-in function in depth, the exact leaves, the public
API, LSP diagnostics/hover/completion/framing, the CLI, error rendering,
the validation verb (`vet.test.ts`, and the verb's cases in
`cli.test.ts`), references, parsing, the fixpoint, worked examples — plus three
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
parity, the validation verb (`vet_test.go` and `cmd/aontu/vet_test.go`,
the twins of the TypeScript files above) — plus four coverage-driven files (`coverage_test.go` through
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
