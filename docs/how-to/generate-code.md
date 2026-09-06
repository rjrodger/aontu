---
description: "Generate target-language source from a model: a rule set over the records, the pieces of a file, and `aontu render` to fold them into bytes and hold the result against its golden."
group: schemas
order: 80
---

# Generate code from a model

A model that holds the field names, the types, and the optionality
already holds everything a Go struct or a TypeScript interface needs.
This guide computes a Go file from one with a rule set—`emit`—and
renders it with `aontu render`, which owns every indent and every line
terminator so the transform spells neither.

For the full worked version—three targets in one instance, goldens,
and a check that both ports render identical bytes—see
[`use-cases/15-code-generation/`](../../use-cases/15-code-generation/).

## Hold the target text in a backtick string

`"…"` and `'…'` refuse a literal newline. `` `…` `` accepts one, so a
backtick string carries a block of another language as one value, and
escapes work in it: `\t` is a tab and `` \` `` a literal backtick.
Write this as `frag.aon`:

<!-- test: scenario generate-code -->
<!-- test: file frag.aon -->
```aontu
tag: `json:"id"`
row: `\tID string`
```

<!-- test: run -->
```sh
$ aontu -c frag.aon
{"row":"\tID string","tag":"json:\"id\""}
```

## Write the rules

A generator is a **rule set**: `emit(select, table)` visits every node
of a selection in source order, takes the first template whose `match`
the node unifies with, and instantiates its `body` against that
node—`.name` is that node's `name`. The body is a list of **pieces**: a
bare string is a line, `{ k:"line" at:1 of:[…] }` is a line one level
deeper, and `k:"blank"` is a blank line. A nested `emit` splices its
pieces into the list, so the result is flat and every piece carries its
own depth.

The pieces fill a **unit** of the bundled `aontu:code` vocabulary: a
file path, a language, and the declarations that make it up. Write
this as `types.aon`:

<!-- test: file types.aon -->
```aontu
records: [
  {
    name: "Customer"
    fields: [{ n:"id" t:"string" go:"ID" } { n:"email" t:"string" go:"Email" }]
  }
  { name:"Order" fields:[{ n:"total" t:"integer" go:"Total" }] }
]

%field = emit(_, {
  match: n: string
  body: [
    {
      k: "line"
      at: 1
      of: [
        .go + " " + match(.t, "string", "string", "integer", "int64")
        + ` \`json:"` + .n + `"\``
      ]
    }
  ]
})

%record = emit(_, {
  match: name: string
  body: [k:"blank" "type " + .name + " struct {" emit(.fields, %field) "}"]
})

code: units: [
  {
    path: "types.go"
    lang: "go"
    profile: indent: { unit:"\t" width:1 }
    decls: [
      { k:"frag" of:["package acme"] }
      { k:"frag" of:emit($.records, %record) }
    ]
  }
]
```

Each piece of that shape is there for a reason:

- **A rule set walks the records in source order.** List order is
  what a file needs; `pack` would key by data and emit the records
  alphabetically—silently wrong output for a file.
- **Pieces, not text.** A record contributes a blank line, a head, its
  fields and a tail; a field contributes one line *at depth 1*. The
  tab appears once, in the unit's `profile`; leave the profile out and
  the unit renders under the bundled text profile, two spaces per
  depth.
- **Two fragments make one unit.** The package clause is one fragment,
  the records another; a unit's declarations render in order, and the
  blank line each record opens with separates a struct from what came
  before.
- **The source keys ride through.** `emit` binds the body to the node,
  so `.name` and `.fields` resolve inside the template without the
  node being copied anywhere.

## Render the unit

`--stdout` prints one unit's bytes and nothing else, so the output can
be piped into `gofmt` or a file:

<!-- test: run -->
```sh
$ aontu render --stdout types.aon
package acme

type Customer struct {
	ID string `json:"id"`
	Email string `json:"email"`
}

type Order struct {
	Total int64 `json:"total"`
}
```

That is the file. No host unwraps a string, decides an ordering, or
adds a separator: the renderer put a tab in front of every depth-1
line and a terminator after every line, and the transform said which
lines exist and where.

Run it without a flag and the verb summarises the units instead, one
line each. The **loss report** goes to stderr: every fragment is a
claim about a language the renderer does not parse, and each is
listed, so a redirect keeps the bytes clean and the reader still sees
what was not checked. `--strict` refuses the two escapes the renderer
copies verbatim—a `text` declaration and a `raw` piece—and passes
fragments.

## Write the files, and hold them

`--out <dir>` writes every unit below `<dir>`, or nothing: the whole
set is rendered first, and one refused unit means no file is touched.
`--check <dir>` renders and compares, and is the CI form—drift is
listed by path and exits 1:

<!-- test: run -->
```sh
$ aontu render --out gen types.aon
$ aontu render --check gen types.aon
```

Edit `gen/types.go` by hand and the check names it:

<!-- test: file gen/types.go -->
```go
package acme
```

<!-- test: run -->
```sh
$ aontu render --check gen types.aon
aontu: types.go differs from the rendered unit
...
$ echo $?
1
```

Commit the generated files beside the model and run `--check` in CI;
a hand edit to a generated file is then a red build rather than a
quiet divergence from the model.

## Ask what the transform read

`--check` says the output still matches the model. It says nothing
about the parts of the model no output uses, or the parts of the output
no rule wrote. `--coverage` answers both, and writes nothing:

<!-- test: run -->
```sh
$ aontu render --coverage types.aon
unruled: types.go $.code.units.0.decls.0
coverage: 1 path(s) read, 0 no output consumed, 1 declaration(s) no rule produced
```

Nothing here is dead: the rule set reads `$.records`, and the whole
model is under it. One declaration is a hole—the package clause, which
the document writes by hand rather than a rule producing it. Add a
`legacy:` key to `types.aon` that nothing reads and the report names it
as dead the next run, which is how a field that outlived its generator
is found before it rots. `--format json` carries the other half, one
trace entry per emitted piece: which model node the rule matched, and
which rule.

## Write the generator in the target's own syntax

A body of quoted lines is a generator a compiler cannot read. The same
generator can be written as a file **in the language it generates**:
one rule, a marked line is aontu source and every other line is a line
of output. The marker is the target's comment token plus a dash, so
the file stays valid in its own language. Write the model as
`model.aon`:

<!-- test: file model.aon -->
```aontu
records: [
  { name:"Customer" note:"one account holder" }
  { name:"Order" note:"one purchase" }
]
```

and the generator as `struct.go`:

<!-- test: file struct.go -->
```go
//- @"./model.aon"
//- code: units: emit($.records, {
//- match: { name: string }
//- body: [{ path: .name + ".go", lang: "go", decls: [{ k: "frag", of: emit([_], {
//- match: { name: string }
//- replace: { NAME: .name, NOTE: .note }
//- body: [
package acme

// NAME is NOTE. Generated: edit the model, not this file.
type NAME struct{}
//- ]}) }] }]
//- })
```

`render` reads it directly—the entry's extension says it is a
template—and there is nothing new to learn about generation itself:

<!-- test: run -->
```sh
$ aontu render --stdout --unit Order.go struct.go
package acme

// Order is one purchase. Generated: edit the model, not this file.
type Order struct{}
```

Three things follow from writing it this way:

- **The output lines are the target's, at their own indentation.**
  `gofmt` formats them, an editor highlights them, and `go vet` reads
  the generator itself. What the target sees is a file with four
  comments in it.
- **A value still arrives through `replace`.** `NAME` is a string the
  body holds, matched exactly, so no delimiter can collide with the
  target's syntax. That needs an inner dispatch: `replace` reaches the
  lines a rule wrote, so the file's lines and the map naming the file
  are two rules rather than one.
- **The whitespace is the artifact.** A line of two spaces is two
  spaces of output, so the generator's bytes matter as much as the
  generated file's. `aontu template --check struct.go` holds the file
  to the spelling the round trip answers, and `aontu render --check`
  against the committed output catches a body line whose whitespace
  changed—an editor set to trim on save, say.

`aontu template struct.go` prints the canonical form, the aontu the
marked lines mean, for reading rather than for keeping. `aontu fmt`
refuses a template by extension—it formats `.aon` and `.aontu`—so a
file whose comment token is `#` is never silently rewritten as aontu.

## Lower a declaration instead

A struct need not be spelled as lines. The vocabulary has a
declaration for a record, an enum, an alias, a constant and a
function, and a unit of `typescript` or `go` renders each under the
bundled profile of that language, which spells the target's syntax
and its naming: Go's profile splits `ledgerId` into words and writes
`LedgerID`, and keeps the model's name in the JSON tag. The rule set
then emits the vocabulary's records and fields rather than pieces.
Write this as `records.aon`:

<!-- test: file records.aon -->
```aontu
records: [
  { name:"Customer" fields:[{ n:"id" t:"string" } { n:"email" t:"string" }] }
  { name:"Order" fields:[{ n:"total" t:"integer" }] }
]

%field = emit(_, {
  match: n: string
  body: [
    {
      name: .n
      type: { k:"prim" prim:match(.t, "string", "string", "integer", "int") }
    }
  ]
})

%record = emit(_, {
  match: name: string
  body: [{ k:"record" name:.name fields:emit(.fields, %field) }]
})

code: units: [
  { path:"types.go" lang:"go" pkg:"acme" decls:emit($.records, %record) }
]
```

<!-- test: run -->
```sh
$ aontu render --stdout records.aon
package acme

type Customer struct {
	ID string `json:"id"`
	Email string `json:"email"`
}

type Order struct {
	Total int64 `json:"total"`
}
```

Nothing in the model spells `ID` or `int64`: the field is `id` and
its type `int`, and the profile's case style for a field, its acronym
set and its primitive table do the rest. What the target cannot
enforce—a `check` on a field, an open record, a union in Go—is listed
on stderr as tier 1, and stays in the model.

## Put the target's names in the model

A fragment spells its own names, and `upper()` uppercases a whole
string, so it yields `EMAIL`, not `Email`. Write the target's spelling
as data, as `go: "Email"` does above, or hand the name to a
declaration, whose profile applies a case style per role.

That is also the better design. What a type is called in a target is
a fact about the model rather than a rule in a template, which is the
split every code generator that survived contact with many languages
arrives at. Writing it down makes a name collision a unification
conflict instead of a broken identifier at emit time.

## Related

- [`aontu render`](../reference-api.md#aontu-render). The verb's
  flags, exit codes and confinement.
- [Transforming: `emit`](../reference-language.md#transforming-emit).
  Dispatch order, splicing, named tables and recursion.
- [`aontu template`](../reference-api.md#aontu-template). The two
  transforms, the markers by extension, and the round trip.
- [Export JSON Schema](export-json-schema.md). The other bridge out
  of the model.
- [Keep schema out of output](keep-schema-out-of-output.md). `hide()`
  and marks, and what they do to generation.
