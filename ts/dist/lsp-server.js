#!/usr/bin/env node
"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameCodec = void 0;
// Aontu Language Server (stdio).
//
//   aontu-lsp
//
// Speaks LSP over stdio (JSON-RPC with Content-Length framing) and
// publishes unification diagnostics as `.aontu` files are edited. This
// binary is intentionally thin: all protocol logic lives in the reusable
// library ./lsp (LspHandler + computeDiagnostics). See docs/lsp.md for
// editor configuration.
const lsp_1 = require("./lsp");
// A byte-level LSP framing codec: feed it incoming chunks, give it a
// handler, and it decodes Content-Length frames, dispatches them, and
// writes framed replies. Kept transport-injectable (write/onExit) so it
// can be unit-tested without real stdio.
class FrameCodec {
    constructor(handler, write, onExit) {
        this.handler = handler;
        this.write = write;
        this.onExit = onExit;
        this.buffer = Buffer.alloc(0);
    }
    // Feed a chunk of incoming bytes; processes any complete frames.
    push(chunk) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.drain();
    }
    // Called when the input stream ends.
    end() {
        this.onExit(this.handler.exitCode);
    }
    drain() {
        for (;;) {
            const headerEnd = this.buffer.indexOf('\r\n\r\n');
            if (headerEnd < 0)
                return;
            const header = this.buffer.subarray(0, headerEnd).toString('ascii');
            const match = /Content-Length:\s*(\d+)/i.exec(header);
            if (null == match) {
                // Malformed header block: skip past it and continue.
                this.buffer = this.buffer.subarray(headerEnd + 4);
                continue;
            }
            const length = parseInt(match[1], 10);
            const bodyStart = headerEnd + 4;
            if (this.buffer.length < bodyStart + length)
                return; // need more bytes
            const body = this.buffer.subarray(bodyStart, bodyStart + length).toString('utf8');
            this.buffer = this.buffer.subarray(bodyStart + length);
            let msg;
            try {
                msg = JSON.parse(body);
            }
            catch {
                continue; // ignore unparseable frame
            }
            for (const out of this.handler.handle(msg)) {
                this.send(out);
            }
            if (this.handler.shouldExit) {
                this.onExit(this.handler.exitCode);
                return;
            }
        }
    }
    send(out) {
        const body = Buffer.from(JSON.stringify(out), 'utf8');
        this.write(Buffer.from('Content-Length: ' + body.length + '\r\n\r\n', 'ascii'));
        this.write(body);
    }
}
exports.FrameCodec = FrameCodec;
function main() {
    const handler = new lsp_1.LspHandler();
    const codec = new FrameCodec(handler, (chunk) => process.stdout.write(chunk), (code) => process.exit(code));
    process.stdin.on('data', (chunk) => codec.push(chunk));
    process.stdin.on('end', () => codec.end());
}
// Only auto-run when invoked as a program, not when imported by tests.
if (require.main === module) {
    main();
}
//# sourceMappingURL=lsp-server.js.map