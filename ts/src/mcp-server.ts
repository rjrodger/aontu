/* Copyright (c) 2025 Richard Rodger, MIT License */

// Aontu MCP server (stdio).
//
//   aontu-mcp
//
// Speaks the Model Context Protocol over stdio: newline-delimited
// JSON-RPC 2.0, one message per line. This binary is intentionally
// thin — every tool and every protocol decision lives in the reusable
// library ./mcp, the same three-layer split the language server uses
// (docs/lsp.md).
//
// NDJSON, not the LSP's Content-Length framing: MCP stdio transport
// is line-delimited, and a server that invented its own framing would
// not be reachable by any client.

import { handle, parseError } from './mcp'
import type { McpRequest, McpResponse } from './mcp'
import { VERSION } from './aontu'


// A line-oriented JSON-RPC codec: feed it incoming chunks, and it
// splits lines, dispatches them, and writes replies. Kept
// transport-injectable (write/onExit) so the wiring is unit-testable
// without real stdio, exactly as the LSP's FrameCodec is.
class LineCodec {
  private buffer = ''

  constructor(
    private write: (line: string) => void,
    private onExit: (code: number) => void,
    private version: string,
  ) { }

  push(chunk: string | Buffer) {
    this.buffer += chunk.toString()
    for (; ;) {
      const nl = this.buffer.indexOf('\n')
      if (nl < 0) {
        return
      }
      const line = this.buffer.slice(0, nl).trim()
      this.buffer = this.buffer.slice(nl + 1)
      if ('' !== line) {
        this.line(line)
      }
    }
  }

  end() {
    this.onExit(0)
  }

  private line(line: string) {
    let msg: McpRequest
    try {
      msg = JSON.parse(line)
    }
    catch {
      this.send(parseError())
      return
    }
    const out = handle(msg, this.version)
    if (null != out) {
      this.send(out)
    }
  }

  private send(out: McpResponse) {
    this.write(JSON.stringify(out) + '\n')
  }
}


// The streams and exit are injectable (defaulting to real stdio) so
// the full wiring is unit-testable.
function main(
  stdin: NodeJS.ReadableStream = process.stdin,
  write: (line: string) => void = (line) => void process.stdout.write(line),
  exit: (code: number) => void = (code) => process.exit(code),
  version: string = VERSION,
): LineCodec {
  const codec = new LineCodec(write, exit, version)
  stdin.on('data', (chunk: Buffer) => codec.push(chunk))
  stdin.on('end', () => codec.end())
  return codec
} /* node:coverage ignore next 11 */


// No require.main guard here: bin/aontu-mcp.js is the executable entry
// and calls main() itself, so this module stays import-only.


export {
  LineCodec,
  main,
}
