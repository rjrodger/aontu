# Divergences

TypeScript is the canonical implementation; the Go port tracks it. This
file is the single record of where they do **not** agree, and why.

There are two registers, and the difference between them matters:

- **This file** holds divergences that are PERMANENT — considered, decided,
  and not expected to change. Each says what differs, what it costs, and
  why the alternative was rejected.
- [`test/spec/divergent.tsv`](test/spec/divergent.tsv) is the DEBT
  register, for divergences that are expected to be fixed — the behaviour
  originates in a pinned `@tabnas` dependency, or which side is right is
  still open. It sits beside the suite so it is read whenever the spec is
  read, and it carries no data rows.

An entry moves from the ledger to this file only when a decision is taken
to keep the divergence. It leaves the ledger in the other direction — by
being fixed — far more often, and should.

The shared spec (`test/spec/*.tsv`) contains only rows that pass
identically in both implementations. Nothing described here may be added
to it.

> **Reclassified (2026-08-11).** This file previously carried six
> entries. By maintainer decision, five of them — error message text,
> parse-level canon of nested `&`/`|`, the canon/failure stage of
> invalid sources, lone surrogates in quoted strings, and the
> malformed-input acceptance edges — are no longer accepted as
> permanent: they are to be FIXED and the ports brought into parity.
> Each is now an OPEN entry in the ledger with a tracking issue
> (#29, #30, #31, #24 reopened, #32 respectively). Only the Unicode
> table vintage below remains permanent, because nothing in this
> repository can change it.

## Why a divergence is a bug by default

When a probe shows the two engines disagreeing, that is a **bug**, and the
default response is to fix the engine, not to write here. Writing the
expectation from one engine's output is how a divergence gets baselined as
the contract: the row then passes on the side it was copied from and fails
on the other, and the obvious next move — "make the other side match" —
quietly changes whichever engine happened to be right. Nothing in the suite
can warn you, because a row that was never probed carries no record of
having been agreed.

## The permanent divergences

- **Unicode table vintage.** `upper()`/`lower()` use FULL Unicode case
  mapping in both ports and agree exactly on the Unicode 15.0 repertoire.
  The Go port's tables (`golang.org/x/text`, and Go's own `unicode`
  package) are Unicode 15.0; Node ships newer ICU tables, so roughly 110
  code points assigned after Unicode 15 — Garay, some Latin Extended-D
  additions, a few Cyrillic — case-map in TypeScript and not in Go. This
  is a table-vintage gap, not an algorithmic one, and it closes on its own
  as Go's tables advance. No ledger entry: nothing in this repository can
  change it, and no spec rows pin it.

## Previously divergent, now fixed

Kept because how each was closed is worth remembering.

> **The canon of move()-hidden ghost nodes**, including the
> object-sharing artifacts. The Go port now
> mirrors TS's clone-graph sharing directly: func clones share their
> args array (TS `Val.clone` passes `peg` by reference) and pref clones
> share their peg, a TOP-peer map/list unify refines the bag IN PLACE
> (the `out = peer.isTop ? this : new ...` fast-path), and a driving
> func re-paths its (possibly shared) args to its own location each
> pass (`repathArg`, the equivalent of TS's ctx-path re-descent — with
> key()'s stored path frozen once it stops residuating, on the settle
> pass of G8 phase 0's staging rule). Hiding
> is mark-based: move() sets the hide mark on the found source node's
> ROOT only (TS `_hide_found`), bag unifies ratchet marks down one
> level per pass, and a marked func freezes against TOP but still
> resolves against a non-TOP peer (spread clones re-driving hidden
> children behave exactly as in TS). Chained moves wrap the moved copy
> in a pref() func immediately (TS MoveFuncVal), so intermediate frozen
> ghosts render `pref($.x.a)` / `pref({"k":"c"})` identically. Ref
> spreads are snapshotted once per canon+site (the TS snapshotRefSpread
> port), and spread constraint roots are pathed under a literal `&`
> segment so relative refs used as spreads resolve one level deeper,
> as in TS. A ctx `slot` hint threads the TS ctx.path through unify
> (bag child loops, func arg loops, junction folds), so shared clones
> whose stored paths carry transplant overlay tails are driven at
> their actual slot — a close() ghost moved to a SHALLOWER destination
> re-keys as in TS. Go's hasPathFunc mirrors the TS isPathDependent
> getter including its recursion quirks (a pref-wrapped func's args
> array is invisible to the property walk, so `&:{q:*copy($.z)}`
> templates are shared and advance in place). Covered by the func.tsv
> ghost/move-chain rows and the spread.tsv close-template and
> template-pref-copy rows.

> **Root-level spreads over `$var` (and other expression) keys.**
> `k1:$flag &:boolean` used to raise an
> internal error in TS: the expr plugin consumed the `&` as an infix
> conjunct, choked on the `:`, and left a raw unevaluated expr node in
> the map. Both grammars now close an open expression when `&` `:`
> follows (backtracking so the enclosing map takes the spread), and TS
> VarVal.unify resolves the variable's NAME against TOP only, applying
> the peer constraint to the resolved VALUE (previously the constraint
> was unified with the name string, inverting the check). TS unite's
> dispatch ladder also gained the `isVar` case Go already had, so
> conjunct-driven constraints reach VarVal.unify instead of failing in
> ScalarKindVal (`p1:$foo &:integer&number`). TS RefVal.find now pushes
> a resolved variable path segment (`$seg.r` with seg="x" reads
> `...x.r`; previously the coerced value was silently dropped and the
> path read without it — Go's interpolation was already correct).
> Covered by the var.tsv spread and path-segment rows.

> **Numeric canon formatting at extreme magnitudes.**
> Go's `formatNumber` (go/scalar.go) now reproduces
> JavaScript `Number.toString` exactly — fixed notation for decimal
> exponents in [-6, 20], exponential with an unpadded signed exponent
> outside (`1e+21`, `1e-7`) — pinned by `go/scalar_format_test.go` and
> the `scalar.tsv` extreme-magnitude canon rows. Numeric canon rows no
> longer need to stay inside the old "safe decimal subset".

> **The classification of numeric kinds.**
> TypeScript decided a literal's kind with no range condition at
> all, and Go with a `float64` → `int64` round-trip (whose out-of-range
> behaviour the Go specification leaves implementation-dependent), so
> `a:1e21 & integer` succeeded in TS and failed in Go. Both ports now
> share one predicate — `isIntegerKind` (`ts/src/val/numkind.ts`,
> `go/lang.go`), comparing against the exact `float64` bounds and
> applied at every construction site, including the raw/implicit-list
> path where there is no source text. Five further rules landed with it:
> negative zero never reaches the AST, generated output or canon; scalar
> identity compares kind as well as value, so `1|1.0` keeps both
> alternatives; number-kind canon always carries a fraction or an
> exponent, so it reparses to the same kind (this flipped `scalar.tsv`'s
> `big-fixed-canon` and `hex-big-canon` to a `.0` suffix); `+`,
> `upper()` and `lower()` never narrow their operands' kind; and
> `super(x)` lifts its argument rather than itself. The `.0` suffix is
> canon-only — `+`'s string coercion keeps JS parity (`"a"+1.0` is
> `"a1"`), so `go/scalar_format_test.go` passes unchanged. Pinned by
> `test/spec/number-model.tsv`. Background:
> [`docs/design/number-model.md`](docs/design/number-model.md).

> **A colon-chain key whose value was a bare import** —
> `struct: minor: @"file"` — used to resolve to `{}` in Go
> (it loaded correctly in TS). Fixed upstream in `@tabnas/multisource/go`
> v0.3.1 (pinned in `go/go.mod`); covered by the shared-spec regression
> `file.tsv:load-colon-chain`. Background:
> [`docs/design/nested-import-colon-chain.md`](docs/design/nested-import-colon-chain.md).
