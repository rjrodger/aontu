# Jostraca component primitives as aontu functions — a spike

**Status:** SPIKE, 2026-09-09. Built, in TypeScript only, and behind
no flag. Nothing here is a landed capability: there is no Go port, no
shared-spec row, no signature declaration and no entry in the progress
register. This note records what was built, what it proved, and what
it did not.

**Origin:** Richard Rodger, 2026-09-09: *"Jostraca should be used by
aontu for code generation. The Jostraca component primitives like
Folder, File etc should be available as aontu functions (keep upper
case). This replaces the use of a conventional schema (code.units
etc). Implement a spike with only Folder, File, Content to investigate
the implementation. Just work in ts at first."*

**Method:** every claim marked VERIFIED was run against this tree —
`node ts/bin/aontu.js` after `make build-ts`, and the jostraca
checkout at `804014f` with the companion change on its own spike
branch. Claims about what the design *should* be are argument, and
are marked as such.

---

## 1. What this reverses, and why that is worth doing

Two decisions stand in the way, and the spike is worth building because
it bears on one of them and not the other. §7 has both;
[ADR-023](../../ADR.md#adr-023--g9-completes-at-the-renderer-the-reflection-sidecar-the-jostraca-bridge-and-string-interpolation-are-retired)
retired the Jostraca *bridge* and the spike does not reopen it, taking no
dependency and running as the pipeline hand-off that entry names. This
section is about the other one.

[G9 Resolution 1](../capability-review/g9-transformation.md#two-specialist-disagreements-resolved)
settled the output vocabulary against exactly this proposal. Two
drafts disagreed: a DECLARATION vocabulary of units, declarations,
types and fields, and a JOSTRACA-SHAPED plan of project/folder/file/
content nodes. The declaration vocabulary won, became
[`aontu:code`](../../test/spec/aontu-code.tsv), and the plan was
demoted to "a data structure the *bridge* builds in the host from the
render report — never something a transform writes". Resolution 1 also
withdrew a claimed blocking ask on the other repository: "because the
bridge builds the Project tree in the host from a render report,
Jostraca needs no data-driven `Tree(nodedef)` component."

The instruction above reverses that. The spike exists to find out
whether Resolution 1's three reasons survive contact with an
implementation, because two of the three turn on an assumption the
spike does not have to make.

Resolution 1's reasons, and what the spike found:

**(i) "At text level, and with no `join`, one output line is one plan
node: a forty-line Go struct is forty nodes carrying `kind`/`src`,
which is strictly worse to write and review than the fifty-line host
program it replaces."** This is the reason that does not survive.
It assumes the nodes are WRITTEN. As functions they are CALLED, and
`form()` already makes one node per model child, so the source scales
with the MODEL, not with the output. VERIFIED — the five-line
interface below is seven lines of aontu whatever the record's field
count, and adding a field to the model adds a line to the output and
nothing to the transform:

```
model: { name:planet fields:[id name mass] }

out: Folder("src", [
  File($.model.name + ".ts", [
    Content("export interface Planet {\n")
    form($.model.fields, Content("  " + _ + ": string\n"))
    Content("}\n")
  ])
])
```

That is [`ts/test/cmp-spike.aon`](../../ts/test/cmp-spike.aon) verbatim —
the fixture `ts/test/cmp.test.ts` asserts and the pipeline command in §8
runs, so this block, the engine and the pipeline cannot drift apart. It
is in the canonical form: `aontu fmt --check` passes on it, which is
also the small finding that a document built from component calls needs
nothing from the formatter.

Resolution 1 was written before `form` landed and reasoned about the
plan as data. Against generated nodes the argument has no purchase.

**But it has no purchase on `aontu:code` either, and that is the part
worth being straight about.** The same combinators write the landed
vocabulary: `use-cases/10-data-model/xf-domain.aon` walks a whole
record schema into TypeScript in thirty lines, and it DERIVES each
field's type from the schema rather than spelling it, so one instance
renders to TypeScript and to Go with each language's own casing and
acronym rules. The component tree cannot do that — a `Content` is
text, for one target, and knows nothing about the field it came from.
So Resolution 1 (i) is withdrawn as an argument against the component
road; it was never an argument for it.

**(ii) "At text level the vocabulary can assert almost nothing — 'this
is a string' — so D1's vetting claim evaporates, which is the whole
prize."** This one survives, and the spike does not rescue it. A
`Content` is a string and nothing in the language knows whether it is
valid TypeScript. What the spike DOES recover is the other half of the
prize, and it recovers it in a stronger form than a schema does: the
structural rules are checked AT THE CALL, with the arguments in hand
and at the site the author wrote. See §3.

**(iii) "At text level the layout is baked into the leaf at
construction time and a renderer can never re-indent, which is XSLT's
whitespace failure imported wholesale."** This one survives too, and
is the spike's clearest open question. See §6.

So the honest summary is: one of Resolution 1's three reasons is
withdrawn by the spike, and two stand. Whether the two that stand are
worth `aontu:code` is a decision, not a finding, and this note does
not make it.

## 2. What was built

Three functions, keeping jostraca's capitalisation, in
[`ts/src/val/CmpFuncVal.ts`](../../ts/src/val/CmpFuncVal.ts) and
registered in `funcMap` (`ts/src/lang.ts`):

```
Folder(spec, children?)
File(spec, children?)
Content(spec)
```

`spec` is a string or a props map; the string spelling fills the one
prop the component cannot work without (`name`, `name`, `src`).
`children` is a list.

**Upper case cost the grammar nothing.** VERIFIED before anything was
written: `x: Folder(a)` already parsed as a call and failed with
`unknown_function`, so the name rule never cared about case.

**A call resolves to an ordinary map**, which is what makes this a
spike rather than a project:

```
$ printf 'x: File("a.ts", [Content("k")])\n' | node ts/bin/aontu.js -c
{"x":{"children":[{"children":[],"cmp":"Content","props":{"src":"k"}}],"cmp":"File","props":{"name":"a.ts"}}}
```

Nothing downstream needed a change. `generate()` emits the tree as
JSON, `canon` renders it, references reach into it (`$.a.props.name`
is `"a.ts"`, VERIFIED), and a children list is an ordinary list — so
`form()` over model data drops straight into one. That last point is
the whole result: **the generation combinators reach the component
tree with no new machinery at all.**

`{cmp, props, children}` is deliberately jostraca's own component
surface rather than a new schema. `cmp` names an exported component,
`props` is its first argument, `children` its second — so the
vocabulary needs no entry per component and no version of its own, and
the aontu side can grow one primitive at a time.

## 3. What the call refuses, and why that is the interesting part

A schema refuses an instance. A call refuses its arguments — at the
site, with the argument in hand, before a value exists. Four rules, all
VERIFIED; the first three refuse as `invalid-arg` and the fourth is the
lattice's own:

- **The containment grammar.** A Folder holds folders and files, a
  File holds content, Content is a leaf. Unification cannot state this
  on its own: a node is a map, and every node map unifies with every
  other. `Folder("a", [Content("c")])` is refused.
- **The spec.** A string or a props map, and the one prop the
  component cannot work without must be a non-empty string.
  `File({mode: 493})` is refused.
- **Arity.** `Content("a", "b")` is refused.
- **Closedness.** The node map is `close()`d — three keys are the
  vocabulary — so `Folder("s") & {childrn: []}` is `closed`. The
  `props` map is left OPEN, because props are the component's
  business: jostraca's `File` already reads `mode` and `exclude`, and
  a component the spike does not implement reads its own.

This is the answer to the half of Resolution 1 (ii) that the spike
does recover. `aontu:code` gets its refusals from `close()` marks on
alias templates — a mechanism that has already gone wrong once in a
way nothing caught (the hash form dropped the `close()` at all 139 of
them; see the 2026-09-07 note at the head of
`test/spec/aontu-code.tsv`). A refusal in the constructor cannot be
erased by a hashing bug, because there is no schema text to erase it
from.

## 4. Children flatten, and that is forced

The finding the worked example produced. A generator's output lands in
the MIDDLE of a written list:

```
File("planet.ts", [
  Content("export interface Planet {\n")
  form($.fields, Content("  " + _ + ": string\n"))
  Content("}\n")
])
```

so that list holds two nodes and a LIST OF NODES. A list is not a node
and could only be an error otherwise, which makes splicing the total
rule and nesting no rule at all. Children are therefore flattened to
any depth before the containment grammar is checked. Every component
system that takes children arrives here; it is recorded because it was
not obvious in advance, and because the first version of the spike
refused the worked example outright.

The same reasoning is why the second argument must BE a list rather
than accepting a bare node as a convenience: `form(...)` already
returns the list, and a one-child special case would make
`File(n, form(...))` and `File(n, [form(...)])` both legal and
different.

## 5. Not staged, and that was checked

A component call answers from its arguments alone. It has no
dependence on WHERE it sits — unlike `key()` — and it reads no bag a
sibling may still merge into — unlike `pack`/`each`/`form`. So it does
not set `staged`, and the ordinary args-done gate is correct: a
children list BUILT by one of the combinators still waits, because the
combinator residuates and the enclosing call is not `pegdone` until it
fires. VERIFIED by the worked example, whose `form()` fires inside a
`File` inside a `Folder` and lands in model order.

## 6. What the spike did not answer

**Indentation, which is Resolution 1 (iii).** Half answered, and the
half that is missing is the half the objection was about. jostraca
carries an `indent` prop on `Content`, and the props map reaches it —
VERIFIED end to end, `Content({src: "y = 1\n", indent: 2})` inside a
`File` writes `  y = 1`. So a span's own indent is expressible today
with no new primitive. What is not is RE-indentation: the author picks
each span's depth at construction, and nothing can take a finished
block and shift it, which is exactly what `aontu:code`'s fragment
algebra exists for (every piece carries its `at` and the renderer owns
every prefix). A `Fragment` primitive would raise the unit from a span
to a block; it would not make the depth someone else's to change.

**Line termination.** jostraca's `FileOp` joins a file's content
spans with the empty string, so `Content("a")` and `Content("b")`
concatenate to `ab`. The examples above carry their own `\n`, which is
honest but not pleasant. `Line` is jostraca's answer and is the
obvious fourth primitive; the bridge already reaches it (VERIFIED —
the jostraca side generates a `Line` node today, from a tree aontu
cannot yet write).

**Identifier case.** The worked example wants `Planet` and aontu has
whole-string `upper`/`lower` and no title case, so the header line is
written out rather than derived. `rep`/`split` can build one; a
`names`-family builtin would be better. jostraca already ships
`camelify`/`snakify`/`kebabify`/`names` — this is the same gap on the
other side of the seam.

**`$$...$$`.** jostraca's `Content` templates unconditionally, so a
`$$path$$` in aontu-generated bytes is silently substituted from the
generate model — aontu owns the bytes right up until jostraca takes the
last edit. VERIFIED both halves: with an empty model `a $$path$$ b`
survives; with `model: {path: 'ZZZ'}` it becomes `a ZZZ b`. G9 §5 asked
for a `raw: true` on the jostraca side and
[ADR-023](../../ADR.md#adr-023--g9-completes-at-the-renderer-the-reflection-sidecar-the-jostraca-bridge-and-string-interpolation-are-retired)
withdrew the ask with the phase, so it is not outstanding — the pipeline
passes an empty model instead, which is safe for a caller who wants no
model of their own and not for one who does.

**Everything about parity.** No Go port, so: no row in
`test/spec/*.tsv` (a shared row must pass in both engines), no line in
`test/spec/signature.tsv`, no entry in `BUILTIN_FUNCS` and none in
`grammar/`. Each of those is asserted in cross-port parity and a
TS-only entry turns the Go suite red. Two consequences inside the
implementation follow from it and would go away with a declaration:
arity is refused in the call rather than by the parse-time table, and
every refusal is `invalid-arg` rather than a code of its own, because
a new code needs a row in `test/spec/errcodes.tsv` and an entry in
BOTH ports' tables. The cases live in
[`ts/test/cmp.test.ts`](../../ts/test/cmp.test.ts) and become spec
rows, probed against both CLIs, if this lands.

**Whether it replaces `aontu:code` or sits beside it.** The
instruction says replaces. The spike does not settle it: `aontu:code`
carries declaration-level constructs (`record`, `enum`, the type
algebra) that a `Content` string cannot express and that the renderer's
language profiles exist to lower, and it is landed capability in both
ports rather than a proposal. §7 has the argument.

## 7. Where this sits against the decisions already taken

Two of them, and a premise of one that has gone stale since it was
written. The spike settles neither decision: a spike is evidence, and
the decision is the owner's.

**[ADR-023](../../ADR.md#adr-023--g9-completes-at-the-renderer-the-reflection-sidecar-the-jostraca-bridge-and-string-interpolation-are-retired)
retired the Jostraca bridge, and the spike does not reopen it.** G9
phase 7 was one `Project`, one `generate()` call and an exact-pinned
production dependency in both ports, and ADR-023 retired it on two
grounds: the write story is `render --out` rather than a merge over
hand-edited files, and the dependency would be an 11x install growth.
The spike takes NO dependency in either direction, and the pipe in §8 is
precisely what ADR-023 sanctions in its place — *"a generation over
hand-edited files is a workflow for a tool that owns files, and the
hand-off to one is a pipeline step the user runs."* Its enforcement
clause is unmoved: the entry is superseded by a phase that adds a
file-merge DEPENDENCY, and nothing here adds one.

**One of ADR-023's two premises has since gone stale**, which is worth
recording where it can be found. The install-growth figure was
`memfs`, which jostraca imported unconditionally for a capability used
only under `mem: true` — 15 MB against 1.4 MB for aontu's whole parser
stack. jostraca has since replaced it with an in-repo port
(`ts/src/util/memfs.ts`) and now installs `shape` and nothing else:
VERIFIED, 736 KB with no transitive dependency at all. The other
premise — the regenerate-everything lifecycle — is untouched and is
the load-bearing one.

**G9 Resolution 1 and the landed renderer are what "replaces" means.**
`aontu:code` is not a proposal: phases 1, 3, 4, 6 and 9 landed on
2026-09-06, in both ports, with the profiles, the lowering, the
provenance trace and the coverage report over them. Replacing it is
reversing landed capability in two engines, and it needs an ADR that
says so rather than a spike that works. What the spike establishes is
narrower and is the thing that was actually in doubt: the
component-primitive road is buildable and cheap, and the verbosity that
was the first of Resolution 1's three reasons against it is not real.
It does not answer the other two — see §1 (ii) and (iii) — and the
first, once withdrawn, argues for neither road.

The likeliest reading of the evidence, offered as argument and not as a
finding: these are two layers rather than two candidates. `aontu:code`
is a program — declarations, a type algebra, a lowering per target
language. A component tree is a file layout plus text. A transform that
emitted `aontu:code` units INTO a `File` would use both, and neither
would have to grow the other's job.

## 8. The other half

The jostraca side is one file, `ts/src/tree.ts`, exporting
`cmpTree(tree)`: a component tree given as data in, a define-phase
callback out. It is not an interpreter — it calls the same exported
components a hand-written generator calls, in the same define phase, so
every rule the components carry holds unchanged. Its design note is
`docs/design/AONTU.0.md` in that repository, and it records that this
is the `Tree(nodedef)` component G9 Resolution 1 ruled out as
unnecessary. It cost 150 lines.

**Neither project depends on the other.** The contract is the JSON
shape, and the integration is a pipe:

```sh
aontu ts/test/cmp-spike.aon | node tools/cmptree-gen.js --at out --folder ./build
```

VERIFIED end to end against the fixture in §1: the command writes
`build/src/planet.ts` holding the five expected lines, and `--dryrun`
writes nothing.
