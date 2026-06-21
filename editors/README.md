# Aontu editor integrations

Editor plugins that connect to the Aontu language server (`aontu-lsp`) for
diagnostics, hover and completion on `.aon` (preferred) and `.aontu`
files. All language intelligence lives in the server — see
[`docs/lsp.md`](../docs/lsp.md); these plugins are thin clients.

| Editor | Directory | LSP | Syntax |
|--------|-----------|-----|--------|
| VS Code | [`vscode/`](vscode/) | ✓ (vscode-languageclient) | basic |
| Emacs | [`emacs/`](emacs/) | ✓ (Eglot & lsp-mode) | ✓ |
| Vim / Neovim | [`vim/`](vim/) | ✓ (Neovim built-in) | ✓ |

Each subdirectory has its own README with install and configuration. All
default to launching `aontu-lsp` from `PATH` (`npm install -g aontu`), and
all allow overriding the command to run the server from a checkout
(`node .../ts/dist/lsp-server.js`) or the Go binary.
