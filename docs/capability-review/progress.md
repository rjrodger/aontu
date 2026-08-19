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
   register's last update the suite is **72 `.tsv` files, 71
   row-bearing, 2,723 rows**, in sixteen modes — `canon` 682, `gen`
   539, `errc` 438, `gens` 337, `err` 237, `subsume` 94, `query` 92,
   `errcode` 86, `vet` 53, `why` 43, `hcanon` 42, `diff` 28,
   `patch` 23, `trim` 11, `hash` 11, `agentsmd` 7. Reproduce with
   `ls test/spec/*.tsv | wc -l` and
   `cat test/spec/*.tsv | grep -P '\t' | grep -vc '^#'`.

## Summary

Thirty-eight of forty-nine phases have moved; thirty-six of those are complete.

| Gap | Capability | Review phase | Landed | Partial | Not started |
|-----|-----------|--------------|--------|---------|-------------|
| [G1](g1-constraint-algebra.md) | Constraint algebra | A | 7 | 0 | 0 |
| [G2](g2-validation-verb.md) | The validation verb | A | 6 | 0 | 0 |
| [G3](g3-subsumption-evolution.md) | Subsumption, evolution | B | 7 | 0 | 0 |
| [G4](g4-identity-relations.md) | Identity, relations | C | 2 | 0 | 4 |
| [G5](g5-trust-contract.md) | Trust contract | A | 5 | 1 | 0 |
| [G6](g6-distribution.md) | Distribution | B/C | 2 | 0 | 3 |
| [G7](g7-machine-access.md) | Machine access | B | 7 | 0 | 0 |
| [G8](g8-generation.md) | Generation | C | 0 | 1 | 4 |
| | | **total** | **36** | **2** | **11** |

Against the review's own [sequencing](index.md#sequencing):

- **Phase A — make the claim true.** Nearly done. The trust contract
  (G5.1–2) and the error-code registry (G2.1) are in, **G1 is
  complete** — all seven phases, both ports, shared rows, and the
  ADR-002 gate back at 100% in both — and so is **`aontu vet`**:
  engine (G2.2), command (G2.3), Go port (G2.4) and the delivery skin
  (G2.5: SARIF in both ports, the `vet-action/` composite Action, and
  `--watch`), with verdict exit classes an agent loop can branch on and
  46 shared rows both runners execute. G1 landed more than the
  sequencing table's "constraint algebra core (bounds, regex,
  length/count)" asked for: cross-field residuation and the `must`
  escape hatch are in too. **G2 is complete**: multi-error collection
  (G2.6) landed, so a report lists every contradiction the fixpoint can
  reach, deduplicated to one finding per cause. **G5 is complete but
  for one release act**: the trust profile (include capability plus
  deterministic budgets) is in both ports at every surface, the shared
  suite is hermetic under it, and the include manifest makes the
  hermeticity file set observable — what remains of A is only G5.6's
  default FLIP, staged for the next major version with its warning
  window already shipping.
- **Phase B — differentiate.** Underway, and **G3 is complete** —
  subsumption is a query and a gate: the recursion in both ports
  (G3.1–2), its rules and 94 shared rows (G3.0), the `subsume` and
  `breaking` CLI verbs with `git#rev` resolution and the
  `aontu_policy.compat` declaration (G3.3), the `deprecate()` mark
  with its three point-of-use surfaces (G3.4), the default-validity
  lint (G3.5) and the `trim --check` redundancy reporter (G3.6). The
  **canon-hash pins meaning rather than text** (G6.0–1): the hash form
  in both ports, `aontu hash` on both command lines, and full
  `aon1-…` strings pinned cross-implementation by the shared suite —
  the review's Phase B "canon-hash pinning" item, useful with no
  registry behind it. And the **query surface has opened** (G7.1–2):
  `aontu get` selects one node by path and renders it plainly or as a
  lattice abstraction, in both ports, with the "view subsumes truth"
  property mechanically asserted by every projection row rather than
  promised. **Provenance is a verb** (G7.3–4): `aontu why` names every
  contribution to a value with the site it was written at, from a
  recorder that hooks the one place every meet passes through and is
  off by default. And **patch is a verb** (G7.5): `aontu set` appends
  a path-flattened conjunct to an overlay, refuses to write a change
  that contradicts a pinned value, and rests on an order-independence
  the suite asserts row by row. **The delivery skin is on** (G7.6):
  an MCP server over the same contracts the CLI prints, a path-
  addressed `diff`, a published grammar the suite's own canon corpus
  is run against, a generated AGENTS.md stanza, and a skill whose
  examples are executed. **G7 is complete** (G7.7): the REPL loads a
  document and answers `:get`, `:keys` and `:why` about it, `--jsonl`
  makes the session machine-drivable, and LSP hover can carry the
  provenance record behind a config gate.
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
| **2** — vet engine API | M | **LANDED** | `ts/src/vet.ts` and its Go twin `go/vet.go`, exported from `ts/src/aontu.ts` and as `aontu.Vet`: anchor selection (`at`, `closed`), data parsed with the full grammar, unify-with-collect, the residue walk, finding construction with roles by provenance, vet-side sorting, `maxErrors`/`truncated`, and the four verdicts. `test/spec/vet.tsv` — 42 rows, executed by BOTH runners; `ts/test/vet.test.ts` (36 cases) and `go/vet_test.go` (35) hold the per-port API around them. **The PARTIAL that stood here had one cause and phase 4 removed it:** both runners execute every row of every `test/spec/*.tsv` with no skip list, so a `vet` row could not execute until both ports had the verb. The rows were promoted from `test/spec/draft/vet.tsv` with every golden regenerated from the canonical engine and then run against the port. **Departures from the design:** (1) the encoding is FIVE columns — name, mode, schema, data, expect — because vet takes two documents and no separator inside one cell is safe; both runners already tolerated extra columns, so the arm is additive. (2) `message` is excluded from the goldens and asserted per port, because prose is deliberately not in cross-port parity. (3) Options (`at`, `closed`, `partial`, `maxErrors`) have no column: they ride an `opts` key in the expect object. Flagged in the draft as the one unprobed piece of the encoding, it survived the probe unchanged. (4) findings that never reach the tree are collected from the context too — a parent that collapses to a nil takes its subtree with it, so `close({…})` meeting a typo AND a kind conflict left one nil standing and reported the other only on `ctx.err`. The verb's own motivating example was reporting half of what it found. (5) A conflict inside a `&:` template reports the TEMPLATE's path, not the instance's. Both ports now agree on that (they did not at first — see phase 4), and the data site still points at the offending value; naming the instance path remains a report-layer improvement nobody has taken. (6) The finding object ships `expected`, `actual` and `note` but NOT the design's `alternatives`, `allowed` and `nearest`. Each needs something the engine does not hand over yet — the member canons of a failed disjunction without going through the fold defect, the closed bag's key set at the point of refusal, and an edit-distance suggestion over it — and none of the three changes the report's SHAPE when it lands, which is why the omission is a gap rather than a departure from the contract. |
| **3** — CLI verb and JSON format | M | **LANDED** | `aontu vet <schema> <data> [more-data...]` in `ts/src/cli.ts` and `go/cmd/aontu/vet.go`: subcommand dispatch (first argument only, so a file argument is never shadowed), `--at`, `--closed`, `--partial`, `--max-errors`, `--format text|json`, and verdict exit classes 0/1/2/3/4. Each data file is vetted separately and the worst verdict wins. 16 cases in `ts/test/cli.test.ts`, 15 in `go/cmd/aontu/vet_test.go`; `docs/reference-api.md` "`aontu vet`" and `docs/how-to.md` carry the verb. The two CLIs were diffed on ~90 schema/data pairs and produce BYTE-IDENTICAL reports, text and JSON, exit codes included — everything but the `version` field, whose two series are independent by design, and the host's own wording for an unreadable file. **Departures from the design:** (1) the text renderer does NOT reuse `descErr`. `descErr` renders NilVals with ANSI colour through the TypeScript-only error path, while the report is a plain projection the Go port has to match byte for byte. (2) JSON field order is `exactJSON`'s lexicographic order, not the design's illustrative order, because that is the emitter already held to byte parity with Go — which is why the Go structs declare their fields in sorted order. (3) `--surplus` and `--watch` are not here: the first has no engine support yet and the second is phase 5. |
| **4** — Go port | L | **LANDED** | `go/vet.go` (the engine), `go/walk.go` (one traversal for Check and vet, the twin of `ts/src/walk.ts`, with provenance stamping), `go/cmd/aontu/vet.go` (the verb). No `go/report.go`: the renderers live beside the command, as they do in `ts/src/cli.ts`, and the report types are the engine's exported API. The port is what made `test/spec/vet.tsv` executable. **What the port cost the ENGINE, and why that is the interesting part.** Byte parity was the acceptance test, and it exposed nine pre-existing divergences no shared row had reached — every one fixed rather than recorded: (1) `rowCol` counted BYTES where the canonical port counts UTF-16 code units, so every column after a multi-byte character was late, in messages and in the LSP-adjacent surface alike; (2) an error frame printed the two lines AFTER the mistake and none of the two before, so every message about row 2 or later differed from TypeScript's; (3) a closed bag RETURNED at its first surplus key instead of recording it and unifying the rest, which is exactly the motivating example above — half the report, from the engine rather than from vet; (4) the disjunct fold dropped the path, so a junction that survived one evaluation and met its peer in a later one (what vet does) reported at the root; (5) junctions were sited at their first member where TypeScript sites them nowhere, so an unsited operand claimed row 1 column 1; (6) a preference's synthesised type yardstick was unplaced, pointing at the start of the document; (7) the operand flip compared positions across the two documents, which are offsets into different texts — fixed by giving every value a source identity (`base.surl`, `srcid`), the same thing TypeScript spells as a site url; (8) a constraint residual dropped that identity, so a data value the schema refined was reported as belonging to neither document; (9) generation under COLLECT recorded nothing — not the bag's first non-generable child, not a root residue — where TypeScript records the reason and carries on, which is the whole point of the mode and the half of the report the incomplete verdict is built from. The first two are now pinned by a twin pair over a multi-row, non-ASCII source (`TestFullMessageTwinFramed`, `full-message-twin-framed`); the one-line twin that stood before could not see either. Two more were fixed in the canonical port: `vet` THREW on a failure with no operands (a lossy integer literal in the data crashed the verb), and half of every report carried an empty `message` because the text is materialised only on the throwing path. **Not fixed here, and now understood:** issue #63's frame ordering is the same operand-flip family — Go marks clone-minted values where TypeScript marks values the parser did NOT site, which is a different set. Dropping the clone mark alone fixes #63 with both suites green; doing it properly means marking parse-sited values instead, and that is its own change. |
| **5** — SARIF, Action, watch | S | **LANDED** | SARIF: `ts/src/report-sarif.ts` + `go/report_sarif.go` — LIBRARY API in both ports (`sarifReport`/`aontu.SarifReport`), a minimal 2.1.0 profile (one run, one result per finding, data site primary, schema sites related, the native finding embedded in `properties`), byte-identical across ports over the shared golden `test/spec/files/vet-sarif/` with `message` text and `tool.driver.version` redacted — the same carve-outs `vet.tsv` and the JSON report already make. `--format sarif` in both CLIs. Watch: `--watch` in both CLIs, polling mtime+size (`watchChange`/`watchWait`), one full re-run per change, an unreadable mid-save file reports and keeps watching; the waiter is injectable, which is what makes the loop testable to the ADR-002 floor. **Departure:** the Action ships IN THIS REPOSITORY as the composite `vet-action/` (usable as `rjrodger/aontu/vet-action@<ref>`), not as the separate `aontu-vet-action` repo the design named — it versions in lock-step with the CLI it runs, and G2's doc now says so. `docs/how-to.md` carries the CI recipe and the pre-commit hook. |
| **6** — multi-error collection | L | **LANDED** | The single-error exit is GONE from both pass loops (`ts/src/unify.ts`, `go/unify.go`): the fixpoint continues past an erroring pass, so failures only a later pass can reach are collected in the same run. `test/spec/vet.tsv` `multi-*` rows (42 → 46), executed by both runners: a second-pass conflict now reports as a real two-site conflict where it used to surface as a vague unsited incompleteness; independent conflicts each report; fan-in and cycles collapse to ONE finding. **Two departures from the design.** (1) No nil-localisation surgery was needed: the design scoped this L and sketched "localise `nil` to its subtree" as new engine machinery, but the existing absorption discipline (unite's isNil arms return the existing nil, raising nothing) already IS the localisation — one failure stays one NilVal through every later meet, which the adversarial probe corpus (fan-in refs, spread templates, disjunct trials, nested conjuncts, prefs, `must`) confirmed against both engines before the rows were written. (2) The report dedup key is **(code, sites)**, not the design's (code, path): a reference resolves by CLONING its target, so one failed target can fail once per referrer with a DIFFERENT path each time — the paths are exactly what differ, so keying on them cannot collapse the family; keying on the meet's source positions does, and also fixed a pre-existing double report (a pure cycle reported at two of its three members even under the single-pass loop; `multi-cycle-one-finding` pins the collapse). One behaviour change outside vet: a cycle's members now absorb the one cycle nil instead of surviving as references, so the LSP hover for such a member is gone (the diagnostics still carry the cycle) — `hover-kind-labels` now pins the `reference` label with a budget-stalled chain instead. `truncated` now means only the `--max-errors` cap. |

**What the phase-4 review round changed, and why it is recorded here.**
An automated review of the port's pull request raised six findings; all
six reproduced, and fixing them moved contracts, so the register carries
them rather than the pull request alone. (1) `vet` resolved a relative
`@"file"` load against the process working directory, so a modular
schema vetted from anywhere else came back `error` — and, worse,
silently read a same-named file that happened to sit in the working
directory. The engine still reads no file itself; the CALLER now passes
each document's path (`schemaPath`/`dataPath`), and the two documents
get their own bases because they need not share a directory. (2) A data
document that would not parse was reported as a broken SCHEMA (exit 4),
which the engine already contradicted one character away — a refused
construct reaches the tree as an ordinary nil and is reported as
invalid data. It is now `invalid` with a `parse`-class finding, and
exit 4 means only "the run cannot be set up from the schema side". (3)
`--max-errors` capped each data file separately and the CLI then
concatenated the lists, so the cap scaled with the number of files and
`truncated` could stay false while the report exceeded it; the cap is
now applied to the aggregate. (4) The two CLIs accepted different
spellings of `--max-errors` (`1.0`, `1e2`, `0x10` and ` 3` in
TypeScript; a saturating twenty-digit value in Go); both now take one
to nine decimal digits and nothing else. (5) `--at` read the anchor off
whatever a value's `peg` held, so it walked into a junction's branches
(narrowing the truth to one alternative and failing a conforming
document), into a constraint's own arguments, and into an array's
`length` — that last handing back a JavaScript number as the anchor,
after which EVERY document validated. The anchor is now a structural
path in both ports, and a list index must be canonical decimal, which
is what a reference already required — the same tightening applied to
`RefVal` in Go, where `$.a.01` had resolved while TypeScript refused
it. (6) Both spec runners silently skipped a row with too few columns;
they now fail loudly, naming the file and line, and so does the
registry loader. Two divergences the review's own line of questioning
exposed are NOT fixed here and carry issues instead: the `file` of a
site whose value came from an included schema file (#66), and the
`-0` path segment (#67). The round's own fixes then left three arms
nothing executed — the aggregate cap of (3), and, in Go, the
per-document base of (1) and the fallback for a value belonging to
neither document — and ADR-002 caught all three. Each is now closed by
a test rather than an exclusion, and the third by a shared row
(`vet-unstamped-operand`): an unknown var meets `top`, which no parser
sited, and BOTH ports leave its site's `file` empty rather than
borrowing a document name, so the emptiness is now contractual.

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

| Phase | Size | Status | Pin |
|-------|------|--------|-----|
| **0** — rules on paper | M | **LANDED** | `docs/reference-language.md` "Subsumption": the per-former table (all three profiles, with the `*` × `close()` × `&:` × `?` interaction cells), sitting above the constraint algebra's own subsumption table, whose "not yet implemented" note is gone. `test/spec/subsume.tsv` — 97 rows, executed by BOTH runners, covering every probe in the design's Problem section (the v1/v2 `service` break included) and every `undecided` reason. **Departure:** the design named six columns (name, profile, general, specific, verdict, detail); the encoding is instead vet.tsv's exactly — FIVE columns with the report as an expect object, `message` excluded, options (`profile`, `at`) riding the `opts` key — because the two-document shape and its probed carve-outs are the same, and a second five-column precedent beats a third encoding. |
| **1** — the recursion, TypeScript | L | **LANDED** | `ts/src/subsume.ts`: a dedicated structural walk over evaluated trees (design option B) — never mutates, no fixpoint, three-valued verdict plus `error`; findings reuse G2's object with class `compat`; the nine codes (`compat_narrowed`, `compat_required_added`, `compat_default_changed`, `compat_marks_changed`, five `sub_*` undecided reasons) registered in `test/spec/errcodes.tsv` under the new `compat` class. Constraint rules live beside the compare machinery they reuse (`ts/src/val/ConstraintVal.ts` `constraintSubsumesConstraint`, `constraintAdmitsScalar`). Exported from `ts/src/aontu.ts`. **Departures:** (1) no `rankPrefs` helper existed to reuse — effective-default extraction is the walk's own, and the first draft picked the HIGHEST rank where generation picks the LOWEST (`a:**1|*2` generates `2`, `edge.tsv`); the parity corpus caught it before landing and `default-rank-mixed` pins the direction. (2) The constraint table's `must` row says "never"; the query answers `undecided` (`sub_evaluate_only`) — honest indecision, recorded in the reference. (3) No nil rule: an error-free evaluated tree carries no nil, so the walk's no-rule fold answers a hypothetical one `undecided`, pinned by direct tests in both ports rather than rows no source can produce. |
| **2** — Go port | L | **LANDED** | `go/subsume.go`, mirroring the dispatch; `go/constraint.go` `constraintStateSubsumes`/`constraintAdmitsScalarQ`; both runners execute every `subsume.tsv` row with no skip list, expectations parity-probed (byte-identical reports, message text excluded) before any row was written. **What the probe cost the engine** (the G2 phase-4 pattern, two more pre-existing divergences fixed rather than recorded): (1) a preference was sited at its inner value where TypeScript sites it at the `*` itself (`go/lang.go` star-prefix); (2) `hasPathFunc` did not see through a `ConstraintVal` — a pending atom endpoint holding `min($.floor)`, a `must` value, the recursive count — so a path-dependent spread template compared structurally instead of refusing (`go/mapval.go`). |
| **3** — CLI verbs (`subsume`, `breaking`) | M | **LANDED** | `aontu subsume [--profile] [--at] [--format text\|json]` and `aontu breaking --against <file\|git#rev> [--mode backward\|forward\|full] [--allow-undecided]` in `ts/src/cli.ts` and `go/cmd/aontu/subsume.go`: exit classes 0/1/3/4/2 mirroring vet's convention (undecided FAILS by default), `git#rev` by shelling out to `git show <rev>:./<basename>` from the file's own directory, the `$.aontu_policy.compat` declaration read from the new document with `--mode` overriding (reader: `policyCompat` beside the TS verb, exported `aontu.PolicyCompat` in Go — the verb package cannot reach the tree's fields), findings through G2's renderer. `SubsumeOptions` gained `generalPath`/`specificPath` (vet's per-document base precedent) so relative `@"file"` loads resolve from each document's own directory. 11 cases in `ts/test/cli.test.ts`, 12 in `go/cmd/aontu/subsume_test.go`; the two CLIs diffed byte-identical (text and JSON, exit codes included) over a 24-case corpus — the version field and the host's unreadable-file wording excepted, G2 phase 3's same carve-outs. `docs/reference-api.md` and `docs/how-to.md` carry the verbs. **Departures:** (1) no `--allow-deprecated-removal`: it gates on `deprecate()`, which is phase 4 — the flag lands there rather than parsing as a no-op lie here. (2) No SARIF format: the SARIF profile is vet's report shape (`truncated`, data/schema roles); mapping compat findings is real design work nothing needs yet. (3) A `git#rev` source's relative includes resolve from the working file's directory (the revision has no directory of its own). |
| **4** — `deprecate()` | M | **LANDED** | The twenty-second builtin: `deprecate(x, m)` in both ports (`ts/src/val/DeprecateFuncVal.ts`; the resolve arm in `go/func.go`), unification-transparent — the record (keys msg/use/since, all optional strings; other keys DROPPED) rides the Val (`Val.deprecation`, `base.deprec`) through every meet via a rider at the tail of `unite` (the one place all meets pass), through clones, reference resolution and spread application; canon renders the call back reparseably (`canonDeprecation`, wrapped at the bag renderers). `test/spec/deprecate.tsv` — 22 rows (canon round-trip and convergence, transparency, refs, spreads, the record vocabulary, arity, three vet rows), parity-probed. Point of use, three surfaces: a vet finding code `deprecated`, class `compat`, severity `warning` — registered in errcodes.tsv, and warnings never move the verdict; the LSP Deprecated tag (2) at Hint severity in both servers; and `breaking --allow-deprecated-removal`, which downgrades findings about values the `--against` version already deprecated (readers: `deprecatedAt` beside the TS verb, exported `aontu.DeprecatedAt`). **Departures:** (1) the design's "alongside the existing mark propagation" landed as a rider in `unite` instead: the boolean-mark sweeps are order-sensitive by construction, and a record lost in one meet shape is a use the tooling never warns about — the rider also makes a deprecated spread template deprecate every key it governs. (2) A first canon draft computed each child's canon twice (guard + render), which is 2^depth on a nested document — the budget suite's 1200-deep fixture caught it. (3) No `since` checking: free text until G6 defines module versions, as designed. |
| **5** — default-validity lint | S | **LANDED** | `pref_not_instance` (class compat, severity `warning`, registered in errcodes.tsv): vet walks the SCHEMA anchor for disjunctions carrying a preference and asks the subsumption recursion's own two questions — the effective default (`effectiveDefault` / `subEffectiveDefault`, exported for the lint) and whether some remaining alternative admits it (`subsumeNode`). Four parity-probed vet rows in `test/spec/subsume.tsv` (the design's own `*wran` example included); the shared `walkBagVals` walker now backs this, the deprecation walk and nothing else. The warning-to-error flip is documented as NOT taken (docs/reference-language.md, "Default validity"): today's engine generates the bad default, and promoting the warning is itself a breaking change, sequenced through the `breaking` gate. |
| **6** — trim reporter | M | **LANDED** | `ts/src/trim.ts` (`trimCheck`, exported from `ts/src/aontu.ts`) and `go/trim.go` (`TrimCheck`): report REDUNDANT map entries — entries whose removal leaves the evaluated result unchanged, the spread-implied case included — as paths, with verdicts `clean`/`redundant`/`error`. The CLI verb `aontu trim --check [--format text\|json]` in both ports (`ts/src/cli.ts`, `go/cmd/aontu/trim.go`), exit classes 0/1/4/2; `--check` is REQUIRED — `aontu trim f.aon` reads as "trim this file", and doing something else silently is worse than refusing. `test/spec/trim.tsv` — 11 rows, parity-probed (the two engines diffed byte-identical over the corpus before any row was written), executed by BOTH runners as the ninth mode. `docs/reference-api.md` carries the verb and the export. **Departures:** (1) the test is EVALUATE-AND-COMPARE — re-parse, delete the entry from the parsed tree, evaluate, compare canons — which *subsumes* the design's "unifies against the spread template to top" test and is honest about everything the fixpoint sees (references, duplicate-key merges), where a structural test would guess; a removal that ERRORS is not redundant (load-bearing). (2) Candidates are map entries at every depth; list ELEMENTS are excluded — removing one shifts every later index, a different document rather than the same one minus a redundancy. A child of a redundant parent is skipped: the parent's removal already covers it. (3) Report-only, and rewriting is DEFERRED to G7 by design: canon discards comments and layout, so an editing trim needs G7's format-preserving patch surface — trim ships as a reporter here and becomes an editor there. |

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

| Phase | Size | Status | Pin |
|-------|------|--------|-----|
| **0** — semantics on paper | S | **LANDED** | The "Identity: `id(name)`" section of [`docs/reference-language.md`](../reference-language.md#identity-idname) — merge semantics, the name grammar, canon and the hash, the three clearing rules — plus `test/spec/id.tsv` (66 rows) and the three codes in `errcodes.tsv`. The design's phase-0 also called for `test/spec/refer.tsv`; that ships with phase 2, which owns `refer()`. |
| **1** — `id()` | M | **LANDED** | `ts/src/val/IdFuncVal.ts` and the `"id"` arm of `go/func.go`; the `entity` slot on the carriers (`ts/src/val/Val.ts`, `go/val.go`) with the rider in `unite` in both ports; the registry on the unify root context (`ts/src/unify.ts` `entities`, `go/ctx.go`) and the per-pass `mergeEntities` walk (`go/identity.go`); canon through `canonRiders` (renamed from `canonDeprecation`, now rendering both riders) and the hash form through `hcanon`; clearing rules in `RefVal`/`CopyFuncVal` (TS) and `ref.go`/`func.go` via `walkClearEntity` (Go), and rule 3 at bag construction in both. `id` added to the arity tables, the LSP completion list, and both published grammars. **Departures:** see below. |
| **2** — `refer()` | M | **NOT STARTED** |  |
| **3** — derived structures | S | **NOT STARTED** |  |
| **4** — `std/system` vocabulary | M | **NOT STARTED** |  |
| **5** — relation graph checks | L | **NOT STARTED** |  |

Phase 5 has a host now — `vet` exists (G2) — but no G4 artifact
beyond phases 0 and 1.

**Departures recorded by G4.1.**

1. **The merge is COLLECT-then-APPLY, two walks per pass, not one.**
   The design's "a position carrying an id unifies with the
   representative and updates it" reads as a single walk, and a single
   walk is wrong: it leaves every position it already passed holding
   the pre-merge value, so `a: id(x) & {k:1}` kept `{k:1}` while
   `b: id(x) & {j:2}` became `{j:2,k:1}` and the two sites disagreed
   about what the one entity is. The representative is settled over
   the whole tree before any position is written.
2. **`id(key(0))`, not `id(key())`, is the per-child spread name.**
   The design sketched `&: id(svc/ + key())`; there is no string `+`,
   and more importantly `key()` reads one level UP (`func.tsv`,
   `key-one`), so in a template applied at the child position it names
   the BAG and every child collides on that one name. `key(0)` is the
   child's own key. The collision case is a defined result rather than
   a refusal — rule 3 is a syntactic guard on CONSTANTS, and no
   parse-time check can know what a computed name resolves to — and is
   pinned as such (`spread-key-id-collides`).
3. **Rule 3's refusal makes the BAG the error, not only its children.**
   Placing the nil as the template alone would leave an empty bag with
   a bad template silently fine. The bag returns it, narrowed to this
   one code so a nil template from any other cause keeps its existing
   per-key behaviour.
4. **Marks reach every position of an entity.** `a: hide(id(x) & {k:1})`
   hides the entity, not just that declaration of it, because every
   position holds the one merged value. A consequence of the design's
   own "every declared position holds the merged value", surprising
   enough to pin (`merge-hide-covers-every-position`).
5. **Identity is a slot, not a mark, and canon renders it** — as the
   design says — which required `canonDeprecation` to become
   `canonRiders` in both ports, rendering identity inside the
   deprecation wrapper. The order only has to be FIXED (both wrappers
   are reparseable calls); this one matches the canon the G3 rows
   already pinned.
6. **The merge is PROVENANCE-VISIBLE, and aligning that moved the
   canonical implementation twice.** `why $.b.k`, where `b` picked `k`
   up from another declaration of the same entity, has to name the
   site that wrote it. Two long-standing structural differences
   between the ports surfaced the moment a merge brought a peer whose
   children the recorder counts as WRITTEN (a reference's clone's do
   not, which is why nothing had caught them): TypeScript CARRIED a
   peer-only key where Go unites it with TOP, and TypeScript's
   equal-pair fast path in `unite` returned before the recorder at the
   tail of the slow path where Go's recorder wraps the whole
   dispatcher. Both are now conditional on `ctx.prov` — instrumented
   runs take the meet, uninstrumented ones are untouched — and the
   four `why` rows in `id.tsv` pin the result.

**The funcMap note, now answered.** The doc said the two new builtins
"join `funcMap`"; G1's atoms did not, routing through
`constraintAtoms` instead. `id()` takes the funcMap road — it is an
ordinary function that resolves to a value, not a residual constraint
— and, as the note required, added its entry to the arity tables in
both ports. The builtin roster is now twenty-three.

## G5 — a specified trust contract

| Phase | Size | Status | Pin |
|-------|------|--------|-----|
| **1** — write the contract | S | **LANDED** | [`docs/trust.md`](../trust.md), four clauses (hermeticity, termination, determinism, sandboxing) with profiles and budget names; `docs/reference-api.md` single-use-tree rule; `AGENTS.md` points at it. Commit `98fc1bf`. |
| **2** — budget and cycle taxonomy | M | **LANDED** | `test/spec/budget.tsv` (24 rows) pinning `path_cycle`, `no_path`, `budget_passes`, `unify_cycle` as distinct; the `maxcc` false positive fixed by the per-pass memo with a 1200-sibling fixture as guard. Commits `98fc1bf`, `90f3146`. |
| **3** — trust profile and confinement, TypeScript | L | **LANDED** | `trust` on `AontuOptions` (`ts/src/type.ts`): include capability `'none' \| {mem} \| {root} \| 'system'` plus `budget.{passes,depth}`. `makeModelResolver` (`ts/src/lang.ts`) enforces it — `none` denies outright, `mem` is the whole world (a miss is not-found, denial is reserved for a refused MECHANISM), `root` is realpath-then-prefix-check on the RESOLVED file so a symlink escape is denied, `system` keeps today's chain; a denial is RAISED (never injected as a value, or a bare-member include would vanish in the merge) and lands as the parse-stage `include_denied` nil (`errcodes.tsv`, class parse). Budgets ride `ctx.budget` (`ts/src/ctx.ts`), read by the pass loop and depth guards (`ts/src/unify.ts`); fixing `passes: 1` exposed and fixed a real defect — the still-refining snapshot was taken after pass `maxcc-2`, which never exists when the budget is 1, so exhaustion was SILENT; it is now taken at the final pass's entry, in both ports. CLI: `--trust <system\|none\|root[:dir]>`, `--include-root`, and the phase-6 warning window. LSP: workspace-root confinement from the `initialize` params, `initializationOptions.aontu.trust.include` override, an unrecognised explicit value confining to NOTHING. Spec: `test/spec/include-trust.tsv` (4 rows, both runners, fixtures-root profile — the var.tsv runner-convention precedent) and `file.tsv` re-scoped under the same profile, making the shared suite itself hermetic. **Departures:** (1) `budget.revisits` is NOT profile surface — the Go dispatcher has no revisit counter, and a knob one port cannot honour breaks ADR-001 by construction; the TS revisit bound stays an internal constant. (2) The LSP falls back to UNCONFINED when there is no workspace root and no explicit option (single-file sessions rely on it); the design's per-surface table implied always-confined. (3) `deny-pkg` from the design's sketch rows is unpinnable as a shared row (a package hit depends on the installed environment); package denial under `root` shows as not-found after the file leg misses, and the pkg-leg skip is pinned per port. |
| **4** — Go port of profile and budgets | L | **LANDED** | The trust profile in Go: `Aontu.Trust` (`TrustOptions{IncludeNone, IncludeMem, IncludeRoot, Budget}`, `go/aontu.go`); enforcement in `go/source.go` (capability + realpath containment + `deniedKind` processor, the twin of the not-found flow) with the capability riding the parse meta bag (`trustSink`, the `notFoundSink` pattern) because the parser is CACHED per base; `parseWithTrust` (`go/lang.go`) returns the denial as `include_denied` BEFORE the not-found check; budgets on `Ctx` (zero = the spec constants, so a bare `&Ctx{}` behaves exactly as before). CLI flags and warning window in `go/cmd/aontu/main.go`; LSP workspace confinement in `go/lsp` (`trustFromInitialize`, `DiagnosticsTrust`). One canonical-side alignment landed with it: `CheckVars` reports a parse failure under its SPECIFIC code (`syntax`, `include_denied`) instead of a generic `parse`, matching the first-code contract errc rows pin. `include-trust.tsv` runs in `go/spec_test.go` under the same fixtures-root profile; per-port twins in `go/trust_test.go`, `go/cmd/aontu/trust_test.go`, `go/lsp/lsp_test.go`. |
| **5** — determinism byte-pinning | M | **LANDED** | `gens` documented in `docs/shared-spec.md`; the byte-exact rows live beside the behaviour they pin; repeatability enforced as a *runner property* — both runners re-run every `gens` row on a fresh engine. The **`deps` manifest** completed the phase: the resolved include closure as sorted, deduplicated `{path, capability}` entries — `result.deps` in TypeScript (`manifestOf`, `ts/src/aontu.ts`), `Aontu.IncludeDeps` in Go — hermeticity clause 1's "file set" made observable, deterministic by construction (no timestamps; the plugin's raw `wen`-stamped DependencyMap stays internal). Documented in `docs/reference-api.md` and `docs/trust.md`; pinned per port (`ts/test/trust.test.ts`, `go/trust_test.go`). |
| **6** — default flip | S | **PARTIAL** | The **warning window** is shipped, in both CLIs: under the default `'system'` posture, every resolution escaping the entry root (or resolving through a package) prints one stderr line naming `--trust system` / `--include-root` — once per resolution, pinned per port. `docs/trust.md` states the schedule. **What remains is the flip itself** — CLI entry-root confinement by default and the library's explicit-capability requirement — which the design stages at the NEXT MAJOR VERSION with a migration note; that is a release decision for the repository owner, not more code: the machinery, flags and denial semantics it needs are all landed. |

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
| **0** — the hash form (`hcanon`) | S/M | **LANDED** | `ts/src/hcanon.ts` (`hcanon`, exported from `ts/src/aontu.ts`) and `go/hcanon.go` (`aontu.Hcanon`): exactly the unify-level canon with the two additions that close its semantic gaps — a closed map or list wrapped as `close({…})` / `close([…])`, and the type/hide marks rendered as `type(x)` / `hide(x)`. Both reuse parseable syntax, so the hash form is valid Aontu source, and every row asserts the property the hash rests on: `hcanon(unify(parse(hcanon(v)))) == hcanon(v)`, in both runners. `test/spec/hcanon.tsv` — 38 `hcanon` rows in the new mode (closedness at depth and under marks, spreads, optional keys, prefs, refs, escape-heavy strings, extreme and exact magnitudes, code-point key order, the deprecation vocabulary), beside 6 `canon` rows over the same sources so the "user-facing canon is UNCHANGED" claim is a pin rather than a promise. `docs/shared-spec.md` carries the new modes (and the `subsume`/`trim` modes it had not caught up with). **Departures:** (1) the marks PROPAGATE to every descendant at unification, so a wrapper is emitted only where a mark STARTS — the walk carries inherited marks down and a child whose mark its parent already carries renders bare; rendering every marked leaf would be correct but never minimal, and not what the source said. (2) The design's "`ts/src/val/Val.ts` (default `hcanon` delegating to `canon`)" landed as a standalone WALK instead of a per-Val method: the rendering has to carry inherited-mark state down the tree, which a no-argument getter on each Val cannot do without adding that state to every Val in the engine. Everything the walk does not need to descend — scalars, kinds, funcs, refs, constraints — still delegates to its own `canon`, which is where the cross-port parity already lives. (3) The junction parenthesisation rule is kept exactly, but post-unification junctions are flattened by `norm`, so no SOURCE reaches its wrapping arm; it is pinned by direct tests over constructed Vals in both ports, because a hash form that could render `(1\|2)&3` as the differently-parsing `1\|2&3` would be a pin that silently agrees with a document it should not. |
| **1** — the hash itself (`canonHash`) | S | **LANDED** | `canonHash` / `aontu.CanonHash`: `"aon1-" + base64url(SHA-256(UTF-8(hcanon(unify(v)))))`, unpadded (RFC 4648 §5), the scheme id there so a semantically stronger normal form is later an upgrade rather than a breakage. CLI verb `aontu hash [--form] [--format text\|json] <file>` in both ports (`ts/src/cli.ts`, `go/cmd/aontu/hash.go`), the document evaluated STANDALONE at its own root — which is what makes the pin transitive — with exit classes 0 hashed, 2 usage, 4 the document does not stand up on its own (a hash of a wreck would agree with every other wreck). 9 `hash` rows pinning full `aon1-…` strings, executed by BOTH runners; 3 cases in `ts/test/cli.test.ts` and 3 in `go/cmd/aontu/hash_test.go` holding each port's argument handling and the invariances (reformat, recomment, reorder keys → same pin; close a map → different pin); the two CLIs diffed byte-identical over a 10-case corpus (text, `--form` and JSON, exit codes included) — the version field and the host's unreadable-file wording excepted, G2 phase 3's same carve-outs. `docs/reference-api.md` carries the verb, the hash form's definition and the two exports. **Departure:** `--form` is not in the design. It prints the hashed TEXT instead of the digest, which is the first thing anyone needs the moment a pin moves and the only way to see what the engine actually hashed; without it a flapping pin is undiagnosable from the command line. |
| **2** — module identity and local resolution | M | **NOT STARTED** |
| **3** — fetch and publish tooling | L | **NOT STARTED** |
| **4** — registry hooks and agent integration | M | **NOT STARTED** |

Phases 2–4 (module identity, fetch/publish tooling, registry hooks)
have no artifacts yet: no module-path resolution, no `mod.aon`, no
`test/spec/mod.tsv`.

G6's own risk row — "G1's new constraint syntax changes canon,
invalidating all pins" — materialised before the hash existed: G1.1
added five atoms to canon while G6 was still on paper, which is
exactly why the hash landed AFTER G1 completed rather than beside it,
and why the scheme id is in the string.

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
| **1** — `get` and projections, TypeScript | M | **LANDED** | `ts/src/query.ts` (`get`, exported from `ts/src/aontu.ts`): evaluate the document, select the node at a path, render it as generated JSON (the default), canonical form, a `types` shape view, a `depth`-elided view, or a `keys` listing. Path parsing REUSES `anchorAt` — vet's `--at` walk, already type-directed and already in parity — so a path means exactly what a reference means by `$.a.b`, down to the canonical-decimal index rule. A refusal is a G2 finding (`no_path`, class `reference`) carrying a nearest-key suggestion, so `get` invents no error format. CLI verb `aontu get <path> [-c\|--canon] [--keys] [--types] [--depth n] [--format text\|json] <file>` in `ts/src/cli.ts`, exit classes 0 rendered / 1 the path names nothing / 2 usage / 4 the document does not stand up. `test/spec/query.tsv` — 92 rows in the new fifth-column mode; `ts/test/query.test.ts` (5 cases) and 3 cli cases hold the API and the command line. `docs/reference-api.md` and `docs/shared-spec.md` carry the verb and the mode. **Departures:** (1) THE PROJECTION PROPERTY IS ASSERTED, not claimed: every canon-shaped row additionally runs `subsume(view, truth)` in both runners and requires `subsumes` — G3 landed first, so what the design could only promise is now mechanically checked. It runs under the **values** profile, because a shape view ERASES defaults (`*8080\|integer` → `*integer\|integer`) and the `defaults` profile rightly calls that a break; the claim a projection makes is about admitted values, not about which one is generated. (2) `--types` lifts through the lattice's own `superior()` rather than a kind table, and leaves a value that is ALREADY an abstraction (a kind marker, a constraint, an unresolved reference) alone — lifting `integer` to `number` would generalise a shape view that was already a shape. (3) Junctions and prefs are TRANSPARENT to `--depth`: not a structural tier, so `*8080\|integer` projects its members rather than collapsing to `top` and discarding the alternatives. (4) `--depth` with the JSON view is a USAGE ERROR: eliding renders `top`, which JSON cannot say, and switching the view silently is the choice `trim --check` already refused. (5) The design's `[file]` optionality (stdin) is not taken: every other verb names its file, and an included document's base directory has to come from somewhere. |
| **2** — `get`, Go port | M | **LANDED** | `go/query.go` (`(*Aontu).Get`, `QueryOptions`, `QueryReport`) and `go/cmd/aontu/get.go`, mirroring the walk, the views, the exit classes and the JSON report; both runners execute every `query.tsv` row with no skip list, expectations parity-probed (87 cases diffed byte-for-byte, then 5 more for the list-spread arm) before any row was written. `go/query_test.go` (7 cases) holds the API and the arms no source reaches. The two CLIs diffed byte-identical over a 17-case corpus — the version series and the host's unreadable-file wording excepted, G2 phase 3's same carve-outs. **What the probe cost the engine** (the G2 phase-4 pattern): the canonical side was WRONG about a non-concrete value — `get $.k` on `k: integer` returned the string `null` under `collect`, where the Go port correctly refused; generation failures now read back off the context in TypeScript, and `query-k-json` pins the refusal. Two smaller fixes: the finding's path is now the normalised QUERIED path in both ports (it was the engine error's, which is empty for a parse failure), and the Go CLI's `get`, `hash` and `trim` verbs now build their engine through `aontuForFile`, so an error frame names the file rather than `<no-file>`. **Observed, not fixed:** for an unparseable document the TS error FRAME prints one more trailing source line than Go's. It is pre-existing (identical under the plain `aontu <file>` verb), it is frame prose rather than behaviour, and no row pins it. |
| **3** — provenance recorder and `why`, TypeScript | L | **LANDED** | `ts/src/provenance.ts` (the `Provenance` recorder and the record shape) and `why` in `ts/src/query.ts`, exported from `ts/src/aontu.ts`: what CONTRIBUTED to the value at a path, in order, each with the site it was written at. CLI verb `aontu why <path> [--format text\|json] <file>`, exit classes mirroring `get`'s. `test/spec/why.tsv` — 39 rows in a new five-column mode. **Departures, all of them about what a contribution IS** — the design named five instrumentation points (the `update()` site-drop, the conjunct fold, spread application, pref resolution, ref resolution); one is enough and the rest fall out: (1) the recorder hooks `unite` ALONE, the one place every meet passes through — G3's deprecation rider proved that point exists — plus a mark at the spread clone, which is the only role no operand can tell you about itself. A ref is still a `RefVal` when it meets its peer and a pref is still a `PrefVal`, so those two roles need no hook. (2) A contribution must be a value the author WROTE: the parsed tree is stamped before the fixpoint runs, and anything minted during unification (a kind lifted while a disjunct trials its members, a fold's intermediate) is the engine's own work and is dropped — without that rule the record for the design's own example carried a `number` nobody wrote. (3) Values structurally INSIDE a recorded contribution are dropped for the same reason, but a CONJUNCT expands into its terms: `a & b`, or two duplicate keys merged at parse, is several separately-written values, and the conjunct's own site is nowhere. (4) Contributions are ordered by SITE, not by meet order: the fold order is the fixpoint's business and would not survive the port. (5) Deduplication is by (path, val id) as designed, keyed on the path STRING rather than `ctx._pathidx` — the same rule, and the string is what the report prints. (6) Two evaluations are not needed: the recorder rides the one run the call already makes. **The cost is where the design put it:** off by default, one property load per meet on the uninstrumented path; an instrumented run additionally takes the no-op meets a bag normally skips, so a value written once and never met is still reported. |
| **4** — `why`, Go port | L | **LANDED** | `go/provenance.go` and `(*Aontu).Why` in `go/query.go`, plus `go/cmd/aontu/why.go`; the recorder hangs off `Ctx.prov` and hooks the `unite` wrapper that already carries G3's deprecation rider. Both runners execute every `why.tsv` row with no skip list, expectations parity-probed (39 cases diffed field by field, records and refusals) before any row was written. `go/provenance_test.go` holds the ordering's last tiebreaks and the entry-file/trust wiring; the two CLIs diffed byte-identical over an 11-case corpus — the version series and the host's file-error wording excepted. **What the probe cost the engine:** three shapes where a value was never met at all (a lone leaf, a nested leaf, a ref target) recorded nothing in TypeScript and one contribution in Go, because the TS bags SKIP the identity meet as an optimisation; the skip now yields while recording, so both ports see the same meets. Go additionally stamps the entry document's file name (`stampURL`, vet's precedent) — the TypeScript side gets it from the parse `path` option — so a site names its file in both. **Observed, not fixed:** Go has no per-Val id, so the recorder keys on pointer identity, which says the same thing. |
| **5** — overlay `set` | M | **LANDED** | `ts/src/patch.ts` (`patch`, exported from `ts/src/aontu.ts`) and `go/patch.go` (`aontu.Patch`), with `aontu set <path>=<value>... --entry <file> --overlay <file> [--dry-run] [--format text\|json]` in both CLIs: an assignment becomes a path-flattened conjunct (`$.a.b=1` → `"a": "b": 1`, keys quoted so a segment may be a keyword, a number, or hold a space) appended to the overlay, and the verdict is G2's, unchanged — `vet(entry, overlay)` already asks exactly the right question, so the verb adds a writer, not a report. Exit codes are vet's verdict classes. `test/spec/patch.tsv` — 23 rows, parity-probed; `patch_assignment` registered in errcodes.tsv (class `parse`: what is malformed is source text). **The order-independence the whole verb rests on is ASSERTED, not claimed**: every row that stands up additionally runs the vet the other way round in both runners and requires the same verdict. **Departures:** (1) the engine returns the overlay TEXT and the CLI writes it — an engine that touched the filesystem could not be used by a server, and the CLI is the one place that knows about files. (2) The overlay is written ONLY when the change holds: an `invalid` or `error` verdict leaves the file exactly as it was, because a change the author still has to think about should not sit in their configuration while they do (the design said "appends, then re-evaluates"; on a refusal that would leave a broken overlay behind and the exit code is the only thing saying so). `--dry-run` writes nothing either way. (3) A missing overlay file is the empty overlay and is created, so "append to the overlay" does not require having made one first. (4) The entry and overlay file names ride as vet URLs as well as base paths, so a finding names the two files rather than the generic `schema`/`data` labels. **Stage 2 — the format-preserving in-place edit — is NOT started and is what other gap documents defer "applying a fix" to**; it needs a comment-and-layout-preserving CST the parser stack does not have. |
| **6** — delivery: MCP server, grammar, skill, `agentsmd` | M | **LANDED** | Four deliverables. **The MCP server**: `ts/src/mcp.ts` (tools and protocol, transport-free) and `ts/src/mcp-server.ts` (NDJSON stdio), published as the `aontu-mcp` bin — the LSP's three-layer split. Six tools — `vet`, `get`, `why`, `diff`, `canon`, `summary` — each returning the SAME JSON contract the CLI prints; a tool that REFUSES answers with its own report and `isError: false`, which is reserved for a call that could not be made. Served evaluation is confined to no includes at all (G5). **`diff`**: `ts/src/diff.ts` and `go/diff.go`, path-addressed, with `test/spec/diff.tsv` (28 rows) asserting SYMMETRY in both runners. **The published grammar**: `grammar/aontu.gbnf` and `grammar/aontu.lark`, and `ts/test/grammar.test.ts`, which READS the gbnf file, interprets it as an ordered-choice PEG, and requires it to accept every canonical-form output in the shared suite (673 rows) while refusing the include directive and the over-approximations. **`aontu agentsmd`** in both CLIs, over `agentsMd`/`(*Aontu).AgentsMd`, with `test/spec/agentsmd.tsv` pinning the stanza BYTE FOR BYTE across ports; `--write` splices between markers and leaves the rest of the file alone. **The skill**: `docs/skill/` — trigger stub, grammar card, JSON-first example ladder, error-code index — with `ts/test/skill.test.ts` evaluating every example document, so a skill that teaches what the engine no longer does fails the build. **Departures:** (1) `diff` compares the HASH FORM, not the plain canon: canon drops closedness and the marks, so a canon diff would call `close({a:1})` and `{a:1}` identical, and a bag's own attributes diff at the `&`, `&closed`, `&type` and `&hide` pseudo-keys. G6 landing first is what made that available. (2) MCP RESOURCES are not implemented; the progressive disclosure the design wanted from them is the `summary` TOOL plus `get`, which is the same disclosure without a second protocol surface to keep in parity. (3) `diff` and `agentsMd` are in BOTH ports with shared rows, though only TypeScript serves MCP — behaviour belongs to the spec suite (ADR-001), and the Go API is what a gateway embeds. (4) The grammar's parity test interprets the gbnf file rather than shelling out to lark or llama.cpp: the discipline the design asked for, without a toolchain the CI does not have. |
| **7** — REPL inspection mode and hover-provenance | S | **LANDED** | The REPL gains `:load`, `:get`, `:keys` and `:why` in BOTH ports, over the query and provenance surfaces, plus a `--jsonl` session mode with no banner, no prompt and one JSON line per answer. The command handler is a PURE FUNCTION of (state, line) in both ports (`replCommand`, `ts/src/cli.ts` and `go/cmd/aontu/repl.go`) with file reading injected: a read loop is untestable, and every answer this REPL gives has to be as checkable as the CLI's. The two handlers were diffed line by line over a 24-line scripted session, in both output modes, before either was tested. **Hover provenance** in both language servers (`ts/src/lsp.ts`, `go/lsp/lsp.go`), config-gated by `initializationOptions.aontu.provenance` and off by default; `ValueSpan` gained the path the record is keyed by, and the markdown was diffed byte for byte. Diagnostics are unchanged. **Departures:** (1) the session flag is `--jsonl`, not the design's `--json`, which would read as the `:json` output mode the REPL already has. (2) `:load` holds the SOURCE, not the rendered document: every later question re-evaluates, which is what single-use trees require, and holding both texts would have made `:get`'s view flags answer from the wrong one. (3) Hover provenance costs a SECOND evaluation rather than instrumenting the hover's own: the recorder needs the parsed tree stamped before the fixpoint, which hover's evaluation has already passed by the time a candidate is chosen. It is gated for exactly that reason. |

What remains of G7 is G7.5's STAGE 2, the format-preserving in-place
edit, which is what [G2](g2-validation-verb.md) and
[G3](g3-subsumption-evolution.md) defer "applying a fix" to. It is
not a phase of this plan — phase 5 names it as deferred — and it needs
a comment-and-layout-preserving CST the parser stack does not have. The design's load-bearing premises for them were
re-verified and all still hold — `maxcc = 9`, the `DisjunctVal.gen`
fold defect, and per-request re-unification in hover, which is what
would make LSP hover-provenance a config-gated increment rather than a
new cost class. Two premises the recorder settled instead of using:
the `update()` site-drop needed no surgery (a meet is recorded where
it happens, so nothing has to survive the drop), and `ctx._pathidx`
was not the key (the path string is, and it is what the report
prints).

Two smaller corrections stand: the `no_path` code G7.1 proposed
already existed (`errcodes.tsv`, landed by G2.1) and is what `get`
reports, and `ctx.find`/`explain` — which design option A proposes
documenting — are already documented in `docs/reference-api.md`.

One open question the phases just landed did NOT settle, deliberately:
the escape spelling for a key containing a dot. `get` splits paths
exactly as a REFERENCE does, so `$.esc.a.b` names nothing when the key
is `a.b` — pinned by a row rather than papered over. Inventing a
spelling for the query surface alone would leave the language's own
references behind; it is G4's to settle for both at once.

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
