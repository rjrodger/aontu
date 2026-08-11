# Draft spec rows — authored before implementation, promoted after probing

The files in this directory are **not executed** by either spec runner:
`ts/test/spec.test.ts` and `go/spec_test.go` glob only `test/spec/*.tsv`
(top level). They exist because the repository's method is spec-first —
rows are authored and reviewed *before* code — while its parity rule
forbids adding an executable row whose expectation was not probed in
BOTH engines. A behaviour that does not exist yet cannot be probed, so
its proposed rows wait here.

Current contents: the constraint-algebra rows of capability G1 phase 0
(`docs/capability-review/g1-constraint-algebra.md`; normative design in
`docs/reference-language.md`, "The constraint algebra"). Every atom is
an `unknown_function` error today.

Rules for this directory:

1. Expectations below are **design targets** derived from the algebra
   tables — NOT probed values. They carry no contract weight.
2. When an implementation phase lands, its rows are **promoted**: moved
   up into a real `test/spec/*.tsv` file, with every expectation
   re-derived by the parity probe (both CLIs/engines, per AGENTS.md)
   at that moment. A draft row never moves verbatim without a probe.
3. Error rows here use `err` substrings (`Cannot unify`) rather than
   `errc` codes: the code a constraint violation carries is a phase-1
   decision to be made against the registry (`test/spec/errcodes.tsv`),
   and guessing it here would prejudge that.
4. Behaviour that IS pinnable today is not drafted here — it goes into
   the real suite directly (see the `guard-fold-canon` and
   `guard-pref-disjunct-gen` rows in `test/spec/disjunct.tsv`, which
   fence the known `DisjunctVal.gen` fold defect from the constraint
   side before any `ConstraintVal` code exists).

Known defect fenced, not pinned: `a:({x:1}|{y:2})&{z:3}` today
GENERATES the chimera `{"a":{"x":1,"y":2,"z":3}}` in BOTH engines (the
fold defect at `ts/src/val/DisjunctVal.ts` ~263, faithfully mirrored by
the Go port) while its canon is correct. The wrong generation is
deliberately NOT pinned as a row — that would baseline a defect; the
correct canon IS pinned (`guard-fold-canon`), and
`constraint-cross.tsv` below carries the future-correct generation
expectations that must hold before constraint-bearing disjuncts ship.
