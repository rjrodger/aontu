# Changelog

All notable changes to this project are documented here. The TypeScript
package (`ts/`, npm `aontu`) and the Go module (`go/`,
`github.com/rjrodger/aontu/go`) are versioned independently; entries note
which implementation each change affects.

## Unreleased — TypeScript 0.47.0, Go 0.1.4

### Breaking (TypeScript)

- **Number model is now CUE-faithful and matches the Go port.** `integer`
  and `number` are distinct kinds, so two concrete literals of different
  kind no longer unify: `1 & 1.0` now errors (`scalar_kind`) instead of
  resolving to `1`. Previously the canonical TS treated `1` and `1.0` as
  equal because JavaScript has a single number type. Kind-constraint
  cases are unchanged (`number & 1` → `1`, `integer & 1` → `1`).
- **Negative zero normalises to `0`** in generated output and the AST,
  matching the Go port (JSON has no `-0`). Previously TS preserved `-0`.

### Fixed (Go)

- Unknown function calls now error with `unknown_function` instead of
  silently degrading to parenthesised grouping (`x:foo(1)` previously
  returned `{"x":1}`; it now errors, matching the canonical TS).
- Unifying two `close`d maps now selects a deterministic driver (fewer
  keys, then lexicographic key order), so the result is independent of
  operand order, matching `ts/src/val/MapVal.ts`.
- `jsonString` canon escaping now covers `\b`, `\f` and other control
  characters (`\u00XX`), matching JavaScript's `JSON.stringify`.

### Changed

- (Go CLI) The REPL no longer silently truncates lines over 64 KB,
  reports scanner errors, and no longer ignores stdin read errors.
- (TypeScript) Internal type-discriminator flags corrected for
  consistency (`LowerFuncVal` → `isLowerFunc`, `OpBaseVal` → `isOp`,
  `NullVal`'s `isNull` now has a prototype default). No behaviour change;
  these flags were previously never read.

### Documentation / tests

- Expanded the shared spec (`test/spec/*.tsv`) with order-independence
  and commutativity cases (refs, chained refs, disjunction, spread+pref),
  scalar edges (`1.0`, `-0`), the `1 & 1.0` conflict, and an
  unknown-function error row — each verified to pass identically in both
  implementations.
- `AGENTS.md` documents the in-place mutation caveat (parsed `Val`s are
  single-use), and the remaining known TS/Go divergences: numeric canon
  formatting is guaranteed only for a documented decimal subset
  (`0` and roughly `1e-6 ≤ |x| < 1e20`), error message text, and
  parse-level canon.
