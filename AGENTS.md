# Aontu — agent & contributor guide

Aontu is a JSON structure unifier (a purpose-specific dialect inspired by
[CUE](https://cuelang.org/)). This repository ships **two implementations
kept in parity**:

- **TypeScript** in `ts/` — the **canonical** implementation.
- **Go** in `go/` — a port that mirrors the TypeScript semantics.

The structural layout follows [`voxgig/util`](https://github.com/voxgig/util):
top-level `ts/` and `go/` siblings and a fan-out `Makefile`. On top of
that, this repo adds a **shared, data-driven test suite** so both
implementations are checked against the same cases.

> **CI note:** the intended two-job (TypeScript + Go) GitHub Actions
> workflow is provided as a full `.github` tree under
> [`ci/`](ci/) (`ci/.github/workflows/build.yml`). Updating
> `.github/workflows/` requires the GitHub `workflow` OAuth scope, so
> copy `ci/.github` over the repo's `.github` and push from an account
> that has the scope to enable it.

## Repository layout

```
.
├── AGENTS.md            # this file
├── CLAUDE.md            # pointer to AGENTS.md
├── Makefile             # fans out to ts/ and go/
├── README.md
├── docs/
│   ├── design/          # design notes — the why behind settled decisions
│   ├── lsp.md           # language server reference
│   └── shared-spec.md   # the shared TSV test format
├── editors/             # editor plugins (VS Code, Emacs, Vim) → aontu-lsp
├── test/
│   └── spec/            # shared test cases — *.tsv (language-agnostic)
│       └── divergent.tsv  # the parity ledger (commentary only, no rows)
├── ts/                  # canonical TypeScript implementation
│   ├── package.json     # `bin`: aontu -> dist/cli.js, aontu-lsp -> dist/lsp-server.js
│   ├── src/             # source incl. cli.ts, lsp.ts, lsp-server.ts (+ src/tsconfig.json -> ../dist)
│   ├── test/            # tests (+ test/tsconfig.json -> ../dist-test)
│   ├── dist/            # committed compiled JS + .d.ts (incl. cli.js)
│   └── dist-test/       # committed compiled tests (the run target)
└── go/                  # Go port
    ├── go.mod           # module github.com/rjrodger/aontu/go
    ├── *.go             # package aontu (incl. check.go: Check -> []Problem)
    ├── lsp/             # LSP library (Diagnostics + Handler)
    ├── cmd/aontu/       # `aontu` CLI (package main, file/stdin/REPL)
    ├── cmd/aontu-lsp/   # `aontu-lsp` Language Server (stdio)
    ├── aontu_test.go    # Go-native sanity tests
    └── spec_test.go     # runs the shared test/spec/*.tsv suite
```

Both implementations also ship an `aontu` command-line tool
(`ts/src/cli.ts`, `go/cmd/aontu`) that evaluates a file or stdin and
starts a REPL when given no file. See
[`docs/reference-api.md`](docs/reference-api.md#command-line-interface).

Both also ship an `aontu-lsp` Language Server that reports unification
diagnostics over stdio. The LSP logic is a reusable library separate from
the server: analysis (`computeDiagnostics` in `ts/src/lsp.ts`;
`lsp.Diagnostics` over `aontu.Check` in `go/lsp`) and a transport-agnostic
handler (`LspHandler` / `lsp.Handler`), with a thin stdio server on top
(`ts/src/lsp-server.ts`, `go/cmd/aontu-lsp`). The two servers are kept in
parity (same capabilities — diagnostics, hover, completion — and identical
output text). The library does not depend on the server, so third parties
can reuse it with their own transport. Editor plugins live in
[`editors/`](editors/). Full reference: [`docs/lsp.md`](docs/lsp.md).
Long-form documentation lives under [`docs/`](docs/) (start at
`docs/index.md`); measure coverage with `make cov` (see
`docs/test-coverage.md`).

## Build & test

Both languages at once, from the repo root:

```sh
make build      # build-ts + build-go
make test       # test-ts  + test-go
make            # build then test
```

Per language:

```sh
cd ts && npm install && npm run build && npm test
cd go && go build ./... && go vet ./... && go test ./...
```

The TypeScript `dist/` and `dist-test/` outputs are committed (as in
`voxgig/util`), so **rebuild after changing `ts/src/` or `ts/test/`**.

## The shared test suite

`test/spec/*.tsv` is the single source of truth for cross-language
behaviour. Each row is one test case; both `ts/test/spec.test.ts` and
`go/spec_test.go` load the same files and must produce identical results.

Tab-separated columns: `name <TAB> mode <TAB> src <TAB> expect`

| mode    | assertion                                              |
|---------|-------------------------------------------------------|
| `canon` | `unify(src).canon` equals `expect`                    |
| `gen`   | `generate(src)` deep-equals `JSON(expect)`            |
| `gens`  | `generate(src)` as compact JSON equals `expect` byte for byte |
| `err`   | `generate(src)` errors, message contains `expect`     |

Escapes in `src`/`expect`: `\n` → newline, `\t` → tab, `\\` → backslash.
Lines starting with `#` and blank lines are ignored. See
[`docs/shared-spec.md`](docs/shared-spec.md) for details.

Pick the mode that can actually fail: `gen` compares through JSON and is
therefore blind to the `integer`/`float` kind distinction, so a
behaviour that distinguishes kinds must be pinned by `canon` or `err`,
and one that turns on the exact serialised bytes (which digits, which
exponent form, which key order) by `gens` — see
[Choosing a mode](docs/shared-spec.md#choosing-a-mode).

### Adding a behaviour

1. Add a row to the appropriate `test/spec/*.tsv` file, with its
   expected value obtained by the [parity probe](#the-parity-probe)
   below — never copied out of one engine.
2. Make it pass in the canonical implementation (`ts/src`), rebuild,
   and run `make test-ts`.
3. Make it pass in the Go port (`go/`) and run `make test-go`.

A behaviour is only "shared" once it passes in **both** — only add rows
that both implementations satisfy.

### The parity probe

**An expected value in a shared spec row must be obtained by running
both implementations and requiring them to agree.** Two command lines,
from the repository root:

```sh
echo 'x:1.0' | node ts/dist/cli.js -c
(cd go && echo 'x:1.0' | go run ./cmd/aontu -c)
```

Both print `{"x":1.0}`, so that is the `canon` expectation and the row
may be written. Drop `-c` from both for a `gen` row — the CLIs then
print generated JSON. For an `err` row, probe the same way and assert a
substring that **both** messages contain; error wording itself is not in
parity (see [Known TS/Go divergences](#known-tsgo-divergences)).

The TypeScript CLI runs the committed build, so run `make build-ts`
before probing if `ts/src` has changed, or the probe answers for the old
code.

Writing the expectation from one engine's output is how a divergence
gets baselined as the contract. The row then passes on the side it was
copied from and fails on the other, and the obvious next move — "make
the other side match" — quietly changes whichever engine happened to be
right. Nothing in the suite can warn you, because a row that was never
probed carries no record of having been agreed. Probing costs two
commands; the alternative costs a wrong contract that looks green.

### The divergence ledger

When a probe shows the two engines disagreeing, that is a **bug**, and
the default response is to fix the engine.
[`test/spec/divergent.tsv`](test/spec/divergent.tsv) is the debt
register for the case where it cannot be fixed from this repository
right now — the behaviour originates in a pinned `@tabnas` dependency,
or which side is correct is an open language-design question.

It lives beside the suite, as a `.tsv`, so it is read whenever the spec
is read — but it carries **no data rows**. A row there would be executed
by both runners and, by definition, could not pass in both, so
everything in the file is commentary; both runners skip comment and
blank lines, and the file therefore contributes zero cases.

Adding an entry is a deliberate, reviewed act, **not** a way to silence
a failing row. An entry must carry an issue reference, the reason it is
not simply fixed, and the exact divergent inputs together with *both*
engines' outputs. An entry is removed — not amended — when the
divergence is fixed, and the behaviour then earns real rows in the
appropriate spec file.

The ledger is not the same list as
[Known TS/Go divergences](#known-tsgo-divergences) below. Those differ
deliberately and permanently and are never going to be pinned, so they
are not tracked as debt.

[`docs/design/number-model.md`](docs/design/number-model.md) is the
worked example of what this discipline catches. TypeScript classified a
numeric literal's kind with no range condition at all, while Go used a
`float64` → `int64` round-trip, so `a:1e21 & integer` **succeeded in
TypeScript and failed in Go** — a silent, magnitude-dependent parity
break that no existing row observed, because no row at that magnitude
had ever been asked of both engines. The review that found it produced
`test/spec/number-model.tsv` and the ledger's two current entries.

## Implementation parity & Go coverage

TypeScript is canonical; the Go port is kept in parity for the subset it
implements. The Go **parser** is built on the Go ports of the `@tabnas`
parser stack and its `expr`/`path` plugins (`github.com/tabnas/...`) —
the same stack as `ts/src/lang.ts` — so the surface syntax parses in
parity.

The Go port has **full parity** with the canonical TypeScript language:
scalars, scalar kinds (type constraints), maps (implicit nesting,
duplicate-key merge, spreads `&:`, optional keys `a?:`, `close`/`open`),
lists (incl. `&:` spreads), conjunction (`&`), disjunction (`|`),
preference/defaults (`*`), references (`$.a.b`, relative `.x.a`, `$KEY`,
cross/chained refs), `$name` variables, the `+` operator (and
parenthesised grouping), all twelve built-in functions (`upper`,
`lower`, `copy`, `key`, `pref`, `super`, `type`, `hide`, `close`,
`open`, `move`, `path`), type/hide marks, and `@"file"` source loading
via the multisource plugin — plus `parse`, `unify`, `generate` and
`canon`.

Both use the **same `@tabnas` parser stack**: TS `@tabnas/jsonic` +
`@tabnas/{expr,path,multisource,directive,debug}`; Go
`github.com/tabnas/{jsonic,expr,path,multisource,directive}/go` — the Go
ports. `$var` variables are supplied via the runner context
(`ctx.vars` in TS, `Aontu.GenerateVars(src, vars)` in Go); the shared
`test/spec/var.tsv` rows are checked with the same variable set in both.

Both implementations use the same `@tabnas` Go/TS stack (jsonic + expr +
path + multisource), so the parser and semantics stay in lock-step. The
shared spec is the contract; grow it whenever either side changes.

**Pin the `@tabnas` versions exactly** (`ts/package.json`, `go/go.mod`).
The spread (`&:`) and optional-key (`a?:`) rules depend on `@tabnas`
parser *internals*, not just its public API: the parent-seeded node that
descended rules share (hence the explicit `r.node = {}` resets in both
`lang.ts` and `lang.go`), the `B:`/`b:` backtrack accounting, and the
order plugins are applied. A minor `@tabnas` bump can change these
silently with no compile error — only the shared spec catches it — so
upgrade deliberately and run `make test` before loosening any pin.

> **Previously divergent, now fixed:** consecutive spreads at one map
> level — bare (`&:k:a &:p:2`) and space-separated braced
> (`x:{&:{k:a} &:{p:2}}`) — used to parse differently (Go nested the
> second bare spread inside the first's template; TS mis-attached a
> nested braced sibling spread to the root). Both grammars now gate the
> sibling-spread pair-close alt on the `pk`/`dmap` counters (see the
> pair close alts in `ts/src/lang.ts` and `go/lang.go`), so consecutive
> spreads are siblings on the enclosing map at any depth; covered by the
> `spread.tsv:sibling-*` shared-spec rows.

## Conventions

- Keep new TypeScript code in the style of the surrounding `ts/src` files.
- Go is `package aontu`; exported API is `New().Parse/Unify/Generate`.
  Run `go vet ./...` and `gofmt` before committing.
- Go module releases (a Go module in a subdirectory) use git tags of the
  form `go/vX.Y.Z`.

### Mutation caveat (both implementations)

Although `Val.unify` is documented "MUST not mutate", the fixpoint
driver relies on `unify` mutating the result/`this` in place on the
self-unify-with-TOP path (e.g. `MapVal`/`ListVal` write back their
children, `Conjunct`/`Disjunct`/`Ref`/`Pref`/`Func` advance their own
`dc`/`peg`). This is safe **only** because a `Val` tree is unified once,
in place, and is not shared across independent unifications. Do not
cache, reuse, or unify the same parsed `Val` (or a node reachable from
it) in two different `unify` runs — clone first. The same constraint
applies to the Go port. Treat parsed `Val`s as single-use.

### Known TS/Go divergences

The shared spec only contains rows that pass identically in both
implementations. A few behaviours deliberately differ and must **not**
be added to `test/spec/*.tsv`. These are permanent, so they are not
entered in the divergence ledger
([`test/spec/divergent.tsv`](test/spec/divergent.tsv)), which tracks
only divergences that are expected to be fixed:

- **Error message text.** Go's `hints` are abbreviated versions of the TS
  hints, and TS additionally renders source frames. Only the substring
  asserted by an `err`-mode spec row is contractual; full error text is
  not in parity.
- **Parse-level canon.** Only `unify(src).canon` is in parity. The raw
  `parse(src).canon` of nested `&`/`|` is parenthesised in TS but flat in
  Go; this is invisible to the shared spec (which is unify-level).
> **Previously divergent, now fixed:** the canon of move()-hidden ghost
> nodes, including the object-sharing artifacts. The Go port now
> mirrors TS's clone-graph sharing directly: func clones share their
> args array (TS `Val.clone` passes `peg` by reference) and pref clones
> share their peg, a TOP-peer map/list unify refines the bag IN PLACE
> (the `out = peer.isTop ? this : new ...` fast-path), and a driving
> func re-paths its (possibly shared) args to its own location each
> pass (`repathArg`, the equivalent of TS's ctx-path re-descent — with
> key()'s stored path frozen once its cc<3 delay window closes). Hiding
> is mark-based: move() sets the hide mark on the found source node's
> ROOT only (TS `_hide_found`), bag unifies ratchet marks down one
> level per pass, and a marked func freezes against TOP but still
> resolves against a non-TOP peer (spread clones re-driving hidden
> children behave exactly as in TS). Chained moves wrap the moved copy
> in a pref() func immediately (TS MoveFuncVal), so intermediate frozen
> ghosts render `pref($.x.a)` / `pref({"k":"c"})` identically. Ref
> spreads are snapshotted once per canon+site (the TS snapshotRefSpread
> port), and spread constraint roots are pathed under a literal `&`
> segment so relative refs used as spreads resolve one level deeper,
> as in TS. A ctx `slot` hint threads the TS ctx.path through unify
> (bag child loops, func arg loops, junction folds), so shared clones
> whose stored paths carry transplant overlay tails are driven at
> their actual slot — a close() ghost moved to a SHALLOWER destination
> re-keys as in TS. Go's hasPathFunc mirrors the TS isPathDependent
> getter including its recursion quirks (a pref-wrapped func's args
> array is invisible to the property walk, so `&:{q:*copy($.z)}`
> templates are shared and advance in place). Covered by the func.tsv
> ghost/move-chain rows and the spread.tsv close-template and
> template-pref-copy rows.
- **Canon of invalid sources.** A source that fails in both
  implementations may fail at different stages — e.g. `k-x:1` (bare key
  containing `-`) is a parse error in TS but parses to a list holding an
  error nil in Go. `generate` errors in both; only `unify(src).canon` of
  such an *invalid* source differs, which the spec (whose canon rows are
  valid sources) never observes.
- **Malformed-input acceptance edges.** Fuzzing surfaced a residual
  family of *degenerate* inputs where the two parsers disagree about
  whether to accept at all: nested implicit lists from adjacent values
  in expression positions (`pref(1-3)`, `close(([]%))`), and stray-quote
  juxtapositions (`1'00]...`, `"q k""?:...`) — one side errors, the
  other parses to a (differently shaped) junk value. Well-formed
  sources are unaffected.
> **Previously divergent, now fixed:** root-level spreads over `$var`
> (and other expression) keys. `k1:$flag &:boolean` used to raise an
> internal error in TS: the expr plugin consumed the `&` as an infix
> conjunct, choked on the `:`, and left a raw unevaluated expr node in
> the map. Both grammars now close an open expression when `&` `:`
> follows (backtracking so the enclosing map takes the spread), and TS
> VarVal.unify resolves the variable's NAME against TOP only, applying
> the peer constraint to the resolved VALUE (previously the constraint
> was unified with the name string, inverting the check). TS unite's
> dispatch ladder also gained the `isVar` case Go already had, so
> conjunct-driven constraints reach VarVal.unify instead of failing in
> ScalarKindVal (`p1:$foo &:integer&number`). TS RefVal.find now pushes
> a resolved variable path segment (`$seg.r` with seg="x" reads
> `...x.r`; previously the coerced value was silently dropped and the
> path read without it — Go's interpolation was already correct).
> Covered by the var.tsv spread and path-segment rows.

> **Previously divergent, now fixed:** numeric canon formatting at
> extreme magnitudes. Go's `formatNumber` (go/scalar.go) now reproduces
> JavaScript `Number.toString` exactly — fixed notation for decimal
> exponents in [-6, 20], exponential with an unpadded signed exponent
> outside (`1e+21`, `1e-7`) — pinned by `go/scalar_format_test.go` and
> the `scalar.tsv` extreme-magnitude canon rows. Numeric canon rows no
> longer need to stay inside the old "safe decimal subset".

> **Previously divergent, now fixed:** the classification of numeric
> kinds. TypeScript decided a literal's kind with no range condition at
> all, and Go with a `float64` → `int64` round-trip (whose out-of-range
> behaviour the Go specification leaves implementation-dependent), so
> `a:1e21 & integer` succeeded in TS and failed in Go. Both ports now
> share one predicate — `isIntegerKind` (`ts/src/val/numkind.ts`,
> `go/lang.go`), comparing against the exact `float64` bounds and
> applied at every construction site, including the raw/implicit-list
> path where there is no source text. Five further rules landed with it:
> negative zero never reaches the AST, generated output or canon; scalar
> identity compares kind as well as value, so `1|1.0` keeps both
> alternatives; number-kind canon always carries a fraction or an
> exponent, so it reparses to the same kind (this flipped `scalar.tsv`'s
> `big-fixed-canon` and `hex-big-canon` to a `.0` suffix); `+`,
> `upper()` and `lower()` never narrow their operands' kind; and
> `super(x)` lifts its argument rather than itself. The `.0` suffix is
> canon-only — `+`'s string coercion keeps JS parity (`"a"+1.0` is
> `"a1"`), so `go/scalar_format_test.go` passes unchanged. Pinned by
> `test/spec/number-model.tsv`; what remains unresolved is entry 2 of
> the divergence ledger. Background:
> [`docs/design/number-model.md`](docs/design/number-model.md).

> **Previously divergent, now fixed:** a colon-chain key whose value was a
> bare import — `struct: minor: @"file"` — used to resolve to `{}` in Go
> (it loaded correctly in TS). Fixed upstream in `@tabnas/multisource/go`
> v0.3.1 (pinned in `go/go.mod`); covered by the shared-spec regression
> `file.tsv:load-colon-chain`. Background:
> [`docs/design/nested-import-colon-chain.md`](docs/design/nested-import-colon-chain.md).

