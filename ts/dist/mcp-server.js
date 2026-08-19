"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineCodec = void 0;
exports.main = main;
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
const mcp_1 = require("./mcp");
const aontu_1 = require("./aontu");
// A line-oriented JSON-RPC codec: feed it incoming chunks, and it
// splits lines, dispatches them, and writes replies. Kept
// transport-injectable (write/onExit) so the wiring is unit-testable
// without real stdio, exactly as the LSP's FrameCodec is.
class LineCodec {
    constructor(write, onExit, version) {
        this.write = write;
        this.onExit = onExit;
        this.version = version;
        this.buffer = '';
    }
    push(chunk) {
        this.buffer += chunk.toString();
        for (;;) {
            const nl = this.buffer.indexOf('\n');
            if (nl < 0) {
                return;
            }
            const line = this.buffer.slice(0, nl).trim();
            this.buffer = this.buffer.slice(nl + 1);
            if ('' !== line) {
                this.line(line);
            }
        }
    }
    end() {
        this.onExit(0);
    }
    line(line) {
        let msg;
        try {
            msg = JSON.parse(line);
        }
        catch {
            this.send((0, mcp_1.parseError)());
            return;
        }
        const out = (0, mcp_1.handle)(msg, this.version);
        if (null != out) {
            this.send(out);
        }
    }
    send(out) {
        this.write(JSON.stringify(out) + '\n');
    }
}
exports.LineCodec = LineCodec;
// The streams and exit are injectable (defaulting to real stdio) so
// the full wiring is unit-testable.
function main(stdin = process.stdin, write = (line) => void process.stdout.write(line), exit = (code) => process.exit(code), version = aontu_1.VERSION) {
    const codec = new LineCodec(write, exit, version);
    stdin.on('data', (chunk) => codec.push(chunk));
    stdin.on('end', () => codec.end());
    return codec;
} /* node:coverage ignore next 11 */
//# sourceMappingURL=mcp-server.js.map