# Capability review — progress register

This is the single record of **where the [capability review](index.md)
stands**: every numbered phase of G1–G8, its status, and the artifact
that proves it.

An entry belongs here when it is a *numbered phase of a gap document's
implementation plan*. The design itself — what a capability should do,
what was rejected, what the risks are — stays in the gap document. This
file answers one question only: **has it landed, and what proves it?**

## Why this file exists

Before it, that question had no answer in one place. The complete
statement of what had landed existed in exactly one artifact — the body
of commit `87f4d37`, which names "G1 0/1/6, G2 1, G5 1/2/5" in passing
while doing something else — and a reader who did not know to run
`git log` had eleven partial, mutually inconsistent sources to
reconcile: eight gap documents all headed *"Status: design proposal"*
including three that are partly implemented, an index whose "Verified
codebase facts" list carries four strikethrough corrections, a
CHANGELOG whose newest heading predates the review, and eight "nothing
may regress" baselines quoting four different spec-suite sizes between
them, none of them current.

This repository has already diagnosed that failure mode in writing, in
[`AGENTS.md`](../../AGENTS.md#known-tsgo-divergences):

> Kept in one place deliberately: the same divergence had been
> described in an AGENTS.md section, a ledger comment and an upstream
> doc, and they drifted apart — the ledger claimed a behaviour was
> still divergent for some time after it had been aligned.

The remedy applied there — one register, one protocol, siblings that
state what they are *not* — is what this file applies to capability
progress. Its siblings: [`ADR.md`](../../ADR.md) for decisions that
must not be quietly reversed,
[`DIVERGENCE.md`](../../DIVERGENCE.md) for permanent TS/Go non-parity,
[`test/spec/divergent.tsv`](../../test/spec/divergent.tsv) for parity
debt, and [`docs/test-coverage.md`](../test-coverage.md) for coverage
exclusions.

## What "landed" means

ADR-001 sets the bar, and it is higher than "the code exists":

> **LANDED** — every named deliverable of the phase exists; where the
> phase touches language behaviour it exists in **both** ports; and
> shared rows in `test/spec/*.tsv` pin it. A phase whose behaviour is
> implemented in TypeScript alone is not landed, it is partial.
>
> **PARTIAL** — some named deliverables exist and others demonstrably
> do not. The entry says which, so the remainder is a work item rather
> than a rediscovery.
>
> **NOT STARTED** — no deliverable of the phase exists. Drafted spec
> rows under [`test/spec/draft/`](../../test/spec/draft/) do not change
> this: a draft is a design artifact, not an implementation, and by the
> [parity-probe rule](../../AGENTS.md#the-parity-probe) it cannot
> become an executable row until the behaviour it describes runs in
> both engines.

The status words are the ones the repo already uses (`OPEN`/`CLOSED` in
the divergence ledger, `Accepted`/`Superseded` in the ADR register).

## The update protocol

1. **A phase's status changes in the same commit that changes its
   status.** This is the rule that already keeps
   [`test/spec/errcodes.tsv`](../../test/spec/errcodes.tsv) accurate —
   "new engine codes must land with a registry row in the same change"
   — and errcodes.tsv is the one landing record in this repository that
   has never gone stale. Nothing else here is machine-checked, so the
   discipline is the whole mechanism.
2. **An entry cites artifacts, never intentions.** A pin is a path, a
   spec file, a symbol, or a commit hash that a reviewer can re-check
   in under a minute. "Designed", "planned" and "in progress" are not
   statuses.
3. **A phase that lands differently from its design says so here**, and
   the gap document is corrected in the same commit. G1.6 is the worked
   example: it landed broader than written, and both the register and
   the design text have to carry that or the next reader plans against
   a rule that is not the one in the engine.
4. **Entries are updated in place, not appended.** Unlike the ADR
   register, phase status has no history worth preserving — the git log
   holds it. What is preserved is the *departure* note, because that is
   design information.
5. **Counts of the shared suite live here and nowhere else.** All eight
   gap documents froze a row count into a "nothing may regress" clause;
   all eight are now wrong, by roughly 1,400 to 1,500 rows. A gap
   document should link this line instead: as of this
   register's last update the suite is **60 `.tsv` files, 59
   row-bearing, 2,202 rows**, in six modes — `canon` 656, `gen` 530,
   `errc` 412, `gens` 302, `err` 232, `errcode` 70. Reproduce with
   `ls test/spec/*.tsv | wc -l` and
   `cat test/spec/*.tsv | grep -P '\t' | grep -vc '^#'`.

## Summary

Fourteen of forty-nine phases have moved; ten of those are complete.

| Gap | Capability | Review phase | Landed | Partial | Not started |
|-----|-----------|--------------|--------|---------|-------------|
| [G1](g1-constraint-algebra.md) | Constraint algebra | A | 7 | 0 | 0 |
| [G2](g2-validation-verb.md) | The validation verb | A | 1 | 1 | 4 |
| [G3](g3-subsumption-evolution.md) | Subsumption, evolution | B | 0 | 0 | 7 |
| [G4](g4-identity-relations.md) | Identity, relations | C | 0 | 0 | 6 |
| [G5](g5-trust-contract.md) | Trust contract | A | 2 | 2 | 2 |
| [G6](g6-distribution.md) | Distribution | B/C | 0 | 0 | 5 |
| [G7](g7-machine-access.md) | Machine access | B | 0 | 0 | 7 |
| [G8](g8-generation.md) | Generation | C | 0 | 1 | 4 |
| | | **total** | **10** | **4** | **35** |

Against the review's own [sequencing](index.md#sequencing):

- **Phase A — make the claim true.** Partly done. The trust contract
  (G5.1–2) and the error-code registry (G2.1) are in, and **G1 is
  complete** — all seven phases, both ports, shared rows, and the
  ADR-002 gate back at 100% in both. That is more than the sequencing
  table's "constraint algebra core (bounds, regex, length/count)"
  asked for: cross-field residuation and the `must` escape hatch are
  in too. Outstanding: the rest of the `vet` verb (G2.3–6) and its Go
  port (G2.4). **Phase A's headline claim now half exists: the vet
  ENGINE runs in TypeScript (G2.2), but there is no `aontu vet`
  command, and Go has no vet at all.**
- **Phase B — differentiate.** Untouched. No subsumption, no canon
  hash, no query surface.
- **Phase C — scale.** Untouched, apart from G8.0's defect-fencing half.

One structural note the sequencing table itself makes: G7's query/MCP
surface depends on nothing and could ship at any time.

## G1 — a real constraint algebra

| Phase | Size | Status | Pin |
|-------|------|--------|-----|
| **0** — algebra on paper | S | **LANDED** | `docs/reference-language.md` "The constraint algebra (specified)": all three tables the phase names — meet, emptiness, and **subsumption** — plus the canonical atom order, tower rulings, the lazy-endpoint/eager-emptiness decision, and `length` as Unicode code points. `test/spec/constraint-bound.tsv`, `constraint-re.tsv`, `constraint-length.tsv` and `constraint-cross.tsv` all promoted (the draft directory is now empty). Fold-defect guard rows in `disjunct.tsv`. Commit `98fc1bf`, completed by the subsumption table. |
| **1** — numeric and lexical bounds, `neq` | M | **LANDED** | `ts/src/val/ConstraintVal.ts` (`cjo = 50000`) + `go/constraint.go`; `min`/`max`/`above`/`below`/`neq` in both registries (12 → 17 builtins); `test/spec/constraint-bound.tsv`, `constraint-product.tsv` (all 256 ordered pairs), `errcodes.tsv:constraint`; law tests `ts/test/constraint-laws.test.ts` + `go/constraint_laws_test.go` over `test/spec/files/constraint-atoms.txt`. Commit `ae82828`. |
| **2** — `re` | M | **LANDED** | `ReConstraintVal` (`ts/src/val/ConstraintVal.ts`) + the `re` arm of `newConstraint` (`go/constraint.go`); `re` in both registries (17 → 18 builtins) and both LSP completion lists; the portable-subset scanner `nonPortableRe`, mirrored statement for statement in both ports; `test/spec/constraint-re.tsv` (89 rows, promoted from the draft with every expectation re-probed) and the differential corpus `test/spec/files/regex-corpus.tsv` (400 patterns, both normalisers pinned); `errcodes.tsv:constraint_pattern`. |
| **3** — `length` and `unique` | M | **LANDED** | `LengthConstraintVal`/`UniqueConstraintVal` (`ts/src/val/ConstraintVal.ts`) + the `length`/`unique` arms of `newConstraint` (`go/constraint.go`); both in both registries (18 → 20 builtins) and both LSP completion lists; `unique` is the first zero-arity built-in, so `arityText` gained a "no arguments" case. `test/spec/constraint-length.tsv` (92 rows, promoted from the draft with every expectation obtained by running BOTH engines and diffing). **Departure from the design:** implementing it added one rule the design did not have — sizing atoms fold LAST in a conjunct (`SIZING_CJO`), or `a:length(2) a:{x:1} a:{y:2}` would count the first fragment alone and refuse the layering the language exists for; `docs/reference-language.md` "Sizing atoms fold last" carries it, and `MapVal`/`ListVal` hand a constraint peer back to the constraint because the order reverses who drives the meet. |
| **4** — cross-field arguments, residuation | M | **LANDED** | `settle` in `ts/src/val/ConstraintVal.ts` + `go/constraint.go`: an atom whose arguments have not settled becomes `pending` and resolves through `unify`, mirroring `FuncBaseVal`'s discipline. `test/spec/constraint-cross.tsv` (30 rows, promoted from the draft with every expectation obtained by running BOTH engines and diffing) covers reference and expression arguments, forward and chained references, the sizing/pattern atoms' own arguments, spread templates carrying a bound onto children, constraint-bearing disjuncts, and the `budget_passes` boundary. **Unblocked, by three parser fixes.** The phase unmasked a family of func-paren comma-group defects: TS handed the handler the UNREDUCED operator tree, Go's `addition-infix` handler read the rule's open token unguarded and PANICKED when a `+` was the last member, and TS dropped every argument after a single-segment `$.z`. The Go panic was fixed in `0feb17c`; the other two upstream in `@tabnas/expr` 0.5.4 (tabnas/expr#42, #43, raised from this work), adopted in `cc0c2d9`. Those three are pinned by the `neq-comma-*`, `min-expr-arg-*` and `neq-ref-*` rows in `constraint-bound.tsv`. **Departure from the design:** writing the rows found two Go-only defects the probe corpus had missed — `setPaths` had no `ConstraintVal` arm, so a pending atom's arguments carried no path and an unresolvable `min($.zz)` located its `no_path` at the ROOT, and the fold's re-wrap was pathless, so `budget_passes` named `$` where TypeScript names the node. Both are fixed and pinned by the `-sited` rows. |
| **5** — `must` | S | **LANDED** | Band B in both ports as a kept, never-simplified field on the residual, folded LAST (`LATE_CJO`/`sizingCjo`, generalised from the sizing rule) so it checks the finished value, against a CLONE so the check reports without contributing; error code `must` in `errcodes.tsv` with the author message carried into the hint. `test/spec/constraint-must.tsv` (28 rows): evaluate-only reporting, the late fold over layered fragments, checks kept in written order without dedup, reference and expression arguments, container arguments, and the argument discipline (parse-time arity, string message, a check holding a nil refused as an argument). **Two departures from the design:** `must` joining the late-fold slot is what generalised it, so `docs/reference-language.md` "Sizing atoms fold last" now names all three late atoms — Go's `cjo()` was missing the `must` arm entirely, which fired the check against the first fragment, and the `must-folds-last` rows pin it. And an **effectful** argument is refused at construction: `move()` hides its resolution target in place, and settling a pending argument runs that against the LIVE root before the trial clone is taken, so `b:1 a:must(move($.b),m) a:1` dropped `b` in Go and raised `internal` in TypeScript. The sibling atoms already refused it for a different reason (an effectful value is not an orderable scalar), so this is `must` joining a policy the family had; `must-move-arg*` pins it. |
| **6** — number exactness | S | **LANDED** | `isLossyIntegerLiteral` → `lossy_integer_literal` in `ts/src/lang.ts` and `go/lang.go`; `test/spec/number-tower.tsv`, `number-model.tsv`, `scalar.tsv`. Landed inside the number tower, commit `51e8149`. |

**Phase 0's subsumption table** was the last of its three tables to be
written, and for a while the reason this phase read PARTIAL: the phase
text names "the pairwise meet / emptiness / subsumption tables", and
only the first two existed. It is now in
`docs/reference-language.md`, "Subsumption" — the per-atom rules for
`A ⊒ B`, with the two approximations (`re` compares patterns as text;
`must` is opaque) marked as such and both failing toward "not
subsumed", which is the safe direction for the compatibility check G3
puts on top. G3 phase 0 is its consumer, and it is no longer blocked.

**Phase 2 departed from its drafted rows in one place, and the probe is
why we know.** The draft predicted `string & re("^[a-z]$")` would canon
as `string&re("^[a-z]$")`. Both engines agree it canons as
`re("^[a-z]$")`: a pattern implies the string kind exactly as a numeric
bound implies `number`, and the phase-1 row `bound-number-passthrough`
already pinned the implied kind being dropped. The promoted row records
the probed behaviour and says so inline.

Phase 2's subset had to be tightened twice, and the second time was
review finding a real defect rather than a style point. The first draft
whitelisted `(?...)` groups but left ESCAPES as a blacklist, and two
escapes it had never heard of silently diverged: `\A` and `\z` are
anchors in RE2 and identity escapes matching a literal letter in
JavaScript, so `re("\A") & "x"` held in Go and failed in TypeScript —
precisely the divergence the subset exists to prevent. `\s` was the
same story on a different axis (Unicode whitespace in JavaScript,
ASCII-only in RE2). Escapes are now a whitelist too. The lesson is
general enough to state: **in a two-engine subset, every axis must be a
whitelist, because a blacklist admits the next divergence by
construction.**

**The enforcement mechanism was then replaced outright, and that is now
[ADR-003](../../ADR.md#adr-003--host-provided-semantics-are-normalised-not-trusted).**
Three leaks in one day — two from review, one from writing documentation,
none from a test — established that a blacklist of known-bad constructs
cannot work: its correctness is a claim about the author's knowledge of
two large external systems, and nothing in the suite can falsify it.
`re` now **normalises** instead: Aontu defines what `\d`, `\s`, `.`,
`\A` and `\z` mean and rewrites the pattern before either host engine
compiles it, so the hosts only ever see constructs they cannot read two
ways. Refusal is reserved for what has no rewriting (backreferences,
lookaround) and for the one axis rewriting cannot reach (complexity).
The result is a LARGER accepted subset than the blacklist allowed, with
a stronger guarantee. `test/spec/files/regex-corpus.tsv` pins both
normalisers over a generated corpus so drift fails in whichever port
drifted.

The third leak, which prompted it, was the subset's own blind spot
rather than review's: **JavaScript matches UTF-16 code units by default and RE2
matches code points**, so `re("^.$")` accepted U+1D11E in Go and refused
it in TypeScript — and `re("^..$")` did the exact reverse. The
TypeScript port now compiles with the `u` flag, which makes `.` and
every quantifier count code points in both engines. That flag also makes
JavaScript refuse `\-` outside a character class where RE2 accepts it,
so the scanner now allows `\-` only inside a class; adding the flag
without that rule would have traded one divergence for another.

The same review found that `re` also breaks the *termination* clause in
one port. `(a+)+$` against twenty-nine characters takes 45 seconds under
JavaScript's backtracking engine and 0.065s under RE2, and a regex match
is counted by no evaluator budget, so an untrusted schema could stall
the TypeScript evaluator indefinitely — the unattended-agent case the
language is for. The subset now refuses a quantifier applied to a group
containing a quantifier or an alternation, which keeps `docs/trust.md`
clause 2 true in the port that has the problem. Recorded there as
bounded-by-construction rather than bounded-by-budget, with the residual
risk (polynomial backtracking is still admitted) stated. **The
principled fix is a linear-time regex engine in TypeScript** so the two
ports share a complexity class as well as a semantics; that is a
dependency decision, not a phase-2 one.

Phase 2 also added the `constraint_pattern` code (class `conflict`) for
a pattern outside the portable subset — the design text does not name a
code, and the phase-1 precedent of one `constraint` code for the whole
family would have given the most likely authoring mistake in the atom a
generic message. The refusal reason is a fixed string rather than the
host engine's message, so the whole error frame stays byte-identical
across ports even when it is the host compiler that objected.

**Phase 6 landed broader than its design.** The design scoped the
refusal to the `(2^53, 2^63)` magnitude band and stated that
"`test/spec/scalar.tsv` extreme-magnitude rows are untouched"; the
landed rule is **exactness, not magnitude**, so `scalar.tsv:hex-big`
did flip to `hex-big-err`, and more than the one sanctioned row
changed. `test/spec/number-tower.tsv` records the reason inline:
"contrary to what the design and G1 both said before this phase checked
the arithmetic". The G1 text carries the correction now — both its
phase-6 paragraph and its risks table say the landed rule is exactness
and that more rows changed than the design sanctioned.

**Known limit of phase 1**, documented but not in the design text: a
preference meeting a constraint inside a conjunct (`min(1024) & *8080`)
does not resolve to the default; the disjunct form does. See
`docs/reference-language.md` and the comment above
`constraint-bound.tsv:bound-pref-disjunct`.

## G2 — the validation verb

| Phase | Size | Status | Pin |
|-------|------|--------|-----|
| **1** — error taxonomy groundwork | M | **LANDED** | `test/spec/errcodes.tsv` (70 registered codes with class and since-version — 64 at this phase's own landing, grown since by `constraint_pattern` and `must`); new spec modes `errc` and `errcode`; `class` on `NilVal` (`ts/src/val/NilVal.ts`, `go/val.go`); registry set-equality asserted by both runners (`ts/test/spec.test.ts` `spec-errcodes-registry`, `go/spec_test.go` `TestErrCodesRegistry`). Commit `98fc1bf`. |
| **2** — vet engine API, TypeScript | M | **PARTIAL** | `ts/src/vet.ts`, exported from `ts/src/aontu.ts`: anchor selection (`at`, `closed`), data parsed with the full grammar, unify-with-collect, the residue walk, finding construction with roles by provenance, vet-side sorting, `maxErrors`/`truncated`, and the four verdicts. 30 rows in `ts/test/vet.test.ts`; ADR-002 back at 100%. **What is missing, and why it is not a slip:** the phase names `test/spec/vet.tsv` as a deliverable, and that file cannot exist yet. Both runners execute every row of every `test/spec/*.tsv` with no skip list, so a `vet` row is only executable once `vet` exists in BOTH ports — phase 4. The rows are written and carry the settled encoding, in `test/spec/draft/vet.tsv`. Under ADR-001 a TypeScript-only phase is partial, and this one is partial for a second reason too. **Departures from the design:** (1) the encoding is FIVE columns — name, mode, schema, data, expect — because vet takes two documents and no separator inside one cell is safe; both runners already tolerate extra columns, so the arm is additive. (2) `message` is excluded from the goldens and asserted by substring per port, because prose is deliberately not in cross-port parity. (3) Options (`at`, `closed`, `partial`) have no column: they ride an `opts` key in the expect object, the one part of the encoding still unprobed, because no runner passes options today. (4) A conflict inside a `&:` template reports the TEMPLATE's path, not the instance's — the data site still points at the offending value, and naming the instance path is a report-layer concern for phase 3. |
| **3** — CLI verb and JSON format | M | **NOT STARTED** | `ts/src/cli.ts` has no subcommand dispatch at all — one file argument, `-c/--canon`, help/version, REPL. |
| **4** — Go port | L | **NOT STARTED** | No `go/vet.go`, no `go/report.go`. |
| **5** — SARIF, Action, watch | S | **NOT STARTED** | — |
| **6** — multi-error collection | L | **NOT STARTED** | The single-error exit in `ts/src/unify.ts` is unchanged. |

**Phase 1 landed without touching `ts/src/err.ts`**, which its
deliverable list names. Nothing was needed: the `[aontu/<code>]`
message marker predates the review and is pinned by
`error.tsv:errm-marker-headline`.

**An open question the landed code answered.** The doc lists "registry
source of truth" (whether `hints.ts` generates `errcodes.tsv` or the
reverse) as undecided. Neither generator was built:
`test/spec/errcodes.tsv` declares itself the source of truth, both
engines keep hand-maintained `codeClasses` tables, and the runners
assert set equality in both directions. That is the decision, and the
doc should record it.

## G3 — subsumption as a query; schema evolution

| Phase | Size | Status |
|-------|------|--------|
| **0** — rules on paper | M | **NOT STARTED** |
| **1** — the recursion, TypeScript | L | **NOT STARTED** |
| **2** — Go port | L | **NOT STARTED** |
| **3** — CLI verbs (`subsume`, `breaking`) | M | **NOT STARTED** |
| **4** — `deprecate()` | M | **NOT STARTED** |
| **5** — default-validity lint | S | **NOT STARTED** |
| **6** — trim reporter | M | **NOT STARTED** |

Nothing of G3 has ever existed: no `ts/src/subsume.ts`,
`go/subsume.go`, `test/spec/subsume.tsv`, `deprecate.tsv` or
`trim.tsv` in any commit. Phase 3 depends on G2 phases 1–3, of which
only phase 1 is in.

**Two facts the doc asserts are no longer true.** `super()` is no
longer "degenerate and unpinned" — `ts/src/val/SuperFuncVal.ts` and
`go/func.go` resolve the *argument's* superior, pinned by rows in
`number-model.tsv`, `number-tower.tsv` and `edge.tsv`. That also
settles G3's fifth open question ("re-founding `super()`") in favour of
the kind-lift, though it was the number-tower work that settled it.
And `PrefVal` now carries **two** yardsticks — `superpeg` and
`familypeg`, computed by `resuper()` — because the tower made `integer`
and `float` disjoint; a `defaults`-profile subsumption rule written to
the doc's one-yardstick text would be wrong.

## G4 — identity and typed relations

| Phase | Size | Status |
|-------|------|--------|
| **0** — semantics on paper | S | **NOT STARTED** |
| **1** — `id()` | M | **NOT STARTED** |
| **2** — `refer()` | M | **NOT STARTED** |
| **3** — derived structures | S | **NOT STARTED** |
| **4** — `std/system` vocabulary | M | **NOT STARTED** |
| **5** — relation graph checks | L | **NOT STARTED** |

No G4 artifact of any kind exists. Phase 5 additionally has no host:
it is a vet-time pass, and `vet` does not exist.

**One note for whoever starts G4.1.** The doc says the two new builtins
"join `funcMap`". G1's atoms did not: they route through a separate
`constraintAtoms` table (`go/constraint.go`, noted at `go/func.go`), so
"join funcMap" now has two shapes to choose between. Arity is also a
parse-time check for all twenty-one builtins since commit `c8b4c54`, so
a new builtin must add entries to the arity tables in both ports.

## G5 — a specified trust contract

| Phase | Size | Status | Pin |
|-------|------|--------|-----|
| **1** — write the contract | S | **LANDED** | [`docs/trust.md`](../trust.md), four clauses (hermeticity, termination, determinism, sandboxing) with profiles and budget names; `docs/reference-api.md` single-use-tree rule; `AGENTS.md` points at it. Commit `98fc1bf`. |
| **2** — budget and cycle taxonomy | M | **LANDED** | `test/spec/budget.tsv` (24 rows) pinning `path_cycle`, `no_path`, `budget_passes`, `unify_cycle` as distinct; the `maxcc` false positive fixed by the per-pass memo with a 1200-sibling fixture as guard. Commits `98fc1bf`, `90f3146`. |
| **3** — trust profile and confinement, TypeScript | L | **NOT STARTED** | No `trust` option in `ts/src/type.ts`, no `include_denied`, no `test/spec/include-trust.tsv`. |
| **4** — Go port of profile and budgets | L | **PARTIAL** | The **budget** half landed with phase 2 (`go/unify.go` defaults, `budget.tsv` runs in `go/spec_test.go` with no skip list). The **trust profile** half has nothing, and cannot until phase 3 gives it a canonical side to mirror. |
| **5** — determinism byte-pinning | M | **PARTIAL** | `gens` documented in `docs/shared-spec.md`; 299 byte-exact rows beside the behaviour they pin; repeatability enforced as a *runner property* — both runners re-run every `gens` row on a fresh engine. Missing: the `deps` manifest, absent from Go entirely and an unpopulated pass-through in TypeScript. |
| **6** — default flip | S | **NOT STARTED** | Depends on phase 3's warning window. |

**Two departures the doc already records**: no `gens.tsv` bucket (rows
live beside their behaviour), and repeatability as a runner property
rather than dedicated rows. **One it does not**: a third budget,
`depth` (`MAXDEPTH`/`maxUniteDepth` = 1000, not the sketched 512),
landed in commit `90f3146` as a shared spec-visible constant.

**Phase 5 is graded PARTIAL here where commit `87f4d37` self-certified
it landed.** The `deps` manifest is one of five named deliverables,
`go/lang.go` was never touched for it, and no test covers it. Under
ADR-001, a deliverable absent from one port's source cannot count.

## G6 — a distribution layer

| Phase | Size | Status |
|-------|------|--------|
| **0** — the hash form (`hcanon`) | S/M | **NOT STARTED** |
| **1** — the hash itself (`canonHash`) | S | **NOT STARTED** |
| **2** — module identity and local resolution | M | **NOT STARTED** |
| **3** — fetch and publish tooling | L | **NOT STARTED** |
| **4** — registry hooks and agent integration | M | **NOT STARTED** |

Zero code, zero rows, zero doc sections. G6's own risk row — "G1's new
constraint syntax changes canon, invalidating all pins" — has already
begun to materialise: G1.1 added five atoms to canon before G6 wrote a
line, which vindicates the "hash GA after G1's canon settles"
mitigation.

**One current-state claim is now false**: the doc says parse-level
canon is not in TS/Go parity, citing an AGENTS.md entry. That
divergence (#30) is fixed and the entry deleted; parity is pinned by
twin tests in both ports. The design conclusion (scope the hash to
post-unification canon) survives, but its stated justification must be
rewritten — the residual reason is that no shared spec mode *observes*
parse-level canon.

## G7 — a machine-facing access surface

| Phase | Size | Status |
|-------|------|--------|
| **1** — `get` and projections, TypeScript | M | **NOT STARTED** |
| **2** — `get`, Go port | M | **NOT STARTED** |
| **3** — provenance recorder and `why`, TypeScript | L | **NOT STARTED** |
| **4** — `why`, Go port | L | **NOT STARTED** |
| **5** — overlay `set` | M | **NOT STARTED** |
| **6** — delivery: MCP server, grammar, skill, `agentsmd` | M | **NOT STARTED** |
| **7** — REPL inspection mode and hover-provenance | S | **NOT STARTED** |

Not one named deliverable of any phase exists. The design's
load-bearing premises were re-verified and all still hold — the
site-dropping `update()` stub, `maxcc = 9`, the `DisjunctVal.gen` fold
defect, per-request re-unification in hover, and the `ctx._pathidx`
trie that the provenance recorder would reuse.

Two smaller corrections: the `no_path` code G7.1 proposes already
exists (`errcodes.tsv`, landed by G2.1), and `ctx.find`/`explain` —
which design option A proposes documenting — are already documented in
`docs/reference-api.md`.

## G8 — generation, on the total side of the fork

| Phase | Size | Status | Pin |
|-------|------|--------|-----|
| **0** — staging rule | S | **PARTIAL** | The phase has two deliverables. The `DisjunctVal.gen` distribution defect is **fenced** — probed guard rows landed in `test/spec/disjunct.tsv` with G1.0. The `KeyFuncVal` `cc < 3` delay is **not** replaced by the settled-argument residuation rule; `ts/src/val/KeyFuncVal.ts` and `go/func.go` are unchanged. |
| **1** — `pack` and `each` | M | **NOT STARTED** | — |
| **2** — `filter` and `match` | M | **NOT STARTED** | Depends on phase 0's defect work. |
| **3** — placeholder `_` (the parser phase) | M/L | **NOT STARTED** | — |
| **4** — `\|>` sugar | S | **NOT STARTED** | Marked optional and droppable in the plan, so this is a plan-consistent state rather than a slip. |

## Corrections outstanding in the gap documents

Recorded here rather than fixed silently, because each is a change to a
design document and belongs in a commit with its reasoning.

**The list this section carried is now empty.** All ten entries have
been applied — four (the "design proposal" headers, `docs/trust.md`'s
depth-budget self-contradiction, `AGENTS.md` on the divergence ledger,
and `docs/test-coverage.md`'s per-file table) in commit `94b63f9`,
which is also the commit that wrote the list; the remaining six with
the G1 phase 4–5 landing. What changed, for a reader tracing the
history:

- G1's problem statement, Phase 6 text and Risks table, and its
  open-questions list now match what landed — 21 builtins with the
  atoms routed through `constraintAtoms`, exactness rather than the
  `(2^53, 2^63)` magnitude band, and the two questions phase 0 decided
  (lazy endpoints with eager emptiness; `length` in Unicode code
  points) struck through with their rulings.
- All eight plan preambles now link protocol rule 5 above instead of
  restating a row count; none of the eight had a current one.
- `parse(canon(v)) == v` is gone from the gap documents' guarantees,
  replaced by canon convergence — the property both runners actually
  assert. It survives only where G1, G2 and G5 quote the retracted
  phrasing in order to retract it.
- The drifted `makeModelResolver` "~line 750" citations in G6 and G7
  now name the file without a line number, which is the form that
  cannot drift again.

Keep this section, and add to it, when the next phase lands
differently from its design: the standing hazard is a gap document
that reads as current while describing a rule the engine no longer
has.

## Where this is pinned

Nothing in this file is machine-checked; it is prose, held accurate by
protocol rule 1 alone. The suite counts in rule 5 are the exception —
they carry their reproduction commands, so a reader can falsify them in
two shell lines. If this register and a gap document disagree, **this
file is wrong until re-verified against the tree**: the gap documents
are older and were written before any of it landed, so they cannot be
evidence of status, but neither can a register nobody re-checked.
Re-derive from `test/spec/`, `ts/src/`, `go/` and `git log`.
