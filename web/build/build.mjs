
import { build } from 'esbuild'
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '..', '..')

const entry = join(repo, 'ts', 'dist', 'aontu.js')
const outfile = join(repo, 'web', 'aontu-bundle.js')

const shim = (name) => join(here, 'shims', name)

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: 'iife',
  globalName: 'AontuLib',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  keepNames: true,
  sourcemap: false,
  logLevel: 'info',
  alias: {
    'fs': shim('fs.cjs'),
    'node:fs': shim('fs.cjs'),
    'path': shim('path.cjs'),
    'node:path': shim('path.cjs'),
    'crypto': shim('crypto.cjs'),
    'node:crypto': shim('crypto.cjs'),
    'util': shim('util.cjs'),
    'node:util': shim('util.cjs'),
  },
  // Free `process` / `Buffer` references in the bundle resolve to the
  // exports of the injected file.
  inject: [shim('globals.mjs')],
  banner: {
    js: '/* aontu playground bundle -- built from ts/dist by web/build/build.mjs. Do not edit. */',
  },
})

const size = statSync(outfile).size
console.log('bundle: ' + outfile + ' (' + (size / 1024).toFixed(1) + ' KiB)')

// Inline the bundle into the page. The template carries a single
// placeholder line; everything else in the page is authored there.
const templatePath = join(repo, 'web', 'playground.template.html')
const pagePath = join(repo, 'web', 'playground.html')

const PLACEHOLDER = '/*__AONTU_BUNDLE__*/'
const template = readFileSync(templatePath, 'utf8')

if (!template.includes(PLACEHOLDER)) {
  console.error('playground.template.html is missing the ' + PLACEHOLDER + ' placeholder')
  process.exit(1)
}

const bundle = readFileSync(outfile, 'utf8')
  // Guard against the bundle text upsetting the HTML parser inside the
  // inline <script>. Both rewrites are value-neutral where they occur
  // (string/regex literals): `\/` is `/` and `\!` is `!`.
  .replace(/<\/script/gi, '<\\/script')
  .replace(/<!--/g, '<\\!--')

const page = template.replace(PLACEHOLDER, () => bundle)
writeFileSync(pagePath, page)

const pageSize = statSync(pagePath).size
console.log('page:   ' + pagePath + ' (' + (pageSize / 1024).toFixed(1) + ' KiB)')
