"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// The MCP tool library and its stdio wiring (G7 phase 6). The tools
// return the SAME contracts the CLI prints — vet's report, get's
// slice, why's record, diff's changes — so what is asserted here is
// the protocol around them, not the verbs, which the shared suite
// already pins in both ports.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const node_stream_1 = require("node:stream");
const mcp_1 = require("../dist/mcp");
const mcp_server_1 = require("../dist/mcp-server");
// The text payload of a tool result, decoded.
function payload(result) {
    return JSON.parse(result.content[0].text);
}
(0, node_test_1.describe)('mcp', () => {
    (0, node_test_1.test)('initialize-and-list', () => {
        const init = (0, mcp_1.handle)({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }, '9.9.9');
        Assert.equal(init.result.protocolVersion, mcp_1.MCP_PROTOCOL);
        Assert.equal(init.result.serverInfo.name, 'aontu');
        Assert.equal(init.result.serverInfo.version, '9.9.9');
        Assert.deepEqual(init.result.capabilities, { tools: {} });
        const list = (0, mcp_1.handle)({ id: 2, method: 'tools/list' }, '9.9.9');
        Assert.deepEqual(list.result.tools.map((t) => t.name).sort(), ['canon', 'diff', 'get', 'summary', 'vet', 'why']);
        // Every tool declares its arguments, and every required argument
        // is one of them: a schema that asks for what it does not describe
        // is a schema no client can satisfy.
        for (const t of (0, mcp_1.toolList)()) {
            Assert.equal(t.inputSchema.type, 'object');
            for (const req of t.inputSchema.required) {
                Assert.ok(null != t.inputSchema.properties[req], `${t.name}: ${req}`);
            }
        }
        Assert.deepEqual((0, mcp_1.handle)({ id: 3, method: 'ping' }, '9.9.9')?.result, {});
    });
    // A NOTIFICATION has no id, and answering one is a protocol error in
    // the other direction.
    (0, node_test_1.test)('notifications-get-no-answer', () => {
        Assert.equal((0, mcp_1.handle)({ jsonrpc: '2.0', method: 'notifications/initialized' }, '1'), undefined);
    });
    (0, node_test_1.test)('every-tool-answers-its-own-report', () => {
        const v = payload((0, mcp_1.callTool)('vet', { schema: 'a: integer', data: 'a: "x"' }));
        Assert.equal(v.verdict, 'invalid');
        Assert.equal(v.findings[0].code, 'no_scalar_unify');
        Assert.equal(payload((0, mcp_1.callTool)('get', { src: 'a: {b: 1}', path: '$.a', view: 'canon' })).out, '{"b":1}');
        Assert.equal(payload((0, mcp_1.callTool)('get', { src: 'a: {b: 1}', path: '$', view: 'types', depth: 2 })).out, '{"a":{"b":top}}');
        const w = payload((0, mcp_1.callTool)('why', { src: 'a: 1\na: integer', path: '$.a' }));
        Assert.equal(w.record.value, '1');
        Assert.equal(w.record.conjuncts.length, 2);
        const d = payload((0, mcp_1.callTool)('diff', { left: 'a: 1', right: 'a: 2' }));
        Assert.equal(d.same, false);
        Assert.equal(d.changes[0].path, '$.a');
        // The optional arguments: `at` on vet and on diff.
        Assert.equal(payload((0, mcp_1.callTool)('vet', { schema: 'a: {b: integer}', data: 'b: 1', at: '$.a' })).verdict, 'valid');
        Assert.equal(payload((0, mcp_1.callTool)('diff', { left: 'a: {b: 1}', right: 'a: {b: 2}', at: '$.a' })).changes[0].path, '$.b');
        // An argument of the wrong TYPE is read as absent rather than
        // coerced: a client that sends a number for a path gets the empty
        // path, which is the root — the same answer as sending nothing.
        Assert.equal(payload((0, mcp_1.callTool)('diff', { left: 'a: 1', right: 'a: 1', at: 7 })).same, true);
        Assert.equal(payload((0, mcp_1.callTool)('canon', { src: 'a: 1.0' })).canon, '{"a":1.0}');
        const s = payload((0, mcp_1.callTool)('summary', { src: 'b: 2\na: 1' }));
        Assert.match(s.hash, /^aon1-/);
        Assert.deepEqual(s.keys, ['a', 'b']);
        Assert.equal(s.shape, '{"a":integer,"b":integer}');
        // A document whose root is NOT a map has no root keys, which is a
        // true summary rather than an error.
        const list = payload((0, mcp_1.callTool)('summary', { src: '[1,2]' }));
        Assert.equal(list.ok, true);
        Assert.deepEqual(list.keys, []);
    });
    // A tool that REFUSES is not a protocol error: the report IS the
    // answer. `isError` is for a call that could not be made at all.
    (0, node_test_1.test)('a-refusal-is-an-answer-not-a-protocol-error', () => {
        const r = (0, mcp_1.callTool)('get', { src: 'a: 1', path: '$.zz' });
        Assert.equal(r.isError, false);
        Assert.equal(payload(r).ok, false);
        Assert.equal(payload(r).findings[0].code, 'no_path');
        const broken = (0, mcp_1.callTool)('canon', { src: 'a:]' });
        Assert.equal(broken.isError, false);
        Assert.equal(payload(broken).ok, false);
        const bsum = (0, mcp_1.callTool)('summary', { src: 'a:1 a:2' });
        Assert.equal(payload(bsum).ok, false);
        // A missing tool, or a missing required argument, IS one.
        Assert.equal((0, mcp_1.callTool)('nope', {}).isError, true);
        Assert.equal((0, mcp_1.callTool)('get', { src: 'a:1' }).isError, true);
        Assert.equal((0, mcp_1.callTool)('vet', {}).isError, true);
    });
    (0, node_test_1.test)('served-evaluation-is-confined', () => {
        // A served document may not reach the filesystem: text arrives
        // from a caller, and an include is exactly what a server must not
        // run unconfined (G5).
        const r = payload((0, mcp_1.callTool)('canon', { src: 'a: @"/etc/passwd"' }));
        Assert.equal(r.ok, false);
        Assert.equal(r.findings[0].code, 'include_denied');
    });
    // main() with no stream arguments uses the real stdout/exit
    // defaults, which no injected test reaches.
    (0, node_test_1.test)('stdio-server-default-streams', () => {
        const stdin = { on: () => stdin };
        const written = [];
        let exited;
        const so = process.stdout.write;
        const pe = process.exit;
        try {
            ;
            process.stdout.write = (c) => (written.push(String(c)), true);
            process.exit = (code) => { exited = code; };
            const codec = (0, mcp_server_1.main)(stdin);
            codec.push('{"id":1,"method":"ping"}\n');
            codec.end();
        }
        finally {
            process.stdout.write = so;
            process.exit = pe;
        }
        Assert.match(written.join(''), /"result":\{\}/);
        Assert.equal(exited, 0);
    });
    (0, node_test_1.test)('protocol-errors', () => {
        Assert.equal((0, mcp_1.handle)({ id: 9, method: 'no/such' }, '1')?.error?.code, -32601);
        Assert.equal((0, mcp_1.handle)({ id: 9, method: 'tools/call', params: {} }, '1')?.error?.code, -32602);
        Assert.equal((0, mcp_1.parseError)().error?.code, -32700);
        Assert.equal((0, mcp_1.parseError)().id, null);
        // A call with a name and NO arguments block: the tool's own
        // required-argument check answers, not the protocol.
        const bare = (0, mcp_1.handle)({ id: 10, method: 'tools/call', params: { name: 'canon' } }, '1');
        Assert.equal(bare.result.isError, true);
    });
    // The stdio wiring: NDJSON in, NDJSON out, one line per message.
    (0, node_test_1.test)('stdio-server-speaks-ndjson', async () => {
        const lines = [];
        let exited = -1;
        const stdin = new node_stream_1.PassThrough();
        // The stream ends on a later tick, so the exit code is awaited
        // rather than read: this is the wiring test, and the wiring is
        // event-driven.
        const done = new Promise((resolve) => {
            const codec = (0, mcp_server_1.main)(stdin, (line) => lines.push(line), (code) => (exited = code, resolve()), '9.9.9');
            Assert.ok(codec instanceof mcp_server_1.LineCodec);
        });
        // Two messages in one chunk, and one split across chunks.
        stdin.write('{"id":1,"method":"ping"}\n{"id":2,"method":"tools/list"}\n');
        stdin.write('{"id":3,"method":"ini');
        stdin.write('tialize"}\n');
        // A blank line is not a message; unparseable text is.
        stdin.write('\nnot json\n');
        stdin.end();
        await done;
        Assert.equal(lines.length, 4);
        Assert.deepEqual(JSON.parse(lines[0]).result, {});
        Assert.equal(JSON.parse(lines[1]).result.tools.length, 6);
        Assert.equal(JSON.parse(lines[2]).result.serverInfo.version, '9.9.9');
        Assert.equal(JSON.parse(lines[3]).error.code, -32700);
        Assert.equal(exited, 0);
    });
});
//# sourceMappingURL=mcp.test.js.map