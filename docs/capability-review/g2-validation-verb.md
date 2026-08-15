# G2: The validation verb

*Status: partly implemented — phase 1 (the error-code registry) landed;
the verb itself, phases 2–6, is outstanding. Per-phase status and pins
are in the [progress register](progress.md), which is authoritative for
status; this document is authoritative for design. Part of the
[capability review](index.md) (August 2026). This document expands gap
G2 — turning Aontu from an evaluator of its own files into a guardrail
that validates external data — with alternatives, an explicit boundary,
risks, and an implementation plan.*

## Problem

The canonical agent loop is *emit, validate, repair*. Aontu's CLI
(ts/src/cli.ts) supports none of it: it evaluates one file (or stdin)
to JSON or canonical form, full stop. There is no way to hand the
engine a definition and a separate piece of concrete data and ask "is
this data admissible?". Because Aontu is a JSON superset, the
unification machinery needed is already present — what is missing is
the verb, and the machine-readable contract around it.

Consider a schema an agent is meant to satisfy:

```aon
# service.aon
service: close({
  name:     string
  port:     integer
  replicas: integer
  owner:    string
})
```

An agent emits `deploy.json`:

```json
{ "service": { "name": "auth", "prot": 8080,
               "replicas": "3", "owner": "team-identity" } }
```

The user wants to write `aontu vet service.aon deploy.json` — and
cannot. The workaround is textual concatenation
(`cat service.aon deploy.json | aontu`), which unifies — but every
site now points into an anonymous synthetic document, the typo `prot`
is reported without the closed struct's allowed keys or a nearest-key
suggestion, the `"3"`-versus-`integer` conflict may never surface
because the fixpoint stops after the first erroring pass
(ts/src/unify.ts), and the report is ANSI-coloured prose on stderr
(`color: { active: true }` is hard-coded in ts/src/err.ts) that an
agent must regex-parse. Exit code 1 means only "something failed".

Second example: drift detection. The same verb pointed at a live
system dump is spec-versus-reality checking:

```aon
# system.aon
services: &: {
  image:    string
  replicas: integer
}
services: auth: { image: "auth:v2.3", replicas: 3 }
```

The platform reports reality as `live.json`:

```json
{ "auth": { "image": "auth:v2.4", "replicas": 3 } }
```

The user wants `aontu vet system.aon live.json --at $.services` and
to learn that `$.services.auth.image` conflicts — `"auth:v2.4"`
observed at live.json:1, `"auth:v2.3"` declared at system.aon:6 — a
located drift report. Today the dump must be hand-edited into an
Aontu file that happens to nest under `services`, and the result is
still prose.

The deeper defect is the output contract. The survey's repair-loop
evidence is that error *content* — failing path, observed value, and
above all the admissible alternatives ("what would have unified
here") — drives an agent's ability to self-correct; one benchmark
reports gains of tens of percentage points from alternatives alone
(a single-benchmark figure, per the critique pass, but the direction
is corroborated). Aontu's errors carry two sites and a why-code but
enumerate nothing: not the expected kind, not the closed struct's key
set, not the surviving disjunct branches. And the spec suite
conflates the two fundamentally different negative verdicts: in
test/spec/error.tsv, `a:1 a:2` (a contradiction) and `a:number` (mere
incompleteness) are both just `err` rows — yet for a gate, "your data
contradicts the truth" and "your data has not yet supplied everything
the truth requires" are different answers.

## Current state

What exists and is reusable:

- **Unification of external JSON is free.** Any JSON document is
  valid Aontu source, so "validate data against schema" is "unify two
  parsed values and inspect the result". Parsing the data file with
  the Aontu parser gives every node a site (`{row, col, url}`), so
  external data slots into the two-site error model as-is.
- **Collect mode.** `AontuOptions.collect` (ts/src/aontu.ts,
  ts/src/ctx.ts) accumulates errors on `result.err` instead of
  throwing; `AontuError.errs()` (ts/src/err.ts) exposes the raw
  `NilVal` list. The LSP already builds a structured surface on
  exactly this: `computeDiagnostics` (ts/src/lsp.ts) unifies with
  `{collect: true}`, walks the tree collecting every `NilVal`
  (`walkNils`), and maps `nil.why` to a diagnostic `code` with LSP
  severity constants. This walk is the embryo of the vet report.
- **A why-code vocabulary.** ts/src/hints.ts holds some forty
  why-code strings (`scalar_kind`, `closed`, `no_path`,
  `mapval_required`, …) plus five dynamic prefix patterns (`func:`,
  `op:`, `var[`, `ref[`, `op[`), each with hint text; go/hints.go
  mirrors it. These seed a stable code scheme, but nothing pins them:
  test/spec/error.tsv asserts message substrings, not codes, so codes
  can silently drift between implementations.
- **The two-site error model.** `NilVal` (ts/src/val/NilVal.ts)
  carries `why`, `primary`, `secondary`, `path`, `site`, `details`;
  `NilVal.make` picks the primary by "later in the same file wins";
  `descErr` (ts/src/err.ts) renders both sites with source context.
- **Exit codes.** docs/reference-api.md documents 1 for an evaluation
  error, 2 for a bad option — a two-way split, no verdict classes.

What structurally blocks the capability:

- **Single-document CLI.** ts/src/cli.ts accepts one file and two
  output modes (`json`/`canon`); no (schema, data) pairing, no
  anchor concept.
- **First-error fixpoint break.** The pass loop in ts/src/unify.ts
  (bounded at `maxcc = 9`) breaks as soon as `uctx.err` is non-empty;
  go/unify.go does the same. Errors raised within one pass all
  collect, but no later pass ever runs — multi-error reporting is
  inherently truncated today.
- **Prose-only rendering.** `descErr` produces ANSI-coloured terminal
  text; no JSON serialisation of a `NilVal` exists outside the LSP's
  partial mapping.
- **No incomplete/contradiction distinction.** Residual `top`/kind
  values become `nil_gen`/`no_gen`-family errors only at generate
  time; test/spec/error.tsv and incomplete.tsv pin both as generic
  `err` rows.
- **Go has no public collect surface.** The Go API returns
  `(Val, error)` with one wrapped message; `Ctx.collect` (go/ctx.go)
  is internal optional-subtree machinery. A structured multi-finding
  report is a genuinely new surface on the Go side.

## Prior art

**cue vet** is the direct model: `cue vet schema.cue data.yaml`
validates YAML/JSON against constraints without exporting;
concreteness is a separate dial (`vet -c`). It proves the verb's
value — "validate data" is CUE's homepage headline — and its failure
mode: output is prose, and CUE's community documents 3,000-line
configs erroring with 30+ stacked sites and no root cause, debugged
by bisection. Verb without contract does not serve agents.

**SHACL validation reports** show the contract half: a standard
machine-readable report vocabulary, three severities
(`sh:Info`/`sh:Warning`/`sh:Violation`), author-attached `sh:message`
on constraints. Cost: RDF-shaped verbosity, and no two-site conflict
concept — SHACL checks data against shapes, it does not merge peers.

**Rust and Elm** set the error-craft bar: stable codes (`E0123`) with
mandatory long-form explanations, JSON diagnostics, suggestions
graded by `Applicability` that rustfix applies automatically; Elm
shows the code as written, both conflicting fragments, one plain
sentence, one hint. Cost: a code registry is a forever-contract —
every code frozen, documented, parity-tested.

**SARIF** is the interchange standard CI systems and coding agents
already consume (GitHub code scanning, MSVC, rustc); the critique
pass flags "inventing a JSON report format" while ignoring SARIF as a
survey blind spot. Cost: rule-centric and verbose; two-site conflicts
squeeze into `relatedLocations`; much of the spec (code flows, fixes,
baselines) is dead weight for a unifier.

**Policy-as-code CI practice** (OPA/conftest, Kubernetes admission,
buf breaking) settles the ergonomics: exit-code classes, a published
GitHub Action, machine-readable output as table stakes, the engine as
a deterministic decision service at the boundary — "the agent does
not decide what is allowed; the policy engine does".
**datacontract-cli** demonstrates the drift half: a definition is
only ground truth if continuously verified against the running
system.

## Design space

**A. Bless the concatenation idiom.** Document
`cat schema.aon data.json | aontu` as the validation story. Zero
cost; but sites collapse into one synthetic document, there is no
report contract, no verdict classes, no anchor, and the identity
claim ("Aontu is a gate") stays false. Rejected.

**B. A thin `vet` verb, text output only (cue parity).** Add the CLI
pairing, reuse `descErr`. Small (mostly ts/src/cli.ts); but it
reproduces CUE's documented weakness — the output contract matters as
much as the verb, and agents cannot branch on coloured prose.
Rejected as an end state; it is a waypoint of the phased plan.

**C. Vet with a full machine contract on today's engine.** The verb,
JSON and SARIF reports, stable codes with classes, verdict-classed
exit codes, admissible-alternative enumeration — the first-error
fixpoint break kept and reported honestly (`truncated: true` when the
pass loop stopped early). Moderate cost, no engine risk; the price is
that repair loops may need several round trips to see all errors.

**D. C plus an error-tolerant fixpoint.** Change ts/src/unify.ts and
go/unify.go to localise a `nil` to its subtree and continue passes,
collecting all independent errors in one run. Highest loop
efficiency; but real engine surgery: `nil` is currently absorbing,
and naive continuation risks exactly the cascading spurious-error
pathology CUE users report (one root cause, thirty stacked findings),
plus cost on the hot path.

**E. Validation as a resident service instead of a CLI verb.** Ship
validation as an LSP extension or MCP tool only. But the
delivery-channel evidence (llms.txt versus AGENTS.md) says CI gates
and exit codes are what pull a format into loops,
[G7](g7-machine-access.md) owns the MCP surface and will wrap
whatever engine call vet exposes, and a daemon without a CLI is
untestable in the spec suite. Rejected as a substitute; correct as a
later consumer.

**Recommendation: C, with D as a follow-on engine phase.** The verb
plus the contract changes the language's identity and is
implementable now on collect mode and the existing `NilVal` walk.
The repair literature supports the ordering: alternatives content,
not error count, drives repair success — one well-furnished finding
beats ten bare ones. Multi-error collection is then an efficiency
upgrade whose absence the contract already marks (`truncated`), so
the report shape does not change when D lands.

## Proposed design

### The verb

```
aontu vet [options] <schema.aon> <data.json|data.aon> [more-data...]

  --at <path>        validate data against this path of the
                     evaluated schema (e.g. --at $.services)
  --format <f>       text | json | sarif        (default: text)
  --closed           close() the anchor value for this run
  --partial          incomplete residue is not a failure
  --surplus          report unconstrained data keys (info severity)
  --max-errors <n>   cap findings in the report (default 20)
  --watch            re-run on file change, streaming reports
```

Semantics, in order:

1. Evaluate `schema.aon` alone. If it errors, the *schema* is broken:
   verdict `error`, exit 4 — never blamed on the data.
2. Select the anchor: the evaluated root, or the value at `--at`;
   `--closed` wraps it in `close()`.
3. Parse each data file with the Aontu parser, so every data node
   carries `{row, col, url}` sites pointing into the data file.
4. Unify anchor & data under `{collect: true}`, then generate-check.
   Parsed trees are single-use, so each data file gets a fresh
   evaluation of the schema — the documented mutation caveat.
5. Walk the result (the ts/src/lsp.ts `walkNils` pattern,
   generalised): every `NilVal` is a finding; every residual
   non-generable value (`top`, scalar kinds, unresolved required
   keys) is an *incomplete* finding, a distinct class.
6. Render the report in the chosen format; exit by verdict class.

### Verdicts and exit codes

| Verdict      | Meaning                                        | Exit |
|--------------|------------------------------------------------|------|
| `valid`      | unifies, fully concrete (or `--partial`)       | 0    |
| `invalid`    | at least one contradiction-class finding       | 1    |
| `incomplete` | no contradiction, but residue remains          | 3    |
| `error`      | schema unusable (parse/unify failure)          | 4    |
| —            | usage error (bad flags, unreadable file)       | 2    |

Exit 2 stays reserved for usage, matching the existing CLI convention
(docs/reference-api.md). The `invalid`/`incomplete` split is the
mechanical answer to the error.tsv conflation: contradiction means
the data can never satisfy the truth; incomplete means it does not
yet. Agent-emitted whole documents want incomplete to fail (the
default); layered drift checks over partial dumps want `--partial`.

### The finding object

`--format json` emits one object (stable field order, canonical value
rendering, no ANSI):

```json
{ "aontu": { "version": "0.49.0", "verb": "vet" },
  "verdict": "invalid", "truncated": false,
  "findings": [
    { "code": "no_scalar_unify", "class": "conflict",
      "severity": "error", "path": "$.service.replicas",
      "message": "Cannot unify value: \"3\" with value: integer",
      "sites": [
        { "file": "deploy.json", "row": 2, "col": 28,
          "role": "data",   "value": "\"3\"" },
        { "file": "service.aon", "row": 5, "col": 13,
          "role": "schema", "value": "integer" } ],
      "expected": "integer", "actual": "\"3\"",
      "alternatives": ["integer"], "note": null },
    { "code": "closed", "path": "$.service.prot",
      "allowed": ["name", "owner", "port", "replicas"],
      "nearest": "port", "...": "..." } ] }
```

Field semantics:

- **`code`** — a frozen snake_case string: today's why-codes
  (ts/src/hints.ts, go/hints.go) promoted to contract — append-only,
  renames forbidden, each carrying a `class` and hint text. The
  registry becomes a shared spec asset (`test/spec/errcodes.tsv`:
  code, class, since-version) both implementations load in tests, so
  code parity is assertable the way error substrings are today.
- **`class`** — one of `conflict`, `incomplete`, `reference`,
  `parse`, `budget` (cycle/pass-limit, per
  [G5](g5-trust-contract.md)), `internal`. Verdicts derive from
  classes, so new codes never change exit behaviour.
- **`severity`** — `error`, `warning`, `info`. Conflict and
  incomplete findings are errors; `warning` is reserved for the
  [G3](g3-subsumption-evolution.md) deprecation mark and
  [G1](g1-constraint-algebra.md)'s evaluate-only advisories; `info`
  for `--surplus`. Maps one-to-one onto the LSP severity constants in
  ts/src/lsp.ts and onto SARIF levels.
- **`expected` / `actual` / `alternatives`** — the
  admissible-alternatives contract, all rendered in canonical form
  (deterministic and byte-identical across TS and Go, so reports are
  diffable and cacheable). For a kind conflict, `expected` is the
  kind's canon; for a failed disjunction, `alternatives` lists the
  member canons a corrected value could still satisfy — rendered from
  member canons, *not* via `DisjunctVal.gen`, which has a known fold
  defect (ts/src/val/DisjunctVal.ts:263); for a closed struct,
  `allowed` lists the key set and `nearest` gives an edit-distance-≤2
  suggestion. When G1's bounds land, `expected` renders via G1's
  canonical bound syntax — consumed here, defined there.
- **`note`** — the author-attached message carried by G1's
  message-bearing constraint wrappers. Reserved here; designed there.

### The two-site model with external data

`NilVal.make`'s primary/secondary heuristic ("later in the same file
wins") is source-order reasoning within one document and says nothing
useful when one side is external. Vet assigns site *roles* by URL
provenance instead: a site whose `url` is a data file gets
`role: "data"` and is listed first (the thing to fix); schema sites
get `role: "schema"`. The underlying `NilVal` fields are unchanged —
a report-layer projection — so the existing error.tsv message
assertions do not move.

### SARIF output

`--format sarif` emits a minimal SARIF 2.1.0 profile: one run, one
`result` per finding with `ruleId: "aontu/<code>"`, `level` from
severity, the data site as primary `location`, the schema site under
`relatedLocations`, the JSON finding embedded in `properties`.
Nothing beyond this profile (no fixes, no code flows); enough for
GitHub code-scanning upload and PR annotation.

### Collect-mode API surface

TypeScript (ts/src/vet.ts, exported from ts/src/aontu.ts):

```ts
const report = aontu.vet(schemaSrc, dataSrc, { at: '$.services' })
// report: { verdict, truncated, findings: Finding[] } — never throws
// for findings; throws AontuError only for unusable schema/args.
```

Go (go/vet.go):

```go
report, err := a.Vet(schemaSrc, dataSrc, aontu.VetOpts{At: "$.services"})
// err != nil only for engine/schema failure; findings are data.
```

`Vet` is Go's first structured multi-finding surface, built on the
internal error list the unifier already accumulates (go/ctx.go)
rather than the single wrapped `AontuError` message. The report
struct is the parity contract: both implementations must emit
byte-identical JSON for the same inputs, pinned by spec rows.

### CI ergonomics

- **GitHub Action** (`aontu-vet-action`, separate repo): runs vet
  over declared (schema, data) pairs, uploads SARIF, fails the job by
  exit class. A pre-commit hook recipe ships in docs/how-to.md.
- **Watch mode**: `--watch` re-runs on file mtime change, one report
  per run. Honestly non-incremental: parsed trees are single-use, so
  every run is a full re-parse and re-unify — acceptable at current
  model sizes and bounded by the `maxcc = 9` fixpoint. Incremental
  re-validation is future engine work; evaluation budgets belong to
  [G5](g5-trust-contract.md).
- **Resolver posture**: vet inherits the include resolver chain
  (memory → filesystem → package, ts/src/lang.ts) and its documented
  stance that opening an untrusted source is running it. Untrusted
  schemas are a [G5](g5-trust-contract.md)/[G6](g6-distribution.md)
  problem (sandboxing, pinning) — vet adds no fetching of its own.

## Boundary: what we will not do

- **No auto-applied fixes.** Suggestions are data; applying a patch
  is [G7](g7-machine-access.md)'s format-preserving patch surface.
- **No JSON Schema import/export inside vet.** Interop is a separate
  capability and is lossy until G1's algebra exists.
- **No constraint-bound design.** What `number > 0` means, its meet
  and emptiness rules, and its canonical rendering belong to
  [G1](g1-constraint-algebra.md); vet only reports them.
- **No subsumption or breaking checks.** "Does v2 still admit v1?"
  is [G3](g3-subsumption-evolution.md)'s verb.
- **No lint-rule plugin framework.** Governance rules are ordinary
  Aontu files unified over the target; a Spectral-style engine is
  surface-area creep toward CUE, a trap in [index.md](index.md).
- **No executable hooks in validation.** No callbacks or shell-outs
  on findings — deterministic and total, per the
  Turing-completeness trap.
- **No LLM-graded validation.** Vet's answer to the
  JSON-Schema-plus-prose null hypothesis is mechanical — two-site
  conflicts, merge-as-unification, admissible alternatives — not
  another eval harness.
- **No incremental evaluation engine here.** Watch mode is
  re-run-everything; incrementality is a later engine project shared
  with the LSP.
- **No full SARIF fidelity.** Minimal profile only; the JSON report
  is the native contract.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TS/Go report divergence (Go has no collect surface today) | Medium | High | Report JSON pinned byte-for-byte by shared vet spec rows; Go builds on the existing internal error list, not new semantics |
| First-error truncation makes "multi-error report" oversell | High | Medium | `truncated: true` in the contract from day one; phased engine work (Phase 6) removes it; docs state the limit plainly |
| Error-tolerant fixpoint causes cascading spurious findings (CUE's stacked-error pathology) | Medium | High | Gate Phase 6 behind spec rows for nil-localisation; `--max-errors` cap; findings deduplicated by (code, path) |
| Freezing today's why-codes bakes in bad names | Medium | Low | Append-only registry with an alias/deprecation column; codes are contracts, hint text is not |
| Alternatives enumeration touches the known DisjunctVal.gen fold defect | Medium | Medium | Render alternatives from member canons only; never call `gen` on a disjunct to enumerate; add regression spec rows |
| Per-data-file schema re-evaluation is slow in watch/CI loops (single-use trees) | Medium | Medium | Acceptable now (`maxcc = 9` bounds passes); measure; incrementality is explicitly deferred, budgets are G5's |
| Canon round-trip or existing error text regresses while adding classes | Low | High | `class` is additive on `NilVal`; error.tsv substrings and `parse(canon(v)) == v` stay green throughout |
| Exit-class numbering collides with scripts assuming 0/1 | Low | Low | Non-zero on any failure is preserved; classes are refinements; documented in reference-api.md |
| Adoption risk: agents default to JSON Schema validators | Medium | High | Ship the Action + SARIF so vet drops into existing CI; lead with what JSON Schema cannot do (two-site conflicts, merge-as-unification) |

## Implementation plan

Spec-first throughout: every behaviour lands as `test/spec/*.tsv`
rows before code; TypeScript (canonical) first, Go port follows.
Nothing may regress: the 45 existing spec files (~426 rows), the
error.tsv substring assertions, and canon convergence stay green in
every phase. (This document originally stated that guard as
`parse(canon(v)) == v`; see the correction in
[G1](g1-constraint-algebra.md#implementation-plan) — the enforced
property is convergence, asserted by both spec runners for every canon
row.)

**Phase 1 — error taxonomy groundwork (M).**
Spec: new `test/spec/errcodes.tsv` (code, class, since-version); new
error.tsv rows distinguishing incomplete from conflict (existing rows
untouched). Code: ts/src/hints.ts (registry export),
ts/src/val/NilVal.ts (`class` field), ts/src/err.ts; go/hints.go,
go/val.go. Runners ts/test/spec.test.ts and go/spec_test.go learn to
assert codes.

**Phase 2 — vet engine API, TypeScript (M).**
Spec: new `test/spec/vet.tsv` — columns name, schema, data, verdict,
findings (`code@path` lists) — plus JSON-report goldens for a
representative subset. Code: new ts/src/vet.ts (anchor selection,
data parse, unify-with-collect, residue walk generalising
ts/src/lsp.ts `walkNils`, finding construction); ts/src/aontu.ts
export.

**Phase 3 — CLI verb and JSON format (M).**
Code: ts/src/cli.ts (`vet` subcommand, `--at`, `--format`, verdict
exit classes); docs/reference-api.md, docs/how-to.md. Text renderer
reuses `descErr`, with roles replacing the same-file primary
heuristic for cross-file sites.

**Phase 4 — Go port (L).**
Code: go/vet.go, go/report.go, go/cmd/aontu, go/hints.go.
go/spec_test.go runs vet.tsv and errcodes.tsv with no skip list,
including byte-identical report JSON.

**Phase 5 — SARIF, Action, watch (S).**
Code: ts/src/report-sarif.ts and Go twin; `--watch` in both CLIs;
`aontu-vet-action` repository; SARIF goldens in test/spec/files/.

**Phase 6 — multi-error collection (L, engine).**
Localise `nil` to its subtree and let the pass loop continue. Spec
rows first: two independent conflicts must yield two findings;
single-cause models exactly one. Code: ts/src/unify.ts (the
`if (0 < uctx.err.length) break` site), affected Val classes;
go/unify.go. Ships only if the cascade risk is demonstrably
controlled by the spec rows; `truncated` then becomes rare.

Rough sizing: S ≈ days, M ≈ a week or two, L ≈ several weeks per
implementation.

## Open questions

- **Default completeness.** Should bare `vet` require full
  concreteness (incomplete ⇒ exit 3) or admit partial data? Agent
  emission favours strict; drift checks over partial dumps favour
  `--partial`. Must be settled before the exit classes are documented
  as stable.
- **YAML ingestion.** Live dumps are often YAML. Accepting it means a
  site-accurate YAML parser in *both* implementations, or a
  documented `yq`-style conversion step; parser cost decides.
- **Relaxed versus strict data parsing.** Full-grammar parsing lets
  "data" carry operators and constraints — arguably a feature (a
  candidate can refine the truth) but it blurs the data/schema role
  labels. A `--strict-data` JSON mode is the conservative
  alternative; the default depends on whether vet's contract is
  "validate a document" or "validate a contribution".
- **Registry source of truth.** Whether hints.ts generates
  errcodes.tsv or errcodes.tsv generates both hint tables; the
  generation direction decides which artifact is the contract.
- **Anchor convention beyond `--at`.** A schema could name its own
  validation entrypoints (an in-file mark), which travels better than
  a flag once schemas are distributed ([G6](g6-distribution.md)) but
  adds language surface; the flag ships first.
- **Finding cap and ordering once Phase 6 lands.** CUE's thirty-site
  pile-ups argue for a low default cap; agent loops argue for
  data-site document order so repairs apply top-down.
