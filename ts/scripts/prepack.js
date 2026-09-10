/* Copyright (c) 2025 Richard Rodger, MIT License */


const Fs = require('node:fs')
const Path = require('node:path')

const REPO = 'https://github.com/aontu-lang/aontu/blob/main/'

// [file, from, to]. `file` is relative to the staged tree.
const REWRITES = [
  ['skill/grammar-card.md',
    '](../../grammar/aontu.abnf)',
    '](../grammar/aontu.abnf)'],
  ['skill/grammar-card.md',
    '](../../grammar/aontu.gbnf)',
    '](../grammar/aontu.gbnf)'],
  ['skill/error-codes.md',
    '](../../test/spec/errcodes.tsv)',
    '](' + REPO + 'test/spec/errcodes.tsv)'],
]

const TREES = [
  ['../grammar', 'grammar'],
  ['../docs/skill', 'skill'],
]

for (const [from, to] of TREES) {
  Fs.rmSync(to, { recursive: true, force: true })
  Fs.cpSync(from, to, { recursive: true })
}

for (const [file, from, to] of REWRITES) {
  const path = Path.join(__dirname, '..', file)
  const src = Fs.readFileSync(path, 'utf8')
  if (!src.includes(from)) {
    throw new Error(
      `prepack: ${file} no longer contains ${from} — the link moved or ` +
      'changed, and shipping it unrewritten would break it in the package')
  }
  Fs.writeFileSync(path, src.split(from).join(to))
}

// Nothing may still point above the package root.
for (const [, tree] of TREES) {
  for (const file of Fs.readdirSync(Path.join(__dirname, '..', tree))) {
    if (!file.endsWith('.md')) {
      continue
    }
    const path = Path.join(__dirname, '..', tree, file)
    const src = Fs.readFileSync(path, 'utf8')
    const escaped = src.match(/\]\(\.\.\/\.\.\/[^)]*\)/g)
    if (null != escaped) {
      throw new Error(
        `prepack: ${tree}/${file} links outside the package: ` +
        escaped.join(', '))
    }
  }
}

process.stdout.write('prepack: staged grammar/ and skill/, links rewritten\n')
