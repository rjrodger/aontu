# Changelog

All notable changes to this project are documented here. The TypeScript
package (`ts/`, npm `aontu`) and the Go module (`go/`,
`github.com/rjrodger/aontu/go`) are versioned independently; entries note
which implementation each change affects.

## Unreleased — TypeScript 0.47.0, Go 0.1.4

### Changed — parser packages (TypeScript and Go)

- **Go**: migrated the parser from the `github.com/jsonicjs/*` Go modules
  to the `github.com/tabnas/*` modules (`tabnas/jsonic`, `tabnas/expr`,
  `tabnas/multisource`, `tabnas/path`, `tabnas/directive`). Behaviour
  unchanged; the full suite passes. Adaptations: the `RuleSpec` API moved
  from exported slice fields to methods (`PrependOpen`/`AddClose`/`AddAC`);
  and the map `Merge` now returns the value as-is for a new key
  (`prev == nil`) — `tabnas/multisource` calls `Merge` for every key of a
  top-level `@"file"` load, and `asVal(nil)` is an empty map, so the old
  code wrongly produced `{} & val` and dropped the loaded keys.

- **TypeScript**: migrated the parser from the `@jsonic`/`jsonic` packages
  to the `@tabnas` packages (`@tabnas/jsonic`, `@tabnas/expr`,
  `@tabnas/multisource`, `@tabnas/path`, `@tabnas/directive`,
  `@tabnas/debug`). Behaviour is unchanged — the full suite (393 tests)
  passes. Three integration points needed adapting to `@tabnas`'s parser:
  - the parser core is split into `@tabnas/parser` + `@tabnas/jsonic`, so
    plugin `Plugin` types are reconciled via a small `asPlugin` cast and
    the model resolver is typed against `Tabnas`;
  - literal scalars are wrapped into Vals in the `val` rule's *after-close*
    (`.ac`) hook rather than before-close, because `@tabnas` re-resolves
    the scalar token during before-close;
  - `MultiSource` is applied before the grammar customisation so the `@`
    directive's `val` alt survives, and the spread/optional `val→map`
    dives reset to a fresh node (`@tabnas` parent-seeds a descended node,
    which otherwise made nested `&:`/`?:` maps share — and self-reference —
    their parent's node).
- Requires Node.js >= 24 (the `@tabnas` packages require it; CI already
  runs node 24.x).

### Changed — source file extensions

- `.aon` is now the **preferred** Aontu source extension; `.aontu` also
  works. Both are tried (in that order) for extension-less `@"path"`
  loads.
- **`.jsonic` is retired**: it is no longer in the implicit-extension
  search or the resolver's processor configuration in either
  implementation. (An explicitly named file still parses via the default
  processor, but `.jsonic` is no longer a recognised Aontu extension.)
- All shared-spec and test fixtures renamed from `.jsonic` to `.aon`;
  docs updated accordingly.

### Added — Language Server (LSP)

- New `aontu-lsp` Language Server in both implementations, reporting
  unification diagnostics over stdio (TypeScript `bin` `aontu-lsp` →
  `dist/lsp-server.js`; Go `go/cmd/aontu-lsp`). The two servers are kept
  in parity: same capabilities and identical diagnostic text.
- The LSP logic is exposed as a reusable library, separate from serving:
  - analysis — `computeDiagnostics(src)` (`ts/src/lsp.ts`) and
    `lsp.Diagnostics(src)` (`go/lsp`, built on the new
    `aontu.Check(src) []Problem` in `package aontu`);
  - a transport-agnostic protocol handler — `LspHandler` (TS) /
    `lsp.Handler` (Go);
  - a thin stdio JSON-RPC server on top.
- Diagnostics report genuine errors only (conflicts, unresolved
  references, unknown functions, syntax errors); valid non-concrete
  schemas such as `a:string` produce none. Full documentation in
  `docs/lsp.md`.
- **Hover** (`textDocument/hover`): resolves the value under the cursor
  from the unified tree and shows its canon and kind. Library:
  `computeHover` (TS) / `lsp.Hover` (Go), built on the new
  `(*aontu.Aontu).Spans` core API.
- **Completion** (`textDocument/completion`): the built-in functions,
  scalar-kind keywords and literals. Library: `computeCompletions` (TS) /
  `lsp.Completions` (Go); function names sourced from the engine
  (`aontu.BuiltinFuncNames`).
- (Go) Reference, dot, and unknown-function NilVals now carry source byte
  offsets, so `no_path` and `unknown_function` diagnostics are positioned
  precisely (matching TS).

### Added — editor plugins

- `editors/` now contains thin LSP-client plugins that launch `aontu-lsp`:
  **VS Code** (`editors/vscode`), **Emacs** (`editors/emacs`, Eglot and
  lsp-mode, with a major mode + syntax), and **Vim/Neovim**
  (`editors/vim`, filetype/syntax + Neovim built-in LSP autostart). All
  associate `.aon` and `.aontu`.
- The LSP **library is server-independent** in both languages (Go `lsp`
  package does not import `cmd/aontu-lsp`; TS `lsp.ts` does not import
  `lsp-server.ts`), so third parties can reuse the analysis + handler with
  their own transport. Documented under "Bring your own server" in
  `docs/lsp.md`.

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
