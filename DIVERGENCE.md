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

## Why a divergence is a bug by default

When a probe shows the two engines disagreeing, that is a **bug**, and the
default response is to fix the engine, not to write here. Writing the
expectation from one engine's output is how a divergence gets baselined as
the contract: the row then passes on the side it was copied from and fails
on the other, and the obvious next move — "make the other side match" —
quietly changes whichever engine happened to be right. Nothing in the suite
can warn you, because a row that was never probed carries no record of
having been agreed.


The shared spec only contains rows that pass identically in both
implementations. A few behaviours deliberately differ and must **not**
be added to `test/spec/*.tsv`. These are permanent, so they are not
entered in the divergence ledger
([`test/spec/divergent.tsv`](test/spec/divergent.tsv)), which tracks
only divergences that are expected to be fixed:

- **Error message text.** Go's `hints` are abbreviated versions of the TS
  hints, and TS additionally renders source frames. Only the substring
  asserted by an `err`-mode spec row is contractual; full error text is
  not in parity.
- **Parse-level canon.** Only `unify(src).canon` is in parity. The raw
  `parse(src).canon` of nested `&`/`|` is parenthesised in TS but flat in
  Go; this is invisible to the shared spec (which is unify-level).
> **Previously divergent, now fixed:** the canon of move()-hidden ghost
> nodes, including the object-sharing artifacts. The Go port now
> mirrors TS's clone-graph sharing directly: func clones share their
> args array (TS `Val.clone` passes `peg` by reference) and pref clones
> share their peg, a TOP-peer map/list unify refines the bag IN PLACE
> (the `out = peer.isTop ? this : new ...` fast-path), and a driving
> func re-paths its (possibly shared) args to its own location each
> pass (`repathArg`, the equivalent of TS's ctx-path re-descent — with
> key()'s stored path frozen once its cc<3 delay window closes). Hiding
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
- **Canon of invalid sources.** A source that fails in both
  implementations may fail at different stages — e.g. `k-x:1` (bare key
  containing `-`) is a parse error in TS but parses to a list holding an
  error nil in Go. `generate` errors in both; only `unify(src).canon` of
  such an *invalid* source differs, which the spec (whose canon rows are
  valid sources) never observes.
- **Lone surrogates in quoted strings.** A UTF-16 surrogate that does not
  form a high+low pair round-trips in TypeScript (JS strings permit it,
  `isWellFormed()` is false) and becomes U+FFFD in Go. It happens at LEX
  time in `@tabnas/parser`, where it is deliberate and documented
  (`go/doc/differences.md`: "Lone surrogates | Preserved (JS strings allow
  them) | U+FFFD (matches encoding/json)"), so nothing here can recover a
  surrogate the lexer already discarded.

  Be clear about the cost, because it is not merely cosmetic: Go
  **conflates** values TypeScript keeps distinct, which breaks the lattice
  law that two different values never unify.

  ```
  x:"\ud800"
  x:"\ufffd"   ts -> error, Cannot unify values at $.x
                go -> SUCCESS, {"x":"\ufffd"}
  ```

  As map KEYS this silently merges distinct entries. Refusing an unpaired
  surrogate in both ports would restore the law, and that was considered
  and **declined** (#24, 2026-08-11): in Go a refusal removes nothing
  anyone can depend on, since the value is already destroyed, but in
  TypeScript it removes a working capability. Keeping a documented
  divergence was judged the smaller cost. Reopen #24 rather than changing
  one port quietly.

  Confined to QUOTED strings, all three quote styles, both escape
  spellings. Bare text is unaffected — `a\ud800:1` agrees, the backslash
  stays literal there, pinned by `scalar.tsv surrogate-bare-text-untouched`.
  Every PAIRED form agrees and is pinned by real rows (`scalar.tsv
  surrogate-*`), including the braced and mixed spellings that Go used to
  destroy before `@tabnas/parser` 0.8.4. The per-port behaviour is pinned
  upstream in `go/surrogate_pairing_test.go` and
  `ts/test/surrogate-pairing.test.js`, which assert OPPOSITE results on
  purpose, so changing either side fails loudly.
- **Unicode table vintage.** `upper()`/`lower()` use FULL Unicode case
  mapping in both ports and agree exactly on the Unicode 15.0 repertoire.
  The Go port's tables (`golang.org/x/text`, and Go's own `unicode`
  package) are Unicode 15.0; Node ships newer ICU tables, so roughly 110
  code points assigned after Unicode 15 — Garay, some Latin Extended-D
  additions, a few Cyrillic — case-map in TypeScript and not in Go. This
  is a table-vintage gap, not an algorithmic one, and it closes on its own
  as Go's tables advance. No ledger entry: nothing in this repository can
  change it, and no spec rows pin it.

- **Malformed-input acceptance edges.** Fuzzing surfaced a residual
  family of *degenerate* inputs where the two parsers disagree about
  whether to accept at all: nested implicit lists from adjacent values
  in expression positions (`pref(1-3)`, `close(([]%))`), and stray-quote
  juxtapositions (`1'00]...`, `"q k""?:...`) — one side errors, the
  other parses to a (differently shaped) junk value. Well-formed
  sources are unaffected.

  The same bullet covers a source that is not well-formed **UTF-8**: the
  two ports may produce a different NUMBER of U+FFFD replacement
  characters for the same invalid bytes. A truncated three-byte sequence
  (`E2 82`) inside a string yields ONE replacement character in
  TypeScript and TWO in Go, because Node replaces invalid bytes as it
  decodes the file to a UTF-16 string, while Go carries the raw bytes
  through to the encoder. No spec rows: the `src` column cannot carry raw
  invalid bytes, and by this document's own rule a divergence declared
  permanent does not go in the ledger either.

  Distinct from this: a lone *surrogate* in a quoted string is folded
  to U+FFFD by Go, which conflates distinct values and breaks a
  lattice law rather than merely reshaping junk. That case has its own
  entry above — it was tracked as ledger debt under issue #24 until
  the refusal option was declined (2026-08-11), and is now a decided,
  permanent divergence, not an open one.
> **Previously divergent, now fixed:** root-level spreads over `$var`
> (and other expression) keys. `k1:$flag &:boolean` used to raise an
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

> **Previously divergent, now fixed:** numeric canon formatting at
> extreme magnitudes. Go's `formatNumber` (go/scalar.go) now reproduces
> JavaScript `Number.toString` exactly — fixed notation for decimal
> exponents in [-6, 20], exponential with an unpadded signed exponent
> outside (`1e+21`, `1e-7`) — pinned by `go/scalar_format_test.go` and
> the `scalar.tsv` extreme-magnitude canon rows. Numeric canon rows no
> longer need to stay inside the old "safe decimal subset".

> **Previously divergent, now fixed:** the classification of numeric
> kinds. TypeScript decided a literal's kind with no range condition at
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
> `test/spec/number-model.tsv`; what remains unresolved is entry 2 of
> the divergence ledger. Background:
> [`docs/design/number-model.md`](docs/design/number-model.md).

> **Previously divergent, now fixed:** a colon-chain key whose value was a
> bare import — `struct: minor: @"file"` — used to resolve to `{}` in Go
> (it loaded correctly in TS). Fixed upstream in `@tabnas/multisource/go`
> v0.3.1 (pinned in `go/go.mod`); covered by the shared-spec regression
> `file.tsv:load-colon-chain`. Background:
> [`docs/design/nested-import-colon-chain.md`](docs/design/nested-import-colon-chain.md).


