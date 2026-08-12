/* Copyright (c) 2025 Richard Rodger, MIT License */

// Command-line interface for Aontu.
//
//   aontu [options] [file]
//
// With a file argument, the file is evaluated and the result printed.
// With no file on an interactive terminal, a REPL is started. With no
// file and piped input, the source is read from stdin. See HELP below.

import * as Fs from 'node:fs'
import * as Path from 'node:path'
import * as Readline from 'node:readline'

import { Aontu, AontuError, exactJSON } from './aontu'


type Mode = 'json' | 'canon'


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
`


function version(): string {
  try {
    const txt = Fs.readFileSync(Path.join(__dirname, '..', 'package.json'), 'utf8')
    return JSON.parse(txt).version ?? '0.0.0'
  }
  catch {
    return '0.0.0'
  }
}


// Evaluate source, returning either the rendered output or the error
// message. Never throws.
function evalSource(
  aontu: Aontu,
  src: string,
  mode: Mode,
): { ok: boolean; text: string } {
  try {
    // exactJSON, not JSON.stringify: a document using the `0d` exact
    // leaves generates bigints and Decimals, which JSON.stringify cannot
    // write (D9). The CLI prints INDENTED JSON and the shared suite's
    // `gens` mode prints COMPACT JSON, but both go through this one
    // emitter -- an indent argument rather than a second implementation,
    // so the two cannot drift from each other or from the Go port.
    const text = 'canon' === mode
      ? aontu.unify(src).canon
      : exactJSON(aontu.generate(src), 2)
    return { ok: true, text }
  }
  catch (err: any) {
    const msg = (err instanceof AontuError || true === err?.aontu)
      ? err.message
      : String(err?.message ?? err)
    return { ok: false, text: msg }
  }
}


function runFile(file: string, mode: Mode): number {
  let src: string
  try {
    src = Fs.readFileSync(file, 'utf8')
  }
  catch (err: any) {
    process.stderr.write(`aontu: cannot read ${file}: ${err.message}\n`)
    return 1
  }

  const aontu = new Aontu({ path: Path.resolve(file) })
  const res = evalSource(aontu, src, mode)
  ;(res.ok ? process.stdout : process.stderr).write(res.text + '\n')
  return res.ok ? 0 : 1
}


function runStdin(mode: Mode): Promise<number> {
  return new Promise((resolve) => {
    let src = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (d) => (src += d))
    process.stdin.on('end', () => {
      const res = evalSource(new Aontu(), src, mode)
      ;(res.ok ? process.stdout : process.stderr).write(res.text + '\n')
      resolve(res.ok ? 0 : 1)
    })
  })
}


function runRepl(initialMode: Mode): void {
  let mode = initialMode
  const aontu = new Aontu()
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'aontu> ',
  })

  process.stdout.write(
    `Aontu v${version()} REPL — :help for commands, :quit to exit\n`)
  rl.prompt()

  rl.on('line', (line) => {
    const s = line.trim()

    if ('' === s) {
      rl.prompt()
      return
    }

    if (s.startsWith(':')) {
      switch (s) {
        case ':help': process.stdout.write(HELP); break
        case ':canon': mode = 'canon'; process.stdout.write('canon output\n'); break
        case ':json': mode = 'json'; process.stdout.write('json output\n'); break
        case ':quit': case ':exit': rl.close(); return
        default: process.stdout.write(`unknown command: ${s} (try :help)\n`)
      }
      rl.prompt()
      return
    }

    const res = evalSource(aontu, s, mode)
    process.stdout.write(res.text + '\n')
    rl.prompt()
  })

  rl.on('close', () => {
    process.stdout.write('\n')
    // Same reason as finish(): the REPL requires a TTY stdin, but stdout
    // can still be a pipe (`aontu | cat`), so exiting outright could
    // discard queued output here too.
    process.exitCode = 0
  })
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
function finish(code: number): void {
  process.exitCode = code
}


function main(argv: string[]): void {
  let mode: Mode = 'json'
  let file: string | undefined

  for (const arg of argv.slice(2)) {
    if ('-c' === arg || '--canon' === arg) {
      mode = 'canon'
    }
    else if ('-h' === arg || '--help' === arg) {
      process.stdout.write(HELP)
      return finish(0)
    }
    else if ('-v' === arg || '--version' === arg) {
      process.stdout.write(version() + '\n')
      return finish(0)
    }
    else if (arg.startsWith('-')) {
      process.stderr.write(`aontu: unknown option ${arg} (try --help)\n`)
      return finish(2)
    }
    else {
      file = arg
    }
  }

  if (null != file) {
    finish(runFile(file, mode))
  }
  else if (process.stdin.isTTY) {
    runRepl(mode)
  }
  else {
    runStdin(mode).then((code) => finish(code))
  }
} /* node:coverage ignore next 8 */


// No require.main guard here: bin/aontu.js is the executable entry and
// calls main(process.argv) itself, so this module stays import-only.


export { evalSource, main }
