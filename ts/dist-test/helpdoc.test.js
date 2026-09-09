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
// THE TEACHING PACK AND THE CODE LOOKUP (G11 phases 1-3), and the
// TypeScript twin of go/cmd/aontu/help_test.go and explain_test.go.
//
// What the two ports must AGREE on -- the corpus bytes, the topic list
// and its order, every exit class, and the tool help itself -- is
// asserted in both suites against the same repository sources. These
// are CLI-level messages and the shared spec suite runs the engine, so
// there is no shared mode that could carry them; asserting both ports
// against one source is what makes the agreement checkable anyway.
const node_test_1 = require("node:test");
const Assert = __importStar(require("node:assert"));
const node_child_process_1 = require("node:child_process");
const Fs = __importStar(require("node:fs"));
const Path = __importStar(require("node:path"));
const helpdoc_1 = require("../dist/helpdoc");
const hints_1 = require("../dist/hints");
const cli_1 = require("../dist/cli");
const CLI = Path.join(__dirname, '..', 'bin', 'aontu.js');
const REPO = Path.join(__dirname, '..', '..');
function run(args) {
    const env = { ...process.env };
    delete env.NODE_V8_COVERAGE;
    try {
        const out = (0, node_child_process_1.execFileSync)('node', [CLI, ...args], {
            input: '', encoding: 'utf8', env, stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { out, err: '', code: 0 };
    }
    catch (err) {
        return {
            out: err.stdout ?? '', err: err.stderr ?? '', code: err.status ?? 1,
        };
    }
}
// LINE ENDINGS ARE THE CHECKOUT'S BUSINESS, the rule every other gate
// in this repository states.
function readRepo(rel) {
    return Fs.readFileSync(Path.join(REPO, rel), 'utf8')
        .replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}
(0, node_test_1.describe)('helpdoc', () => {
    // THE ASSERTION THE WHOLE PHASE RESTS ON. ts/src/helpdoc.ts is a
    // generated copy (ts/scripts/helpdoc.cjs, `make helpdoc`), and a
    // generated copy that nothing compares is a second source of truth
    // waiting to drift. Regenerate rather than hand-edit.
    (0, node_test_1.test)('corpus-is-identical-with-its-sources', () => {
        Assert.ok(0 < helpdoc_1.HELPDOC.length, 'no topics: has the generator run?');
        for (const topic of helpdoc_1.HELPDOC) {
            Assert.equal(topic.text, readRepo(topic.source), `help topic ${topic.topic} is stale against ${topic.source}` +
                ' — run `make helpdoc`');
        }
    });
    // THE TWO PORTS SERVE THE SAME CORPUS, in the same order. Both read
    // the same generated index, so this is what catches a stage that
    // wrote one port and not the other.
    (0, node_test_1.test)('both-ports-stage-the-same-topics', () => {
        const goDir = Path.join(REPO, 'go', 'cmd', 'aontu', 'helpdoc');
        const index = readRepo('go/cmd/aontu/helpdoc/index.tsv')
            .split('\n')
            .filter((line) => '' !== line && !line.startsWith('#'))
            .map((line) => line.split('\t'));
        Assert.deepEqual(index.map((col) => col[0]), helpdoc_1.HELPDOC.map((t) => t.topic), 'the two ports list different topics, or in a different order');
        for (const [topic, file, summary, source] of index) {
            const staged = Fs.readFileSync(Path.join(goDir, file), 'utf8')
                .replaceAll('\r\n', '\n').replaceAll('\r', '\n');
            const mine = helpdoc_1.HELPDOC.find((t) => topic === t.topic);
            Assert.ok(null != mine, `${topic} is staged for Go and not here`);
            Assert.equal(staged, mine.text, `${topic} differs between the ports`);
            Assert.equal(summary, mine.summary, `${topic}: summaries differ`);
            Assert.equal(source, mine.source, `${topic}: sources differ`);
        }
    });
    // The one construct the phase exists for. An agent that cannot learn
    // `&:` offline cannot write a schema that constrains anything, and
    // gets `verdict: valid` over data that violates it.
    (0, node_test_1.test)('help-language-teaches-the-map-template', () => {
        const r = run(['help', 'language']);
        Assert.equal(r.code, 0);
        Assert.ok(r.out.includes('&:'), 'the grammar card omits `&:`');
        Assert.ok(r.out.includes('TEMPLATE'), 'the card does not name it');
    });
    (0, node_test_1.test)('help-tasks-bridges-the-callers-vocabulary', () => {
        const r = run(['help', 'tasks']);
        Assert.equal(r.code, 0);
        // The word the caller arrives with. It occurs nowhere in the tool
        // help, which is the measurement that opened G11.
        for (const want of ['ontology', 'aontu vet', '&:']) {
            Assert.ok(r.out.includes(want), `help tasks omits ${want}`);
        }
    });
    (0, node_test_1.test)('help-index-lists-every-topic', () => {
        const r = run(['help']);
        Assert.equal(r.code, 0);
        for (const topic of helpdoc_1.HELPDOC) {
            Assert.ok(r.out.includes(topic.topic), `the index omits ${topic.topic}`);
            Assert.ok(r.out.includes(topic.summary), `no summary for ${topic.topic}`);
        }
    });
    (0, node_test_1.test)('help-index-json', () => {
        const r = run(['help', '--format', 'json']);
        Assert.equal(r.code, 0);
        const report = JSON.parse(r.out);
        Assert.equal(report.aontu.verb, 'help');
        Assert.equal(report.topics.length, helpdoc_1.HELPDOC.length);
        Assert.deepEqual(Object.keys(report.topics[0]).sort(), ['source', 'summary', 'topic']);
    });
    (0, node_test_1.test)('help-topic-json-carries-the-text', () => {
        const r = run(['help', 'language', '--format', 'json']);
        Assert.equal(r.code, 0);
        const report = JSON.parse(r.out);
        Assert.equal(report.topic, 'language');
        Assert.ok(report.text.includes('&:'));
    });
    // AN UNKNOWN TOPIC NAMES THE ALTERNATIVES. The caller who typed it
    // has no other way to find out what exists.
    (0, node_test_1.test)('help-unknown-topic-lists-the-topics', () => {
        const r = run(['help', 'langauge']);
        Assert.equal(r.code, 2);
        Assert.equal(r.out, '', 'a refusal wrote to stdout');
        for (const want of ['langauge', 'language', 'examples']) {
            Assert.ok(r.err.includes(want), `the refusal omits ${want}`);
        }
    });
    (0, node_test_1.test)('help-usage-refusals', () => {
        for (const [args, want] of [
            [['help', 'a', 'b'], 'one topic'],
            [['help', '--format', 'xml'], 'text or json'],
            [['help', '--format'], 'text or json'],
            [['help', '--bogus'], 'unknown help option'],
        ]) {
            const r = run(args);
            Assert.equal(r.code, 2, args.join(' '));
            Assert.ok(r.err.includes(want), `${args.join(' ')}: ${r.err}`);
        }
    });
    (0, node_test_1.test)('help-verb-takes-the-tool-help', () => {
        const r = run(['help', '--help']);
        Assert.equal(r.code, 0);
        Assert.ok(r.out.startsWith('Usage: aontu'));
    });
    // --- G11 phase 3: explain ---
    // EVERY REGISTERED CODE RESOLVES. This is the property that makes
    // the verb usable from a report: a caller reading `[aontu/x]` out of
    // a finding can always ask what it means. The registry is read from
    // the shared TSV rather than the engine table, so the test can fail
    // when the two disagree instead of agreeing with itself.
    (0, node_test_1.test)('explain-answers-for-every-registered-code', () => {
        const codes = readRepo('test/spec/errcodes.tsv')
            .split('\n')
            .filter((line) => '' !== line.trim() && !line.startsWith('#'))
            .map((line) => line.split('\t')[0]);
        Assert.ok(100 < codes.length, `the registry looks unread: ${codes.length}`);
        for (const code of codes) {
            Assert.equal((0, cli_1.runExplain)([code]), 0, `explain ${code} refused`);
            Assert.ok(null != hints_1.codeClasses[code], `${code} has no class`);
        }
    });
    (0, node_test_1.test)('explain-list-is-the-registry', () => {
        const r = run(['explain', '--list']);
        Assert.equal(r.code, 0);
        const listed = r.out.trim().split('\n').map((line) => line.split(/\s+/)[0]);
        Assert.deepEqual(listed.length, Object.keys(hints_1.codeClasses).length, 'the list is not the registry');
        for (const code of Object.keys(hints_1.codeClasses)) {
            Assert.ok(listed.includes(code), `--list omits ${code}`);
        }
    });
    // A registered code carrying no explanation text SAYS SO rather than
    // printing an empty block. Before this verb the gap was invisible,
    // because a hint is only ever met beside the error that raises it.
    (0, node_test_1.test)('explain-marks-the-codes-with-no-text', () => {
        const r = run(['explain', '--list']);
        Assert.equal(r.code, 0);
        const bare = r.out.trim().split('\n')
            .filter((line) => line.includes('(no text)'))
            .map((line) => line.split(/\s+/)[0]);
        Assert.ok(0 < bare.length, 'no code is marked as carrying no text; has the table become' +
            ' complete? then this test should assert that instead');
        for (const code of bare) {
            Assert.ok(null == hints_1.hints[code], `${code} is marked bare but has a hint`);
        }
        const one = run(['explain', bare[0]]);
        Assert.equal(one.code, 0);
        Assert.ok(one.out.includes('no explanation text is registered'));
    });
    (0, node_test_1.test)('explain-json', () => {
        const r = run(['explain', '--format', 'json', 'no_scalar_unify']);
        Assert.equal(r.code, 0);
        const report = JSON.parse(r.out);
        Assert.equal(report.code, 'no_scalar_unify');
        Assert.equal(report.class, 'conflict');
        Assert.ok(0 < report.hint.length);
    });
    (0, node_test_1.test)('explain-list-json-flags-what-is-explained', () => {
        const r = run(['explain', '--list', '--format', 'json']);
        Assert.equal(r.code, 0);
        const rows = JSON.parse(r.out).codes;
        Assert.equal(rows.length, Object.keys(hints_1.codeClasses).length);
        Assert.ok(rows.some((row) => true === row.explained));
        Assert.ok(rows.some((row) => false === row.explained));
    });
    // A DYNAMIC CODE IS REGISTERED THROUGH ITS PREFIX and carries the
    // prefix's hint: the suffix names the operator, the explanation is
    // the prefix's.
    (0, node_test_1.test)('explain-resolves-a-dynamic-code', () => {
        for (const code of ['func:upper', 'op[+]', 'var[x', 'ref[y']) {
            const r = run(['explain', code]);
            Assert.equal(r.code, 0, `${code}: ${r.err}`);
            Assert.ok(r.out.includes(`code:  ${code}`));
        }
    });
    (0, node_test_1.test)('explain-unknown-code-suggests-a-near-match', () => {
        const r = run(['explain', 'no_scalar_unif']);
        Assert.equal(r.code, 2);
        Assert.equal(r.out, '', 'a refusal wrote to stdout');
        for (const want of [
            'no such error code', 'did you mean `no_scalar_unify`', '--list',
        ]) {
            Assert.ok(r.err.includes(want), `the refusal omits ${want}: ${r.err}`);
        }
    });
    // The other arm of the suggestion: a code nothing is near gets the
    // refusal with no `did you mean`, because naming an unrelated code
    // with confidence is worse than naming none.
    (0, node_test_1.test)('explain-unknown-code-with-no-near-match-suggests-nothing', () => {
        const r = run(['explain', 'zzzzzzzzzzzzzzzzzzzz']);
        Assert.equal(r.code, 2);
        Assert.ok(r.err.includes('no such error code'));
        Assert.ok(!r.err.includes('did you mean'), r.err);
    });
    (0, node_test_1.test)('explain-usage-refusals', () => {
        for (const [args, want] of [
            [['explain'], 'needs one code'],
            [['explain', 'a', 'b'], 'needs one code'],
            [['explain', '--list', 'x'], 'takes no code'],
            [['explain', '--format', 'xml'], 'text or json'],
            [['explain', '--bogus'], 'unknown explain option'],
        ]) {
            const r = run(args);
            Assert.equal(r.code, 2, args.join(' '));
            Assert.ok(r.err.includes(want), `${args.join(' ')}: ${r.err}`);
        }
    });
    (0, node_test_1.test)('explain-verb-takes-the-tool-help', () => {
        const r = run(['explain', '--help']);
        Assert.equal(r.code, 0);
        Assert.ok(r.out.startsWith('Usage: aontu'));
    });
    // The in-process entries, so the exported surface is exercised as a
    // library call and not only through the packaged binary.
    (0, node_test_1.test)('help-and-explain-are-callable-in-process', () => {
        Assert.equal((0, cli_1.runHelp)([]), 0);
        Assert.equal((0, cli_1.runHelp)(['language']), 0);
        Assert.equal((0, cli_1.runHelp)(['nope']), 2);
        Assert.equal((0, cli_1.runExplain)(['--list']), 0);
        Assert.equal((0, cli_1.runExplain)(['nope']), 2);
    });
    // --- G11 phase 2: the one-argument mistyped-verb hint ---
    // `aontu help` used to answer `cannot read help: open help: no such
    // file or directory` and exit 1 -- the bare word read as a file name,
    // with the good hint gated behind a SECOND argument.
    (0, node_test_1.test)('bare-word-is-diagnosed-as-a-mistyped-verb', () => {
        for (const [arg, near] of [
            ['vett', 'vet'], ['gett', 'get'], ['explian', 'explain'],
            ['relation', 'relations'], ['hepl', 'help'],
        ]) {
            const r = run([arg]);
            Assert.equal(r.code, 2, arg);
            Assert.ok(r.err.includes('not a verb this port knows'), arg);
            Assert.ok(r.err.includes(`did you mean \`aontu ${near}\``), `${arg}: ${r.err}`);
        }
    });
    (0, node_test_1.test)('bare-word-with-no-near-verb-suggests-nothing', () => {
        const r = run(['ontology']);
        Assert.equal(r.code, 2);
        Assert.ok(r.err.includes('not a verb this port knows'));
        Assert.ok(!r.err.includes('did you mean'), `suggested something unrelated: ${r.err}`);
    });
    // THE ESCAPE HATCH THE SUBCOMMAND DISPATCH ALREADY DOCUMENTS. A
    // path-shaped argument was meant as a path and keeps the file
    // diagnosis and its exit 1.
    (0, node_test_1.test)('path-shaped-argument-keeps-the-file-diagnosis', () => {
        for (const arg of ['./help', 'help.aon', '/tmp/aontu-no-such', 'sub/help']) {
            const r = run([arg]);
            Assert.equal(r.code, 1, arg);
            Assert.ok(r.err.includes(`cannot read ${arg}`), `${arg}: ${r.err}`);
        }
    });
    (0, node_test_1.test)('looks-like-verb', () => {
        for (const arg of ['help', 'vet', 'a']) {
            Assert.equal((0, cli_1.looksLikeVerb)(arg), true, arg);
        }
        for (const arg of [
            '', './help', 'help.aon', '/tmp/help', 'sub/help', 'a\\b', '-x',
        ]) {
            Assert.equal((0, cli_1.looksLikeVerb)(arg), false, arg);
        }
    });
    (0, node_test_1.test)('nearest-verb-respects-the-cap', () => {
        Assert.equal((0, cli_1.nearestVerb)('vett', ['vet', 'view', 'why']), 'vet');
        Assert.equal((0, cli_1.nearestVerb)('qqqqqqqqqq', ['vet', 'view', 'why']), '');
        // A TIE RESOLVES BY CODE-POINT ORDER in both ports, not by the
        // order the verb table happens to be written in: `xet` is one edit
        // from both `get` and `vet`, and `get` sorts first.
        Assert.equal((0, cli_1.nearestVerb)('xet', ['vet', 'get']), 'get');
    });
    // KNOWN_VERBS feeds the suggestion, and is a SEPARATE list from the
    // if-chain in main() because the chain's arms have three shapes.
    // This is what stops the two drifting.
    (0, node_test_1.test)('known-verbs-all-dispatch', () => {
        for (const verb of cli_1.KNOWN_VERBS) {
            const r = run([verb, '--help']);
            Assert.ok(!r.err.includes('not a verb this port knows'), `${verb} is in KNOWN_VERBS but main() does not dispatch it`);
            Assert.equal(r.code, 0, `${verb} --help: ${r.err}`);
        }
    });
    // AND THE OTHER DIRECTION, which is the one that actually drifts: a
    // verb added to the dispatch and not to the list is invisible until
    // somebody mistypes it and gets no suggestion. #187 added `allow`
    // while this branch was open and that is exactly what would have
    // happened. Read from the source, because a dispatch arm is not
    // enumerable at run time.
    (0, node_test_1.test)('every-dispatched-verb-is-in-known-verbs', () => {
        const src = readRepo('ts/src/cli.ts');
        const dispatched = new Set();
        for (const m of src.matchAll(/if \('([a-z]+)' === argv\[2\]\)/g)) {
            dispatched.add(m[1]);
        }
        Assert.ok(15 < dispatched.size, `only ${dispatched.size} dispatch arms found; has main() changed shape?`);
        for (const verb of dispatched) {
            Assert.ok(cli_1.KNOWN_VERBS.includes(verb), `main() dispatches \`${verb}\` and KNOWN_VERBS omits it, so a ` +
                'caller who mistypes it gets no suggestion');
        }
    });
    // THE TWO PORTS' TOOL HELP IS ONE TEXT, EXCEPT WHERE A VERB EXISTS IN
    // ONLY ONE OF THEM. It was byte-identical before G11 and nothing
    // asserted it, so a verb documented in one port and not the other
    // shipped silently -- which is exactly what happened while this
    // branch was open: #187 added `allow` to the TypeScript CLI and
    // touched no Go file, and the first version of this case (byte
    // identity) caught it on the first merge.
    //
    // Byte identity is the WRONG invariant, though, because that
    // divergence is real: `allow` is not in the Go port yet, and Go's
    // help should not document a verb that port does not have. (`mcp`
    // differs: Go carries a stub verb for it, so Go's help documents it
    // and says it is part of the npm build.)
    //
    // So the invariant is two-sided. Go's help must be a SUBSEQUENCE of
    // TypeScript's -- Go may never carry a line TypeScript lacks -- and
    // every run of TypeScript-only lines must sit in a block that names
    // a DECLARED port-only verb. An undeclared drift in the shared text
    // still fails, which is the whole point of the gate; a tracked
    // divergence does not.
    const TS_ONLY_VERBS = [
        // ADR-001 keeps the ports at parity; until `allow` is ported, the
        // Go help documents no verb the Go binary refuses. Remove this
        // entry in the commit that lands `allow` in Go.
        'allow',
    ];
    function helpTextOf(file, decl) {
        const src = readRepo(file);
        const at = src.indexOf(decl);
        Assert.ok(-1 !== at, `${file} no longer declares ${decl}`);
        const body = src.slice(at + decl.length);
        return body.slice(0, body.indexOf('`')).split('\n');
    }
    (0, node_test_1.test)('the-tool-help-agrees-except-for-declared-port-only-verbs', () => {
        const goLines = helpTextOf('go/cmd/aontu/main.go', 'const helpText = `');
        const tsLines = helpTextOf('ts/src/cli.ts', 'const HELP = `');
        // Walk Go's lines through TypeScript's in order. Every unmatched
        // TypeScript line joins the current extra-run; a Go line that
        // never matches is a drift TypeScript does not carry.
        let ti = 0;
        let run = [];
        const extras = [];
        for (const goLine of goLines) {
            const from = ti;
            while (ti < tsLines.length && tsLines[ti] !== goLine) {
                run.push(tsLines[ti]);
                ti++;
            }
            Assert.ok(ti < tsLines.length, 'go/cmd/aontu/main.go helpText carries a line ts/src/cli.ts HELP ' +
                `does not, at or after Go line ${from}: ${JSON.stringify(goLine)}`);
            if (0 < run.length) {
                extras.push(run);
                run = [];
            }
            ti++;
        }
        if (ti < tsLines.length) {
            extras.push(tsLines.slice(ti));
        }
        for (const block of extras) {
            const text = block.join('\n');
            Assert.ok(TS_ONLY_VERBS.some((v) => text.includes(v)), 'ts/src/cli.ts HELP carries a block go/cmd/aontu/main.go helpText ' +
                'does not, naming no declared port-only verb -- the two texts ' +
                `have drifted:\n${text}`);
        }
    });
    (0, node_test_1.test)('the-tool-help-advertises-the-language-door', () => {
        const ts = readRepo('ts/src/cli.ts');
        const help = ts.slice(ts.indexOf('const HELP = `') + 14);
        const text = help.slice(0, help.indexOf('`'));
        for (const want of [
            'aontu help [topic]', 'aontu explain <code>',
            'NEW TO THE LANGUAGE?', '&: inside a map is',
        ]) {
            Assert.ok(text.includes(want), `the tool help omits ${want}`);
        }
    });
});
//# sourceMappingURL=helpdoc.test.js.map