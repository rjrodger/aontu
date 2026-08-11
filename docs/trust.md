# The Aontu trust contract

*Status: normative (v0.51 line). This document states the guarantees an
agent harness — or any host — may rely on when evaluating an Aontu
document, and exactly where each guarantee is conditional today. It is
the written half of capability G5
([docs/capability-review/g5-trust-contract.md](capability-review/g5-trust-contract.md));
the tested half lives in the shared spec suite
([test/spec/](../test/spec/)), and anything stated here without a spec
pin says so plainly.*

For a document that agents evaluate unattended, safety guarantees are
not hardening applied afterwards — they are constitutive. The contract
is four clauses: **hermeticity**, **termination**, **determinism**, and
**sandboxing**.

## Clause 1 — Hermeticity

The output of an evaluation is a pure function of exactly four inputs:

1. the entry source text,
2. the resolved `@"…"` include closure,
3. the host-injected `$name` bindings, and
4. the evaluator: implementation (TypeScript or Go), version, and
   options.

Nothing else. The language has **no clock, no randomness, no
environment access, and no network** — the builtin functions are pure
value transformers, the `+` operator works over concrete scalars, and
external input enters only through includes and `$` bindings. No
construct that observes time or entropy will ever be added (see
[Refusals](#refusals) below); parameterise through `$` bindings
instead.

**Where this is conditional.** Input 2 — the include closure — is only
a well-defined *input* when the resolver is confined. Under the default
resolver chain (memory → filesystem → package,
`makeModelResolver` in `ts/src/lang.ts`) the closure is unbounded and
machine-dependent: a relative include follows any path the process can
read, and package resolution walks `node_modules` from the working
directory, so the same file set can resolve differently on two
machines. The code states the resulting posture and this contract
repeats it:

> **Treat opening an untrusted source as running it.**

Hermeticity is therefore *total* under a confined resolver (an
in-memory resolver, or a filesystem limited via `options.fs` — both
exist today, see [the API reference](reference-api.md#aontuoptions))
and *conditional* under the default chain. The graduated `trust`
capability profile that makes confinement a first-class, per-surface
default — `include: 'none' | {mem} | {root} | 'system'` — is the
registered design (G5 phase 3) and is **not implemented yet**; until it
is, confinement is the host's responsibility through the existing
`resolver` / `fs` injection points.

**The JSON-superset guarantee, stated precisely.** Every JSON document
*parses* as Aontu. That is the whole claim. It does not say "behaves
identically to a JSON parser": the number tower refuses what JSON
silently corrupts, so `{"x":9007199254740993}` — a literal binary64
cannot carry exactly — is a loud `lossy_integer_literal` error in
Aontu where `JSON.parse` would round it. Refusal-over-corruption is a
feature of the contract, not an exception to it.

## Clause 2 — Termination

Every evaluation halts within deterministic budgets counted in
**engine events, never wall-clock**:

| budget     | counts                                   | current default |
|------------|------------------------------------------|-----------------|
| `passes`   | fixpoint passes over the whole model     | 9 (`maxcc`, `ts/src/unify.ts`) |
| `revisits` | same-pair re-unifications within a pass  | 999 (`MAXCYCLE`, `ts/src/unify.ts`) |
| `depth`    | structural recursion depth               | engine guard (walk cap in TS; `maxUniteDepth` in Go) |

The contract pins *verdicts at default budgets* — every shared spec
row must produce the same verdict in both implementations — not
internal step counts, which remain implementation detail.

**Exhaustion is a semantic error, never silent truncation.** The three
different answers — "your model is cyclic", "your model is
incomplete", "my budget ran out" — are distinct codes with distinct
classes (the registry: [test/spec/errcodes.tsv](../test/spec/errcodes.tsv);
the taxonomy rows: [test/spec/budget.tsv](../test/spec/budget.tsv)):

| code            | class       | meaning                                | valid agent response |
|-----------------|-------------|----------------------------------------|----------------------|
| `path_cycle`    | `reference` | a **proven** structural cycle: a self/ancestor reference, or a chain of plain references revisiting a node (`a:$.b b:$.a`) | fix the model — no budget helps |
| `no_path`       | `reference` | a reference target that does not exist | supply what is missing |
| `budget_passes` | `budget`    | the pass budget was spent while the final pass was **still making progress** — the evaluator gave up mid-convergence | retry with a larger budget, or restructure |
| `unify_cycle`   | `budget`    | the revisit bound tripped: **suspected** non-convergence | inspect; may be a cycle or a very large model |

A *stable* residue — a stuck `1+true`, an unresolved kind — is none of
these: it is ordinary incompleteness, silent at unify time and a
generate-time error (`mapval_no_gen` family, class `incomplete`)
exactly as before. Only genuine cut-off earns `budget_passes`.

Two honest caveats, both tracked rather than papered over:

- The smallest `budget_passes` reproducer (a chain of ten plain
  references) errors in TypeScript and resolves in Go, because the two
  engines resolve reference chains at different rates per pass. This is
  an **open verdict divergence** — the parity ledger
  ([test/spec/divergent.tsv](../test/spec/divergent.tsv)) and
  issue #26 track it — so `budget_passes` has no shared spec row yet.
- The revisit bound carries an acknowledged false-positive defect on
  very large models ("too many top unifications", `ts/src/unify.ts`);
  fixing it needs a generated-SDK-scale corpus first, and until then
  `unify_cycle` remains *suspicion*, which is why it is class `budget`
  and not `reference`.

## Clause 3 — Determinism

Identical inputs (clause 1's four) produce **byte-identical canonical
output and byte-identical generated JSON**, across runs and across the
TypeScript and Go implementations. This is pinned, not promised:

- `canon` spec rows are strict string equality in both runners, and
  canon round-trips kind (a number-kind scalar always renders with a
  fraction or an exponent), so a canon row pins the value the engine
  *holds*, not only the JSON it emits.
- `gens` spec rows compare the serialised generate output **byte for
  byte** (compact, sorted keys, no HTML escaping, JS number
  formatting) using each port's real emitter.
- Error **codes** are stable and cross-implementation per the
  registry ([test/spec/errcodes.tsv](../test/spec/errcodes.tsv), `errc`
  rows); full error message text is deliberately non-contractual.
- Expected values are **parity-probed**: obtained from both engines
  before a row is written, never copied from one (AGENTS.md).
- Known disagreements live in exactly one place — the parity ledger —
  and its normal state is empty of open entries.

## Clause 4 — Sandboxing

What an evaluation may read is declared by the **host**, not by the
document: a `.aon` file cannot request more capability, includes take a
literal string (never a computed expression), and canonical form is
unaffected by any trust setting.

Today the declaration is made through the existing injection points
(`options.resolver`, `options.fs`, `base`); the graduated profile with
per-surface defaults (LSP: workspace-confined; library: explicit; CLI:
entry-file root with `--trust system` escape) is registered design, not
yet behaviour. Until it ships, the default at every surface is the full
resolver chain, and the posture above — opening an untrusted source is
running it — is the operative warning.

Denied resolution, when confinement ships, is a located, deterministic
parse-stage error (`include_denied`) like any other — never a silent
skip.

### Rules pre-registered for remote includes

Adopted now so the ecosystem never has a permissive interlude;
enforced the day any remote resolver exists (G6):

1. Remote sources may include only remote sources — never local
   files, never `$` bindings, never anything environment-derived.
2. Include paths are literal strings; computed import paths are
   prohibited (true today by grammar, to be pinned by a spec row when
   the capability lands).
3. No credential or header forwarding across origins; anything beyond
   a bare fetch is explicit opt-in.
4. Remote resolution is only available under an explicit capability;
   it never joins `system`.

## Evaluation consumes the tree

A parsed `Val` tree is **single-use**: `unify`/`generate` refine it in
place, and reusing a consumed tree (or any node reachable from it) in
a second evaluation is a *correctness* bug that surfaces as
nondeterminism — the exact failure mode this contract exists to
exclude. Parse again (or clone first) for every independent
evaluation. This is a named rule of the API contract now — see
[the API reference](reference-api.md#evaluation-consumes-the-tree) —
not a code-comment caveat.

## Refusals

Guarantees are as much about what will never be added:

- **No wall-clock or memory budgets** — a limit that varies with
  machine load makes identical inputs fail differently.
- **No `now()`, `random()`, or `env()`** — each would falsify
  clause 1 by construction.
- **No Turing-completeness, no SMT solvers** — termination stays
  structural plus fuel; every trust question is answered by counting,
  never by solving.
- **No executable hooks in evaluation** — no callbacks or shell-outs;
  the resolver is the language's only effect, which is why confining
  the resolver confines the language.

## Where each piece is pinned

| claim | pin |
|-------|-----|
| cycle/no-path taxonomy codes | [test/spec/budget.tsv](../test/spec/budget.tsv) (`errc` + substring rows, both engines) |
| `budget_passes` code, class and "evaluation budget" substring | per-port only — `ts/test/unify.test.ts` (end-to-end) and `go/hints_test.go` (hint table); a shared row is blocked on issue #26, as budget.tsv's comments state |
| code → class registry | [test/spec/errcodes.tsv](../test/spec/errcodes.tsv) + set-equality tests in both runners |
| canon byte-stability | every `canon` row (strict equality, both runners) |
| generated-JSON byte-stability | `gens` rows (docs/shared-spec.md) |
| known open divergences | [test/spec/divergent.tsv](../test/spec/divergent.tsv) (currently: deep ref chains, issue #26) |
| resolver posture | SECURITY comment, `ts/src/lang.ts`; this document |
| single-use trees | reference-api.md rule; `Aontu.parse` / Go `Parse` doc comments |
