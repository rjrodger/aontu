# Design proposal: the number tower

*Status: design proposal (August 2026). Direction decided — Aontu will
mirror boru's number type structure; this document works out how, and
records the implications and the places where Aontu must deviate.
Nothing here is implemented. The current, implemented model is
[number-model.md](number-model.md); this proposal builds on its six
rules (R1–R6) and supersedes parts of the
[G1](../capability-review/g1-constraint-algebra.md) boundary.*

Every behavioural claim about boru below was verified by building and
running its CLI from a local clone; every claim about Aontu's current
behaviour was verified against both implementations.

## The decision

Aontu adopts the structure of boru's `Scalar/Number` subtree:

```
number                        (becomes a pure supertype)
├── integer      int64-window exact       (exists today)
├── float        IEEE-754 binary64       (today's "number" leaf, renamed)
├── biginteger   unbounded exact integer  (new, opt-in via 0d)
└── bigdecimal   exact base-10 decimal    (new, opt-in via 0d)
```

The two new leaves are reached only by literal syntax — the `0d`
prefix (`0d123` → biginteger; a `.` or exponent in the source, as in
`0d0.1` or `0d1e3`, → bigdecimal) — never by promotion, coercion, or
inference. A document that does not write `0d` or `float` means
exactly what it means today. That property is why boru's design is
the right one to copy: an opt-in prefix adds a leaf without changing
the meaning of any existing document.

Scope: the `number` subtree only. Boru's wider tree (String
subtypes, Microns, Path) is out of scope, though the restructured
`ScalarKindVal` lattice deliberately leaves room for depth elsewhere
later.

## Why unification changes the design

Boru is an evaluator: values are computed, compared, and printed.
Aontu is a unifier: values are points in a lattice obeying laws —
`a & a == a`, `a & b == b & a`, and canon is a function of the value.
Three boru behaviours, all verified live, are incompatible with those
laws, and Aontu must deviate on each:

1. **Boru preserves decimal scale in rendering but not in identity.**
   `0d0.10 eq 0d0.1` is true, yet `0d0.10` renders back as `0d0.10`.
   That is one value with two renderings — legal in an evaluator,
   impossible where canon must be a function of the value: if they
   are the same value they must render identically, and if they were
   distinct values then `0d0.10 & 0d0.1` would have to *fail* while
   being numerically equal. So Aontu normalises at parse: trailing
   zeros dropped, exponents folded, one rendering per value. Scale is
   presentation, not value, in a unification lattice.

2. **Boru's decimal arithmetic silently rounds.** The apd context
   (IEEE decimal128: 34 significant digits, round-half-even) is
   threaded through *every* decimal operation, not just division —
   verified: `0d1234567890123456789012345678901234.5 add 0d0` loses
   its fraction. Boru needs this because it has division; rounding
   somewhere is unavoidable. Aontu's entire numeric operator surface
   is `+`, `upper()`/`lower()` (ceiling/floor), and unary minus — all
   of which are **exact** in scaled-decimal arithmetic. Aontu
   therefore adopts *exact-always* semantics: no context, no rounding
   mode, no `with-decimal` machinery — and where boru rounds
   silently, Aontu errors loudly (a spec-fixed coefficient budget,
   below). For a ground-truth language, silent rounding is precisely
   the failure mode the exact leaves exist to eliminate.

3. **Boru's `eq` crosses leaves; Aontu's unification must not.**
   In boru, `5 eq 0d5` and `0.5 eq 0d0.5` are true (comparison
   projects both sides to an exact rational) while `0.1 eq 0d0.1` is
   honestly false. Aontu's landed R3 discipline is that concrete
   scalars of different kinds never unify (`1 & 1.0` errors), and the
   tower keeps it: `5 & 0d5` is an error. The argument is not purism:
   if cross-leaf unification succeeded, the result would have to
   *have* a kind, and either choice makes `&` asymmetric in kind —
   exactly the ambiguity that made `1 & 1.0` an error. Equality
   *tests* across leaves belong to G1's future comparison atoms (which
   should use boru's exact-rational ordering), not to unification.

Everything else mirrors boru directly.

## The design, decision by decision

### D1 — `number` becomes a pure supertype; `float` is a new kind keyword

Today `number` is simultaneously the binary64 leaf and the parent of
`integer`. Under the tower it is only the parent: the set of all
numeric values, of any leaf. The binary64 leaf gets the keyword
`float`.

Kind-with-kind meets: `number & <leaf>` → that leaf; two distinct
leaves → error (disjoint value sets have no common lower bound);
`number & number` → `number`. Kind-with-value: `number & v` → `v`
for a value of any numeric leaf; `<leaf> & v` → `v` only when `v` is
of that leaf.

The `super()` ladder gains a real rung: `super(1)` → `integer`,
`super(1.5)` → `float` (today: `number` — one landed spec row flips),
`super(integer)` → `number`, `super(number)` → `top`.

Migration is remarkably gentle: a schema constraint written `number`
keeps admitting everything it admitted (and additionally admits the
new exact leaves — see Implications). Nothing in the repository or
the shared suite uses `float` as a meaningful token today (verified:
it is a bare-text string in both ports, appearing in zero spec-row
sources).

### D2 — leaves are disjoint; identity is kind + value

Mirrors boru's typing exactly (`0d5 is Integer` → false, verified).
`integer & biginteger` (kinds) → error; `5 & 0d5` (values) → error;
`1 & 1.0` stays an error. R3's identity rule extends: two concrete
scalars are the same only when kind and value both match, where
"value match" for the big leaves is numeric comparison of the exact
representation — **never** Go pointer equality. (Audit fact: today's
`ps.peg == s.peg` in `go/scalar.go` and `go/disjunct.go` would
compare `*big.Int` pointers, silently breaking dedup and unification
— these become per-kind value comparisons.)

### D3 — literal syntax mirrors boru's matcher, minus its warts

Accepted: `[+-]? 0[dD] digits [. digits] [(e|E) [+-] digits]`, with
single `_` separators between digits (the landed separator rule
applies unchanged). Leaf choice follows the source, mirroring both
boru and Aontu's own R1 precedent (`.` in source decides): a `0d`
literal containing `.`, `e`, or `E` is bigdecimal; digits only is
biginteger.

Two boru edges are deliberately not mirrored: `0d-5` evaluates in
boru only through a text-fallback accident (its own matcher rejects
it) — Aontu rejects it cleanly, the sign belongs before the prefix
(`-0d5`); and `0d.5` / bare `0d` are syntax errors in both.

Baseline change to pin first: today `0d12` is the bare string
`"0d12"` in both ports, `0d1.5` is a path-ref error (the `.` splits
it), and `-0d5` is a `negative` error. The literal must win over the
member-access grammar for the dotted forms — the matcher claims a
trailing `.` only when a digit follows, so `x:0d1.5` is one literal
while dot-adjacency edges (`0d1.e2`) fall out of the grammar and get
pinned in the spec phase.

### D4 — one value, one rendering: normalise at parse

`0d0.10`, `0d0.1`, and `0d1e-1` all parse to the same value, whose
canon is `0d0.1`. Rendering is boru's otherwise: sign before the
marker (`-0d5`), plain form at every magnitude, never scientific.

The `0d` prefix identifies the *family*, not the leaf, so the R4
`.0`-suffix device recurs for the leaf split: an **integral
bigdecimal always renders with one decimal place**. `0d1.5e2` (its
source has an exponent, so it is bigdecimal by D3) has value 150 and
canon `0d150.0`; `0d1e3` canons as `0d1000.0`; plain `0d1000` stays
biginteger and canons as `0d1000`. Without the marker,
`parse(canon(0d1e3))` would come back as a *biginteger* — a
kind-flipping canon of exactly the sort R4 exists to prevent.
Normalisation is therefore: strip fraction to minimal scale, fold
exponents, but never below one decimal place for a bigdecimal.
(Bigdecimal 1000 and biginteger 1000 are distinct lattice points —
kinds are disjoint per D2 — so their canons must differ.)

### D5 — negative zero: R2 extends to the tower

`-0d0` and `-0d0.0` normalise to `0d0` everywhere (AST, gen, canon).
Deviation from boru, which preserves `-0d0.0` through rendering and
gives it a totalOrder slot. Aontu has no total-order surface, R2 is
a landed rule, and JSON has no negative zero.

### D6 — arithmetic: the exact ladder, exact-always, loud limits

The `+` promotion rules mirror boru's tower with one substitution
(no rounding):

- exact ladder: `integer < biginteger < bigdecimal` — a mixed exact
  operation promotes to the widest operand, computed exactly
  (`1 + 0d0.5` → `0d1.5`);
- `float` stays off the ladder with classic contagion against
  `integer` only (`1 + 2.0` → `3.0`, unchanged R5 behaviour);
- **float ⊕ big is a hard error, both orders** — "a Big type never
  silently becomes a binary Float" (boru's rule, mirrored verbatim;
  its two-sided error message naming both leaves is worth copying);
- `integer + integer` is **computed exactly** and its result must
  satisfy the R1 storage contract (integral, int64 range, *and*
  exactly representable in binary64) or it is a located error with
  the `0d` hint. Today's float64 addition silently rounds sums of
  exact operands — `4503599627370496 + 4503599627370497` yields
  `9007199254740992` instead of `…993` — which the tower's
  exact-or-error creed cannot tolerate. TypeScript computes the sum
  in `bigint`, Go in checked `int64` (boru's checked-add precedent);
  both then apply the same storage test, so a sum Go could hold but
  TypeScript could not (double-inexact above 2^53) errors in *both*
  ports rather than diverging. Result kind is unchanged R5.

String concatenation is defined for the new leaves and uses the
**plain digit rendering, without the `0d` marker** — `"x" + 0d5` →
`"x5"`, `"q" + 0d0.1` → `"q0.1"` — matching the existing rule that
concatenation renders digits, not kind decoration (`"q" + 0.001` is
`"q0.001"`, and the R4 canon suffix never leaks into strings). This
must be stated because the audit shows both ports would otherwise
fail differently: TypeScript's `+` would leave the op unresolved
while Go's `primStr` would coerce a big peg to the empty string — a
silent divergence. The string × leaf pairs join the cross-product
rows.

`upper()`/`lower()` on the big leaves are exact ceiling/floor and
keep the argument's kind (R5). Unary minus negates exactly. Results
never demote (`0d7 + -0d2` is biginteger `0d5`, mirroring boru).

Where boru consults its 34-digit context, Aontu instead enforces an
**exactness budget**: a fixed, spec-pinned limit on *both* the
coefficient digits *and* the absolute scale of any bigdecimal
(proposed: 4096 each), enforced at parse time, through every
operation, and at render. A literal or an exact result that exceeds
either bound is a located error (`decimal_budget`), never a rounded
value. Both bounds are needed: scale alignment can inflate
coefficients without bound (`0d1e4000 + 0d1e-4000`), and a
one-digit-coefficient literal like `0d1e1000000000` would otherwise
sail past a result-coefficient check only to demand a gigabyte of
zeros at plain-form render time (and overflow an `int32` scale
field) without any arithmetic occurring. The budget is a resource
guarantee in the G5 family — deterministic, identical in both ports,
and pinned by spec rows at both boundaries.

### D7 — lossy literals become errors with a migration path

This adopts G1's already-designed Phase 6, improved by the tower's
existence: an integer-source literal (decimal or base-prefixed)
whose value cannot be held exactly becomes a located parse-time
error whose hint names the fix — *"write `0d<digits>` for an exact
integer"*. Boru's equivalent error suggests only an approximate
float, even though its own `0d` form would be exact (verified); Aontu
should not repeat that missed opportunity.

This flips four rows to `err`: the three G1-sanctioned hex rows
(`hex-big`, `hex-big-canon`, `hex-huge`) **and**
`number-model.tsv:lossy-above-pow53`, whose source
`9007199254740993` pins today's silent rounding and is precisely the
behaviour D7 abolishes — leaving it in `gen` mode would make a
correct D7 implementation fail the shared contract. Together these
**resolve issue #21** exactly as its ledger entry prescribes: the
divergent (2^53, 2^63) window becomes a refusal in both ports, and
the ledger entry is deleted rather than answered with a renderer
choice.

### D8 — representation: no new dependencies

- **Go:** biginteger is `*big.Int` (pointer, mandatorily — a
  non-pointer `big.Int` in an `any` marshals as `{}`, verified);
  bigdecimal is a small struct `(coeff *big.Int, scale int32)`.
  **No apd dependency**: apd exists to round, and Aontu never
  rounds. Exact add/negate/ceil/floor over coefficient-and-scale is
  a few dozen lines.
- **TypeScript:** biginteger is a native `bigint`; bigdecimal is a
  dependency-free Decimal class — boru already proved this exact
  shape (`unscaled bigint + scale`) renders byte-identically to
  Go across a divergence-ledger's worth of edge cases, minus the
  negZero flag D5 removes.
- Pointer pegs are treated as immutable, matching the engine's
  existing immutability contract (clones share them; nothing may
  mutate them in place).
- **Programmatic construction obeys the same storage contract.**
  Today Go's `NewInteger` accepts any `int64` while TypeScript's
  `IntegerVal` holds a JS number — so the nominal value
  `9007199254740993` is exact in Go and silently `…992` in the
  canonical port, a parity hole no parse-time rule can see. Under
  the tower, Go's `NewInteger` rejects an int64 that is not exactly
  representable in binary64 (the R1 storage test, applied to API
  input), and both ports gain exact-input constructors for the big
  leaves (`NewBigInteger`/`NewBigDecimal` in Go; `bigint`- and
  string-accepting constructors in TypeScript, where a `number`
  argument is already rounded before the library can inspect it).
  Exact values above 2^53 enter through the big leaves or not at
  all — in both ports alike.

### D9 — the generate contract (the hard consumer-facing change)

Generated native values: Go returns `*big.Int` and `*Decimal`, both
implementing `json.Marshaler` to emit **exact digits as a raw JSON
number** — verified: `encoding/json` already does this for
`*big.Int` (`{"a":1267650600228229401496703205379}`), so the Go CLI
works unchanged. TypeScript returns `bigint` for biginteger and a
`Decimal` instance for bigdecimal — and `JSON.stringify` **throws on
bigint** (verified; a replacer cannot emit an unquoted number), so
an exact JSON emitter is required. JSON itself is not the obstacle —
JSON numbers are arbitrary-precision text; only JavaScript's
serialiser is.

The TypeScript emitter is a **documented public library export**,
not a CLI internal: a library consumer whose document contains a
biginteger has no other supported way to produce the promised exact
JSON, so hiding the only implementation behind the command line
would break the contract D9 makes. The CLI consumes the same export.

Two testing consequences, because byte-exact serialisation cannot
see the difference: an integral bigdecimal (`0d1e3`) and a
biginteger can emit the *same* raw JSON number even if `generate()`
returns the wrong runtime type. The native-type contract is
therefore pinned by **per-port API tests** (TypeScript asserting
`typeof`/`instanceof`, Go asserting the concrete type) alongside the
`gens` rows — canon pins the AST kind, `gens` pins the bytes, and
only the API tests pin the runtime object.

This is an API-surface change for TS consumers of `generate()`
(a document using `0d` can yield `bigint`/`Decimal` values), and it
is confined to documents that opt in — a `0d`-free document
generates exactly what it generates today.

### D10 — the spec suite needs a byte-exact gen mode first

Verified: both runners currently collapse gen values through float64
(TS: `JSON.parse` + `deepStrictEqual`, which is also type-strict
against `bigint`; Go: `jsonEqual` without `UseNumber`), so `2^100`
and `2^100 + 3` would compare **equal** — exactness is unassertable,
not merely awkward. The byte-exact generated-output mode already
designed in [G5](../capability-review/g5-trust-contract.md) (`gens`:
compare marshalled bytes) is therefore a hard prerequisite, and
lands as Phase 0. Canon mode remains the kind-faithful surface — the
number-model lesson repeating at the next scale.

## Implications

**Breaking-change inventory** (all gated on a breaking release, all
pinned with baseline rows first):

1. `0d`-prefixed bare strings and the words `float`, `biginteger`,
   `bigdecimal` change meaning. Verified: nothing in the repository,
   suite, docs, or editor files uses any of them meaningfully today;
   real-world documents using them as bare strings must quote them.
2. `super(1.5)` flips from `number` to `float` (one landed row).
3. **Lossy integer literals become errors (D7)** — and this reaches
   further than the four flipped spec rows (`hex-big`,
   `hex-big-canon`, `hex-huge`, `lossy-above-pow53`): a plain JSON
   document containing `{"x":9007199254740993}` is `0d`-free yet
   flips from silently generating a rounded value to a located
   error with a `0d` hint. That is the deliberate point of D7 —
   refusal over corruption — but it means the JSON-superset
   guarantee is "every JSON document parses", not "every JSON
   document behaves identically". Likewise D6's exact integer sums:
   an addition that silently rounded now errors.
4. **`number` widens.** A schema saying `a: number` now also admits
   `0d` values. Subsumption-wise the new schema subsumes the old —
   backward compatible for all existing data — but a schema that
   *meant* "binary64 only" silently became more permissive and must
   say `float` to keep its meaning. This is the subtlest implication
   in the set and leads the migration notes.
5. TS `generate()` can return `bigint`/`Decimal` for opting-in
   documents (D9).
6. Any future canon-hash pins ([G6](../capability-review/g6-distribution.md))
   made before this lands would be invalidated by the canon changes —
   an argument for sequencing the tower before G6 ships hashing.

**What deliberately does not change:** the R1 integer window, the
R2/R3/R4/R5 rules (each *extends* to the new leaves), and the
absence of `inf`/`nan` literals — an overflowing literal stays an
error, and the exact leaves cannot overflow, only exhaust their
budget. A document is untouched iff it avoids all of: `0d`-prefixed
or newly reserved bare words (implication 1), lossy integer literals
(implication 3), and integer sums that silently rounded (D6). Every
value that is exact today means exactly what it meant; what changes
is that the *inexact* cases stop being silent — the claim is meaning
stability, not universal behaviour stability.

**Knock-ons for the capability review:** G1's constraint atoms must
range over the tower (`min(0)` against a bigdecimal — recommend
boru's exact-rational ordering for bound comparison, since bounds are
about order, not identity; an open question below). G3 gains a clean
compat story for implication 4. G5 owns the coefficient budget. G6
should land after canon stabilises. The number-model design record
gains a successor section rather than an edit — its rules stand.

**Cost assessment.** The full checklist of touch points was audited
(every Kind switch and construction site in both ports, both LSP
keyword lists, both editors' syntax files, the hints tables, four
docs). The genuinely novel work is: two Val leaves ×2 ports, the
lexer matcher ×2, exact scaled arithmetic (~dozens of lines, no
dependencies), the TS JSON emitter, and the `gens` runner mode ×2.
Boru's version cost far more — apd, contexts, `with-decimal`, a
render-parity saga — and Aontu escapes almost all of it for one
reason worth stating plainly: **its operator surface is tiny, and
every operation it has is exact.** The tower's price scales with the
operator surface, which is an argument for G8's maths-as-functions
adopting the same exact-or-error discipline rather than importing
floats' behaviour.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bare-string meaning changes go unnoticed downstream | Certain (for affected docs) | Low | Baseline rows pinned before the flip; loud CHANGELOG breaking section; quoting rescues every case |
| Pointer-peg equality bugs in Go (`==` on `*big.Int`) | Medium | High | D2 makes identity per-kind value comparison; property tests over the lattice laws with big-leaf generators; the known sites are already enumerated |
| TS exact-JSON emitter diverges from Go's marshaller | Medium | Medium | `gens` byte-exact rows executed by both runners; parity-probe discipline (both engines, never one) |
| Coefficient or scale blow-up as a resource attack (`0d1e4000 + 0d1e-4000`; the one-digit scale bomb `0d1e1000000000`) | Low | Medium | D6's dual budget — coefficient digits *and* absolute scale — enforced at parse, operation, and render, deterministic and spec-pinned at both boundaries |
| `0d` matcher vs dot/path grammar interactions | Medium | Medium | Mirror boru's claim rule (trailing `.` only before a digit); pin the `0d1.e2`-class edges in the spec phase; the landed separator machinery already covers `_` edges |
| `number`-widening surprises schema authors | Medium | Low | Migration note leads the CHANGELOG; `float` spelling is a one-word fix; G3's subsume verb (when it lands) mechanically confirms compatibility |
| Two new kinds double the R5 contagion surface | Low | Medium | The promotion table is small and closed; pin the full operand-pair cross-product as spec rows, boru's `numeric-cross-product.tsv` being the template |

## Implementation plan

Spec-first throughout: every phase lands its TSV rows before code,
TypeScript then Go, parity-probed. Nothing may regress the landed
number-model rows except the flips this document names.

- **Phase 0 — baseline + machinery (S/M).** Pin today's meaning of
  `0d…`/`float`/`biginteger`/`bigdecimal` bare text in both ports;
  add the byte-exact `gens` mode to both runners (D10).
- **Phase 1 — kind lattice (M).** `float` keyword; `number` to pure
  supertype; kind meets; `super()` ladder; flip `super-float-canon`.
  Touches the enumerated keyword sites (parser defs, marker
  classes/Kind enum, LSP lists, hints, editors, docs tables).
- **Phase 2 — literals and leaves (L).** The `0d` matcher ×2;
  `BigIntegerVal`/`BigDecimalVal` (TS) and Kind members + pegs (Go);
  parse-time normalisation incl. the integral-bigdecimal `.0`
  marker (D4); the parse-time scale bound (D6); canon; R2 extension
  (D5); the programmatic-construction contract and exact-input
  constructors (D8).
- **Phase 3 — identity (S).** Per-kind value comparison in unify and
  disjunct sameness; kill the pointer-equality hazards.
- **Phase 4 — arithmetic (M).** The `+` ladder, exact integer sums
  with the storage-contract error, float⊕big error, string × leaf
  concatenation, `upper`/`lower`/negate on the new leaves, the
  exactness budget at the operation boundary. Cross-product spec
  rows including the string pairs.
- **Phase 5 — generate (M).** Go marshallers; the TS exact JSON
  emitter as a documented public export, consumed by the CLI;
  per-port API tests pinning the native runtime types (D9); API
  documentation of the new native types.
- **Phase 6 — lossy literals (S).** D7's errors with the `0d` hint;
  flip the four rows; delete the ledger entry; close #21.
- **Phase 7 — docs (M).** number-model.md successor section;
  reference/tutorial; CHANGELOG breaking inventory (implications
  1–6); migration notes led by the `number`-vs-`float` distinction.

## Open questions

- **Keyword spellings.** `biginteger`/`bigdecimal` mirror boru and
  are unambiguous; `bigint`/`decimal` are shorter but `decimal`
  is a likelier bare-string collision in real documents. Mirror
  names recommended; decide once, before Phase 1.
- **Cross-leaf bounds in G1.** Should `min(0)` constrain a
  bigdecimal? Recommended yes, via exact-rational ordering (boru's
  `toRatExact` precedent) — bounds are about order, not identity —
  but the decision belongs to G1's algebra and needs its emptiness
  and subsumption rules extended leaf-wise.
- **Conversion functions.** With cross-leaf unification refused,
  deliberate conversion (`0d5` to integer 5) has no spelling. Boru's
  `convert` + accuracy-mode design is the reference; in Aontu this
  is function territory and belongs with G8's roster, not the tower.
- **`biginteger` vs `integer` subtyping.** The tower makes them
  disjoint (mirror). The alternative — `integer ⊑ biginteger`, every
  int64 value also a biginteger — reads attractively but breaks gen
  type stability (would `5` generate as `bigint`?) and boru's
  no-silent-demotion rule; rejected, recorded here because it will
  be asked.
- **Dot-adjacency edges.** The exact parse of `0d1.e2` and friends
  falls out of matcher-vs-path-grammar interaction; pin whatever
  both ports agree on in Phase 2, and only design further if the
  agreed behaviour is unacceptable.
