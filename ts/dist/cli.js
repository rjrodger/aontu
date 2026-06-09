#!/usr/bin/env node
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
exports.evalSource = evalSource;
exports.main = main;
// Command-line interface for Aontu.
//
//   aontu [options] [file]
//
// With a file argument, the file is evaluated and the result printed.
// With no file on an interactive terminal, a REPL is started. With no
// file and piped input, the source is read from stdin. See HELP below.
const Fs = __importStar(require("node:fs"));
const Path = __importStar(require("node:path"));
const Readline = __importStar(require("node:readline"));
const aontu_1 = require("./aontu");
const HELP = `Usage: aontu [options] [file]

Evaluate an Aontu source file and print the result as JSON.
With no file on an interactive terminal, start a REPL.
With no file and piped input, read the source from stdin.

Options:
  -c, --canon     Print the canonical form instead of generated JSON
  -h, --help      Show this help and exit
  -v, --version   Print the version and exit

REPL commands:
  :help           Show REPL help
  :canon          Switch to canonical-form output
  :json           Switch to JSON output
  :quit, :exit    Exit the REPL (or press Ctrl-D)
`;
function version() {
    try {
        const txt = Fs.readFileSync(Path.join(__dirname, '..', 'package.json'), 'utf8');
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
        const text = 'canon' === mode
            ? aontu.unify(src).canon
            : JSON.stringify(aontu.generate(src), null, 2);
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
        src = Fs.readFileSync(file, 'utf8');
    }
    catch (err) {
        process.stderr.write(`aontu: cannot read ${file}: ${err.message}\n`);
        return 1;
    }
    const aontu = new aontu_1.Aontu({ path: Path.resolve(file) });
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
    const rl = Readline.createInterface({
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
        process.exit(0);
    });
}
function main(argv) {
    let mode = 'json';
    let file;
    for (const arg of argv.slice(2)) {
        if ('-c' === arg || '--canon' === arg) {
            mode = 'canon';
        }
        else if ('-h' === arg || '--help' === arg) {
            process.stdout.write(HELP);
            process.exit(0);
        }
        else if ('-v' === arg || '--version' === arg) {
            process.stdout.write(version() + '\n');
            process.exit(0);
        }
        else if (arg.startsWith('-')) {
            process.stderr.write(`aontu: unknown option ${arg} (try --help)\n`);
            process.exit(2);
        }
        else {
            file = arg;
        }
    }
    if (null != file) {
        process.exit(runFile(file, mode));
    }
    else if (process.stdin.isTTY) {
        runRepl(mode);
    }
    else {
        runStdin(mode).then((code) => process.exit(code));
    }
}
// Only run when invoked as a program, not when imported (e.g. by tests).
if (require.main === module) {
    main(process.argv);
}
//# sourceMappingURL=cli.js.map