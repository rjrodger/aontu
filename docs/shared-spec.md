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
| `mode`   | `canon`, `gen` or `err` (see below)                            |
| `src`    | Aontu source text to evaluate                                  |
| `expect` | the expected result, interpreted according to `mode`          |

### Modes

| mode    | assertion                                                       |
|---------|-----------------------------------------------------------------|
| `canon` | `unify(src)` then its canonical form must equal `expect`        |
| `gen`   | `generate(src)` must deep-equal `JSON.parse(expect)`            |
| `err`   | `generate(src)` must raise an error whose message contains `expect` |

For `gen`, the generated value and the expected JSON are compared
structurally (numeric type and object key order do not matter).

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

## Adding cases

1. Pick (or add) a thematic file — `scalar.tsv`, `map.tsv`, `list.tsv`,
   `conjunct.tsv`, `disjunct.tsv`, `pref.tsv`, `error.tsv`.
2. Append a row. Validate against the canonical TypeScript
   implementation first (`make test-ts`), then the Go port
   (`make test-go`).
3. Only commit rows that pass in **both** implementations — the spec
   defines shared, agreed behaviour.
