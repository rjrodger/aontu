# API reference

The programming interfaces of both implementations, plus the
command-line tool. For the language itself see the
[Language reference](reference-language.md).

## Contents

- [Command-line interface](#command-line-interface)
- [Evaluation consumes the tree](#evaluation-consumes-the-tree)
- [TypeScript API](#typescript-api)
  - [`Aontu`](#class-aontu)
  - [`AontuOptions`](#aontuoptions)
  - [`AontuContext`](#aontucontext)
  - [`Val`](#val-typescript)
  - [Exact numbers and `exactJSON`](#exact-numbers-and-exactjson)
  - [Variables](#variables)
  - [Exports](#exports)
- [Go API](#go-api)
  - [`Aontu`](#type-aontu)
  - [`Val`](#val-go)
  - [Exact numbers in Go](#exact-numbers-in-go)
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
       aontu vet [options] <schema> <data> [more-data...]

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
  Relative `@"file"` loads inside it resolve against the file's own
  directory, so it works from any working directory.
- **Stdin:** `echo 'a:1 b:$.a' | aontu` reads source from the pipe.
- **REPL:** `aontu` with no file on a terminal starts an interactive
  loop; each line is evaluated and printed.
- Output is pretty-printed JSON by default, or canonical form with
  `--canon`.
- **Exact numbers keep their digits.** A document using the `0d` exact
  literals prints them in full, at any magnitude: `x:0d9007199254740993`
  prints `9007199254740993`, not a rounded `…992`. The TypeScript CLI
  gets this from the library's [`exactJSON`](#exact-numbers-and-exactjson)
  export, the Go CLI from a `json.Encoder` over the
  [marshalling types](#exact-numbers-in-go) — with HTML escaping **off**
  in both, so `<`, `>` and `&` stay literal and the two CLIs print the
  same bytes.
- Results go to **stdout**; errors go to **stderr** with a non-zero exit
  status (`1` for an evaluation error, `2` for a bad option).

### `aontu vet`

Validate data documents against a schema document. This is the
emit → validate → repair loop's entry point: an agent writes a
document, `vet` says what does not hold and where, and the exit code
says which kind of "no" it was.

```
aontu vet [options] <schema> <data> [more-data...]

  --at <path>       Validate against this path of the schema ($.a.b)
  --closed          Refuse keys the anchor does not declare
  --partial         Residue is reported but does not fail the run
  --max-errors <n>  Cap the finding list (default 20)
  --format <f>      text (default) or json
```

**Exit codes are verdict classes**, not a pass/fail bit, because the
three ways to fail call for three different responses:

| Exit | Verdict | Meaning |
|------|---------|---------|
| 0 | `valid` | the data unifies and is concrete (or `--partial`) |
| 1 | `invalid` | the data does not hold: a contradiction it can never satisfy, or a document that would not parse |
| 2 | — | usage: a bad option, or a file that cannot be read |
| 3 | `incomplete` | no contradiction, but the truth is not yet satisfied |
| 4 | `error` | the run could not be set up from the schema side: an unusable schema, or an `--at` that names nothing — never the data's fault |

Each data file is vetted separately, and the worst verdict wins: two
data files are two candidates for the same truth, not one merged
candidate. `--max-errors` caps the whole report, not each file, and
says so with `truncated`.

**A data file that will not parse is the data's fault**, and is
reported as one `parse`-class finding with a site in that file — not as
a broken schema. The distinction matters to the loop the verb exists
for: exit 1 says "repair what you emitted", exit 4 says "the truth you
were given is unusable, stop".

**`--at` takes a structural path** — map keys and list indices, the
same thing a reference means by `$.a.b`, with an index spelled as a
plain decimal integer. A path that names nothing is verdict `error`.

**Relative `@"file"` loads inside either document** resolve from that
document's own directory, exactly as they do for `aontu <file>`.

**A finding names both sides.** Sites are labelled by provenance —
`data` first, because that is the one to edit — rather than by the
source-order heuristic a single-document error uses:

```
$ aontu vet service.aon deploy.json
verdict: invalid

$.service.prot: closed [conflict]
  [aontu/closed]: Cannot resolve value at path $.service.prot
  data: deploy.json:1:40 (8080)
$.service.replicas: no_scalar_unify [conflict]
  [aontu/no_scalar_unify]: Cannot unify values at path $.service.replicas
  data: deploy.json:2:28 ("3")
  schema: service.aon:4:13 (integer)
```

`--format json` emits the same report as an object, with an `aontu`
stanza naming the producer, so a report read from a pipe says which
version and verb made it. Where the constraint algebra knows what would
have unified, the finding carries it as `expected`/`actual`, and a
`must()` check's author message rides along as `note`.

**REPL commands**

| Command | Effect |
|---------|--------|
| `:help` | show help |
| `:canon` | switch to canonical-form output |
| `:json` | switch to JSON output |
| `:quit`, `:exit` | leave (or press Ctrl-D) |

```
$ aontu
Aontu v0.50.1 REPL — :help for commands, :quit to exit
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

## Evaluation consumes the tree

A parsed `Val` tree is **single-use**, in both implementations.
`unify`/`generate` refine the tree in place (children are written
back, junction and reference nodes advance their own state), which is
safe only because a tree is unified once and never shared. Do not
cache, reuse, or unify the same parsed `Val` — or any node reachable
from it — in two different evaluations: the second run starts from
mutated state and the result is nondeterministic. Parse again (or
clone first) for every independent evaluation. The string entry points
(`generate(src)`, `unify(src)`) parse per call and are always safe.

This is a named rule of the [trust contract](trust.md)'s determinism
clause, not a performance note: violating it produces wrong answers,
not slow ones.

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
| `generate` | `generate(src: string, opts?, ctx?)` | `any` | Parse → unify → emit a native JS value. **Throws `AontuError`** on conflict or an unresolved result. Serialise the result with [`exactJSON`](#exact-numbers-and-exactjson), not `JSON.stringify`. |
| `ctx`      | `ctx(cfg?: AontuContextConfig)` | `AontuContext` | Creates a context (for variables, error collection, a custom `fs`, etc.). |

```ts
const aontu = new Aontu()
aontu.parse('a:number')                  // Val (AST)
aontu.unify('a:1 a:number').canon        // '{"a":1}'
aontu.generate('a:1 b:$.a')              // { a: 1, b: 1 }
aontu.generate('a:1 a:2')                // throws AontuError: Cannot unify value: 2 with value: 1
```

`unify` accepts a previously parsed `Val`, so a caller that wants the
AST first need not re-parse: `const p = aontu.parse(src);
aontu.unify(p)`. But note that the parsed tree is **single-use** — see
[Evaluation consumes the tree](#evaluation-consumes-the-tree) —
so each parse feeds at most one unify/generate.

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
| `debug` / `trace` | `boolean` | Enable parser debug / parse tracing. |
| `deps`     | `object`    | Dependency record populated by `@"…"` loads. |
| `log`      | `number`    | Parser log verbosity. |

`@"…"` resolution tries an **in-memory** resolver, then the
**filesystem**, then **package** resolution, in that order. The chain
is unconfined by default — a relative include follows any path the
process can read — so **treat opening an untrusted source as running
it**. Confinement today means **replacing `resolver` outright** (a
supplied resolver substitutes for the whole chain; the in-memory
resolver is such a replacement): `fs` is *not* a sandbox — it supplies
source text for parsing and error context, and the file and package
legs read through their own channels — and the **Go API has no
confinement hook at all** (`NewWithBase` only rebases relative
paths). The [trust contract](trust.md) states the guarantees and
their conditions; a first-class `trust` option (include capability
`'none' | {mem} | {root} | 'system'` plus deterministic budgets) is
the registered design for making confinement a per-surface default,
and is not implemented yet — this stub reserves the name.

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
`IntegerVal`, `NumberVal`, `BigIntegerVal`, `BigDecimalVal`,
`StringVal`, `BooleanVal`, `NullVal`, `ScalarKindVal`, `ConjunctVal`,
`DisjunctVal`, `PrefVal`, `RefVal`, `VarVal`, the `*FuncVal`s, …) are
exported from their modules under `dist/val/`.

The four numeric subclasses are the four numeric leaves:
`IntegerVal` is `integer`, `NumberVal` is `float` (the class name is
historical — `number` used to name that leaf and is now the pure
supertype), and `BigIntegerVal` / `BigDecimalVal` are the exact leaves
`biginteger` / `bigdecimal`.

### Exact numbers and `exactJSON`

`generate()` returns **native** values, and a document that opts into
the `0d` exact literals returns two of them that `JSON.stringify` cannot
write:

| Aontu kind   | Source     | `generate()` returns |
|--------------|------------|----------------------|
| `integer`    | `x:5`      | `number`, or `bigint` past `Number.MAX_SAFE_INTEGER` (see below) |
| `float`      | `x:1.5`    | `number`             |
| `biginteger` | `x:0d5`    | `bigint`             |
| `bigdecimal` | `x:0d0.1`  | `Decimal`            |

**Why an `integer` can be a `bigint`.** The `integer` leaf is an int64
window, and JavaScript stores it in a double. Below
`Number.MAX_SAFE_INTEGER` that is faithful: the integers are contiguous
there, so the `number` renders its own exact digits. Above it they are
not — `JSON.stringify(2**60)` is `1152921504606847000`, a *different*
integer that merely rounds to the same double — so `generate()` returns
a `bigint`, which `exactJSON` writes exactly. A `float` stays a `number`
at any magnitude, because there its shortest form *is* the right answer
(`1e21` serialises as `1e+21`, in this port and in Go).

```ts
typeof gen('x:9007199254740991').x     // 'number'  (2^53-1)
typeof gen('x:9007199254740992').x     // 'bigint'  (2^53)
typeof gen('x:1e21').x                 // 'number'  (float kind)
exactJSON(gen('x:1152921504606846976'))  // '{"x":1152921504606846976}'
```

An integer-kind `bigint` is still not a `biginteger`: the leaves stay
disjoint and only canon tells them apart (`1152921504606846976` versus
`0d1152921504606846976`). Go needs none of this — its `integer` leaf is
an `int64`, exact across the whole window, so `Generate` returns an
`int64` at every magnitude. The serialised JSON is identical in both
ports.

A `0d`-free document generates exactly what it always did — the exact
leaves are reached only by writing `0d` (see the
[language reference](reference-language.md#the-four-numeric-leaves)).
Both leaves survive nesting: `generate('x:{y:0d7} z:[0d1,0d0.5]')` puts
a `bigint` at `x.y` and a `Decimal` at `z[1]`. Note that an *integral*
bigdecimal is still a `Decimal` and never a `bigint`: `0d1e3` is a
bigdecimal by source form, and the leaves are disjoint.

`JSON.stringify` **throws** on a `bigint` (`TypeError: Do not know how
to serialize a BigInt`), and a `replacer` cannot rescue it — a replacer
may only return another *value*, and anything it returns that is not
already a JSON primitive gets quoted, so the exact digits could come
back only as a JSON *string*, which is a different document. JSON itself
was never the obstacle: a JSON number is arbitrary-precision decimal
text, and `{"x":9007199254740993}` is a legal document. Only
JavaScript's serialiser stands in the way, so the package ships its own.

```ts
exactJSON(value: any, indent?: number | string): string
```

Serialises a `generate()` result as JSON text, preserving exact numbers.
**Use it instead of `JSON.stringify` on generated output.**

```ts
import { Aontu, exactJSON } from 'aontu'

const out = new Aontu().generate('x:0d9007199254740993')
typeof out.x        // 'bigint'
exactJSON(out)      // '{"x":9007199254740993}'
exactJSON(out, 2)   // '{\n  "x": 9007199254740993\n}'
JSON.stringify(out) // TypeError: Do not know how to serialize a BigInt
```

- **`indent`** has `JSON.stringify`'s `space` semantics: a number of
  spaces (clamped to `0`–`10`) or a literal string (truncated to 10
  characters). Omitted or `0` gives **compact** output — no spaces, no
  newlines.
- A `bigint` writes its digits. A `Decimal` writes its plain digit form
  (`1000.0`, `0.1`, `-1.5`) — no `0d` marker, since that belongs to
  canon and is not JSON, but an integral bigdecimal keeps its `.0` so
  the JSON still shows a decimal.
- Object keys are emitted in **lexicographic order** (by UTF-16 code
  unit), matching Go's `encoding/json`, which sorts map keys. This is
  done at emit time and not by `generate()`, because a JavaScript object
  *cannot* hold the required order: ECMAScript lists canonical
  array-index keys first, ascending numerically, so an object can never
  present `"10"` before `"9"`. It applies to any object passed in, not
  only `generate()` output, since this is a general emitter — and it is
  the one place the result deliberately differs from `JSON.stringify`.
- Ordinary values are otherwise written exactly as `JSON.stringify`
  writes them: the same string escaping, `null` for `NaN` and
  `Infinity`, and `undefined`/function/symbol dropped from an object but
  written as `null` inside an array. An object with a `toJSON` method is
  asked for its replacement (`Decimal` is handled as a number before
  that check).
- U+2028 and U+2029 are escaped, which `JSON.stringify` does not do —
  that is the one place JavaScript and Go disagree by default, and
  escaping is both legal JSON and safe to embed in JavaScript source.
- It always returns a string: a top-level `undefined` becomes `null`.
- It throws `AontuError` if the value contains a reference cycle. A
  *shared* subtree — which unification produces routinely — is fine;
  only a true cycle is refused, as in `JSON.stringify`.

The output is byte-identical to the Go port's `encoding/json` with
`SetEscapeHTML(false)` for the same document; that equivalence is what
the shared suite's [`gens` mode](shared-spec.md#modes) pins. The `aontu`
CLI calls this same export with `indent` of `2`, so there is exactly one
implementation for the pretty and compact forms to stay in step with.

`Decimal` is exported from `aontu` alongside it — the type a bigdecimal
generates as. It is an immutable exact base-10 value (`unscaled: bigint`
plus `scale: number`) in normal form, so numerically equal decimals have
equal fields:

| Member | Description |
|--------|-------------|
| `new Decimal(unscaled: bigint, scale: number)` | Construct and normalise. |
| `Decimal.fromString(src: string)` | Parse `[+-]?digits[.digits][e[+-]digits]`, with or without a `0d` marker. |
| `toString(): string` | Plain digit form — what `exactJSON` writes. |
| `canon(): string` | Canonical form, with the `0d` marker. |
| `equals` / `compare` / `add` / `negate` / `ceil` / `floor` / `isZero` | Exact operations — no rounding anywhere. |

`Decimal.fromString` refuses input beyond the exactness budget (at most
4096 coefficient digits and an absolute scale of at most 4096 — see the
[language reference](reference-language.md#the-exactness-budget)), the
same refusal a literal gets.

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

**Exact-input constructors.** The two exact leaves take a `bigint`, a
`Decimal`, or the digits as **text** — never a JS `number`, which
binary64 has already rounded before this library could inspect it, so an
exact value above 2^53 could not arrive that way intact:

```ts
import { Decimal }       from 'aontu'
import { BigIntegerVal } from 'aontu/dist/val/BigIntegerVal'
import { BigDecimalVal } from 'aontu/dist/val/BigDecimalVal'

new BigIntegerVal({ peg: 5n })                     // 0d5
new BigIntegerVal({ peg: '9007199254740993' })     // 0d9007199254740993
new BigIntegerVal({ peg: 5 })                      // throws: not-biginteger

new BigDecimalVal({ peg: new Decimal(15n, 1) })    // 0d1.5
new BigDecimalVal({ peg: '0.10' })                 // 0d0.1  (normalised)
new BigDecimalVal({ peg: 1.5 })                    // throws: not-bigdecimal
```

Both reject malformed text (`'5.5'` is not a biginteger).
`BigDecimalVal` additionally refuses input over the exactness budget,
exactly as a `0d` literal does; a biginteger has no bound and is as wide
as its digits. Because the constructor picks the leaf where a literal's
source text would, `new BigDecimalVal({ peg: '5' })` is a *bigdecimal*
and canons `0d5.0`.

### Exports

From `aontu`:

```ts
Aontu          // class (also default export)
AontuOptions   // type
AontuContext   // class
AontuError     // error class (thrown by generate)
Val            // base value type
Lang           // the parser
VERSION        // the package version string
runparse, util // parsing helpers
formatExplain  // pretty-print an `explain` trace
exactJSON      // exact JSON emitter — use instead of JSON.stringify
Decimal        // the type a bigdecimal generates as
```

---

## Go API

Module `github.com/rjrodger/aontu/go`, package `aontu`.

```go
import aontu "github.com/rjrodger/aontu/go"
```

### type `Aontu`

```go
func New() *Aontu                 // relative @"file" loads resolve from the cwd
func NewWithBase(base string) *Aontu  // …resolve from base (a directory)
```

Use `NewWithBase` when a source's relative `@"file"` loads should resolve
from somewhere other than the process working directory — typically the
directory of an entry file:

```go
abs, _ := filepath.Abs(file)
a := aontu.NewWithBase(filepath.Dir(abs))
```

Absolute `@"file"` paths are unaffected by the base. (The `aontu` CLI
does exactly this for a file argument.)

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
`int64`/`float64`, `string`, `bool`, `nil`), plus `*big.Int` and
`*Decimal` for the exact leaves — see
[Exact numbers in Go](#exact-numbers-in-go).

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
`PrefVal`, `RefVal`, `VarVal`, `FuncVal`, `PlusOpVal`. Every scalar leaf
— including the two exact ones — is a `ScalarVal`; it holds its kind
internally, so from outside the package a leaf is told apart by the
concrete type `Gen` returns, or by `Canon`.

### Exact numbers in Go

`Generate` returns Go's natural types, and the two exact leaves come out
as the two types that can hold them exactly:

| Aontu kind   | Source     | `Generate` returns |
|--------------|------------|--------------------|
| `integer`    | `x:5`      | `int64`            |
| `float`      | `x:1.5`    | `float64`          |
| `biginteger` | `x:0d5`    | `*big.Int`         |
| `bigdecimal` | `x:0d0.1`  | `*Decimal`         |

A `0d`-free document generates exactly what it always did. An
*integral* bigdecimal is still a `*Decimal` and never a `*big.Int`:
`0d1e3` is a bigdecimal by source form, and the leaves are disjoint.

Both types implement `json.Marshaler` and emit **exact digits as a raw
JSON number**, so `encoding/json` needs no help:

```go
out, _ := aontu.New().Generate("a:0d9007199254740993 b:0d1e3 c:0d0.1")
b, _ := json.Marshal(out)
// {"a":9007199254740993,"b":1000.0,"c":0.1}
```

The pointer is load-bearing. A non-pointer `big.Int` inside an `any` has
no `MarshalJSON` in its method set, so `encoding/json` falls back to the
struct encoder and writes `{}` — an exact number silently replaced by an
empty object, which is the class of failure the exact leaves exist to
eliminate.

A generated `*big.Int` is a **copy**, so a caller may mutate it without
disturbing the value it came from.

`Decimal` is an exact base-10 value (coefficient plus scale), immutable
and always in normal form. Its exported surface is what a consumer of
generated output needs:

| Method | Description |
|--------|-------------|
| `String() string`             | Plain digit form (`1000.0`, `0.1`, `-1.5`). |
| `MarshalJSON() ([]byte, error)` | The same digits, as a raw JSON number. |
| `Canon() string`              | Canonical form, with the `0d` marker. |

`json.Marshal` output matches the TypeScript port's
[`exactJSON`](#exact-numbers-and-exactjson) byte for byte once HTML
escaping is off (`json.Encoder` + `SetEscapeHTML(false)`); that is the
equivalence the shared suite's [`gens` mode](shared-spec.md#modes) pins.

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
| `NewInteger(i int64) Val`        | `integer` scalar — **refuses** an `int64` binary64 cannot carry exactly (see below) |
| `NewNumber(f float64) Val`       | `float` scalar (the name is kept for API compatibility; the kind it builds is `KindFloat`) |
| `NewBigInteger(n *big.Int) Val`  | `biginteger` scalar — the exact unbounded integer leaf |
| `NewBigDecimal(s string) (Val, error)` | `bigdecimal` scalar — the exact base-10 leaf |
| `NewBoolean(b bool) Val`         | boolean scalar |
| `NewNull() Val`                  | null scalar |
| `NewScalarKind(k Kind) Val`      | type constraint (`KindString`, `KindBoolean`, `KindNull`, and the numeric lattice `KindNumber` with its leaves `KindInteger`, `KindFloat`, `KindBigInteger`, `KindBigDecimal`) |
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

**`NewInteger` obeys the same storage contract as a literal.** An
`int64` that binary64 cannot carry exactly is refused rather than
stored, exactly as the equivalent literal is refused — otherwise the API
would be a hole straight through that rule, since Go's `integer` leaf is
an `int64` and the canonical TypeScript port's is a double. The refusal
is a **nil value**, not a panic and not a second return: aontu errors
are values, so it flows through unification and surfaces at `Generate`
with the same "not exactly representable" message and the same `0d`
escape a lossy literal gets.

The rule is **exactness, not magnitude**: every power of two in the
window is fine however large, `math.MinInt64` included.

```go
aontu.NewInteger(1152921504606846976)   // 2^60 — fine
aontu.NewInteger(math.MinInt64)         // -2^63, a power of two — fine
aontu.NewInteger(9007199254740993)      // 2^53+1 — nil value
aontu.NewInteger(math.MaxInt64)         // 2^63-1, rounds up — nil value
aontu.NewBigInteger(big.NewInt(9007199254740993))  // the exact escape
```

**Exact-input constructors.** `NewBigInteger` **copies** its argument
and never mutates the copy, so a caller may keep using (and mutating)
the `*big.Int` it passed in; a `nil` argument is zero.
`NewBigDecimal` takes a **string** — an optional sign, an optional `0d`
marker, digits, an optional fraction and an optional exponent, and no
`_` separators (those are literal syntax, not part of a number's text).
A `float64` is deliberately not accepted: it has already rounded before
the library can inspect it.

```go
n, _ := new(big.Int).SetString("123456789012345678901234567890", 10)
aontu.NewBigInteger(n)          // 0d123456789012345678901234567890
aontu.NewBigDecimal("0.10")     // 0d0.1   (normalised)
aontu.NewBigDecimal("0d1e3")    // 0d1000.0
aontu.NewBigDecimal("1_000")    // error: Not an exact decimal
```

`NewBigDecimal` returns an error for malformed text and for input over
the exactness budget (at most 4096 coefficient digits and an absolute
scale of at most 4096 — see the
[language reference](reference-language.md#the-exactness-budget)), the
same refusal a literal gets. A biginteger has no bound and is as wide as
its digits. Because the constructor picks the leaf where a literal's
source text would, `NewBigDecimal("5")` is a *bigdecimal* and canons
`0d5.0`.

---

## Behavioural parity

Both implementations are validated against the same
[`test/spec/*.tsv`](../test/spec/) cases and agree on: scalars and scalar
kinds — including the numeric tower's four leaves (`integer`, `float`,
`biginteger`, `bigdecimal`) under the pure supertype `number`, their
`0d` exact literals, and exact arithmetic — maps (nesting, merge,
spreads `&:`, optional keys, `close`/`open`), lists (incl. spreads),
conjunction `&`, disjunction `|`, preference `*`, references (`$.a.b`,
`.x.a`, `.$KEY`), `$name` variables, the `+` operator, all twelve
functions, `type`/`hide` marks, and `@"…"` source loading — plus
`parse` / `unify` / `generate` and the canonical form.

Generated **bytes** are in parity too: `exactJSON` in TypeScript and
`encoding/json` in Go produce the same JSON text for the same document,
which the shared suite's byte-exact `gens` rows pin. What byte equality
cannot see — a `bigint` where a `number` was due, since both serialise
as `5` — is pinned by per-port API tests instead.

**Validation reports** are in parity as well: `aontu vet` produces the
same report from both commands, text and JSON, with the same exit code —
pinned by the shared suite's [`vet.tsv`](../test/spec/vet.tsv) rows for
everything but each finding's `message`, which is prose. Two things
still differ by construction: the `aontu.version` field, because the
npm and Go module version series are independent, and the wording of a
"cannot read <file>" failure, which is the host's.

The shared parser stack is identical: TypeScript uses `@tabnas/jsonic` +
`@tabnas/{expr,path,multisource,directive,debug}`; Go uses the ports
`github.com/tabnas/{jsonic,expr,path,multisource,directive}/go`. See
the [Explanation](explanation.md#two-implementations-one-behaviour) for
how parity is maintained, and [Test coverage](test-coverage.md) for what
each suite exercises.
