/* Copyright (c) 2025 Richard Rodger, MIT License */

// ADR-002 gate: read an lcov report of ts/src and fail unless every
// line, branch and function is covered.
//
//   node test/covcheck.js [lcov.info]
//
// Why lcov and not the runner's own summary table: Node's built-in
// coverage reporter attributes the re-export accessors tsc emits for
// `export { X }` (six of them in src/aontu.ts) to the import lines, and
// then counts one of them unhit even when V8 recorded a call. The lcov
// reporter and the raw NODE_V8_COVERAGE data agree with each other, so
// this gate reads lcov. The summary table stays useful as a human
// report — it is just not the thing CI checks.
//
// bin/ is excluded deliberately: those two files are the packaging
// entry points, executed only by the spawned-binary tests in
// cli.test.ts, and a child process's coverage is not always flushed
// before the parent aggregates. Their content (one require + one call)
// is covered in-process through the exported main().

const Fs = require('node:fs')
const Path = require('node:path')


function parseLcov(text) {
  const files = []
  let cur = null

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('SF:')) {
      cur = {
        file: line.slice(3),
        lines: new Map(),
        branches: [],
        fns: new Map(),
        fnhits: new Map(),
      }
      files.push(cur)
    }
    else if (null == cur) {
      continue
    }
    else if (line.startsWith('DA:')) {
      const [ln, count] = line.slice(3).split(',')
      cur.lines.set(+ln, +count)
    }
    else if (line.startsWith('BRDA:')) {
      const p = line.slice(5).split(',')
      cur.branches.push({ line: +p[0], taken: p[3] })
    }
    else if (line.startsWith('FN:')) {
      const ix = line.indexOf(',')
      cur.fns.set(line.slice(ix + 1), +line.slice(3, ix))
    }
    else if (line.startsWith('FNDA:')) {
      const ix = line.indexOf(',')
      cur.fnhits.set(line.slice(ix + 1), +line.slice(5, ix))
    }
  }

  return files
}


function check(files) {
  const gaps = []
  const total = { lines: [0, 0], branches: [0, 0], fns: [0, 0] }

  for (const f of files) {
    if (!f.file.startsWith('src/')) continue

    for (const [ln, count] of f.lines) {
      total.lines[1]++
      if (0 < count) total.lines[0]++
      else gaps.push(`${f.file}:${ln} line never executed`)
    }

    for (const b of f.branches) {
      total.branches[1]++
      if ('0' !== b.taken && '-' !== b.taken) total.branches[0]++
      else gaps.push(`${f.file}:${b.line} branch arm never taken`)
    }

    for (const [name, ln] of f.fns) {
      total.fns[1]++
      if (0 < (f.fnhits.get(name) ?? 0)) total.fns[0]++
      else gaps.push(`${f.file}:${ln} function ${name} never called`)
    }
  }

  return { gaps, total }
}


function pct(hit, all) {
  return 0 === all ? '100.00' : (100 * hit / all).toFixed(2)
}


function main() {
  const path = process.argv[2] ?? Path.join(__dirname, '..', 'coverage', 'lcov.info')

  if (!Fs.existsSync(path)) {
    process.stderr.write(`covcheck: no lcov report at ${path}\n`)
    process.exitCode = 2
    return
  }

  const { gaps, total } = check(parseLcov(Fs.readFileSync(path, 'utf8')))

  process.stdout.write(
    `ts/src coverage: lines ${pct(...total.lines)}% (${total.lines[0]}/${total.lines[1]}), ` +
    `branches ${pct(...total.branches)}% (${total.branches[0]}/${total.branches[1]}), ` +
    `functions ${pct(...total.fns)}% (${total.fns[0]}/${total.fns[1]})\n`)

  if (0 === gaps.length) {
    process.stdout.write('covcheck: 100% (ADR-002)\n')
    return
  }

  process.stderr.write(`\ncovcheck: ${gaps.length} uncovered item(s) — ADR-002 requires 100%:\n`)
  for (const g of gaps) {
    process.stderr.write('  ' + g + '\n')
  }
  process.stderr.write(
    '\nClose each with a shared spec row (preferred), a unit test, or — only\n' +
    'when genuinely unreachable — by removing the dead code. See ADR.md.\n')
  process.exitCode = 1
}


main()
