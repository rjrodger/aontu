# How-to guides

Focused recipes for specific tasks. Each assumes you already know the
basics from the [Tutorial](tutorial.md); for exhaustive rules see the
[Language reference](reference-language.md) and
[API reference](reference-api.md).

- [Run a file or start a REPL from the command line](#run-a-file-or-start-a-repl-from-the-command-line)
- [Call Aontu from TypeScript](#call-aontu-from-typescript)
- [Call Aontu from Go](#call-aontu-from-go)
- [See the canonical form instead of JSON](#see-the-canonical-form-instead-of-json)
- [Validate data against a schema](#validate-data-against-a-schema)
- [Provide defaults that callers can override](#provide-defaults-that-callers-can-override)
- [Apply one template to many keys](#apply-one-template-to-many-keys)
- [Forbid unexpected keys](#forbid-unexpected-keys)
- [Make a field optional](#make-a-field-optional)
- [Reference and reshape other parts of the document](#reference-and-reshape-other-parts-of-the-document)
- [Split a model across files](#split-a-model-across-files)
- [Inject values from the host program](#inject-values-from-the-host-program)
- [Keep schema/helper fields out of the output](#keep-schemahelper-fields-out-of-the-output)
- [Collect errors instead of throwing](#collect-errors-instead-of-throwing)
- [Read a conflict error](#read-a-conflict-error)

---

## Run a file or start a REPL from the command line

Both implementations ship an `aontu` command (full options in the
[API reference](reference-api.md#command-line-interface)).

```sh
aontu config.aontu              # evaluate a file → pretty JSON
aontu --canon config.aontu      # → canonical form instead
echo 'a:1 b:$.a' | aontu        # read source from stdin
aontu                           # no file on a terminal → REPL
```

In the REPL each line is evaluated and printed; `:canon`/`:json` switch
output mode and `:quit` (or Ctrl-D) exits:

```
$ aontu
Aontu v0.45.1 REPL — :help for commands, :quit to exit
aontu> a:*1|number
{ "a": 1 }
aontu> :quit
```

Get the command with `npm i -g aontu` (or `npx aontu`) for Node, or
`go install github.com/rjrodger/aontu/go/cmd/aontu@latest` for Go. From a
clone, use `node ts/dist/cli.js …` or `go run ./cmd/aontu …`.

## Call Aontu from TypeScript

```ts
import { Aontu } from 'aontu'

const aontu = new Aontu()

aontu.generate('a: 1 b: $.a')   // → { a: 1, b: 1 }   (plain JS value)
aontu.unify('a: *1 | number')   // → Val; .canon is '{"a":*1|number}'
aontu.parse('a: number')        // → Val AST, not yet unified
```

`generate` throws an `AontuError` on conflict or if the result is not
fully concrete. Use `unify(...).canon` when you want to *see* an
unresolved or schema-bearing result rather than a final value.

## Call Aontu from Go

```go
import aontu "github.com/rjrodger/aontu/go"

a := aontu.New()

out, err := a.Generate("a: 1 b: $.a")   // out = map[a:1 b:1], err = nil
v,   err := a.Unify("a: *1 | number")   // v.Canon() == `{"a":*1|number}`
v,   err  = a.Parse("a: number")        // AST, not yet unified
```

`Generate`/`Unify` return an `error` instead of throwing; check it.

## See the canonical form instead of JSON

The **canonical form** (`canon`) is reparseable source text that shows
constraints, defaults, and disjunctions that `generate` would either
resolve away or reject. Use it to debug what a model *means*.

```ts
aontu.unify('a: *1 | number').canon   // '{"a":*1|number}'
aontu.unify('a: 1 a: number').canon   // '{"a":1}'
aontu.unify('a: number a: string').canon // '{"a":number&"string"}'? -> conflict shows as nil
```

```go
a.Unify("a: *1 | number")   // .Canon() == `{"a":*1|number}`
```

`generate` on `a: *1 | number` returns `{a:1}`; `canon` keeps the whole
default/disjunction so you can see the shape.

## Validate data against a schema

Write the schema as types, then unify the data on top. A fit narrows to
the data; a misfit errors.

```aontu
# schema
user: { id: integer, name: string, admin: boolean }
# data
user: { id: 7, name: ada, admin: true }
```

→ `{ "user": { "id": 7, "name": "ada", "admin": true } }`

Supplying `id: "seven"` instead fails with
`Cannot unify value: "seven" with value: integer`. To reject *extra*
fields too, wrap the schema in [`close`](#forbid-unexpected-keys).

## Provide defaults that callers can override

Mark the default with `*` inside a disjunction with its type:

```aontu
timeout: *30 | integer      # 30 unless overridden
retries: *3  | integer
```

A later `timeout: 60` (or a merge from another file) overrides it;
absent any override, the `*` branch is chosen. A lone `*5` (no `|`) is
just a default `5`.

## Apply one template to many keys

Use a `&:` spread entry. It is unified into every other key of the map:

```aontu
endpoints: {
  &: { method: *GET | string, auth: *true | boolean }
  list:   {}
  create: { method: POST }
}
```

→

```json
{ "endpoints": {
  "list":   { "method": "GET",  "auth": true },
  "create": { "method": "POST", "auth": true }
} }
```

The same works in lists: `[&:{x:1}, {y:1}, {y:2}]` →
`[{y:1,x:1},{y:2,x:1}]`. A top-level `&:{...}` applies to every key of the
root map.

## Forbid unexpected keys

Maps are open by default. Seal one with `close`:

```aontu
config: close({ host: string, port: integer })
config: { host: h, port: 1, debug: true }
```

→ fails: the extra `debug` key is rejected with a `closed` error. Use
`open(x)` to lift a `close` again (e.g. `open(close({x:1})) & {y:2}`
succeeds).

## Make a field optional

Suffix the key with `?`. An optional field that never receives a concrete
value is **dropped** from the output instead of erroring:

```aontu
record: { id: integer, note?: string }
record: { id: 1 }
```

→ `{ "record": { "id": 1 } }`  (no `note`)

Supplying `note: hi` keeps it. Optional defaults still apply if given
(`z: *3` survives even when untouched).

## Reference and reshape other parts of the document

```aontu
base:  { region: us-east, tier: free }
prod:  $.base & { tier: paid }      # copy base, override tier
```

→ `{ "base": {…}, "prod": { "region": "us-east", "tier": "paid" } }`

- `$.a.b` — absolute path from the root.
- `.a.b` — relative to the current object.
- `.$KEY` — the key the current value is stored under.
- `copy($.x)` — a deep copy with type/hide marks cleared.
- `move($.x)` — like a reference but drops unresolved optional keys.

## Split a model across files

Load another source file with `@"path"`. The loaded value unifies in
place, so a base file and an override file merge naturally:

```aontu
car: @"./car.aon"               # { color: silver, doors: 4 }
car: { doors: number, wheels: 4 }
```

→ `{ "car": { "color": "silver", "doors": 4, "wheels": 4 } }`

Paths resolve via memory, file, then package resolvers (see the
[API reference](reference-api.md#options)). In Node you can supply a
virtual filesystem through options for tests.

## Inject values from the host program

`$name` (no dot) is a variable supplied by the calling program, not the
document. This is how you parameterise a model from code.

TypeScript — set them on a context:

```ts
import { Aontu } from 'aontu'
import { IntegerVal } from 'aontu/dist/val/IntegerVal'

const aontu = new Aontu()
const ctx = aontu.ctx()
ctx.vars.port = new IntegerVal({ peg: 8080 })

aontu.generate('server: { port: $port }', undefined, ctx) // { server: { port: 8080 } }
```

Go — build a `map[string]Val` with the exported constructors
(`NewInteger`, `NewString`, `NewNumber`, `NewBoolean`, `NewNull`,
`NewScalarKind`, `NewMap`, `NewList`):

```go
vars := map[string]aontu.Val{"port": aontu.NewInteger(8080)}
out, err := aontu.New().GenerateVars("server: { port: $port }", vars)
// out == map[string]any{"server": map[string]any{"port": 8080}}
```

An undefined `$name` is a `Cannot resolve` error.

## Keep schema/helper fields out of the output

Values marked with `type(...)` or `hide(...)` are treated as
schema/metadata and are **omitted when generating an enclosing map**,
while still participating in unification:

```aontu
_schema: type({ id: integer })   # constrains, but not emitted
id:      1
```

`hide(x)` is the same idea for values you want to compute with but not
emit. `copy(...)` clears these marks, so `copy($._schema)` would produce
an emittable value again.

## Collect errors instead of throwing

By default `generate` throws/returns on the first surfaced error. To
gather them instead, pass `collect: true` (TypeScript) and read the
result's `err` array:

```ts
const aontu = new Aontu()
const res = aontu.unify('a: 1 a: 2', { collect: true })
res.err            // array of NilVal errors, instead of a throw
```

This is useful for editors/linters that want every problem at once.

## Read a conflict error

Conflict messages name both operands, later-in-source first:

```
Cannot unify value: 2 with value: 1
```

means two facts reached the same path — `1` (earlier) and `2` (later) —
and they cannot both hold. For references, an unresolved path reads
`Cannot resolve value: $.nope`. Nested conflicts report the leaf values
that clashed, e.g. `a:b:1` vs `a:b:2` → `Cannot unify value: 2 with
value: 1`.
