# Tutorial: your first unifications

This is a hands-on introduction. By the end you will have installed
Aontu, run it from both TypeScript and Go, and used every core feature
to build up a small service configuration that is part schema, part
default, and part data — all in one document.

You do not need to understand *why* unification works yet (that is the
[Explanation](explanation.md)); just follow along and watch what each
step produces. Every snippet here is real, tested behaviour.

## 1. Set up

### TypeScript

```sh
cd ts
npm install
npm run build      # compiles src + test into dist/ and dist-test/
```

Create a scratch file `play.js` next to `ts/`:

```js
const { Aontu } = require('aontu')   // when installed from npm
// from inside this repo, use: require('./ts/dist/aontu')

const aontu = new Aontu()
console.log(aontu.generate('hello: world'))
```

```sh
node play.js
# { hello: 'world' }
```

`generate` takes Aontu source text and returns a plain JavaScript value.

### Go

```sh
cd go
go test ./...      # confirms the toolchain works
```

A scratch `main.go`:

```go
package main

import (
	"fmt"
	aontu "github.com/rjrodger/aontu/go"
)

func main() {
	out, err := aontu.New().Generate("hello: world")
	fmt.Println(out, err)        // map[hello:world] <nil>
}
```

The two implementations accept the same source and produce the same
shape. The rest of this tutorial shows source text and the result; run
it in whichever language you prefer.

> **Tip — try snippets instantly.** Both implementations also ship an
> `aontu` command. From a clone you can pipe any example straight in:
> `echo 'a:1 b:$.a' | node ts/dist/cli.js` (or `go run ./cmd/aontu`
> inside `go/`). Running `aontu` with no file starts a REPL. See the
> [API reference](reference-api.md#command-line-interface).

## 2. Objects are just keys and values

Aontu source looks like relaxed JSON (it is parsed by
[jsonic](https://github.com/rjrodger/jsonic), so quotes, commas, and
braces are mostly optional):

```aontu
name: Mercury
order: 1
rocky: true
```

→

```json
{ "name": "Mercury", "order": 1, "rocky": true }
```

Nesting works by repeating keys with a colon — `a:b:c:1` is the same as
`a: { b: { c: 1 } }`:

```aontu
server: host: localhost
server: port: 8080
```

→

```json
{ "server": { "host": "localhost", "port": 8080 } }
```

Notice the two `server:` lines did not collide — they **merged**. That
merge is your first unification.

## 3. Unification: combining facts

Stating two things about the same place combines them. If they agree (or
one is more specific), you get the combination. The explicit operator is
`&`, but for map keys it happens automatically:

```aontu
server: { host: localhost }
server: { port: 8080 }
```

→ `{ "server": { "host": "localhost", "port": 8080 } }`

If they *disagree*, you get an error instead of a wrong answer:

```aontu
port: 8080
port: 9090
```

→ fails with:

```
Cannot unify value: 9090 with value: 8080
```

This is the whole point of Aontu: combining information can only ever
**narrow** toward a single answer or **fail loudly**. It never picks one
fact over another silently.

## 4. Types as values

A bare type name is a value too — it means "any value of this kind":

```aontu
port: integer
```

Unify a type with a concrete value and the value wins, *provided it
fits*:

```aontu
port: integer
port: 8080
```

→ `{ "port": 8080 }`

But:

```aontu
port: integer
port: "high"
```

→ `Cannot unify value: "high" with value: integer`

The built-in kinds are `string`, `number`, `integer` (a `number` with no
fractional part), `boolean`, and `top` (the catch-all that fits
anything). Now your config is starting to carry its own schema.

## 5. Defaults with `*`

Mark a value as a **default** with `*`. A default is used only if nothing
more specific is supplied:

```aontu
port: *8080 | integer
```

Read `*8080 | integer` as "an integer, defaulting to 8080". On its own:

→ `{ "port": 8080 }`

Override it by unifying a concrete value:

```aontu
port: *8080 | integer
port: 9090
```

→ `{ "port": 9090 }`

The `|` here is **disjunction** — a choice between alternatives
(`8080` *or* any `integer`). The `*` picks which branch is preferred when
the choice is otherwise unforced.

## 6. References

Pull a value from elsewhere in the document with a path. `$.` starts at
the root:

```aontu
defaults: timeout: 30
service:  timeout: $.defaults.timeout
```

→

```json
{ "defaults": { "timeout": 30 }, "service": { "timeout": 30 } }
```

A leading `.` is relative to the current object, and `.$KEY` resolves to
the key the value is stored under — handy for giving records their own
name:

```aontu
users: alice: { id: .$KEY }
users: bob:   { id: .$KEY }
```

→ `{ "users": { "alice": { "id": "alice" }, "bob": { "id": "bob" } } }`

## 7. Templates with `&:` (spread)

A `&:` entry inside a map is a **template** unified into every sibling
key. Define a shape once and apply it everywhere:

```aontu
servers: {
  &: { region: *us-east | string, active: *true | boolean }
  web: { region: eu-west }
  db:  {}
}
```

→

```json
{
  "servers": {
    "web": { "region": "eu-west", "active": true },
    "db":  { "region": "us-east", "active": true }
  }
}
```

`web` overrode the default region; `db` took both defaults. The template
itself does not appear in the output. Spreads work in lists too
(`[&:{...}, ...]`).

## 8. Functions

Aontu has a fixed set of built-in functions. A few useful ones:

```aontu
name:  upper(mercury)      # -> "MERCURY"   (ceil for numbers)
slug:  lower(Mercury)      # -> "mercury"   (floor for numbers)
label: a + b + c           # -> "abc"       (+ concatenates / adds)
copy:  copy($.servers.web) # deep copy of another node
```

The complete list — `upper`, `lower`, `copy`, `key`, `pref`, `super`,
`type`, `hide`, `close`, `open`, `move`, `path` — is in the
[language reference](reference-language.md#functions).

## 9. Sealing a shape with `close`

By default a map is **open**: unifying in extra keys is allowed.
`close()` forbids that, turning a shape into a strict schema:

```aontu
point: close({ x: number, y: number })
point: { x: 1, y: 2 }
```

→ `{ "point": { "x": 1, "y": 2 } }`, but adding `z: 3` would fail with a
`closed` error. `open()` reverses it.

## 10. Putting it together

Here is a single document that is schema, defaults, and data at once:

```aontu
# --- schema + defaults (could live in its own file) ---
service: close({
  name:    string
  host:    *localhost | string
  port:    *8080 | integer
  tags:    [string]
})

# --- environment data merged on top ---
service: {
  name: api
  port: 9090
  tags: [public, http]
}
```

→

```json
{
  "service": {
    "name": "api",
    "host": "localhost",
    "port": 9090,
    "tags": ["public", "http"]
  }
}
```

The schema constrained every field, defaults filled `host`, the data
supplied `name`/`port`/`tags`, `close` guaranteed no stray keys slipped
in, and unification combined it all into one answer — failing loudly if
anything had conflicted.

## Where to go next

- Have a concrete task? → [How-to guides](how-to.md)
- Want every rule and edge case? → [Language reference](reference-language.md)
- Calling Aontu from code? → [API reference](reference-api.md)
- Curious *how* it works? → [Explanation](explanation.md)
