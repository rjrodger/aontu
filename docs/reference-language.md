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

Aontu source is parsed by
[`@tabnas/jsonic`](https://github.com/tabnas/jsonic) with Aontu-specific
plugins, so the surface syntax is "relaxed JSON".

- **Whitespace** separates tokens; newlines and commas are
  interchangeable separators. `a:1 b:2`, `a:1, b:2`, and `a:1\nb:2` are
  equivalent.
- **Comments** begin with `#` and run to end of line. A file of only
  comments unifies to `{}`.
- **Keys** may be bare (`host`), and need quoting only if they contain
  separators or operator characters.
- **Bare strings** need no quotes (`name: Mercury`). Quote with `"…"` or
  `'…'` to include spaces or special characters (`name: "hi there"`).
- **Numbers** are JSON numbers, stored as IEEE-754 doubles. A literal
  has `integer` kind only when its source has no `.`, its value is
  integral, *and* the value fits the int64 range; otherwise it has
  `float` kind (so `1` is an integer, `1.0` is a float, and so is
  `1e21`). The rule is stated in full under
  [Scalar kinds](#scalar-kinds-types).
- **Other numeric forms.** Hexadecimal (`0x1f`), octal (`0o17`) and
  binary (`0b1010`) literals use lower-case prefixes. `_` may separate
  digits (`1_000_000`), but only singly and only *between* digits — a
  run that breaks the rule is not a number at all, so `1__0` is the
  string `"1__0"`, not `10`.
- **Booleans** are `true` / `false`; **null** is `null`.

## The value lattice

Every Aontu value is a point in a lattice ordered from most general to
most specific:

```
                top            (fits anything)
        ┌────────┼─────────┐
     string   number    boolean …      (kinds / types)
        │    ┌───┴───┐     │
        │ integer    │     │           (integer is the more
        │    │       │     │            specific numeric kind)
      "ada"  1      1.5  true          (concrete scalars)
        └────┴───────┴─────┘
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
| `number`  | any numeric value — the supertype of every numeric leaf |
| `float`   | any value of *float kind* (below)    |
| `integer` | any value of *integer kind* (below)  |
| `boolean` | `true` or `false`                    |
| `top`     | any value at all                     |

### Integer kind and float kind

Every numeric value carries a **kind**, fixed when the value is built,
and it is the kind — not the magnitude — that decides what the value
unifies with. A numeric literal has **integer** kind if, and only if,
all three of these hold:

1. its source text contains no `.`;
2. its value is integral (no fractional part);
3. its value lies within the int64 range, that is
   `-9223372036854775808 ≤ n < 9223372036854775808`.

Anything else has **float** kind. `number` is not a leaf: it is the
supertype naming *any* numeric value, so `number` admits an integer
and a float alike, while `float` admits only the latter. The upper
bound is *exclusive*
because numeric values are IEEE-754 doubles and 2^63−1 cannot be
represented in one: it rounds up to 2^63, and so falls outside the
range.

```
1                      → integer   (no '.', integral, in range)
1e3                    → integer   (1000 — an exponent is not a '.')
9007199254740992       → integer
1.0                    → float     (rule 1: the source has a '.')
1.5                    → float     (rules 1 and 2)
1e21                   → float     (rule 3: beyond int64)
100000000000000000000  → float     (rule 3)
0x7fffffffffffffff     → float     (rule 3: rounds up to 2^63)
0xffffffffffffffff     → float     (rule 3)
```

Points worth knowing:

- The same rule applies wherever a numeric value is built — a parsed
  literal, a `$var` binding, a raw value handed to the API — so a given
  number never has two different kinds depending on where it came from.
  Where there is no source text, condition 1 is vacuous and conditions
  2 and 3 decide.
- A literal that overflows the double range entirely (`1e999`) is not a
  number at all; it is an error. One that *underflows* to exactly zero
  (`1e-400`) is integer-kind `0`.
- Aontu has no negative literals: `-` is a prefix operator applied to a
  positive literal. The int64 *minimum* therefore cannot be written as
  an integer-kind literal — `-9223372036854775808` negates the
  number-kind literal `9223372036854775808`, and stays number kind.

Unification rules:

- **kind & matching scalar → the scalar.** `number & 2` → `2`;
  `string & hello` → `"hello"`; `1 & integer` → `1`.
- **kind & non-matching scalar → conflict.** `1 & string` → error;
  `1.0 & integer` → error (`1.0` is number kind whatever its value),
  and so is `1e21 & integer`.
- **kind & kind:** equal kinds unify to themselves; `number & integer` →
  `integer` (integer is the more specific); unrelated kinds conflict.
- **scalar & scalar:** two concrete numbers are the same only when kind
  *and* value match. So `1 & 1.0` is a conflict, and `1|1.0` is a real
  two-branch disjunction — `(1|1.0) & 1.0` selects the number.

No operator or function narrows a kind: see
[`+`](#the--operator-and-grouping) and
[`upper()`/`lower()`](#functions). For the reasoning behind the model —
why the bound is int64, why canon carries a `.0`, and how the two
implementations are held in step — see the
[number model design note](design/number-model.md).

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

**Result kind.** `+` never introduces a kind narrower than its
operands. Two numerics add to an `integer` only when *both* operands
are of integer kind **and** the sum is itself of integer kind (integral
and within int64); otherwise the result is a `number`. A `*`-preferred
operand contributes its preferred value's kind.

```
x:1+2                 → integer 3    canon {"x":3}
x:1+1.0               → number 2     canon {"x":2.0}
x:1.5+1.5             → number 3     canon {"x":3.0}
x:(1+2) & integer     → {"x":3}
x:(1.5+1.5) & integer → error        (the sum is number kind)
```

String concatenation is unchanged, and a numeric operand coerces with
plain JavaScript rules: `x:a+1.0` → `"a1"`, not `"a1.0"`.

Unary `-` negates a numeric operand. It binds tighter than `+`, `&` and
`|` — `-1 & integer` is `(-1) & integer` — and, like `+`, never narrows
the kind and never yields `-0`.

## Functions

Aontu provides a fixed set of twelve built-in functions. There are no
user-defined functions.

| Function    | Effect | Example |
|-------------|--------|---------|
| `upper(x)`  | uppercase a string; **ceiling** of a number, keeping the argument's kind | `upper(abc)`→`"ABC"`, `upper(2)`→ integer `2`, `upper(1.1)`→ number `2`, `upper(-1.9)`→`-1` |
| `lower(x)`  | lowercase a string; **floor** of a number, keeping the argument's kind   | `lower(ABC)`→`"abc"`, `lower(2)`→ integer `2`, `lower(1.9)`→ number `1`, `lower(-1.1)`→`-2` |
| `copy(x)`   | deep copy of a value or referenced node; clears `type`/`hide` marks | `copy({a:1,b:2})`→`{a:1,b:2}`; `copy($.x)` |
| `key(n)`    | the ancestor key `n` levels up (`0` = own key, default `1` = parent) | at `a:b:c`: `key()`→`"b"`, `key(0)`→`"c"`, `key(2)`→`"a"` |
| `pref(x)`   | mark `x` as preferred (same as `*x`)          | `pref(1)` canon `*1`; `pref(2),x:3`→`3` |
| `super(x)`  | the lattice-superior (generalisation/type) of `x` — for a concrete scalar, its kind | `super(1)` → `integer`, `super(1.5)` → `number` |
| `type(x)`   | mark `x` as a type/schema value               | `type(1) & number`→`1` |
| `hide(x)`   | mark `x` as hidden                            | `hide(world) & string`→`"world"` |
| `close(x)`  | seal a map/list against extra keys            | see [closed values](#closed-values-close--open) |
| `open(x)`   | reverse a `close`                             | `open(close({x:1})) & {y:2}`→`{x:1,y:2}` |
| `move(p)`   | resolve reference `p`, dropping unresolved optional keys | `m:{x?:number,y:Y} n:move($.m)`→`n:{y:"Y"}` |
| `path(p)`   | resolve a path expression (function form of a reference) | `path(x.a)` (relative), `path($.z.x.a)` (absolute) |

`super(x)` lifts its **argument** one step up the lattice, so for a
concrete scalar it yields that scalar's kind:

```
x:super(1)      → integer      x:super(a)     → string
x:super(1.5)    → number       x:super(true)  → boolean
```

Being a kind, the result then constrains: `x:super(1) & 2` → `2`, while
`x:super(1) & 2.5` is a conflict. Where the argument has no meaningful
superior — a map, a list, a bare kind, `top` — the result is `top`.

`upper()` and `lower()` round a number without narrowing it: the result
carries the *argument's* kind, so `upper(2)` is an integer `2` (and
unifies with `integer`) while `upper(1.1)` is a number `2` (and does
not).

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

Source files use the `.aon` extension (preferred) or `.aontu`. When the
path has no extension, those two are tried in turn, so `@"foo"` resolves
`foo.aon` then `foo.aontu`.

```
@"foo.aon"                       → {"f":11}            (top level)
a:@"foo.aon"                     → {"a":{"f":11}}      (nested)
car:@"car.aon" car:{wheels:4}    → merges loaded + local
@"foo"                           → {"f":11}            (implicit .aon/.aontu)
```

A **relative** path resolves against a configurable base directory: the
`aontu` CLI sets it to the entry file's directory, and the Go API exposes
it via `NewWithBase` (the TypeScript API via the `path` option). A
relative load *inside* a loaded file resolves against **that file's own
directory**, so a chain of files (a → b → c) each resolves relative to
itself. Absolute paths ignore the base. Resolution tries, in order, an
in-memory resolver,
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
| `-` / `+` (unary)   | prefix      | `-1 & integer` ≡ `(-1) & integer` |
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
- **Numbers render so that canon reparses to the same kind.** An
  integer-kind value renders plainly (`1000`). A number-kind value
  always carries a fraction or an exponent, so a `.0` suffix is
  appended when the shortest rendering has neither:

  ```
  1.0    → 1.0        1e21     → 1e+21        (already exponential)
  0.0    → 0.0        0.000001 → 0.000001     (already fractional)
  1e20   → 100000000000000000000.0
  ```

  This applies to **canon only**. String concatenation is unaffected:
  `a+1.0` is still `"a1"`.
- Negative zero never appears: it normalises to `0` (integer kind) or
  `0.0` (number kind), in canon and in generated output alike.
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
