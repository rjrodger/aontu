
const Fs = require('node:fs')
const Path = require('node:path')

const REPO = Path.join(__dirname, '..', '..')

const DOC_PAGES = [
  'index.md',
  'tutorial.md',
  'tutorial-graph.md',
  'unification.md',
  'reference-language.md',
  'reference-api.md',
  'use-cases.md',
  'explanation.md',
  'trust.md',
  'lsp.md',
  'shared-spec.md',
  'test-coverage.md',
  'release-and-tag.md',
]

const READMES = ['README.md', 'ts/README.md']


function exists(rel) {
  return Fs.existsSync(Path.join(REPO, rel))
}


// Repo-relative, sorted within each group, and filtered to what is
// actually on disk so a renamed page fails as a missing gate rather
// than as a crash.
function gatedDocs() {
  const docs = DOC_PAGES.map((f) => `docs/${f}`)

  const howtoDir = Path.join(REPO, 'docs', 'how-to')
  const howto = Fs.existsSync(howtoDir)
    ? Fs.readdirSync(howtoDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .map((f) => `docs/how-to/${f}`)
    : []

  const ucDir = Path.join(REPO, 'use-cases')
  const cases = Fs.existsSync(ucDir)
    ? Fs.readdirSync(ucDir)
      .filter((d) => /^\d\d-/.test(d))
      .sort()
      .map((d) => `use-cases/${d}/README.md`)
    : []

  return [...docs, ...howto, ...cases, ...READMES].filter(exists)
}


module.exports = { gatedDocs, DOC_PAGES, READMES }

if (require.main === module) {
  process.stdout.write(gatedDocs().join('\n') + '\n')
}
