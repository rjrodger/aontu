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
│   ├── lsp.md           # language server reference
│   └── shared-spec.md   # the shared TSV test format
├── editors/             # editor plugins (VS Code, Emacs, Vim) → aontu-lsp
├── test/
│   └── spec/            # shared test cases — *.tsv (language-agnostic)
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
| `err`   | `generate(src)` errors, message contains `expect`     |

Escapes in `src`/`expect`: `\n` → newline, `\t` → tab, `\\` → backslash.
Lines starting with `#` and blank lines are ignored. See
[`docs/shared-spec.md`](docs/shared-spec.md) for details.

### Adding a behaviour

1. Add a row to the appropriate `test/spec/*.tsv` file.
2. Make it pass in the canonical implementation (`ts/src`), rebuild,
   and run `make test-ts`.
3. Make it pass in the Go port (`go/`) and run `make test-go`.

A behaviour is only "shared" once it passes in **both** — only add rows
that both implementations satisfy.

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
be added to `test/spec/*.tsv`:

- **Error message text.** Go's `hints` are abbreviated versions of the TS
  hints, and TS additionally renders source frames. Only the substring
  asserted by an `err`-mode spec row is contractual; full error text is
  not in parity.
- **Parse-level canon.** Only `unify(src).canon` is in parity. The raw
  `parse(src).canon` of nested `&`/`|` is parenthesised in TS but flat in
  Go; this is invisible to the shared spec (which is unify-level).
- **Canon of move()-hidden ghost nodes with a `key()` spread.** In
  `x:{&:{y:1,k:key()}} x:a:z:2 x:c:move($.x.a)` the moved-away (hidden)
  map `a` renders `k:key()` in TS canon but `k:"a"` in Go: TS spread
  clones *share* the template's child Vals, and `key()` deliberately
  clones instead of resolving in place, so the ghost keeps the pending
  func. Generated output is identical (the node is hidden); only the
  unify-canon of the invisible node differs.
- **Canon of invalid sources.** A source that fails in both
  implementations may fail at different stages — e.g. `k-x:1` (bare key
  containing `-`) is a parse error in TS but parses to a list holding an
  error nil in Go. `generate` errors in both; only `unify(src).canon` of
  such an *invalid* source differs, which the spec (whose canon rows are
  valid sources) never observes.

> **Previously divergent, now fixed:** numeric canon formatting at
> extreme magnitudes. Go's `formatNumber` (go/scalar.go) now reproduces
> JavaScript `Number.toString` exactly — fixed notation for decimal
> exponents in [-6, 20], exponential with an unpadded signed exponent
> outside (`1e+21`, `1e-7`) — pinned by `go/scalar_format_test.go` and
> the `scalar.tsv` extreme-magnitude canon rows. Numeric canon rows no
> longer need to stay inside the old "safe decimal subset".

> **Previously divergent, now fixed:** a colon-chain key whose value was a
> bare import — `struct: minor: @"file"` — used to resolve to `{}` in Go
> (it loaded correctly in TS). Fixed upstream in `@tabnas/multisource/go`
> v0.3.1 (pinned in `go/go.mod`); covered by the shared-spec regression
> `file.tsv:load-colon-chain`. Background:
> [`docs/design/nested-import-colon-chain.md`](docs/design/nested-import-colon-chain.md).

