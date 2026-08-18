# Draft spec rows — authored before implementation, promoted after probing

The files in this directory are **not executed** by either spec runner:
`ts/test/spec.test.ts` and `go/spec_test.go` glob only `test/spec/*.tsv`
(top level). They exist because the repository's method is spec-first —
rows are authored and reviewed *before* code — while its parity rule
forbids adding an executable row whose expectation was not probed in
BOTH engines. A behaviour that does not exist yet cannot be probed, so
its proposed rows wait here.

Current contents: none — every drafted family has been promoted. The
directory stays, because the method it exists for (author rows before
code, promote after probing) is how the next capability phase starts.

Promoted so far, each with every expectation re-probed in both engines
at promotion time per rule 2: the bound/neq rows to
`test/spec/constraint-bound.tsv` when G1 phase 1 landed, the regex
rows to `test/spec/constraint-re.tsv` when G1 phase 2 landed, and the
cross-field/residuation and constraint-bearing-disjunct rows to
`test/spec/constraint-cross.tsv` when G1 phases 4–5 landed (the
`must` rows went directly to `test/spec/constraint-must.tsv`). The
second promotion is the reason rule 1 says what it does -- one drafted
expectation was WRONG. The draft predicted `a:string&re("^[a-z]$")`
would canon as `string&re("^[a-z]$")`; both engines agree it canons as
`re("^[a-z]$")`, because a pattern implies the string kind exactly as
a bound implies `number`. The probe caught it; the draft would have
baselined a canon neither engine produces.

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
   `guard-pref-disjunct-canon`/`guard-pref-disjunct-gens` rows in
   `test/spec/disjunct.tsv`, which
   fence the known `DisjunctVal.gen` fold defect from the constraint
   side before any `ConstraintVal` code exists).

The last paragraph's forward reference is now history: the
constraint-bearing-disjunct expectations it describes live in
`test/spec/constraint-cross.tsv` as executable rows.

Known defect fenced, not pinned: `a:({x:1}|{y:2})&{z:3}` today
GENERATES the chimera `{"a":{"x":1,"y":2,"z":3}}` in BOTH engines (the
fold defect at `ts/src/val/DisjunctVal.ts` ~263, faithfully mirrored by
the Go port) while its canon is correct. The wrong generation is
deliberately NOT pinned as a row — that would baseline a defect; the
correct canon IS pinned (`guard-fold-canon`), and
`constraint-cross.tsv` below carries the future-correct generation
expectations that must hold before constraint-bearing disjuncts ship.
