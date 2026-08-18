"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalSource = evalSource;
exports.main = main;
exports.runVet = runVet;
// Command-line interface for Aontu.
//
//   aontu [options] [file]
//
// With a file argument, the file is evaluated and the result printed.
// With no file on an interactive terminal, a REPL is started. With no
// file and piped input, the source is read from stdin. See HELP below.
// Named imports, not `import * as`: the namespace form makes tsc emit the
// __importStar downlevel helper, whose branches no supported Node takes.
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_readline_1 = require("node:readline");
const aontu_1 = require("./aontu");
const vet_1 = require("./vet");
const HELP = `Usage: aontu [options] [file]
       aontu vet [options] <schema> <data> [more-data...]

Evaluate an Aontu source file and print the result as JSON.
With no file on an interactive terminal, start a REPL.
With no file and piped input, read the source from stdin.

The vet verb validates data documents against a schema document and
reports what does not hold, as text or as a machine-readable object.

Options:
  -c, --canon     Print the canonical form instead of generated JSON
  -h, --help      Show this help and exit
  -v, --version   Print the version and exit

Vet options:
  --at <path>       Validate against this path of the schema ($.a.b)
  --closed          Refuse keys the anchor does not declare
  --partial         Residue is reported but does not fail the run
  --max-errors <n>  Cap the finding list (default 20)
  --format <f>      text (default) or json

Vet exit codes:
  0  valid       data unifies, and is concrete (or --partial)
  1  invalid     at least one contradiction
  2  usage       bad option, or a file that cannot be read
  3  incomplete  no contradiction, but the truth is not yet satisfied
  4  error       the schema is unusable on its own

REPL commands:
  :help           Show REPL help
  :canon          Switch to canonical-form output
  :json           Switch to JSON output
  :quit, :exit    Exit the REPL (or press Ctrl-D)
`;
function version() {
    try {
        const txt = (0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, '..', 'package.json'), 'utf8');
        return JSON.parse(txt).version ?? '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
// Evaluate source, returning either the rendered output or the error
// message. Never throws.
function evalSource(aontu, src, mode) {
    try {
        // exactJSON, not JSON.stringify: a document using the `0d` exact
        // leaves generates bigints and Decimals, which JSON.stringify cannot
        // write (D9). The CLI prints INDENTED JSON and the shared suite's
        // `gens` mode prints COMPACT JSON, but both go through this one
        // emitter -- an indent argument rather than a second implementation,
        // so the two cannot drift from each other or from the Go port.
        const text = 'canon' === mode
            ? aontu.unify(src).canon
            : (0, aontu_1.exactJSON)(aontu.generate(src), 2);
        return { ok: true, text };
    }
    catch (err) {
        const msg = (err instanceof aontu_1.AontuError || true === err?.aontu)
            ? err.message
            : String(err?.message ?? err);
        return { ok: false, text: msg };
    }
}
function runFile(file, mode) {
    let src;
    try {
        src = (0, node_fs_1.readFileSync)(file, 'utf8');
    }
    catch (err) {
        process.stderr.write(`aontu: cannot read ${file}: ${err.message}\n`);
        return 1;
    }
    const aontu = new aontu_1.Aontu({ path: (0, node_path_1.resolve)(file) });
    const res = evalSource(aontu, src, mode);
    (res.ok ? process.stdout : process.stderr).write(res.text + '\n');
    return res.ok ? 0 : 1;
}
function runStdin(mode) {
    return new Promise((resolve) => {
        let src = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (d) => (src += d));
        process.stdin.on('end', () => {
            const res = evalSource(new aontu_1.Aontu(), src, mode);
            (res.ok ? process.stdout : process.stderr).write(res.text + '\n');
            resolve(res.ok ? 0 : 1);
        });
    });
}
function runRepl(initialMode) {
    let mode = initialMode;
    const aontu = new aontu_1.Aontu();
    const rl = (0, node_readline_1.createInterface)({
        input: process.stdin,
        output: process.stdout,
        prompt: 'aontu> ',
    });
    process.stdout.write(`Aontu v${version()} REPL — :help for commands, :quit to exit\n`);
    rl.prompt();
    rl.on('line', (line) => {
        const s = line.trim();
        if ('' === s) {
            rl.prompt();
            return;
        }
        if (s.startsWith(':')) {
            switch (s) {
                case ':help':
                    process.stdout.write(HELP);
                    break;
                case ':canon':
                    mode = 'canon';
                    process.stdout.write('canon output\n');
                    break;
                case ':json':
                    mode = 'json';
                    process.stdout.write('json output\n');
                    break;
                case ':quit':
                case ':exit':
                    rl.close();
                    return;
                default: process.stdout.write(`unknown command: ${s} (try :help)\n`);
            }
            rl.prompt();
            return;
        }
        const res = evalSource(aontu, s, mode);
        process.stdout.write(res.text + '\n');
        rl.prompt();
    });
    rl.on('close', () => {
        process.stdout.write('\n');
        // Same reason as finish(): the REPL requires a TTY stdin, but stdout
        // can still be a pipe (`aontu | cat`), so exiting outright could
        // discard queued output here too.
        process.exitCode = 0;
    });
}
// THE VET VERB (G2 phase 3).
//
// Exit codes are VERDICT CLASSES, not a pass/fail bit: an agent loop
// branches on "the data contradicts the truth" (1) differently from
// "the data has not supplied everything the truth requires" (3), and
// differently again from "the schema itself is broken" (4), which is
// never the data's fault. 2 stays what it already was for this CLI --
// the caller got the invocation wrong -- which is why an unreadable
// file is a 2 rather than a 4.
const VET_EXIT = {
    valid: 0,
    invalid: 1,
    incomplete: 3,
    error: 4,
};
const VET_HELP = 'aontu vet <schema> <data> [more-data...] (try --help)';
// Parse the verb's argv tail. Returns the error text instead of
// throwing, so the caller owns the exit code.
function parseVetArgs(argv) {
    const files = [];
    let format = 'text';
    let at;
    let closed = false;
    let partial = false;
    let maxErrors;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        // `-h`/`--help` before anything else, INCLUDING the file count:
        // the usage errors below all end with "(try --help)", and a verb
        // that then refused --help as an unknown option was sending the
        // reader in a circle.
        if ('-h' === arg || '--help' === arg) {
            return { args: { help: true, schema: '', data: [], format } };
        }
        if ('--at' === arg) {
            at = argv[++i];
            if (null == at) {
                return { err: 'aontu: --at needs a path' };
            }
        }
        else if ('--format' === arg) {
            const f = argv[++i];
            if ('text' !== f && 'json' !== f) {
                return { err: `aontu: --format needs text or json` };
            }
            format = f;
        }
        else if ('--max-errors' === arg) {
            // ONE GRAMMAR, spelled the same way in both ports: decimal
            // digits, one to nine of them, at least 1. `Number()` alone
            // accepted `1.0`, `1e2`, `0x10` and ` 3`, which Go's parser
            // refuses -- so the same documented invocation meant different
            // things in the two shipped commands. The nine-digit ceiling is
            // where the ports would part company again: beyond it Go's
            // integer conversion saturates, and a cap nobody can reach is
            // not worth a divergence.
            const raw = argv[++i];
            if (!/^[0-9]{1,9}$/.test(raw ?? '') || 1 > Number(raw)) {
                return { err: 'aontu: --max-errors needs a positive whole number' };
            }
            maxErrors = Number(raw);
        }
        else if ('--closed' === arg) {
            closed = true;
        }
        else if ('--partial' === arg) {
            partial = true;
        }
        else if (arg.startsWith('-')) {
            return { err: `aontu: unknown vet option ${arg} (try --help)` };
        }
        else {
            files.push(arg);
        }
    }
    if (files.length < 2) {
        return { err: `aontu: vet needs a schema and at least one data file\n${VET_HELP}` };
    }
    return {
        args: {
            schema: files[0],
            data: files.slice(1),
            format,
            at,
            closed,
            partial,
            maxErrors,
        },
    };
}
// One line per site, so a finding reads as "what is wrong, where the
// data says it, and where the truth says otherwise". The data site
// comes first because it is the one to edit.
function renderFinding(f) {
    const out = [`${f.path}: ${f.code} [${f.class}]`];
    if ('' !== f.message) {
        out.push(`  ${f.message}`);
    }
    if (null != f.note) {
        out.push(`  note: ${f.note}`);
    }
    if (null != f.expected) {
        out.push(`  expected: ${f.expected}`);
    }
    if (null != f.actual) {
        out.push(`  actual:   ${f.actual}`);
    }
    for (const s of f.sites) {
        // Every site carries the canon of the value it stands for: that is
        // what makes the two sides of a conflict readable side by side. A
        // site's file is always a string -- empty when the value belongs to
        // neither document -- so there is nothing to coalesce here.
        out.push(`  ${s.role}: ${s.file}:${s.row}:${s.col} (${s.value})`);
    }
    return out.join('\n');
}
function renderVetText(report) {
    const head = `verdict: ${report.verdict}` +
        (report.truncated ? ' (findings truncated)' : '');
    if (0 === report.findings.length) {
        return head;
    }
    return [head, ''].concat(report.findings.map(renderFinding)).join('\n');
}
// The machine-readable form. `aontu` names the producer, so a report
// read from a file or a pipe says which version and which verb made it
// without the consumer having to know.
function renderVetJson(report) {
    return (0, aontu_1.exactJSON)({
        aontu: { version: version(), verb: 'vet' },
        verdict: report.verdict,
        truncated: report.truncated,
        findings: report.findings,
    }, 2);
}
// The worst verdict wins across data files: a run that is invalid
// anywhere is invalid, and a schema that cannot stand up makes every
// file's verdict moot.
const VET_RANK = {
    valid: 0,
    incomplete: 1,
    invalid: 2,
    error: 3,
};
function runVet(argv) {
    const parsed = parseVetArgs(argv);
    if (null != parsed.err) {
        process.stderr.write(parsed.err + '\n');
        return 2;
    }
    const args = parsed.args;
    if (true === args.help) {
        process.stdout.write(HELP);
        return 0;
    }
    let schemaSrc;
    const sources = [];
    try {
        schemaSrc = (0, node_fs_1.readFileSync)(args.schema, 'utf8');
        for (const file of args.data) {
            sources.push({ file, src: (0, node_fs_1.readFileSync)(file, 'utf8') });
        }
    }
    catch (err) {
        process.stderr.write(`aontu: cannot read ${err.path}: ${err.message}\n`);
        return 2;
    }
    // Each data file is vetted on its own, because a parsed tree is
    // single-use (docs/reference-api.md) -- and because two data files
    // are two candidates for the same truth, not one merged candidate.
    let verdict = 'valid';
    let truncated = false;
    const findings = [];
    for (const source of sources) {
        const report = (0, aontu_1.vet)(schemaSrc, source.src, {
            at: args.at,
            closed: args.closed,
            partial: args.partial,
            maxErrors: args.maxErrors,
            schemaUrl: args.schema,
            dataUrl: source.file,
            // The paths as well as the labels: a relative `@"file"` load
            // inside either document resolves from ITS OWN directory, the
            // way `aontu <file>` already resolves one (runFile above). The
            // path is passed AS TYPED, not resolved: it doubles as the
            // label above, and a report that mixed the typed path with an
            // absolute one would name the same file two ways.
            schemaPath: args.schema,
            dataPath: source.file,
        });
        if (VET_RANK[verdict] < VET_RANK[report.verdict]) {
            verdict = report.verdict;
        }
        truncated = truncated || report.truncated;
        findings.push(...report.findings);
    }
    // The cap is on the REPORT, not on each file. Capping every file's
    // list and then concatenating them let `--max-errors 1` emit one
    // finding PER FILE -- and leave `truncated` false while doing it,
    // because no single file had been cut. The engine still caps each
    // run, so a pathological file cannot flood the aggregate before it
    // gets here; this is the second, honest cut.
    const cap = args.maxErrors ?? vet_1.VET_MAX_ERRORS;
    const kept = cap < findings.length ? findings.slice(0, cap) : findings;
    const report = {
        verdict,
        truncated: truncated || cap < findings.length,
        findings: kept,
    };
    const text = 'json' === args.format
        ? renderVetJson(report) : renderVetText(report);
    process.stdout.write(text + '\n');
    return VET_EXIT[verdict];
}
// Exit without truncating output.
//
// process.exit() terminates immediately, discarding anything still
// queued on stdout. A write to a PIPE is asynchronous once it exceeds
// the pipe buffer, so `write(big); exit(0)` silently truncated output at
// 65536 bytes — while a write to a TTY or a file, being synchronous,
// looked fine. Setting exitCode instead lets the process end naturally,
// after the queue drains.
//
// This predates the exact leaves but they make it trivially reachable
// (one long biginteger canon exceeds the buffer), and it lands squarely
// on the parity-probe discipline in AGENTS.md, which derives expected
// spec values by piping BOTH CLIs and comparing. A truncated pipe there
// reads as a port divergence.
function finish(code) {
    process.exitCode = code;
}
function main(argv) {
    let mode = 'json';
    let file;
    // Subcommand dispatch, and deliberately only for a FIRST argument:
    // `aontu vet` is the verb, while `aontu somefile vet` keeps meaning
    // what it always did. A file named `vet` is still reachable as
    // `aontu ./vet`.
    if ('vet' === argv[2]) {
        return finish(runVet(argv.slice(3)));
    }
    for (const arg of argv.slice(2)) {
        if ('-c' === arg || '--canon' === arg) {
            mode = 'canon';
        }
        else if ('-h' === arg || '--help' === arg) {
            process.stdout.write(HELP);
            return finish(0);
        }
        else if ('-v' === arg || '--version' === arg) {
            process.stdout.write(version() + '\n');
            return finish(0);
        }
        else if (arg.startsWith('-')) {
            process.stderr.write(`aontu: unknown option ${arg} (try --help)\n`);
            return finish(2);
        }
        else {
            file = arg;
        }
    }
    if (null != file) {
        finish(runFile(file, mode));
    }
    else if (process.stdin.isTTY) {
        runRepl(mode);
    }
    else {
        runStdin(mode).then((code) => finish(code));
    }
} /* node:coverage ignore next 8 */
//# sourceMappingURL=cli.js.map