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
│   └── shared-spec.md   # the shared TSV test format
├── test/
│   └── spec/            # shared test cases — *.tsv (language-agnostic)
├── ts/                  # canonical TypeScript implementation
│   ├── package.json
│   ├── src/             # source (+ src/tsconfig.json -> ../dist)
│   ├── test/            # tests (+ test/tsconfig.json -> ../dist-test)
│   ├── dist/            # committed compiled JS + .d.ts
│   └── dist-test/       # committed compiled tests (the run target)
└── go/                  # Go port
    ├── go.mod           # module github.com/rjrodger/aontu/go
    ├── *.go             # package aontu
    ├── aontu_test.go    # Go-native sanity tests
    └── spec_test.go     # runs the shared test/spec/*.tsv suite
```

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
implements. The Go **parser** is built on the official Go ports of jsonic
and its `expr`/`path` plugins (`github.com/jsonicjs/...`) — the same stack
as `ts/src/lang.ts` — so the surface syntax parses in parity.

Unification/generation covers the whole language: scalars, scalar kinds
(type constraints), maps (implicit nesting, duplicate-key merge, spreads
`&:`, optional keys `a?:`, `close`/`open`), lists (incl. `&:` spreads),
conjunction (`&`), disjunction (`|`), preference/defaults (`*`),
references (`$.a.b`, relative `.x.a`, `$KEY`, cross/chained refs), the
`+` operator (and parenthesised grouping), all twelve built-in functions
(`upper`, `lower`, `copy`, `key`, `pref`, `super`, `type`, `hide`,
`close`, `open`, `move`, `path`) and type/hide marks — plus `parse`,
`unify`, `generate` and `canon`.

Still TypeScript-only: file/source resolution (`@"file"`, via the
multisource plugin) and generic `$var` variables (no test defines one).
The shared spec is scoped to what both implementations pass; grow it as
the Go port grows.

## Conventions

- Keep new TypeScript code in the style of the surrounding `ts/src` files.
- Go is `package aontu`; exported API is `New().Parse/Unify/Generate`.
  Run `go vet ./...` and `gofmt` before committing.
- Go module releases (a Go module in a subdirectory) use git tags of the
  form `go/vX.Y.Z`.
