/* Copyright (c) 2025 Richard Rodger, MIT License */

// VS Code extension: thin client that launches the Aontu language server
// (aontu-lsp) and connects it to .aon / .aontu files. All language
// intelligence lives in the server; this file only wires it up.

import * as vscode from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'

let client: LanguageClient | undefined

export function activate(_context: vscode.ExtensionContext) {
  const cfg = vscode.workspace.getConfiguration('aontu')
  const command = cfg.get<string>('server.command', 'aontu-lsp')
  const args = cfg.get<string[]>('server.args', [])

  const serverOptions: ServerOptions = {
    run: { command, args, transport: TransportKind.stdio },
    debug: { command, args, transport: TransportKind.stdio },
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'aontu' }],
  }

  client = new LanguageClient('aontu', 'Aontu', serverOptions, clientOptions)
  client.start()
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop()
}
