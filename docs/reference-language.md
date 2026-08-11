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
- [The constraint algebra (specified)](#the-constraint-algebra-specified)

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
- **Numbers** come in two families. A plain JSON number (`1`, `1.5`,
  `1e3`) is stored as an IEEE-754 double and takes `integer` or
  `float` kind; a `0d`-prefixed literal (`0d5`, `0d0.1`) is stored
  *exactly*, with no binary rounding anywhere, and takes `biginteger`
  or `bigdecimal` kind. Which of the four a literal takes is decided
  by its source text, never by its magnitude; the rule is stated in
  full under [Scalar kinds](#scalar-kinds-types).
- **Exact literals** are written `0d` (or `0D`) followed by digits.
  Digits alone give a biginteger (`0d123`); adding a `.` or an
  exponent gives a bigdecimal (`0d0.1`, `0d1e3`). The grammar is
  `0[dD] digits [ "." digits ] [ (e|E) [+-] digits ]`. The sign goes
  *before* the prefix — `-0d5`, never `0d-5` — and a marker with no
  digit after it is not a literal at all: `0d` is the bare string
  `"0d"`, and `0d.5` reads as member access on that string.
- **Other numeric forms.** Hexadecimal (`0x1f`), octal (`0o17`) and
  binary (`0b1010`) literals use lower-case prefixes, and belong to
  the plain family, not the exact one. (Only the exact marker also
  accepts its letter in upper case: `0D12` is a literal, `0X1F` is the
  bare string `"0X1F"`.) `_` may separate digits (`1_000_000`,
  `0d1_000`), but only singly and only *between* digits — a run that
  breaks the rule is not a number at all, so `1__0` is the string
  `"1__0"`, not `10`.
- **A number that cannot be stored exactly is refused.** An integer
  literal the double format would silently round is a located error
  naming the `0d` escape, not an approximation — see
  [Exact or refused](#exact-or-refused-lossy-literals).
- **Booleans** are `true` / `false`; **null** is `null`.

## The value lattice

Every Aontu value is a point in a lattice ordered from most general to
most specific:

```
                 top                 (fits anything)
        ┌─────────┼─────────┐
     string     number   boolean …   (kinds / types)
        │    ┌────┼────┐     │       (number is a pure
        │    │    │    │     │        supertype over four
      "ada"  1   1.5 0d0.1 true       numeric leaves — see
        └────┴────┴────┴─────┘        Scalar kinds)
                 ⊥  nil / bottom     (no value — a conflict)
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
| biginteger  | `a:0d5`        | `5`       |
| bigdecimal  | `a:0d0.1`      | `0.1`     |
| bare string | `a:hello`      | `"hello"` |
| quoted str  | `a:"hi there"` | `"hi there"` |
| boolean     | `a:true`       | `true`    |
| null        | `a:null`       | `null`    |

Two scalars unify only if they are of the same kind *and* equal
(`1 & 1` → `1`, `foo & foo` → `"foo"`); otherwise the result is a
conflict (`1 & 2` → error, and so is `1 & 1.0`).

## Scalar kinds (types)

A bare kind name is a *type*: the set of all scalars of that kind.

| Kind         | Matches                                        |
|--------------|------------------------------------------------|
| `string`     | any string                                     |
| `number`     | any numeric value — the supertype over the four leaves below |
| `integer`    | any value of *integer kind* (below)            |
| `float`      | any value of *float kind* (below)              |
| `biginteger` | any value of *biginteger kind* (below)         |
| `bigdecimal` | any value of *bigdecimal kind* (below)         |
| `boolean`    | `true` or `false`                              |
| `top`        | any value at all                               |

### The four numeric leaves

Every numeric value carries a **kind**, fixed when the value is built,
and it is the kind — not the magnitude — that decides what the value
unifies with. There are four numeric kinds, and `number` is not one of
them: `number` names the whole family and nothing else, so no value
ever has `number` kind.

```
number                   (a pure supertype — no value has this kind)
├── integer      a double, whole, in the int64 window   1     1e3
├── float        any other double                       1.5   1e21
├── biginteger   exact, whole, unbounded                0d5   0d1_000
└── bigdecimal   exact, with a point or an exponent     0d0.1 0d1e3
```

The two upper leaves hold IEEE-754 doubles — every value a plain JSON
number can hold exactly — and the source rule below decides which of
them a literal joins. The two lower leaves are reached only by writing
`0d`, and hold their digits *exactly*: no binary rounding, and no
precision limit but the [exactness budget](#the-exactness-budget).

The four leaves are **disjoint**. No value belongs to two of them, and
values of different leaves never unify however equal they look —
`1 & 1.0`, `5 & 0d5` and `0d5 & 0d5.0` are all conflicts. A cross-leaf
result would have to pick a kind, and either choice would make `&`
asymmetric in kind.

**Leaf by source.** Which leaf a literal lands in is decided by how it
is written, never by how large it is. A literal *without* the `0d`
prefix has **integer** kind if, and only if, all three of these hold:

1. its source text contains no `.`;
2. its value is integral (no fractional part);
3. its value lies within the int64 range, that is
   `-9223372036854775808 ≤ n < 9223372036854775808`.

Anything else has **float** kind. The upper bound is *exclusive*
because these values are doubles and 2^63−1 cannot be represented in
one: it rounds up to 2^63, and so falls outside the range.

A literal *with* the `0d` prefix has **bigdecimal** kind if its source
contains a `.` or an exponent, and **biginteger** kind otherwise.

```
1                      → integer     (no '.', integral, in range)
1e3                    → integer     (1000 — an exponent is not a '.')
9007199254740992       → integer
1.0                    → float       (rule 1: the source has a '.')
1.5                    → float       (rules 1 and 2)
1e21                   → float       (rule 3: beyond int64)
100000000000000000000  → float       (rule 3)
0d5                    → biginteger  (0d, digits only)
0d1_000                → biginteger
0d0.1                  → bigdecimal  (0d with a '.')
0d1e3                  → bigdecimal  (0d with an exponent)
```

The two families nearly mirror each other, with one asymmetry worth
remembering: a `.` splits the leaf in both, but an exponent splits it
only in the `0d` family — `1e3` is an integer, `0d1e3` a bigdecimal.

**Canon rendering.** Canon renders a number so that reparsing it
yields the same kind again, which takes three markers:

- an integer-kind value renders plainly: `1000`;
- a float-kind value always carries a fraction or an exponent, so
  a `.0` suffix is appended when the shortest rendering has neither:
  `1.0`, `100000000000000000000.0`;
- an exact value carries the `0d` marker, with any sign in front of
  it: `0d5`, `-0d5`, `0d0.1`.

Because `0d` names the *family* and not the leaf, one more marker is
needed to tell the two exact leaves apart, and it is the same `.0`
device: **an integral bigdecimal always renders with one decimal
place.** So `0d1e3` canons as `0d1000.0` while the biginteger `0d1000`
canons as `0d1000`. Without that, `canon(0d1e3)` would reparse as a
biginteger — a different lattice point, since the leaves are disjoint.

Exact values render in plain form at every magnitude, never in
scientific notation, and **one value has exactly one rendering**:
scale is presentation, not identity, so `0d0.10`, `0d0.1` and `0d1e-1`
all parse to the same value and all canon as `0d0.1`.

Points worth knowing:

- The same rules apply wherever a numeric value is built — a parsed
  literal, a `$var` binding, a raw value handed to the API — so a given
  number never has two different kinds depending on where it came from.
  Where there is no source text, condition 1 is vacuous and conditions
  2 and 3 decide.
- A literal that overflows the double range entirely (`1e999`) is not a
  number at all; it is an error. One that *underflows* to exactly zero
  (`1e-400`) is integer-kind `0`.
- Negative zero never survives, in any leaf: `-0.0` normalises to
  `0.0`, `-0d0` to `0d0`, and `-0d0.0` to `0d0.0`, in canon and in
  generated output alike.
- Aontu has no negative literals: `-` is a prefix operator applied to a
  positive literal. The int64 *minimum* therefore cannot be written as
  an integer-kind literal — `-9223372036854775808` negates the
  float-kind literal `9223372036854775808` and stays float kind. Write
  it `-0d9223372036854775808` to hold it exactly, as a biginteger.

### Exact or refused: lossy literals

An integer literal is stored only if the double format holds it
*exactly*. One that would be silently rounded is a located error
instead, and the message names the fix: write it with `0d`.

This is the rule most likely to surprise, because the input that
triggers it is ordinary JSON. Suppose a dump from an API carries a
64-bit record ID:

```aontu
id: 9007199254740993
```

That value is 2^53+1, the first whole number a double cannot hold.
Storing it anyway would yield 9007199254740992 — a different ID, with
nothing said about it. Aontu refuses instead:

```
[aontu/lossy_integer_literal]: Cannot resolve value at path $.id

This integer literal, 9007199254740993, is not exactly representable in
binary64, so storing it would silently round it to a DIFFERENT
number. Aontu refuses rather than corrupts: write it as a `0d`
literal to get the exact integer.
```

(That is the TypeScript wording; Go phrases the same refusal a little
differently. Both name the `0d` escape.)

Take the escape, and the document works again — exactly:

```aontu
id: 0d9007199254740993
```

```
canon      {"id":0d9007199254740993}
generates  {"id":9007199254740993}
```

One consequence to plan for: the rescued value has **biginteger**
kind, not `integer`, so a schema constraining it must say `biginteger`
(or the family, `number`). `id: integer` would now conflict.

```
id:0d9007199254740993 & biginteger   → {"id":0d9007199254740993}
id:0d9007199254740993 & number       → {"id":0d9007199254740993}
id:0d9007199254740993 & integer      → error
```

**The rule is exactness, not magnitude.** A shorter literal can be
refused while a much longer one is fine, because what matters is
whether the exact value happens to be a double:

```
9007199254740992       → integer  (2^53, exactly representable)
9007199254740993       → error    (2^53+1 is not)
100000000000000000000  → float    (10^20 — far larger, still exact)
0x7fffffffffffffff     → error    (2^63−1 rounds up to 2^63)
0x8000000000000000     → float    (2^63 itself is a power of two)
```

The refusal covers every integer-literal form, decimal and
base-prefixed alike, and it happens at parse time, so a lossy literal
never reaches unification.

### The exactness budget

The exact leaves have no precision limit in the ordinary sense — a
biginteger is as wide as its digits — but a bigdecimal is bounded, so
that a short source cannot demand unbounded work. The bound is one a
document can rely on:

> A bigdecimal may carry **at most 4096 coefficient digits** and an
> **absolute scale of at most 4096**.

The *coefficient* is the significant digits with the point removed;
the *scale* is where the point sits among them, which for a literal is
its fraction digits minus its exponent. So `0d1.5e-4095` has
coefficient 2 and scale 4096, and is the last value of its shape that
fits.

Both halves are checked independently, on literals (against the source
as written, before normalisation) and on every computed result.
Exceeding either is a located error — *"This exact decimal exceeds the
exactness budget"*. Aontu has no rounding mode and no precision
context, so a value beyond the budget is refused rather than
approximated.

```
0d1e-4096            → 0d0.000…0001   (scale 4096 — inside)
0d1e-4097            → error          (scale 4097 — outside)
0d1e4097             → error          (the bound is two-sided)
0d1e1000000000       → error          (refused before rendering it)
0d1e-4000 + 0d1e4000 → error          (the exact sum needs 8001 digits)
```

`biginteger` has no scale and no coefficient bound: a whole number of
ten thousand digits is an ordinary value.

### Unification rules

- **kind & matching scalar → the scalar.** `number & 2` → `2`;
  `string & hello` → `"hello"`; `1 & integer` → `1`;
  `0d1.5 & bigdecimal` → `0d1.5`.
- **kind & non-matching scalar → conflict.** `1 & string` → error;
  `1.0 & integer` → error (`1.0` is float kind whatever its value),
  and so are `1e21 & integer`, `0d5 & integer` and `1 & biginteger`.
- **kind & kind:** equal kinds unify to themselves; `number & <leaf>` →
  that leaf (`number & integer` → `integer`, `number & bigdecimal` →
  `bigdecimal`); two distinct leaves conflict, as do unrelated kinds.
- **scalar & scalar:** two concrete numbers are the same only when kind
  *and* value match. So `1 & 1.0` is a conflict, and `1|1.0` is a real
  two-branch disjunction — `(1|1.0) & 1.0` selects the float. Value
  comparison for the exact leaves is over the number, not its
  spelling: `0d1.5 & 0d1.50` is `0d1.5`.

No operator or function narrows a kind: see
[`+`](#the--operator-and-grouping) and
[`upper()`/`lower()`](#functions). For the reasoning behind the model —
why the bound is int64, why canon carries a `.0`, and how the two
implementations are held in step — see the
[number model design note](design/number-model.md); for why `number`
became a supertype and where the exact leaves came from, see
[the number tower](design/number-tower.md).

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

Overriding is judged by *family*, not by leaf: a numeric default is
overridden by a concrete peer from any numeric leaf, so `a:*2 & 3.0`
is `3.0` and `a:*2.2 & 3` is `3`. A peer from outside the family is
still a conflict, and a bare kind peer constrains the default rather
than replacing it (`a:*1.5 & integer` is `integer`).

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
| `$.a.1`   | list index — a segment is numeric **only** as a plain decimal integer | `a:[10,20,30] b:$.a.1` → `b:20` |
| `.$KEY`   | the key under which the current value is stored      | `a:{k:.$KEY}` → `{"a":{"k":"a"}}` |

**Numeric segments are plain decimal integers, and nothing else is.**
`$.a.1` indexes a list and reaches the key `1`. Every other numeric
spelling — hex, `0d`, `_` separators, an exponent — addresses the key
spelled **exactly that way**, because that is what the spelling already
produces on the key side: `a:{0x0:1}` generates `{"0x0":1}`, not
`{"0":1}`, so `$.a.0x0` finds it and `$.a.0` does not.

In a path the dot is always the **separator**, never a decimal point.
That is why `$.a.1.0` is the two segments `1` and `0` — how a nested list
index is written (`a:[[1,2],[3,4]] b:$.a.1.0` → `b:3`) — rather than a
key spelled `1.0`.

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

**Result kind: the exact ladder.** `+` never introduces a kind
narrower than its operands, and it never demotes. The three exact
leaves form a ladder,

```
integer  <  biginteger  <  bigdecimal
```

and a sum of exact operands takes the **widest** leaf present and is
computed exactly. `float` is not on that ladder: it keeps its classic
contagion with `integer` alone.

```
x:1+2                 → integer 3      canon {"x":3}
x:1+2.0               → float 3        canon {"x":3.0}
x:1.5+1.5             → float 3        canon {"x":3.0}
x:1+0d2               → biginteger 3   canon {"x":0d3}
x:0d2+0d3             → biginteger 5   canon {"x":0d5}
x:1+0d0.5             → bigdecimal 1.5 canon {"x":0d1.5}
x:0d2+0d0.5           → bigdecimal 2.5 canon {"x":0d2.5}
x:(1+2) & integer     → {"x":3}
x:(1.5+1.5) & integer → error          (the sum is float kind)
x:(1+0d2) & integer   → error          (the sum is a biginteger)
```

The widest operand anywhere in a chain decides, whichever end it
arrives at: `x:1+2+0d3` → `0d6`. A `*`-preferred operand contributes
its preferred value's kind. Results never demote, so a biginteger sum
that would fit an `integer` stays a biginteger, and an integral
bigdecimal sum stays a bigdecimal — `x:(0d0.5+0d0.5)&0d1.0` is
`0d1.0`, while `& 0d1` is a conflict.

**Exact arithmetic is exact.** Adding bigdecimals aligns the scales
and adds; nothing is rounded and no precision context is consulted, so
the answers are the ones decimal arithmetic gives on paper:

```
x:0d0.1+0d0.2          → {"x":0d0.3}    (binary64: 0.30000000000000004)
x:0d0.1+0d0.2+0d0.3    → {"x":0d0.6}    (binary64: 0.6000000000000001)
x:0d1.23+0d4.567       → {"x":0d5.797}
```

A sum too wide to hold is refused, never approximated — see
[the exactness budget](#the-exactness-budget).

**Float and exact never mix.** An exact value never silently becomes a
binary float, in either operand order. There is no promotion for this
pair; it is a hard error.

```
x:1.0+0d2   → error   (a float and a biginteger cannot mix)
x:0d0.5+1.0 → error   (the same refusal, operands the other way round)
```

Parentheses only decide *where* the refusal happens: `x:(1+0d2)+1.0`
and `x:(1+2.0)+0d3` both fail.

**Integer sums are exact too.** `integer + integer` is computed
exactly, and the answer must then satisfy the same storage contract
its operands did — integral, inside the int64 window, *and* exactly
representable as a double. A sum that fails any of the three is a
located error naming the `0d` escape, rather than a rounded value:

```
x:4503599627370496+4503599627370496 → {"x":9007199254740992}   (2^53)
x:9007199254740992+2                → {"x":9007199254740994}
x:9007199254740992+1                → error: … not exactly representable
x:9007199254740992+0d1              → {"x":0d9007199254740993}  (the escape)
x:4611686018427387904+4611686018427387904 → error (2^63, past int64)
```

**String concatenation renders digits, not kinds.** A `+` with a
string operand concatenates, and the numeric side contributes its
plain digits with **no `0d` marker** — the marker is canon decoration,
and it never leaks into a string.

```
x:q+0d5     → {"x":"q5"}
x:q+0d0.1   → {"x":"q0.1"}
x:0d5+q     → {"x":"5q"}
```

The digits are the value's own rendering minus the marker, so an
integral bigdecimal keeps its one decimal place: `x:q+0d1e3` is
`"q1000.0"`, while the biginteger `x:q+0d1000` is `"q1000"`. The plain
family is unchanged and still coerces with JavaScript rules, which
drop a trailing `.0`: `x:a+1.0` → `"a1"`, not `"a1.0"`.

Unary `-` negates a numeric operand exactly. It binds tighter than
`+`, `&` and `|` — `-1 & integer` is `(-1) & integer` — and, like `+`,
never narrows the kind and never yields `-0`.

## Functions

Aontu provides a fixed set of seventeen built-in functions. There are
no user-defined functions. Twelve are the general-purpose functions
tabulated below; the other five — `min(x)`, `max(x)`, `above(x)`,
`below(x)` and `neq(x,...)` — are the constraint atoms, whose meaning
is defined in
[The constraint algebra](#the-constraint-algebra-specified).

| Function    | Effect | Example |
|-------------|--------|---------|
| `upper(x)`  | uppercase a string; **ceiling** of a number, keeping the argument's kind | `upper(abc)`→`"ABC"`, `upper(2)`→ integer `2`, `upper(1.1)`→ float `2`, `upper(0d1.1)`→ bigdecimal `0d2.0` |
| `lower(x)`  | lowercase a string; **floor** of a number, keeping the argument's kind   | `lower(ABC)`→`"abc"`, `lower(2)`→ integer `2`, `lower(1.9)`→ float `1`, `lower(0d1.9)`→ bigdecimal `0d1.0` |
| `copy(x)`   | deep copy of a value or referenced node; clears `type`/`hide` marks | `copy({a:1,b:2})`→`{a:1,b:2}`; `copy($.x)` |
| `key(n)`    | the ancestor key `n` levels up (`0` = own key, default `1` = parent). `n` must be an **integer** (`integer` or `biginteger`); anything else is an error. A level beyond the top of the path yields `""`. | at `a:b:c`: `key()`→`"b"`, `key(0)`→`"c"`, `key(2)`→`"a"`, `key(2.0)`→error |
| `pref(x)`   | mark `x` as preferred (same as `*x`)          | `pref(1)` canon `*1`; `pref(2),x:3`→`3` |
| `super(x)`  | the lattice-superior (generalisation/type) of `x` — for a concrete scalar, its kind | `super(1)` → `integer`, `super(1.5)` → `float`, `super(integer)` → `number` |
| `type(x)`   | mark `x` as a type/schema value               | `type(1) & number`→`1` |
| `hide(x)`   | mark `x` as hidden                            | `hide(world) & string`→`"world"` |
| `close(x)`  | seal a map/list against extra keys            | see [closed values](#closed-values-close--open) |
| `open(x)`   | reverse a `close`                             | `open(close({x:1})) & {y:2}`→`{x:1,y:2}` |
| `move(p)`   | resolve reference `p`, dropping unresolved optional keys | `m:{x?:number,y:Y} n:move($.m)`→`n:{y:"Y"}` |
| `path(p)`   | resolve a path expression (function form of a reference) | `path(x.a)` (relative), `path($.z.x.a)` (absolute) |

`super(x)` lifts its **argument** one step up the lattice, so for a
concrete scalar it yields that scalar's kind — and because `number`
sits above the four numeric leaves, the numeric side of the ladder has
a real middle rung: a leaf lifts to `number`, and `number` to `top`:

```
x:super(1)       → integer      x:super(a)          → string
x:super(1.5)     → float        x:super(true)       → boolean
x:super(0d5)     → biginteger   x:super(integer)    → number
x:super(0d1.5)   → bigdecimal   x:super(number)     → top
```

Being a kind, the result then constrains: `x:super(1) & 2` → `2`, while
`x:super(1) & 2.5` is a conflict. Where the argument has no meaningful
superior — a map, a list, a non-numeric kind, `top` — the result is
`top`.

`upper()` and `lower()` round a number without narrowing it: the result
carries the *argument's* kind, so `upper(2)` is an integer `2` (and
unifies with `integer`) while `upper(1.1)` is a float `2` (and does
not). On the exact leaves they are exact ceiling and floor — no
binary arithmetic is involved, and the kind still survives:

```
x:upper(0d1.1)   → {"x":0d2.0}     x:upper(-0d1.5)  → {"x":-0d1.0}
x:lower(0d1.9)   → {"x":0d1.0}     x:lower(-0d1.5)  → {"x":-0d2.0}
x:upper(0d5)     → {"x":0d5}       (a biginteger is already integral)
x:upper(0d1.1) & bigdecimal → {"x":0d2.0}
x:upper(0d1.1) & biginteger → error   (rounding does not change the leaf)
```

A bigdecimal result is still a bigdecimal, so it keeps the one decimal
place its leaf always renders, even when the value is whole.

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
  integer-kind value renders plainly (`1000`). A float-kind value
  always carries a fraction or an exponent, so a `.0` suffix is
  appended when the shortest rendering has neither:

  ```
  1.0    → 1.0        1e21     → 1e+21        (already exponential)
  0.0    → 0.0        0.000001 → 0.000001     (already fractional)
  1e20   → 100000000000000000000.0
  ```

  This applies to **canon only**. String concatenation is unaffected:
  `a+1.0` is still `"a1"`.
- **Exact values carry the `0d` marker**, with any sign in front of
  it, in plain form at every magnitude — never scientific. An integral
  bigdecimal keeps one decimal place, which is what distinguishes it
  from the biginteger of the same value:

  ```
  0d5    → 0d5          0d1000  → 0d1000       (biginteger)
  -0d5   → -0d5         0d1e3   → 0d1000.0     (bigdecimal)
  0d0.10 → 0d0.1        0d1e-1  → 0d0.1        (one value, one rendering)
  ```

  Here too the marker is canon decoration only: `q+0d5` is `"q5"`.
- Negative zero never appears: it normalises to `0` (integer), `0.0`
  (float), `0d0` (biginteger) or `0d0.0` (bigdecimal), in canon and in
  generated output alike.
- Kinds render lowercase: `number`, `integer`, `float`, `biginteger`,
  `bigdecimal`, `string`, `boolean`.
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

**Exact values generate exactly.** The `0d` marker is source syntax
and does not survive into output; the digits do, all of them. A JSON
number is arbitrary-precision text, so nothing is lost on the way out:

```
x:0d9007199254740993   → {"x": 9007199254740993}
x:0d0.1+0d0.2          → {"x": 0.3}
a:0d1000 b:0d1e3       → {"a": 1000, "b": 1000.0}
```

The last line is the leaf distinction reaching the output: a
biginteger emits `1000`, and the integral bigdecimal beside it emits
`1000.0`, because that trailing place is part of a bigdecimal's own
digits. The plain family behaves the other way — an integral float
loses its point, so `b:2.0` generates `2`.

The native values follow: `bigint` and `Decimal` in TypeScript,
`*big.Int` and `*aontu.Decimal` in Go, each carrying the exact value.
TypeScript's `JSON.stringify` cannot serialise a `bigint`, so the
library exports its own exact emitter (`exactJSON`) — the one the
`aontu` command uses.

Object key order is not significant in generated output, and within
the plain family neither is numeric kind. Between the exact leaves it
*is* significant, as the `1000` / `1000.0` pair shows, which is why the
shared suite pins those cases byte for byte rather than structurally.

## Errors

Failures surface as messages (thrown as `AontuError` in TS, returned as
`error` in Go):

| Situation              | Message (contains) |
|------------------------|--------------------|
| scalar conflict        | `Cannot unify value: 2 with value: 1` |
| kind conflict          | `Cannot unify value: string with value: 1` |
| cross-leaf conflict    | `different kinds cannot unify` (`1 & 1.0`, `5 & 0d5`) |
| nested conflict        | reports the clashing leaf values |
| unresolved reference   | `Cannot resolve value: $.nope` |
| unknown variable       | `Cannot resolve …` |
| extra key on closed    | `closed` |
| lossy integer literal  | `not exactly representable`, plus the `0d` hint |
| inexact integer sum    | `exactly representable`, plus `0d<digits>` |
| float mixed with exact | `cannot mix` (naming both leaves) |
| over the exact budget  | `exceeds the exactness budget`, `at most 4096` |

In conflict messages the operand later in the source is named first
("…value: `<later>` with value: `<earlier>`") so the two sites are
distinguishable.

## The constraint algebra (specified)

> **Status: phase 1 implemented (bounds and `neq`); the rest
> specified.** This section is the normative design of capability G1's
> constraint atoms
> ([docs/capability-review/g1-constraint-algebra.md](capability-review/g1-constraint-algebra.md),
> phase 0), re-derived over the four-leaf number tower. The bound
> atoms `min`/`max`/`above`/`below` and the exclusion `neq` are
> implemented in both engines and pinned by
> [`test/spec/constraint-bound.tsv`](../test/spec/constraint-bound.tsv);
> violations raise the registered `constraint` code. `re`, `len`,
> `unique` and `must` still parse as `unknown_function` errors; their
> proposed spec rows live as **drafts** in
> [`test/spec/draft/`](../test/spec/draft/) and are promoted (after
> parity probing) as each implementation phase lands. Known phase-1
> limit: a preference meeting a constraint in a CONJUNCT
> (`min(1024) & *8080`) does not yet resolve to the default — use the
> disjunct form (`*8080 | min(1024)`) today.

### Vocabulary

Nine builtins join the function registry. Eight are **Band A** — full
lattice citizens with defined meet, emptiness, subsumption, and
canonical form. One is **Band B** — evaluate-only, honestly reported
as such. There is no new grammar: atoms are ordinary functions.

| Atom | Band | Meaning |
|------|------|---------|
| `min(x)`  | A | value ≥ x (numeric, or string with lexical order) |
| `max(x)`  | A | value ≤ x |
| `above(x)`| A | value > x |
| `below(x)`| A | value < x |
| `neq(x, ...)` | A | value is none of the listed scalars (leaf-aware) |
| `re(p)`   | A | string matches pattern p (unanchored, portable subset) |
| `len(c)`  | A | length/count satisfies integer constraint c |
| `unique()`| A | list elements pairwise distinct |
| `must(c, msg)` | B | evaluate-only check with an author message |

### Bounds and the number tower

Three rulings, each forced by the tower's disjoint leaves
(`integer`, `float`, `biginteger`, `bigdecimal` under the pure
supertype `number`):

1. **Order is a property of the number line, not the leaf.** A
   numeric bound constrains the value's mathematical position and is
   satisfied by ANY numeric leaf at an admissible position:
   `min(0) & 0d5` is `0d5`, `above(1) & 1.5` is `1.5`. Comparison is
   exact across leaves — every binary64 is exactly a rational, so a
   `float` compares with an exact decimal without rounding, in both
   implementations. A numeric bound implies the kind `number` (the
   supertype); it never narrows the peer's leaf.
2. **Endpoints keep their written leaf.** Canon round-trips kind
   (rule R4), so `min(1)`, `min(1.0)` and `min(0d1)` are distinct
   canonical texts denoting the same bound point. When two endpoints
   at the SAME point meet (`min(1) & min(1.0)`), the survivor is the
   one whose leaf sits lowest in the tower order
   `integer < float < biginteger < bigdecimal` — a deterministic
   choice both implementations make identically.
3. **`neq` excludes by scalar identity — leaf and value** — because
   that is what scalar identity means in the lattice (`1 & 1.0` is a
   conflict; `1|1.0` keeps both alternatives). `neq(1)` excludes the
   integer `1` and admits the float `1.0`. To exclude a point on the
   whole number line, list its leaves: `neq(1, 1.0)` (the exact
   leaves are opt-in, so `0d`-free documents need only these two).

String bounds (`min("a")`) use lexical code-point order and imply
`string`. Mixing domains in one meet (`min(0) & min("a")`) is empty
and yields nil.

### The meet

`atom & atom` (same domain) is symbolic — decided at
schema-composition time, before any data arrives:

| Meet | Result |
|------|--------|
| interval & interval | intersection: `min(0) & min(5)` → `min(5)`; `min(2) & max(10) & max(7)` → `min(2)&max(7)` |
| `neq` & `neq` | exclusion-set union, arguments sorted |
| `re` & `re` | regex-set accumulation (patterns sorted; never simplified) |
| `len(c1)` & `len(c2)` | `len(c1 & c2)` — the count atom reuses the numeric algebra recursively |
| bound & kind | domain narrowing: `integer & min(0)` keeps both (interval gains the integral-domain flag); `number & min(0)` keeps `min(0)` (already implied); `string & min(0)` → nil |
| bound & concrete scalar | membership by exact comparison → the scalar, or a two-site nil |
| bound & `must` | both kept; `must` stays opaque |

Meets are commutative and idempotent by construction — normalisation,
not term order, defines the result — so the lattice guarantee is
preserved.

### Emptiness

Decided **eagerly at unification time** where it is exact, and never
guessed where it is not:

- Empty interval: `min(5) & max(3)` → nil, both sites reported.
- Integral gap: an integral-domain interval containing no integral
  value — `integer & above(1) & below(2)` → nil. (Applies when the
  domain is narrowed by `integer` or `biginteger`.)
- Point deletion **requires a narrowed leaf**: `min(3) & max(3)`
  admits the point 3 in any numeric leaf, so `neq(3)` (which excludes
  only the integer `3`) does NOT empty it — but
  `integer & min(3) & max(3) & neq(3)` → nil. This is the tower
  re-derivation of the pre-tower example, and the draft rows pin both
  directions.
- `len(c)` is empty iff `c & integer & min(0)` is.
- Regex emptiness is deliberately approximate: distinct `re` atoms
  accumulate and are never declared empty — sound (no false
  conflicts), incomplete (some contradictions surface only against
  data).

### Endpoint tightening: lazy endpoints, eager emptiness

The pre-tower draft left open whether `integer & above(0.5)` should
rewrite to `integer&min(1)`. **Decided: no endpoint rewriting.**
Under the tower, a synthesised endpoint must be given a leaf the
author never wrote (`1`? `0d1`?), and that invented spelling leaks
into canonical text and, later, canon hashes. Emptiness needs no
synthesis, so the algebra keeps *eager emptiness* (the
composition-time contradiction detection that is the point of Band A)
with *lazy endpoints* (canon stays what was written, normalised only
by the meet rules above).

### Canonical form

A residual constraint renders as its normalised atoms joined by `&`
in a fixed order — **kind, lower bound (`min`/`above`), upper bound
(`max`/`below`), `neq` (arguments sorted), `re` (patterns sorted),
`len`, `unique`, `must`** — no spaces, reparseable, endpoint leaves
preserved:

```aon
a: integer & max(10) & min(0) & min(2)
# canon: {"a":integer&min(2)&max(10)}
```

`parse(canon(v)) == v` holds for every atom and every normalisation
rule: the reparse produces a conjunct of atoms that normalises back
to the identical residual. Draft rows pin a round-trip and an
order-independence case (`min(0)&max(10)` vs `max(10)&min(0)` →
identical canon) for each rule.

### `len` semantics

`len` applies to strings, lists, and maps, with the domain fixed by
the peer:

- **strings**: length in **Unicode code points** — not UTF-16 code
  units (TS's native count) and not bytes (Go's): `len(1) & "𝄞"`
  holds, in both implementations. Astral-plane rows are part of the
  draft suite, not an implementation accident.
- **lists**: element count. **maps**: entry count.

Its argument is any integer-domain constraint: `len(3)` means exactly
3; `len(min(2) & max(5))` means between 2 and 5.

### Cross-field bounds and residuation

An atom whose argument contains an unresolved reference, or whose
peer is not yet concrete, **residuates**: no error, stays in place,
re-evaluated on later fixpoint passes. Atoms only ever suspend or
intersect — never force evaluation — so evaluation order cannot
change results.

```aon
scaling: {
  floor: 2
  ceiling: 10
  target: integer & min($.scaling.floor) & max($.scaling.ceiling)
}
# target normalises to integer&min(2)&max(10) once floor/ceiling resolve
```

A residual that survives to generation is an error, exactly like an
unresolved kind today; exhaustion of the pass budget while residuals
are still refining is `budget_passes` ([the trust
contract](trust.md), clause 2).

### Band B: `must`

`must(c, msg)` wraps any Aontu value as an evaluate-only check: it
residuates until its peer is concrete, then requires the peer to
unify with `c`; on failure the author's message is attached to the
nil (`NilVal.details`). `must` never participates in emptiness or
subsumption, and any report including one states that the check was
evaluate-only — the honest channel for domain rules beyond the
algebra.

### Errors

A constraint violation is an ordinary two-site nil in the existing
message family (`Cannot unify value: 99999 with value: max(65535)`),
with machine-readable `details`: the failing atom, the normalised
admissible interval/sets, and any `must` message. Codes ride the
[error-code registry](../test/spec/errcodes.tsv); rendering into
reports belongs to the vet verb (G2).
