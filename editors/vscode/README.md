# Aontu for VS Code

Language support for [Aontu](../../README.md) — diagnostics, hover and
completion — by launching the `aontu-lsp` language server and connecting
it to `.aon` and `.aontu` files.

## Prerequisites

Install the language server so `aontu-lsp` is on your `PATH`:

```sh
npm install -g aontu            # provides the `aontu-lsp` binary
```

Or point the extension at a checkout (see configuration below).

## Build & run (from source)

```sh
cd editors/vscode
npm install
npm run compile
```

Then press <kbd>F5</kbd> in VS Code (with this folder open) to launch an
Extension Development Host, and open a `.aon` file.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `aontu.server.command` | `aontu-lsp` | Command to launch the server. |
| `aontu.server.args` | `[]` | Arguments for the command. |

To run the TypeScript server directly from a repo checkout without
installing the binary:

```jsonc
{
  "aontu.server.command": "node",
  "aontu.server.args": ["/abs/path/to/aontu/ts/dist/lsp-server.js"]
}
```

To use the Go server, set `aontu.server.command` to the built `aontu-lsp`
binary's absolute path.

## How it works

This extension is a thin LSP client (`src/extension.ts`); all language
intelligence lives in the reusable server library. See
[`docs/lsp.md`](../../docs/lsp.md) for the architecture and protocol.
