# Language reference

Complete, exhaustive description of the Aontu language: lexical
structure, every value form and operator, evaluation order, the
canonical form, and generation rules. Behaviour stated here is verified
by the shared [`test/spec/*.tsv`](../test/spec/) suite and holds in both
the TypeScript and Go implementations unless a difference is called out.

For the public programming interface see the
[API reference](reference-api.md). For the reasoning behind the model see
the [Explanation](explanation.md).

## Contents

- [Lexical structure](#lexical-structure)
- [The value lattice](#the-value-lattice)
- [Scalars](#scalars)
- [Scalar kinds (types)](#scalar-kinds-types)
- [Maps](#maps)
- [Lists](#lists)
- [Conjunction `&`](#conjunction-)
- [Disjunction `|`](#disjunction-)
- [Preference / default `*`](#preference--default-)
- [Optional keys `?`](#optional-keys-)
- [Spreads `&:`](#spreads-)
- [References and paths](#references-and-paths)
- [Variables `$name`](#variables-name)
- [The `+` operator and grouping](#the--operator-and-grouping)
- [Functions](#functions)
- [Marks: `type` and `hide`](#marks-type-and-hide)
- [Closed values: `close` / `open`](#closed-values-close--open)
- [Source loading `@"…"`](#source-loading-)
- [Operator precedence](#operator-precedence)
- [Canonical form](#canonical-form)
- [Generation](#generation)
- [Errors](#errors)

---

## Lexical structure

Aontu source is parsed by [jsonic](https://github.com/rjrodger/jsonic)
with Aontu-specific plugins, so the surface syntax is "relaxed JSON".

- **Whitespace** separates tokens; newlines and commas are
  interchangeable separators. `a:1 b:2`, `a:1, b:2`, and `a:1\nb:2` are
  equivalent.
- **Comments** begin with `#` and run to end of line. A file of only
  comments unifies to `{}`.
- **Keys** may be bare (`host`), and need quoting only if they contain
  separators or operator characters.
- **Bare strings** need no quotes (`name: Mercury`). Quote with `"…"` or
  `'…'` to include spaces or special characters (`name: "hi there"`).
- **Numbers** are JSON numbers. A literal containing `.` is a `number`
  (float); an integral literal with no `.` is an `integer` (so `1` is an
  integer but `1.0` is a number).
- **Booleans** are `true` / `false`; **null** is `null`.

## The value lattice

Every Aontu value is a point in a lattice ordered from most general to
most specific:

```
                top            (fits anything)
        ┌────────┼─────────┐
     string   number    boolean …      (kinds / types)
        │     ┌──┴──┐
     "ada"  integer 1.5                 (concrete scalars)
        │      │
        └──────┴── …  concrete values
                ⊥  nil / bottom         (no value — a conflict)
```

- **`top`** is the unit: unifying anything with `top` yields the other
  value. It is what an unconstrained field is.
- **`nil`** (bottom) is the result of a failed unification. It carries an
  error message and cannot be generated.
- **Unification** of two values is their *greatest lower bound* — the
  most general value at least as specific as both. If none exists, the
  result is `nil`.

This ordering is why unification is order-independent and idempotent:
`a & b` equals `b & a`, and `a & a` equals `a`.

## Scalars

| Form        | Example source | Generates |
|-------------|----------------|-----------|
| integer     | `a:1`          | `1`       |
| negative    | `a:-5`         | `-5`      |
| float       | `a:1.5`        | `1.5`     |
| bare string | `a:hello`      | `"hello"` |
| quoted str  | `a:"hi there"` | `"hi there"` |
| boolean     | `a:true`       | `true`    |
| null        | `a:null`       | `null`    |

Two scalars unify only if equal (`1 & 1` → `1`, `foo & foo` → `"foo"`);
otherwise the result is a conflict (`1 & 2` → error).

## Scalar kinds (types)

A bare kind name is a *type*: the set of all scalars of that kind.

| Kind      | Matches                              |
|-----------|--------------------------------------|
| `string`  | any string                           |
| `number`  | any number (including integers)      |
| `integer` | any number with no fractional part   |
| `boolean` | `true` or `false`                    |
| `top`     | any value at all                     |

Unification rules:

- **kind & matching scalar → the scalar.** `number & 2` → `2`;
  `string & hello` → `"hello"`; `1 & integer` → `1`.
- **kind & non-matching scalar → conflict.** `1 & string` → error.
- **kind & kind:** equal kinds unify to themselves; `number & integer` →
  `integer` (integer is the more specific); unrelated kinds conflict.

## Maps

A map is an unordered set of key/value pairs. Braces are optional at the
top level.

- **Literal:** `a:{b:1,c:2}` → `{"a":{"b":1,"c":2}}`.
- **Implicit nesting:** a chain of colons builds nested maps —
  `a:b:c:1` → `{"a":{"b":{"c":1}}}`.
- **Duplicate-key merge:** stating a key twice unifies the two values.
  `a:{b:1}, a:{c:2}` → `{"a":{"b":1,"c":2}}`; this recurses, so
  `a:b:c:1 a:b:d:2 a:e:3` → `{"a":{"b":{"c":1,"d":2},"e":3}}`.

Maps are **open** by default (extra keys may be unified in) until sealed
with [`close`](#closed-values-close--open).

## Lists

A list is an ordered sequence.

- **Literal:** `a:[1,2,3]` → `{"a":[1,2,3]}`. Elements may be
  whitespace-separated: `[1 2 3]`.
- **Mixed / nested / of maps:** `[1,two,true]`, `[[1,2],[3,4]]`,
  `[{x:1},{y:2}]` all work.
- Lists unify element-by-element by position (and support `&:` spreads,
  below).

## Conjunction `&`

`a & b` is the explicit unification of `a` and `b` — the same operation
that merges duplicate map keys.

```
a:1 & integer        → {"a":1}
a:number & integer   → {"a":integer}
a:{x:1} & {y:2}      → {"a":{"x":1,"y":2}}
a:{x:{p:1}} & {x:{q:2}} → {"a":{"x":{"p":1,"q":2}}}
```

Conjunction is commutative, associative, and idempotent. It **distributes
over disjunction**: `x & (a|b)` tries `x` against each alternative.

## Disjunction `|`

`a | b` is a choice of alternatives. It is kept open until something
selects a branch.

```
a:1|2                → canon {"a":1|2}
a:string|number      → canon {"a":string|number}
a:1|2|3              → canon {"a":1|2|3}
```

Unifying a concrete value selects the matching branch (others become nil
and drop out):

```
a:2  a:1|2           → {"a":2}
a:2  a:string|number → {"a":2}
```

`&` binds tighter than `|`, so `c & b | a` parses as `(c & b) | a`.

## Preference / default `*`

`*x` marks `x` as **preferred** (a default). In a disjunction the
preferred branch is chosen unless unification forces another.

```
a:*1|number          → generates {"a":1};  canon {"a":*1|number}
a:*5                 → {"a":5}              (default with no alternatives)
a:*green|string      → {"a":"green"}
a:*1|number  a:2     → {"a":2}              (override beats default)
```

Defaults propagate through nesting and spreads. `pref(x)` is the
function form of `*x` (canon `*x`). Preferences can be ranked (a `*` of a
`*` outranks a single `*`); the lowest rank wins when two preferred
values meet.

## Optional keys `?`

A key suffixed with `?` is optional. If it never receives a concrete
value, it is **dropped from the generated output** instead of erroring.

```
{x?:number, y:Y}     → {"y":"Y"}            (x unresolved → dropped)
{x?:top, y:Y}        → {"y":"Y"}
a:{y?:number,z:2} a:{}      → {"a":{"z":2}}
a:{y?:number,z:2} a:{y:11}  → {"a":{"y":11,"z":2}}   (filled → kept)
a:{y?:number,z:*3} a:{y:11} → {"a":{"y":11,"z":3}}   (default still applies)
```

Optionality survives references: a referenced map drops its unresolved
optional keys too.

## Spreads `&:`

A `&:` entry is a **template** unified into every other entry of its map
or list. The template itself is not emitted.

```
c:{&:{x:2}, y:{k:3}, z:{k:4}}
  → {"c":{"y":{"k":3,"x":2}, "z":{"k":4,"x":2}}}

a:b:{&:string, c:C, d:D}        → applies a type to every value
a:b:{&:{x:number}, c:{x:1}, d:{x:2}}   → constrains every child
a:b:{&:{name:.$KEY}, c:{}, d:{}}       → {"c":{"name":"c"},"d":{"name":"d"}}
a:b:{&:$.tmpl, …}                      → spread a referenced template
a:b:{&:x:*1|number, c:{x:2}, d:{}}     → defaults per child, overridable
```

Other forms:

- **Implicit / cross-statement:** `a:b:{} a:&:{x:1}` →
  `{"a":{"b":{"x":1}}}`.
- **Top-level:** `a:{} &:{x:1}` → `{"a":{"x":1}}` (applied to every root
  key).
- **Lists:** `[&:{x:1}, {y:1}, {y:2}]` → `[{y:1,x:1},{y:2,x:1}]`;
  canon keeps the spread: `[&:{"x":1},{"y":1,"x":1},…]`.

## References and paths

A reference resolves to the value at another location, then unifies in
place.

| Syntax    | Meaning                                              | Example |
|-----------|------------------------------------------------------|---------|
| `$.a.b`   | absolute path from the document root                 | `a:1 b:$.a` → `b:1` |
| `.a.b`    | path relative to the current map                     | `z:x:{a:62} z:y:.x.a` → `y:62` |
| `$.a.1`   | list index                                           | `a:[10,20,30] b:$.a.1` → `b:20` |
| `.$KEY`   | the key under which the current value is stored      | `a:{k:.$KEY}` → `{"a":{"k":"a"}}` |

References compose with unification and each other:

```
cross:  a:{x:1,y:$.b.x} b:{x:2,y:$.a.x}  → a.y=2, b.y=1
chain:  a:{v:$.b.v} b:{v:$.c.v} c:{v:99} → all v = 99
merge:  w:b:$.q.a & {y:2,z:3}            → referenced map unified with extra keys
```

An unresolvable path is an error: `a:$.nope` →
`Cannot resolve value: $.nope`.

## Variables `$name`

`$name` (a bare name with no leading dot) is **not** resolved from the
document — it is supplied by the calling program (see
[API reference](reference-api.md#variables)). The shared test set binds
`foo=11`, `bar="hello"`, `flag=true`, `obj={x:1}`:

```
a:$foo               → {"a":11}
a:$bar               → {"a":"hello"}
a:$obj               → {"a":{"x":1}}
a:$foo & number      → {"a":11}            (variables unify like values)
```

An unknown variable is a `Cannot resolve` error.

## The `+` operator and grouping

`+` adds numbers and concatenates strings; it chains left-to-right.
Parentheses group sub-expressions and a leading unary `+` is allowed.

```
x:1+2        → {"x":3}
x:1+2+3      → {"x":6}
x:1.5+2      → {"x":3.5}
x:a+b        → {"x":"ab"}
x:a+b+c      → {"x":"abc"}
x:(1+2)      → {"x":3}
x:(+3+4)     → {"x":7}
a:b:c:10+5   → {"a":{"b":{"c":15}}}
```

## Functions

Aontu provides a fixed set of twelve built-in functions. There are no
user-defined functions.

| Function    | Effect | Example |
|-------------|--------|---------|
| `upper(x)`  | uppercase a string; **ceiling** of a number | `upper(abc)`→`"ABC"`, `upper(1.1)`→`2`, `upper(-1.9)`→`-1` |
| `lower(x)`  | lowercase a string; **floor** of a number   | `lower(ABC)`→`"abc"`, `lower(1.9)`→`1`, `lower(-1.1)`→`-2` |
| `copy(x)`   | deep copy of a value or referenced node; clears `type`/`hide` marks | `copy({a:1,b:2})`→`{a:1,b:2}`; `copy($.x)` |
| `key(n)`    | the ancestor key `n` levels up (`0` = own key, default `1` = parent) | at `a:b:c`: `key()`→`"b"`, `key(0)`→`"c"`, `key(2)`→`"a"` |
| `pref(x)`   | mark `x` as preferred (same as `*x`)          | `pref(1)` canon `*1`; `pref(2),x:3`→`3` |
| `super(x)`  | the lattice-superior (generalisation/type) of `x` | `super(1)` → `number` |
| `type(x)`   | mark `x` as a type/schema value               | `type(1) & number`→`1` |
| `hide(x)`   | mark `x` as hidden                            | `hide(world) & string`→`"world"` |
| `close(x)`  | seal a map/list against extra keys            | see [closed values](#closed-values-close--open) |
| `open(x)`   | reverse a `close`                             | `open(close({x:1})) & {y:2}`→`{x:1,y:2}` |
| `move(p)`   | resolve reference `p`, dropping unresolved optional keys | `m:{x?:number,y:Y} n:move($.m)`→`n:{y:"Y"}` |
| `path(p)`   | resolve a path expression (function form of a reference) | `path(x.a)` (relative), `path($.z.x.a)` (absolute) |

Functions compose with operators and references:
`upper(a)+b`→`"Ab"`, `lower(1.1)+2`→`3`, `x:foo y:upper($.x)`→`y:"FOO"`,
`[lower(A),lower(B)]`→`["a","b"]`, and a function may be a preferred
default: `*upper(foo)`→`"FOO"`.

## Marks: `type` and `hide`

Marks are boolean flags carried on a value (set by `type()` / `hide()`,
or propagated by conjunction):

- A **type**-marked value is schema/metadata.
- A **hide**-marked value is intentionally excluded from output.

In both cases, **a map field whose value is type- or hide-marked is
omitted when the enclosing map is generated**, while still participating
in unification. A bare marked value at the top level still generates
(`type(1) & number`→`1`). `copy()` clears both marks, making the result
emittable again (`x:type({}) x:y:1 a:copy($.x)`→`{"a":{"y":1}}`).

## Closed values: `close` / `open`

A **closed** map or list rejects any key/element not already present.

```
close({x:1})              → {"x":1}
close({x:1}) & {x:1}      → {"x":1}
close({x:1}) & {x:number} → {"x":1}        (narrowing existing keys is fine)
close({x:1}) & {y:2}      → error: closed   (adding a key is not)
close([1,2]) & [3,4,5]    → error: closed   (extending a list is not)
close(42)                 → 42              (scalars: close is a no-op)
close($.x)                → closes a referenced node
open(close({x:1})) & {y:2} → {"x":1,"y":2}  (open lifts the seal)
```

## Source loading `@"…"`

`@"path"` loads and parses another source file, then unifies the result
in place — so external files merge like any other value.

```
@"foo.jsonic"                       → {"f":11}            (top level)
a:@"foo.jsonic"                     → {"a":{"f":11}}      (nested)
car:@"car.jsonic" car:{wheels:4}    → merges loaded + local
```

A **relative** path resolves against a configurable base directory: the
`aontu` CLI sets it to the entry file's directory, and the Go API exposes
it via `NewWithBase` (the TypeScript API via the `path` option). Absolute
paths ignore the base. Resolution tries, in order, an in-memory resolver,
the filesystem, then package resolution (see
[API reference](reference-api.md#options)). A conflict between a loaded
value and a local one is a normal unification
error.

## Operator precedence

From tightest to loosest binding (higher binding power binds first):

| Operator            | Form        | Notes |
|---------------------|-------------|-------|
| `$` (variable/abs)  | prefix      | tightest |
| `.` (path)          | prefix/infix |       |
| `*` (preference)    | prefix      |       |
| `+` (add/concat)    | infix       |       |
| `&` (conjunction)   | infix       | binds tighter than `\|` |
| `\|` (disjunction)  | infix       | loosest |

So `c & b | a` ≡ `(c & b) | a`, and `*1 | number` ≡ `(*1) | number`.
Parentheses override precedence and also serve as function-call syntax.

## Canonical form

`unify(src).canon` (TS) / `Unify(src).Canon()` (Go) renders a unified
value as **reparseable source text**. Unlike generation it preserves
constraints, defaults, and open disjunctions. Rules:

- Maps render as `{"k":v,…}` with **quoted keys**, no spaces:
  `{"a":{"b":1,"c":2}}`. Lists as `[v,…]`.
- Strings are quoted (`"hello"`); numbers, booleans and `null` render
  literally; `top` renders as `top`.
- Kinds render lowercase: `number`, `string`, `integer`, `boolean`.
- Conjunction: `a&b` (e.g. `number&"A"`). Disjunction: `a|b`
  (e.g. `1|2`, `string|number`). Preference: `*x` (e.g. `*1|number`).
- Spreads keep the `&:` entry: `{&:{"x":2},"y":{…}}`.

## Generation

`generate` / `Generate` produces a native value (JSON-compatible) and
requires the model to be **fully concrete**:

- Disjunctions must be resolved to a single branch; a `*`-preferred
  branch is generated as that value.
- Unresolved **optional** keys are dropped.
- **type/hide**-marked map fields are omitted.
- An unresolved **type**, an unresolved **conjunction**, a **nil**, or
  `top` cannot be generated and raises an error.

Numeric type and object key order are not significant in generated
output (the shared suite compares structurally).

## Errors

Failures surface as messages (thrown as `AontuError` in TS, returned as
`error` in Go):

| Situation              | Message (contains) |
|------------------------|--------------------|
| scalar conflict        | `Cannot unify value: 2 with value: 1` |
| kind conflict          | `Cannot unify value: string with value: 1` |
| nested conflict        | reports the clashing leaf values |
| unresolved reference   | `Cannot resolve value: $.nope` |
| unknown variable       | `Cannot resolve …` |
| extra key on closed    | `closed` |

In conflict messages the operand later in the source is named first
("…value: `<later>` with value: `<earlier>`") so the two sites are
distinguishable.
