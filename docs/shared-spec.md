# Shared test specification (`test/spec/*.tsv`)

The `test/spec/` directory holds the **language-agnostic** unit tests
that both the TypeScript (`ts/`) and Go (`go/`) implementations of Aontu
must satisfy. They are plain tab-separated-value (TSV) files so they can
be parsed trivially and identically from any language.

Both runners load the same files:

- TypeScript: `ts/test/spec.test.ts`
- Go: `go/spec_test.go`

## File format

Each `.tsv` file is a list of test rows. Lines that are empty or begin
with `#` are ignored (used for headers and comments).

A row has four tab-separated columns:

```
name <TAB> mode <TAB> src <TAB> expect
```

| column   | meaning                                                        |
|----------|----------------------------------------------------------------|
| `name`   | short identifier for the case (unique within its file)         |
| `mode`   | `canon`, `gen`, `gens` or `err` (see below)                    |
| `src`    | Aontu source text to evaluate                                  |
| `expect` | the expected result, interpreted according to `mode`          |

### Modes

| mode    | assertion                                                       |
|---------|-----------------------------------------------------------------|
| `canon` | `unify(src)` then its canonical form must equal `expect`        |
| `gen`   | `generate(src)` must deep-equal `JSON.parse(expect)`            |
| `gens`  | `generate(src)` serialised as compact JSON must equal `expect` **byte for byte** |
| `err`   | `generate(src)` must raise an error whose message contains `expect` |

For `gen`, the generated value and the expected JSON are compared
structurally (numeric type and object key order do not matter). That
comparison is weaker than it looks, and choosing the wrong mode because
of it is the commonest way to write a row that cannot fail — see
[Choosing a mode](#choosing-a-mode).

`gens` is the byte-exact counterpart: no decode happens on either side,
so the row pins the serialised text — digits, exponent form, key order,
string escaping and all. Because `gen` normalises both sides through
JSON, every number lands in a `float64` and two distinct exact integers
above 2^53 compare *equal*; `gens` is the mode that can tell them apart,
and the one the number tower's exact leaves are pinned with
([`docs/design/number-tower.md`](design/number-tower.md), D10). The
serialisation contract both runners implement is: compact (no
indentation, no spaces), object keys in lexicographic order, and no HTML
escaping of `<`, `>` or `&`. The key order is the EMITTER's doing, not
`generate`'s: a JavaScript object cannot hold `"10"` before `"9"`
(ECMAScript hoists canonical array-index keys, ascending), so TypeScript
sorts in `exactJSON` and Go gets the same order from `encoding/json`,
which sorts map keys.
Each runner uses its port's real emitter — aontu's own `exactJSON`
export in TypeScript (`JSON.stringify` throws on the `bigint` a
biginteger generates as), `encoding/json` with `SetEscapeHTML(false)`
in Go — so a `gens` row pins the bytes a *caller* gets, not bytes
invented for the test.

**`canon` pins kind, `gens` pins bytes, `gen` is blind to both.** An
integral float serialises as `1` under `gens` and canons as `1.0`; two
exact integers above 2^53 differ under `gens` and are indistinguishable
under `gen`. No one mode replaces another.

One thing even `gens` cannot see: the *runtime type* `generate` returns.
A biginteger and an ordinary integer of the same value serialise to the
same text, so `gens` stays green if a port hands back a `number` where a
`bigint` was due. That half of the contract is pinned by per-port API
tests (`ts/test/exactjson.test.ts`, `go/generate_test.go`) instead.

### Escapes

Because the delimiter is a tab and rows are single lines, the following
escapes are recognised in both `src` and `expect` and expanded before
use:

| escape | becomes      |
|--------|--------------|
| `\n`   | newline      |
| `\t`   | tab          |
| `\\`   | backslash    |

This lets a single row carry multi-line source, e.g.:

```
override	gen	a:*1|number\na:2	{"a":2}
```

which evaluates the two-line source

```
a:*1|number
a:2
```

and expects `{ "a": 2 }`.

## Choosing a mode

**`canon` pins kind, `gens` pins bytes, and `gen` is blind to both.**
This is the single most useful thing to know about the suite.

Aontu has four numeric leaf kinds — `integer`, `float`, `biginteger`,
`bigdecimal` — and JSON has one number type. A `gen` row round-trips the
result through JSON, so the kind is gone before the comparison happens,
and so is any precision beyond a `float64`. Canon, by contrast, must
reparse to a value of the *same* kind, so a float-kind scalar always
renders with a fraction or an exponent:

| Source  | `gen`     | `gens`    | `canon`     |
|---------|-----------|-----------|-------------|
| `x:1`   | `{"x":1}` | `{"x":1}` | `{"x":1}`   |
| `x:1.0` | `{"x":1}` | `{"x":1}` | `{"x":1.0}` |

The two sources are indistinguishable in the two middle columns —
`gens` pins bytes, and the bytes of an integral float are those of an
integer — and distinct only in the right-hand one. So:

> **A behaviour that distinguishes numeric kinds MUST be pinned by a
> `canon` row or an `err` row — never by `gen` alone. A behaviour that
> turns on exact digits MUST be pinned by a `gens` row.**

A `gen` row accepts whichever kind the implementation happens to
produce. It stays green while the kind is wrong, which is exactly how a
kind defect survives a passing suite — and how one port can drift from
the other without any row noticing.

For a value on one of the **exact leaves**, `gen` is worse than weak —
it is unusable, and the two runners do not even fail the same way. Go
marshals and re-decodes both sides into `float64`, so a `gen` row on
`x:0d9007199254740993` passes against `{"x":9007199254740992}` *and*
against `{"x":9007199254740993}`; TypeScript compares the generated
`bigint` with `deepStrictEqual`, which is type-strict, so the same row
fails against either. Write `gens` (or `canon`) and the question does
not arise. Every `gen` row that mentions `0d` in the suite today is one
where no exact value reaches the output at all — the marker is text, a
map key, or `hide`-marked away.

- Use `canon` when the point is which kind is *produced*: `x:1.5+1.5`
  canons to `{"x":3.0}`, whereas its `gen` value is `{"x":3}` — which
  would pass just as happily if the sum had wrongly come out an
  integer.
- Use `err` when the point is that a kind is *rejected*:
  `x:(1.5+1.5) & integer` must fail.
- `gen` remains the right mode for a *value's structure*, and reads
  most clearly when the shape is the point.
- Use `gens` when the point is the exact *bytes*: which digits are
  emitted, which exponent form, which key order, how a string is
  escaped. It is the only mode that can distinguish two exact integers
  above 2^53, since `gen` collapses both to the same `float64`, and the
  only one that checks the JSON text a caller actually receives.

The same blindness applies to everything else JSON flattens — `gen`
ignores object key order too — but numeric kind is the case that bites,
because it is invisible rather than merely unordered.

The kind rules themselves are pinned by
[`test/spec/number-model.tsv`](../test/spec/number-model.tsv) and the
exact leaves by
[`test/spec/number-tower.tsv`](../test/spec/number-tower.tsv); the
reasoning behind them is in
[`docs/design/number-model.md`](design/number-model.md) and
[`docs/design/number-tower.md`](design/number-tower.md).

## Adding cases

1. Pick (or add) a thematic file. `scalar.tsv`, `map.tsv`, `list.tsv`,
   `conjunct.tsv`, `disjunct.tsv`, `pref.tsv` and `error.tsv` cover the
   core language; `number-model.tsv` covers the numeric kind rules,
   `number-tower.tsv` the exact leaves the tower adds to them, and
   `number-cross-product.tsv` the closed ordered-pair table for `+`; and
   `spread.tsv` plus the `spread-*.tsv` family take one spread topic per
   file.
2. Pick the mode that can actually fail for the behaviour you are
   pinning — see [Choosing a mode](#choosing-a-mode).
3. **Obtain the expected value by running both implementations and
   requiring them to agree.** Never copy it out of one engine: that
   baselines a divergence as the contract. From the repository root:

   ```sh
   echo 'x:1.0' | node ts/dist/cli.js -c
   (cd go && echo 'x:1.0' | go run ./cmd/aontu -c)
   ```

   Drop `-c` from both for a `gen` row. The TypeScript CLI runs the
   committed build, so run `make build-ts` first if `ts/src` has
   changed.

   Neither CLI prints compact JSON, so a `gens` expectation cannot be
   read off these two commands. Probe it through each engine's library
   instead — `exactJSON(new Aontu().generate(src))` in TypeScript,
   `Generate(src)` through an `encoding/json` encoder with
   `SetEscapeHTML(false)` in Go — and require the two texts to be
   byte-identical before writing the row. Use `exactJSON` (exported from
   `aontu`), **not** `JSON.stringify`: the latter throws on the `bigint`
   a biginteger generates as, and it is `exactJSON` that the `gens`
   runner and the CLI both call.
4. Append the row, then run `make test-ts` and `make test-go`.
5. Only commit rows that pass in **both** implementations — the spec
   defines shared, agreed behaviour.

## The divergence ledger

[`test/spec/divergent.tsv`](../test/spec/divergent.tsv) is the opposite
register: behaviours where the two ports are known to **disagree** and
which cannot be fixed from this repository right now — because the cause
is in a pinned dependency, or because which side is correct is still an
open question.

It lives beside the suite so it is read whenever the spec is read, but
it carries no data rows. A row there would be executed by both runners
and, by definition, could not pass in both, so the file is entirely
commentary and contributes zero cases. Recording a divergence there is a
deliberate, reviewed act rather than a way to quieten a failing row; the
rules for an entry are in [`AGENTS.md`](../AGENTS.md).
