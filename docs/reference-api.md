# API reference

The programming interfaces of both implementations, plus the
command-line tool. For the language itself see the
[Language reference](reference-language.md).

## Contents

- [Command-line interface](#command-line-interface)
- [TypeScript API](#typescript-api)
  - [`Aontu`](#class-aontu)
  - [`AontuOptions`](#aontuoptions)
  - [`AontuContext`](#aontucontext)
  - [`Val`](#val-typescript)
  - [Variables](#variables)
  - [Exports](#exports)
- [Go API](#go-api)
  - [`Aontu`](#type-aontu)
  - [`Val`](#val-go)
  - [`Ctx` and errors](#ctx-and-errors)
  - [Variables in Go](#variables-in-go)
- [Behavioural parity](#behavioural-parity)

---

## Command-line interface

Both implementations ship the same `aontu` command. It evaluates a
source file (or stdin) and prints the result, or starts a REPL when run
interactively with no file.

```
Usage: aontu [options] [file]

Evaluate an Aontu source file and print the result as JSON.
With no file on an interactive terminal, start a REPL.
With no file and piped input, read the source from stdin.

Options:
  -c, --canon     Print the canonical form instead of generated JSON
  -h, --help      Show this help and exit
  -v, --version   Print the version and exit
```

**Behaviour**

- **File:** `aontu config.aontu` reads, unifies and prints the file.
- **Stdin:** `echo 'a:1 b:$.a' | aontu` reads source from the pipe.
- **REPL:** `aontu` with no file on a terminal starts an interactive
  loop; each line is evaluated and printed.
- Output is pretty-printed JSON by default, or canonical form with
  `--canon`.
- Results go to **stdout**; errors go to **stderr** with a non-zero exit
  status (`1` for an evaluation error, `2` for a bad option).

**REPL commands**

| Command | Effect |
|---------|--------|
| `:help` | show help |
| `:canon` | switch to canonical-form output |
| `:json` | switch to JSON output |
| `:quit`, `:exit` | leave (or press Ctrl-D) |

```
$ aontu
Aontu v0.45.1 REPL — :help for commands, :quit to exit
aontu> port: *8080 | integer
{
  "port": 8080
}
aontu> :canon
canon output
aontu> a:1|2|3
{"a":1|2|3}
aontu> :quit
```

**Getting the command**

- **TypeScript:** the npm package declares a `bin` named `aontu`
  (`dist/cli.js`), so `npm install -g aontu` (or `npx aontu`) provides
  it. From a clone: `node ts/dist/cli.js …`.
- **Go:** `go install github.com/rjrodger/aontu/go/cmd/aontu@latest`, or
  from a clone: `go run ./cmd/aontu …` (inside `go/`).

Both commands accept the same options and produce the same results.

---

## TypeScript API

Package `aontu` (canonical). Entry point `dist/aontu.js`, types
`dist/aontu.d.ts`. Requires Node ≥ 22.

```ts
import { Aontu } from 'aontu'          // named
import Aontu from 'aontu'              // default (same class)
```

### class `Aontu`

```ts
new Aontu(opts?: AontuOptions)
```

Constructs an instance and its parser (`Lang`). One instance can process
many sources.

| Method | Signature | Returns | Notes |
|--------|-----------|---------|-------|
| `parse`    | `parse(src: string, opts?, ctx?)` | `Val \| undefined` | Parses to an unresolved AST. Does not unify. |
| `unify`    | `unify(src: string \| Val, opts?, ctx?)` | `Val` | Parses (if given a string) and runs the fixpoint to a fully unified `Val`. |
| `generate` | `generate(src: string, opts?, ctx?)` | `any` | Parse → unify → emit a native JS value. **Throws `AontuError`** on conflict or an unresolved result. |
| `ctx`      | `ctx(cfg?: AontuContextConfig)` | `AontuContext` | Creates a context (for variables, error collection, a custom `fs`, etc.). |

```ts
const aontu = new Aontu()
aontu.parse('a:number')                  // Val (AST)
aontu.unify('a:1 a:number').canon        // '{"a":1}'
aontu.generate('a:1 b:$.a')              // { a: 1, b: 1 }
aontu.generate('a:1 a:2')                // throws AontuError: Cannot unify value: 2 with value: 1
```

`unify` accepts a previously parsed `Val`, letting you parse once and
unify repeatedly: `const p = aontu.parse(src); aontu.unify(p)`.

### `AontuOptions`

Passed to the constructor, to any method's `opts` argument, or merged
into a context.

| Option     | Type        | Purpose |
|------------|-------------|---------|
| `src`      | `string`    | Source text (usually passed positionally instead). |
| `path`     | `string`    | Path of the entry file (for `@"…"` relative resolution and error sites). |
| `base`     | `string`    | Base path for the resolver. |
| `resolver` | `Resolver`  | Custom source resolver for `@"…"` loading. |
| `fs`       | `typeof fs` | Filesystem implementation — e.g. a `memfs` volume for tests. |
| `collect`  | `boolean`   | Collect errors onto `result.err` instead of throwing. |
| `err`      | `any[]`     | Pre-existing array to accumulate errors into (implies `collect`). |
| `explain`  | `any[]`     | Capture a structured trace of the unification. |
| `debug` / `trace` | `boolean` | Enable jsonic debug / parse tracing. |
| `deps`     | `object`    | Dependency record populated by `@"…"` loads. |
| `log`      | `number`    | jsonic log verbosity. |

`@"…"` resolution tries an **in-memory** resolver, then the
**filesystem**, then **package** resolution, in that order.

### `AontuContext`

A context threads variables, error state, and resolver configuration
through a run. Create one with `aontu.ctx()`.

- `ctx.vars: Record<string, Val>` — values for `$name` variables.
- `ctx.err: any[]` — collected errors (when `collect`).
- `ctx.find(path: string[]): Val | undefined` — look a value up by path.

Pass the context as the third argument:
`aontu.generate(src, undefined, ctx)`.

### `Val` (TypeScript)

The unified value. Useful members:

| Member | Description |
|--------|-------------|
| `canon: string` | Reparseable canonical form (see [language reference](reference-language.md#canonical-form)). |
| `gen(ctx): any` | Emit the native value (used by `generate`). |
| `err: any[]`    | Errors attached to this value (`NilVal`s). |
| `isVal: boolean` and `isMap`/`isList`/`isScalar`/`isNil`/… | Type discriminators. |
| `path: string[]` | Path from the root. |

`Val` is an abstract base; concrete subclasses (`MapVal`, `ListVal`,
`IntegerVal`, `StringVal`, `BooleanVal`, `NumberVal`, `NullVal`,
`ScalarKindVal`, `ConjunctVal`, `DisjunctVal`, `PrefVal`, `RefVal`,
`VarVal`, the `*FuncVal`s, …) are exported from their modules under
`dist/val/`.

### Variables

`$name` references are filled from `ctx.vars`. Build value objects with
the exported `Val` constructors:

```ts
import { Aontu } from 'aontu'
import { IntegerVal } from 'aontu/dist/val/IntegerVal'
import { StringVal }  from 'aontu/dist/val/StringVal'
import { MapVal }     from 'aontu/dist/val/MapVal'

const aontu = new Aontu()
const ctx = aontu.ctx()
ctx.vars.foo = new IntegerVal({ peg: 11 })
ctx.vars.bar = new StringVal({ peg: 'hello' })
ctx.vars.obj = new MapVal({ peg: { x: new IntegerVal({ peg: 1 }) } })

aontu.generate('a:$foo b:$bar c:$obj', undefined, ctx)
// { a: 11, b: 'hello', c: { x: 1 } }
```

### Exports

From `aontu`:

```ts
Aontu          // class (also default export)
AontuOptions   // type
AontuContext   // class
AontuError     // error class (thrown by generate)
Val            // base value type
Lang           // the parser
runparse, util // parsing helpers
formatExplain  // pretty-print an `explain` trace
```

---

## Go API

Module `github.com/rjrodger/aontu/go`, package `aontu`.

```go
import aontu "github.com/rjrodger/aontu/go"
```

### type `Aontu`

```go
func New() *Aontu
```

| Method | Signature | Notes |
|--------|-----------|-------|
| `Parse`        | `Parse(src string) (Val, error)` | AST, not unified. |
| `Unify`        | `Unify(src string) (Val, error)` | Parse + fixpoint unify. |
| `UnifyVars`    | `UnifyVars(src string, vars map[string]Val) (Val, error)` | `Unify` with `$name` variables. |
| `Generate`     | `Generate(src string) (any, error)` | Parse → unify → native Go value. |
| `GenerateVars` | `GenerateVars(src string, vars map[string]Val) (any, error)` | `Generate` with variables. |

```go
a := aontu.New()
v, err := a.Unify("a:1 a:number")   // v.Canon() == `{"a":1}`
out, err := a.Generate("a:1 b:$.a") // out == map[string]any{"a":1,"b":1}
```

All methods return an `error` (never panic for ordinary conflicts);
`Generate` returns `(nil, err)` on any unresolved or conflicting value.
Generated output uses Go's natural types (`map[string]any`, `[]any`,
`int64`/`float64`, `string`, `bool`, `nil`).

### `Val` (Go)

The lattice element interface:

```go
type Val interface {
    Canon() string              // canonical source-like form
    Gen(ctx *Ctx) (any, error)  // native value (error if not generable)
    Unify(peer Val, ctx *Ctx) Val
    Dc() int                    // done-counter; DONE (-1) == fully resolved
    Nil() bool                  // true for a unification failure (bottom)
    // …plus unexported lattice-ordering methods
}
```

Concrete exported types: `TopVal`, `NilVal`, `ScalarVal`,
`ScalarKindVal`, `MapVal`, `ListVal`, `ConjunctVal`, `DisjunctVal`,
`PrefVal`, `RefVal`, `VarVal`, `FuncVal`, `PlusOpVal`.

### `Ctx` and errors

- `Ctx` carries the root, variables, and collected errors through a run;
  you normally let `Unify`/`Generate` create it.
- `AontuError{ Msg string }` implements `error` and is returned (wrapped)
  for conflicts; its message matches the TypeScript phrasing
  (e.g. `Cannot unify value: 2 with value: 1`).

### Variables in Go

`UnifyVars`/`GenerateVars` accept a `map[string]Val`. Build the values
with the exported constructors:

| Constructor | Returns |
|-------------|---------|
| `NewString(s string) Val`        | string scalar |
| `NewInteger(i int64) Val`        | integer scalar |
| `NewNumber(f float64) Val`       | number (float) scalar |
| `NewBoolean(b bool) Val`         | boolean scalar |
| `NewNull() Val`                  | null scalar |
| `NewScalarKind(k Kind) Val`      | type constraint (`KindString`, `KindNumber`, `KindInteger`, `KindBoolean`) |
| `NewMap(map[string]Val) Val`     | map (keys inserted in sorted order) |
| `NewList([]Val) Val`             | list |

```go
vars := map[string]aontu.Val{
    "port": aontu.NewInteger(8080),
    "host": aontu.NewString("localhost"),
    "obj":  aontu.NewMap(map[string]aontu.Val{"x": aontu.NewInteger(1)}),
}
out, err := aontu.New().GenerateVars(
    "server: { host: $host, port: $port }", vars)
// out == map[string]any{"server": map[string]any{"host":"localhost","port":8080}}
```

Pass `nil` vars when a model uses no `$name` variables. An undefined
`$name` is a `Cannot resolve` error.

---

## Behavioural parity

Both implementations are validated against the same
[`test/spec/*.tsv`](../test/spec/) cases and agree on: scalars and scalar
kinds, maps (nesting, merge, spreads `&:`, optional keys, `close`/`open`),
lists (incl. spreads), conjunction `&`, disjunction `|`, preference `*`,
references (`$.a.b`, `.x.a`, `.$KEY`), `$name` variables, the `+`
operator, all twelve functions, `type`/`hide` marks, and `@"…"` source
loading — plus `parse` / `unify` / `generate` and the canonical form.

The shared parser stack is identical: TypeScript uses `jsonic` +
`@jsonic/{expr,path,multisource,directive}`; Go uses the official ports
`github.com/jsonicjs/{jsonic,expr,path,multisource,directive}/go`. See
the [Explanation](explanation.md#two-implementations-one-behaviour) for
how parity is maintained, and [Test coverage](test-coverage.md) for what
each suite exercises.
