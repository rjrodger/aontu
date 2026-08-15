# G1: A real constraint algebra

*Status: partly implemented — phases 1, 2 and 6 landed, phase 0 partial,
phases 3–5 outstanding. Per-phase status, pins and the corrections this
document still needs are in the [progress register](progress.md), which
is authoritative for status; this document is authoritative for design.
Part of the
[capability review](index.md) (August 2026). This document expands the
G1 entry in the review index: the vocabulary of constraint atoms, their
lattice algebra, canonical syntax for bounds, the two-band
architecture, residuation semantics, and the number-representation
defect. Sibling documents own adjacent surfaces — see
[Boundary](#boundary-what-we-will-not-do).*

## Problem

Today "type safety through unification" cashes out as five scalar
kinds (`string`, `number`, `integer`, `boolean`, `top`), literal
equality, disjunction-enums, and closedness. That is not enough to
reject the most common class of wrong output an agent produces:
values that are *type-safe but wrong*. Consider the best a
definition can do today:

```aon
# service.aon — the best that five kinds can do
service: {
  name: string       # "My Service!!" passes
  replicas: integer  # -3 passes
  port: integer      # 99999 passes
}
```

Every commented value unifies cleanly and generates. The definition
cannot state, let alone enforce, that names are DNS labels, replica
counts are bounded, and ports fit in sixteen bits. What the author
wants to write — and cannot — is:

```aon
# service.aon — not expressible today
service: {
  name: string & re("^[a-z][a-z0-9-]{0,62}$")
  replicas: integer & min(0) & max(50)
  port: integer & min(1) & max(65535)
}
```

`min`, `max`, and `re` are not in the parser's `funcMap`
(`ts/src/lang.ts`), so each becomes an `unknown_function` error. The
CUE spelling fares no better: `a: number > 0` is a parse error
(verified live for the review), and the operator characters `-` `*`
`/` `%` are deliberately reserved — `test/spec/op-chars.tsv` pins
`6/2` and `6%2` as plain text and `6-2` and `6*2` as parse errors.

A second thing an author cannot write is a cross-field invariant,
even though the reference machinery for it already exists:

```aon
# scaling.aon — refs exist, but no atom can consume one as a bound
scaling: {
  floor: 2
  ceiling: 10
  target: integer & min($.scaling.floor) & max($.scaling.ceiling)
}
```

`$.scaling.floor` is an ordinary Aontu reference
(`test/spec/ref.tsv`), but there is no constraint value for it to
parameterise.

Third, there is wrong behaviour the spec suite itself pins: both
implementations use IEEE-754 double number semantics, so
`test/spec/scalar.tsv` row `hex-big` asserts that
`a:0xffffffffffffffff` generates `18446744073709552000` — the true
value is 18446744073709551615. An int64-scale quantity (memory
bytes, a large ID) is silently corrupted by the ground truth that
is supposed to guarantee it. This document decides and bounds that
defect.

Finally, the deepest reason this gap leads the review's sequencing:
only a *symbolic* algebra can detect that a composed schema is
self-contradictory before any data arrives. If one team's file says
`port: min(1024)` and another's says `port: max(80)`, interval
intersection decides the meet is empty at schema-composition time.
Evaluate-only systems (CEL, KCL check blocks, Nickel contracts) can
never do this — they discover the contradiction only when a
candidate value happens to arrive. Everything downstream — the
[G2](g2-validation-verb.md) `vet` verb,
[G3](g3-subsumption-evolution.md) subsumption queries, JSON Schema
export, witness generation — is bounded by what the lattice can
express.

## Current state

What exists is a well-shaped kernel with the constraint stratum
missing:

- **Kinds.** `ts/src/val/ScalarKindVal.ts` implements four of the
  five kinds as lattice values (`top` lives apart, in
  `ts/src/val/TopVal.ts`): kind & matching scalar → scalar, kind &
  kind narrows (`number & integer` → `integer`), mismatch → nil.
  This is the one-row-deep version of exactly the behaviour
  constraint atoms need.
- **Conjunct normalisation.** `ConjunctVal.norm`
  (`ts/src/val/ConjunctVal.ts`) flattens nested conjuncts and sorts
  terms by `cjo` to make unification order-independent. Current
  bands: `PrefVal` 30000, `RefVal` 32500, `DisjunctVal` 35000,
  `ConjunctVal` 40000, default 99999 (`ts/src/val/Val.ts`). Terms
  fold pairwise left to right; an empty conjunct evaporates to
  `top`. This is where residual atoms must cluster and collapse.
- **Disjunct trials.** `ts/src/val/DisjunctVal.ts` trials each
  member against the peer in an error-scoped context
  (`ctx._trialMode`, the `TRIAL_NIL` sentinel); erroring members are
  dropped, duplicates removed via `same()`. A comment at ~line 263
  admits the known generation defect: `({x:1}|{y:2})&{z:3}` folds
  members incorrectly.
- **One operator, deferring correctly.** `PlusOpVal` over
  `OpBaseVal` (`ts/src/val/PlusOpVal.ts`, `ts/src/val/OpBaseVal.ts`)
  computes only when both operands are concrete; otherwise it
  re-wraps itself in a conjunct and is retried on later fixpoint
  passes (bounded by `maxcc = 9` in `ts/src/unify.ts`).
  `FuncBaseVal` (`ts/src/val/FuncBaseVal.ts`) has the same defer
  branch. These are embryonic, ad-hoc residuation — the design
  below formalises them.
- **Functions as the extension idiom.** The parser's `funcMap`
  (`ts/src/lang.ts`) holds exactly 12 builtins — `upper`, `lower`,
  `copy`, `key`, `type`, `hide`, `move`, `path`, `pref`, `close`,
  `open`, `super` — mirrored in `go/func.go`. Function canon renders
  `name(args)` reparseably (`FuncBaseVal.canon`). `ExpectVal`
  (`ts/src/val/ExpectVal.ts`) is *internal* spread-required
  machinery, not a user-facing predicate — the design cannot lean
  on a user-visible `expect()`.
- **Located errors.** `NilVal.make` (`ts/src/val/NilVal.ts`) carries
  a primary and secondary site, later-in-source first — the natural
  carrier for "constraint at site A rejected value at site B".
- **Numbers.** Both implementations pin IEEE-754 double semantics
  under two kinds, `integer` and `number`, classified by one shared
  predicate (`isIntegerKind` — `ts/src/val/numkind.ts`, `go/lang.go`);
  `go/scalar.go` reimplements JS `Number.toString` formatting, and the
  canon path adds a `.0` suffix to number-kind values so canon
  round-trips kind. The model and the six rules that make it well
  defined are recorded in `docs/design/number-model.md` and pinned by
  the 101 rows of `test/spec/number-model.tsv`.

Structurally blocking: there is no `Val` kind that can represent a
residual scalar predicate; there is no regex anywhere in the
language; the grammar has no comparison tokens and deliberately
reserves the characters that would supply them; and generation
treats every non-concrete value as an error per-Val, so each new
residual kind must define its own gen behaviour.

## Prior art

- **CUE bounds** are the worked-out reference semantics: `>x`,
  `>=x`, `<x`, `<=x`, `!=x` over numbers and strings, `=~`/`!~`
  regexes; bounds unify symbolically (`>5 & >8` simplifies to `>8`)
  and residual bounds print in exported form. Costs observed in
  CUE's history: a token surface that raised the learning floor
  (Dagger dropped CUE as its users' top complaint), and evaluator
  interactions with defaults and closedness that forced a multi-year
  rewrite. CUE's issue history also supplies a demand-ordered
  backlog: bounds and regex first, then length/count, then
  time/format validators, then custom-message wrappers.
- **Liquid types** (Rondon, Kawaguchi, Jhala, PLDI 2008) teach the
  central lesson: the winning setting of the expressiveness dial is
  predicates whose conjunction, emptiness, and implication are
  cheaply computable — a closed vocabulary, no SMT solver. F* sits
  at the other end and pays with proof flakiness and solver-version
  nondeterminism, disqualifying for a dual-implementation language
  whose product is deterministic answers.
- **Scala refined / Iron** show a shippable solver-free surface: a
  finite set of predicate constructors, each with a meet rule, an
  emptiness rule, and a subsumption rule (a small implication
  table); scalar-level `Not` composes fine without general
  complement.
- **Pkl** (`Int(isBetween(0, 1023))`), **KCL** check blocks with
  failure messages, and **Nickel** contracts are the evaluate-only
  band done well: arbitrary predicates, author messages, blame —
  but no schema-schema reasoning at all. Nickel cannot answer "do
  these two schemas conflict?".
- **PVS predicate subtyping** contributes the reporting pattern:
  obligations the checker cannot discharge are surfaced explicitly
  (TCCs), never silently accepted — the model for honestly
  reporting the evaluate-only band.
- **LIFE residuation** (Aït-Kaci & Podelski, TOPLAS 1994):
  an insufficiently-instantiated function suspends as a passive
  constraint and re-fires as unification refines values, with
  determinacy conditions worked out — the principled version of
  Aontu's existing defer-and-retry loops.
- **Semantic subtyping** (Frisch/Castagna) is the warning label:
  general negation is sound only atop months of emptiness-procedure
  machinery, twice over for TS and Go. Scalar negation does not
  need it.

## Design space

**A. CUE-style bound tokens** (`>0`, `>=1 & <10`, `=~"^[a-z]+$"`).
Maximum familiarity — CUE spellings are in LLM training data and are
terse. But it spends at least seven new operator tokens in a grammar
that deliberately reserves its operator characters
(`test/spec/op-chars.tsv`), contradicts the recorded language
principle "prefer new functions instead of creating new tokens or
syntax" (IDEAS.md), grows the surface a constrained-decoding grammar
([G7](g7-machine-access.md)) must carry, and commits both parsers to
new precedence interactions with `&`, `|`, `*`, and `?`.

**B. Function-form atoms** (`min(0)`, `max(10)`, `re("^[a-z]+$")`,
`len(c)`). Zero grammar change: atoms enter through `funcMap`, the
established extension point; canon already renders functions
reparseably; the Go port mirrors a registry entry, not a grammar
change. Cost: more verbose than `>0`, unfamiliar to CUE-trained
readers and models — an agent will sometimes emit `>0` and must be
redirected by a good parse hint.

**C. Hybrid: tokens as sugar over function canon.** Parse `>0` but
canonicalise to `min`/`above` form. Gets familiarity and a single
canonical form, but pays the full token cost of A *plus* a
two-spellings documentation burden, and the write/read asymmetry
(write `>0`, read back `above(0)`) confuses exactly the
round-tripping agents the language targets.

**D. Evaluate-only predicates only** (the CEL/KCL position). Cheapest
to build: check concrete data, never reason symbolically. But it
forfeits emptiness detection and subsumption — the two capabilities
the review identifies as the lattice's whole advantage — and reduces
G1 to a feature CEL already does better. This is Band B alone, and
it fails the brief.

**E. Constraint mini-language in strings**
(`constraint("0 <= _ <= 10")`). No grammar change, arbitrary syntax
freedom — and a second parser to keep in TS/Go parity, opaque to
canon, tooling, and grammar-constrained decoding. Rejected without
reservation.

**Recommendation: B**, with C's sugar deferred as an open question
rather than rejected forever. The function form is the only option
consistent with the codebase's actual extension mechanism and the
language's recorded design principle; it keeps the grammar — the
acquisition cost for both humans and models — frozen; and it makes
TS/Go parity a registry-entry exercise rather than a parser project.
The familiarity gap is mitigable at low cost: a targeted parse hint
("`>` is not an Aontu operator; write `min(0)` / `above(0)`") in
`ts/src/hints.ts` / `go/hints.go`, plus the published grammar and
examples that G7 owns.

## Proposed design

### Vocabulary

Nine new builtins join `funcMap` (`ts/src/lang.ts`) and the Go
registry (`go/func.go`). Eight are Band A — full lattice citizens
with defined meet, emptiness, subsumption, and canonical form. One is
Band B — evaluate-only, honestly reported as such.

| Atom | Band | Meaning |
|------|------|---------|
| `min(x)` | A | value ≥ x (number or string, lexical) |
| `max(x)` | A | value ≤ x |
| `above(x)` | A | value > x |
| `below(x)` | A | value < x |
| `neq(x, ...)` | A | value equals none of the listed scalars |
| `re(p)` | A | string matches pattern p (unanchored) |
| `len(c)` | A | length/count satisfies integer constraint c |
| `unique()` | A | list elements pairwise distinct |
| `must(c, msg)` | B | evaluate-only check with author message |

Numeric bound atoms imply the `number` kind; string-argument bounds
and `re` imply `string`; `unique` implies list; `len` applies to
strings (length), lists (element count), and maps (entry count),
with the domain fixed by the peer. Mixing domains in one meet
(`min(0) & min("a")`) is empty and yields nil.

`len` is compositional: its argument is any integer-domain
constraint, so `len(3)` means exactly 3 and `len(min(2) & max(5))`
means between 2 and 5 — "between 2 and 5 replicas" is
`replicas: len(min(2) & max(5))` on the replica list (there is no
list kind keyword; the domain resolves against the peer). The meet
of `len(c1)` and `len(c2)` is `len(c1 & c2)`; its emptiness is the
emptiness of `c & integer & min(0)`. The count/cardinality atom
therefore reuses the numeric algebra instead of duplicating it.

### The residual value and the algebra

A new Val kind, `ConstraintVal` (`ts/src/val/ConstraintVal.ts`, Go
`go/constraint.go`), is the normal form of any meet of Band A atoms
over one domain: an interval (endpoints plus open/closed flags), an
exclusion set (from `neq`), a set of regex atoms, a nested integer
constraint for `len`, and a uniqueness flag. Rules:

- **Meet.** atom & atom (same domain) → interval intersection,
  exclusion-set union, regex-set union, recursive `len` meet.
  `min(0) & min(5)` → `min(5)`. Constraint & concrete scalar →
  membership check → the scalar, or nil. Constraint & kind → domain
  narrowing (`integer & min(0)` keeps both; `string & min(0)` is
  nil). Meets are commutative and idempotent by construction, so
  the lattice guarantee is preserved.
- **Emptiness**, decided eagerly at unification time: empty interval
  (`min(5) & max(3)` → nil, with both sites reported); an
  integer-narrowed interval containing no integer
  (`integer & above(1) & below(2)` → nil); exclusions deleting a
  point interval, which under the four-leaf number tower **requires a
  narrowed leaf** — `min(3) & max(3)` admits the point 3 in any
  numeric leaf and `neq(3)` excludes only the integer `3`, so that
  meet is NOT empty, while `integer & min(3) & max(3) & neq(3)` → nil
  (re-derived in phase 0; the normative statement is
  `docs/reference-language.md`, "The constraint algebra"); `len(c)` empty
  iff its integer constraint is. Regex emptiness is deliberately
  approximate: distinct `re` atoms accumulate as a residual and are
  never declared empty — sound (no false conflicts), incomplete
  (some contradictions surface only against data). This follows the
  survey's regex-intersection approximation and avoids a product-
  automaton procedure in two implementations.
- **Subsumption** (consumed by [G3](g3-subsumption-evolution.md),
  which owns its exposure): interval containment plus exclusion-set
  and regex-set superset checks; `re` atoms compare by syntactic
  equality only; `must` is opaque and reported as evaluate-only
  residue, PVS-TCC style.
- **Canonical form.** A residual `ConstraintVal` renders as its
  normalised atoms joined by `&` in a fixed order — kind, lower
  bound, upper bound, `neq` (arguments sorted), `re` (patterns
  sorted), `len`, `unique`, `must` — matching the existing canon
  style (`docs/reference-language.md`): no spaces, reparseable.
  Because atoms are functions, `parse(canon(v)) == v` holds through
  the existing function-canon path: the reparse produces a conjunct
  of atoms that normalises back to the identical `ConstraintVal`.

```aon
# canon round-trip
a: integer & max(10) & min(0) & min(2)
# canon: {"a":integer&min(2)&max(10)}
```

### Conjunct ordering and disjunct trials

`ConstraintVal` (and unresolved atom functions) take `cjo = 50000`:
after `ConjunctVal` (40000) so flattening happens first, before the
default band (99999) where concrete values live. Constraint atoms
therefore cluster adjacently in `ConjunctVal.norm` and fold into a
single normalised residual before meeting the concrete term. Ties
never depend on sort stability: normalisation, not ordering, defines
the result — but the Go port must still use a stable sort
(`sort.SliceStable`) in `go/conjunct.go` to keep canon output
byte-identical for mixed bands.

In `DisjunctVal` trials, atoms behave as ordinary values:
`(min(0) | string) & -5` trials `min(0) & -5` (nil, member dropped)
and `string & -5` (nil), leaving `|:empty`. A *residual* member adds
no trial errors, so it survives the trial — disjunctions of
constraints stay symbolic until data arrives. The known
`DisjunctVal.gen` fold defect (`ts/src/val/DisjunctVal.ts` ~263)
must not be worsened: spec rows pin generation for
constraint-bearing disjuncts (`*8080 | min(1024)` generates `8080`)
before any code lands, and the fold is guarded against conjoining a
residual constraint into a chosen branch.

### Residuation and cross-field bounds

An atom whose argument contains an unresolved reference, or whose
peer is not yet concrete, *residuates*: it produces no error,
remains in place, and is re-evaluated on subsequent fixpoint passes
— the LIFE semantics, formalising the defer branches that
`OpBaseVal` and `FuncBaseVal` already contain. Because atoms only
ever suspend or intersect (never force evaluation), evaluation
order cannot change results. In the `scaling.aon` example from the
[Problem](#problem) section, `target` residuates until `floor` and
`ceiling` are concrete, then normalises to `integer&min(2)&max(10)`.
The pass bound remains `maxcc = 9` (`ts/src/unify.ts`); whether
exhaustion with live residuals becomes a distinct semantic error is
owned by [G5](g5-trust-contract.md). A residual that survives to
generation is an error, exactly like an unresolved kind today.

### Band B: `must`

`must(c, msg)` wraps any Aontu value `c` as an evaluate-only check:
it residuates until its peer is concrete, then requires the peer to
unify with `c`; on failure the author's message is attached to the
nil. `must` never participates in emptiness or subsumption, and any
report that includes one states the check was evaluate-only. Its
initial predicate power is deliberately thin — the language has no
boolean expression layer, and [G8](g8-generation.md)'s total
combinators will widen what `c` can say. Its architectural point is
the honest channel: a place for domain rules beyond the algebra that
does not pretend to be algebra.

```aon
tier: string & must("gold" | "silver" | "bronze",
  "tier must be a support tier name")
```

### Error behaviour

A constraint violation is a `NilVal` with two sites — the
constraint's and the value's, later-in-source primary as today
(`ts/src/val/NilVal.ts`) — and a message in the existing family:
`Cannot unify value: 99999 with value: max(65535)` (only the
asserted substring is contractual, per the spec-suite convention).
The nil's `details` field carries machine-readable data: the failing
atom, the normalised admissible interval/sets, and any `must`
message. The rendering of that data into reports, codes, and formats
is owned by [G2](g2-validation-verb.md); G1 only guarantees the data
is present.

*(As landed in phase 1, `details` carries `expected` — the normalised
residual's canon, which IS the admissible interval/exclusion set — and
`actual`, the peer's canon, byte-identical in both ports. Per-atom
attribution ("which atom rejected it") is **not** carried: when several
atoms are unsatisfied there is no single failing one, and picking a
representative is a report-shaping decision. It is therefore deferred
to G2 phase 2, where the finding object is designed and the choice can
be made once for every code rather than guessed here. `must` messages
arrive with phase 5.)*

### Numbers: decide and bound the defect

Decision: Aontu **keeps IEEE-754 double semantics** — and removes
the *silent* part of the defect. An integer-kind literal whose
double representation is not exact becomes a located parse-time
error (`lossy integer literal`) instead of rounding. Number-kind
literals are untouched: approximation is expected of `number`. The
language contract becomes explicit: integers are exact in
[−2^53, 2^53]; the bounds algebra compares exactly within that
range; outside it, the definition refuses to pretend.

**The contract is now welded to the kind rule, not advisory.** Since
this document was drafted the number model has landed
(`docs/design/number-model.md`, pinned by the 101 rows of
`test/spec/number-model.tsv`), and its first rule decides exactly
which literals the exactness contract binds. A numeric literal is
integer kind if and only if its source text contains no `.`, its
value is integral, and its value lies within the int64 range — the
last tested against the exact `float64` bounds
(`n >= -9223372036854775808.0 && n < 9223372036854775808.0`), never
by round-tripping through `int64`, whose out-of-range behaviour the
Go specification leaves implementation-defined. One predicate,
`isIntegerKind` (`ts/src/val/numkind.ts`, `go/lang.go`), runs at
every construction site in both ports. So "which values must be
exact" is a mechanically checkable question with one answer, and the
two implementations agree by construction rather than by accident:
before the rule landed, `a: 1e21 & integer` succeeded in TypeScript
and failed in Go — a silent, magnitude-dependent parity break in the
very stratum the bounds algebra will compare over.

The rule also relocates this design's remaining work.
`0xffffffffffffffff`, `0x10000000000000000000000000000000` and
`100000000000000000000` all sit outside the int64 window, so they
are *number* kind, and the lossy-literal error does not reach them
at all — approximation is what `number` promises, and their
`test/spec/scalar.tsv` rows stand. What is left for Phase 6 is the
band the kind rule deliberately admits: integer-kind literals in
(2^53, 2^63), in range yet already rounded before any rule sees
them. The suite pins that band as agreed-but-wrong behaviour in one
row — `number-model.tsv`, `lossy-above-pow53`, where
`x:9007199254740993` generates `9007199254740992` in both ports.
Phase 6 is what turns that row loud.

**Canon now round-trips kind, which this design depends on more than
the original text admitted.** Residual constraint atoms must survive
canon — `parse(canon(v)) == v` is asserted throughout this design,
for every atom and every normalisation rule — and until R4 an
integral number-kind value did not: `x:1.0` canoned to `{"x":1}`,
which reparses as an *integer*. A number-kind scalar now always
renders with a fraction or an exponent (`1.0`, `0.0`,
`100000000000000000000.0`; `1e+21` unchanged), so a bound's argument
keeps its kind across a round trip and `min(1)` and `min(1.0)` are
distinguishable in canonical text. The suffix belongs to canon
alone: string coercion inside `+` keeps JavaScript parity, so
`"a"+1.0` is still `"a1"`.

There is a knock-on for [G6](g6-distribution.md)'s canon hashing.
Two semantically different values no longer share canon text, which
retires one instance of the "canon is not semantically complete"
gap its hash form has to close — and it is the dangerous direction,
a false "unchanged". G6 owns that definition; this is a note that
the ground under it moved favourably, not a redesign of it.

Sequencing: Phase 6 is a breaking row change under
[G3](g3-subsumption-evolution.md)'s process — the only deliberate
row change in this design. Migrating to arbitrary-precision
decimals (CUE's choice) is explicitly out of scope: it would touch
every scalar path in two implementations, destabilise the canon
formatting that `go/scalar.go` painstakingly matches to JS
`Number.toString`, and invalidate canon-hash pinning
([G6](g6-distribution.md)) for every existing document. Loud
refusal now preserves the option later — see
[Boundary](#boundary-what-we-will-not-do) for the shape that option
takes.

### API/CLI surface

None new. The algebra surfaces through existing evaluation and
canon; validation verbs are G2's, subsumption queries G3's, query
and provenance G7's. G1's deliverable is that those surfaces have
something worth exposing.

## Boundary: what we will not do

- **No SMT solver.** Solver nondeterminism and proof flakiness are
  disqualifying for a dual-implementation language whose product is
  deterministic answers (index: traps to refuse).
- **No general negation or complement.** Sound only atop
  semantic-subtyping machinery costing months twice over; `neq` and
  exclusion sets cover the scalar cases that matter (index trap).
- **No comparison-operator tokens.** The `op-chars.tsv` reservations
  stand; grammar size is acquisition cost, and the surface-creep
  trap is CUE's documented scar (index trap; sugar remains an open
  question, not a plan).
- **No arbitrary-precision decimal migration.** Bounded instead by
  loud lossy-literal errors and an explicit exactness contract; full
  migration would destabilise canon, parity, and semantic hashing.
  The door that stays open is an **opt-in literal prefix** in the
  manner of boru's `0d` (`docs/design/number-model.md`): an exact
  leaf reachable only through new literal syntax adds a kind without
  changing the meaning, the value, or the canon of any literal
  already written. That property is why refusing the migration now
  costs nothing later — the refusal is a decision not to widen the
  default number, not a decision against exactness. *(Since decided:
  the opt-in tower is being adopted —
  `docs/design/number-tower.md`. The boundary holds as stated: the
  default kinds are not migrated, exactness arrives as new opt-in
  leaves, and this document's bound atoms gain a cross-leaf ordering
  question recorded in that proposal's open questions.)*
- **No time/format/net validator library.** That is the later
  stdlib stratum in CUE's demand ordering, and its hermeticity
  questions belong to [G5](g5-trust-contract.md).
- **No quantified cross-child cardinality atoms.** "Exactly one
  child with `primary: true`" awaits [G8](g8-generation.md)'s total
  combinators (`len` over a filter); until then `must` is the honest
  stopgap.
- **No user-defined predicates or functions.** Recursion trades away
  the termination guarantee (index trap); abstraction power is
  G8's question to resolve on the total side.
- **No error formats, codes, or CLI verbs** — G2 owns them; **no
  subsumption exposure** — G3; **no budget/termination semantics** —
  G5.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TS/Go regex divergence (JS engine vs RE2) | High | High | Pin an RE2-compatible pattern subset in the spec; reject non-portable patterns (backreferences, lookaround) at construction with a located error; spec rows for rejected patterns |
| Canon round-trip breaks on bound arguments (float formatting) | Medium | High | Reuse the existing JS-number formatter on both sides (`go/scalar.go`); a round-trip spec row for every atom and every normalisation rule |
| `DisjunctVal.gen` fold defect compounds with residual members | Medium | Medium | Spec rows pinning disjunct-of-constraint generation land before code; guard the fold against conjoining residuals |
| Residuals silently unresolved at `maxcc = 9` | Medium | High | Spec rows assert unresolved residual → generation error; escalate the silent-stop question to G5 as designed there |
| Conjunct sort instability diverges between implementations | Low | Medium | Result defined by normalisation, not order; `sort.SliceStable` in `go/conjunct.go`; parity rows with mixed-band conjuncts |
| Surface creep: 9 new builtins (12 → 21) | Medium | Medium | One family, one reference section, zero grammar change; demand-ordered phases allow stopping after bounds+regex |
| Agents emit CUE spellings (`>0`, `=~`) | High | Low | Targeted parse hints in `ts/src/hints.ts` / `go/hints.go`; published grammar and examples via G7 |
| Breaking spec-row change for lossy integer literals above 2^53 | Certain | Low | One row (`number-model.tsv`, `lossy-above-pow53`); single, deliberate, documented change; assessed with G3's breaking check once it exists |
| Performance: per-pass regex recompilation, interval churn | Low | Medium | Compile-once cache keyed on pattern; intervals are O(1) merges; add perf-sensitive rows to the parity suite |

## Implementation plan

Every phase is spec-first: TSV rows are authored and reviewed before
any implementation, TypeScript (canonical) lands first, the Go port
follows, and `make test` runs both. Nothing may regress: all 527
rows of the shared suite (46 row-bearing files;
`test/spec/divergent.tsv` is the parity ledger and carries none)
except the single row Phase 6 deliberately amends, and the canon
round-trip property throughout.

*(Correction, since first draft: the guard is stated in this document
and in G2/G5 as `parse(canon(v)) == v`, which is too strong and was
enforced by nothing. Canon deliberately preserves unevaluated ghost
applications — `key()`, `pref(…)`, an unexpanded `&:` template — so
reparsing a canon runs one more evaluation round and legitimately
resolves them; 15 of the 491 canon rows move on that first reparse.
The property that does hold for every row, and is now asserted by both
spec runners, is CONVERGENCE: canon reaches a fixpoint immediately
after that round, so it can never oscillate or drift. Constraint
residuals specifically do satisfy the stronger form. Adding the guard
immediately found one canon that could not be reparsed at all — the
`&:` required-child placeholder rendered as `{"r":}` in both engines —
which is fixed: it now canons as `top`, and no row is exempt.)*

1. **Phase 0 — algebra on paper (S).** Write the pairwise meet /
   emptiness / subsumption tables and the canonical atom order into
   a new section of `docs/reference-language.md`; author
   `test/spec/constraint-bound.tsv`, `constraint-re.tsv`,
   `constraint-len.tsv`, `constraint-cross.tsv` with canon, gen, and
   err rows, including round-trip and order-independence rows
   (`min(0)&max(10)` vs `max(10)&min(0)` → identical canon).
   *(Since done: the algebra section is in
   `docs/reference-language.md` ("The constraint algebra"),
   re-derived over the four-leaf tower — cross-leaf ordering decided
   (bounds are exact order over the number line, leaf-agnostic;
   `neq` excludes by scalar identity, so point-deletion emptiness
   requires a narrowed leaf), endpoint tightening decided (lazy
   endpoints, eager emptiness), `len` pinned to Unicode code points.
   The four spec files are authored as DRAFTS in `test/spec/draft/`
   — the parity-probe rule forbids executable rows for unimplemented
   behaviour — and are promoted with fresh probes as each phase
   lands. The `DisjunctVal.gen` fold defect is fenced from the
   constraint side by probed guard rows in `test/spec/disjunct.tsv`
   plus draft generation expectations.)*
2. **Phase 1 — numeric and lexical bounds, `neq` (M).** New
   `ts/src/val/ConstraintVal.ts` plus atom entries in `funcMap`
   (`ts/src/lang.ts`); `cjo` slot and fold interplay in
   `ts/src/val/ConjunctVal.ts`; messages in `ts/src/err.ts` /
   `ts/src/hints.ts`; rebuild committed dist (`make build-ts`).
   Then `go/constraint.go`, `go/func.go`, `go/conjunct.go`,
   `go/hints.go`.
3. **Phase 2 — `re` (M).** Pinned RE2-compatible subset; portability
   validation at construction in TS (`ts/src/val/ConstraintVal.ts`);
   Go side is native `regexp`. Spec rows for matching, residual
   accumulation, and rejected patterns.
   *(Since done. Two things the plan text did not anticipate. The
   portability check could not be "validate in TS, use native regexp
   in Go": Go's RE2 refuses some non-portable constructs but ACCEPTS
   others JavaScript reads differently — `(?P<n>` versus `(?<n>`,
   `\x{41}` versus `A`, `\p{L}` which JavaScript silently reads
   as a literal `p` without the `u` flag. So the subset is one shared
   syntactic scanner (`nonPortableRe`) mirrored in both ports and run
   BEFORE either host engine compiles, with the host's own compile
   failure folded into the same refusal. It is a whitelist where the
   spellings diverge — `(?` opens only `(?:` — because a blacklist
   admits the next divergence silently. Second, refusal needed its own
   registered code, `constraint_pattern` (class conflict): phase 1's
   one-code-for-the-family rule would have given the atom's most likely
   authoring mistake a generic message. The reason text is a fixed
   string, not the host's, so the frame stays byte-identical across
   ports. Rows: `test/spec/constraint-re.tsv`.)*
4. **Phase 3 — `len` and `unique` (M).** `len` reuses the integer
   algebra recursively; domain resolution against string/list/map
   peers touches `ts/src/val/ListVal.ts` and `MapVal.ts` membership
   checks (`go/listval.go`, `go/mapval.go`).
5. **Phase 4 — cross-field arguments and residuation (M).**
   `RefVal`-valued atom arguments; residuation rows including
   forward references and spread interplay (`&:` templates carrying
   bounds onto children — the existing `spread-*.tsv` files must
   pass unchanged); fixpoint behaviour rows at the `maxcc` boundary.
6. **Phase 5 — `must` (S).** Wrapper Val, message plumbed into
   `NilVal.details`; rows asserting evaluate-only reporting; the
   report rendering itself waits for G2.
7. **Phase 6 — number exactness (S).** Lossy-integer-literal error
   beside `isIntegerKind` in `ts/src/lang.ts` and `go/lang.go`: a
   literal that passes the integer-kind test but whose value is not
   exactly representable — the (2^53, 2^63) band — becomes a
   located nil instead of a rounded value. Amend
   `number-model.tsv` row `lossy-above-pow53` to `err` mode — the
   one sanctioned regression, in its own commit. The `scalar.tsv`
   extreme-magnitude rows are untouched: the kind rule makes those
   literals number kind, so the error never reaches them.

Ongoing, per the review's method: property-based differential
testing of the algebra laws (commutativity, idempotence,
normalisation convergence) across TS and Go, seeded from the atom
vocabulary — the ShardStore lightweight-formal-methods pattern
applied to the language itself.

## Open questions

- **Token sugar later?** Should `>0` ever parse as sugar for
  `above(0)` once adoption data exists? For: CUE familiarity and
  agent emissions observed in the wild. Against: grammar budget,
  two spellings, the op-chars reservation policy. Decide after G7
  publishes the grammar and real usage shows how often the hint
  fires.
- **String length semantics.** TS strings are UTF-16 code units, Go
  strings are bytes with rune iteration — `len` on strings must pin
  one definition (Unicode code points is least surprising and costs
  Go nothing) and spec-test the astral-plane cases. A parity
  landmine either way; a Phase 0 row, not an implementation
  accident.
- **Eager kind-tightening.** Should `integer & above(0.5)`
  canonicalise to `integer&min(1)`, and `integer & above(1) &
  below(2)` be eagerly empty (as proposed), or should integer
  tightening be lazy (emptiness only, no endpoint rewriting)? Eager
  gives stronger composition-time errors and sharper subsumption
  for G3; lazy keeps canon closer to source. The Phase 0 meet
  tables must pick one and pin it.
- **Bare-`min` kinds.** `min(0)` alone implies `number`; should a
  lint (G2's territory) nudge authors to write the kind explicitly
  (`integer & min(0)`) for agent legibility, or is the implication
  enough?
- **`unique` with a projector.** `unique()` compares whole
  elements; uniqueness by key ("no two services share a port")
  needs a projection, which drags in G8's combinator questions.
  Defer, but reserve the arity.
- **How much admissible-set detail travels in `NilVal.details`.**
  Repair-loop evidence says admissible alternatives drive agent
  self-correction; the exact shape (interval endpoints? nearest
  admissible value?) should be settled jointly with G2's report
  schema so the data is produced once, correctly.
