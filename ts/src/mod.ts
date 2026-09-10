/* Copyright (c) 2025 Richard Rodger, MIT License */


import { join as pathJoin, dirname as pathDirname } from 'node:path'


export type ModuleRef = {
  // The module path WITHOUT the major: `corp.example/schemas/service`.
  path: string
  major: number
  // The inline canon-hash pin, if the import froze one.
  hash?: string
}


export type ModuleFs = {
  existsSync: (p: string) => boolean
  readFileSync: (p: string, enc: string) => string
}


const MODULE_RE =
  /^([a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+(?:\/[A-Za-z0-9._-]+)*)@(\d+)(?:#(aon1-[A-Za-z0-9_-]+))?$/


export function parseModuleRef(spec: string): ModuleRef | undefined {
  const m = MODULE_RE.exec(spec)
  if (null == m) {
    return undefined
  }
  return {
    path: m[1],
    major: +m[2],
    ...(null == m[3] ? {} : { hash: m[3] }),
  }
}


export const MODULE_MAX_PATH = 512
export const MODULE_MAX_ELEMS = 32


const RESERVED_ELEMS = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
])


export function validateModulePath(path: string): string | undefined {
  if (MODULE_MAX_PATH < path.length) {
    return 'longer than ' + MODULE_MAX_PATH + ' characters'
  }

  const elems = path.split('/')
  if (MODULE_MAX_ELEMS < elems.length) {
    return 'more than ' + MODULE_MAX_ELEMS + ' elements'
  }

  for (const elem of elems) {
    if ('' === elem) {
      return 'an element is empty'
    }
    if (elem.startsWith('.') || elem.endsWith('.')) {
      return 'an element begins or ends with "."'
    }
    if (RESERVED_ELEMS.has(elem.split('.')[0].toLowerCase())) {
      return 'an element is a reserved device name'
    }
  }

  return undefined
}


function escapeElem(elem: string): string {
  return elem.replace(/[A-Z]/g, (c) => '!' + c.toLowerCase())
}


export function moduleDir(store: string, ref: ModuleRef): string {
  return pathJoin(store, ...ref.path.split('/').map(escapeElem)) + '@' + ref.major
}


export function projectRoots(from: string, fs: ModuleFs): string[] {
  const roots: string[] = []
  let dir = from
  for (; ;) {
    if (fs.existsSync(pathJoin(dir, 'mod.aon'))) {
      roots.push(dir)
    }
    const up = pathDirname(dir)
    if (up === dir) {
      return 0 < roots.length ? roots : [from]
    }
    dir = up
  }
}


export function lockJson(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')
}


export function modCacheDir(): string | undefined {
  return modCacheDirFor(process.platform, process.env)
}


export function modCacheDirFor(
  platform: string,
  env: Record<string, string | undefined>,
): string | undefined {
  const xdg = env.XDG_CACHE_HOME
  if ('string' === typeof xdg && '' !== xdg) {
    return pathJoin(xdg, 'aontu', 'mod')
  }
  const home = env.HOME
  if ('string' === typeof home && '' !== home) {
    return pathJoin(home, '.cache', 'aontu', 'mod')
  }
  if ('win32' === platform) {
    const local = env.LOCALAPPDATA
    if ('string' === typeof local && '' !== local) {
      return pathJoin(local, 'aontu', 'mod')
    }
  }
  return undefined
}


export function lockHash(root: string, ref: ModuleRef, fs: ModuleFs):
  string | undefined {
  const file = pathJoin(root, 'aontu_meta', 'mod-lock.aon')
  if (!fs.existsSync(file)) {
    return undefined
  }

  let lock: any
  try {
    lock = JSON.parse(lockJson(fs.readFileSync(file, 'utf8')))
  }
  catch {
    return undefined
  }

  const entry = lock?.lock?.[ref.path + '@' + ref.major]
  return 'string' === typeof entry?.canon ? entry.canon : undefined
}


export type ModuleEval =
  (src: string, path: string) => { gen: any, hash: string }


export const MODULE_MAX_DEPTH = 16


export type ModuleOptions = {
  // The content-addressed user cache, keyed by canon-hash. Consulted
  // only when the expected hash is known, which is what "content
  // addressed" means: without a pin there is no address.
  cache?: string
  eval: ModuleEval
  // How many module verifications deep this evaluation already is.
  depth?: number
}


export type ModuleFound = {
  // The module's main file, as an absolute path.
  full: string
  src: string
}


export const MODULE_REFUSAL_CODES: ReadonlySet<string> = new Set([
  'module_path', 'module_missing', 'module_integrity', 'module_depth',
])


function refuse(code: string, message: string): never {
  const err: any = new Error(message)
  err.code = code
  throw err
}


// Resolve one module import against the local stores.
export function resolveModule(
  ref: ModuleRef,
  fromDir: string,
  fs: ModuleFs,
  options: ModuleOptions,
): ModuleFound {
  const badpath = validateModulePath(ref.path)
  if (undefined !== badpath) {
    refuse('module_path',
      'module path: ' + ref.path + '@' + ref.major + ' (' + badpath + ')')
  }

  if (MODULE_MAX_DEPTH <= (options.depth ?? 0)) {
    refuse('module_depth',
      'module depth: ' + ref.path + '@' + ref.major +
      ' (verification nested past ' + MODULE_MAX_DEPTH + ')')
  }

  // EVERY enclosing project, innermost first (see projectRoots): a
  // vendored module is a project inside a project, and its nested
  // imports have to reach the tree the consumer vendored them into.
  const roots = projectRoots(fromDir, fs)
  // The PIN comes from the first lockfile that names this import. A
  // vendored module usually ships none, so that is the consumer's --
  // which is right: the consumer's lock is what its build is pinned to.
  const expect = ref.hash ??
    roots.map((r) => lockHash(r, ref, fs)).find((h) => null != h)

  const stores: string[] =
    roots.map((r) => moduleDir(pathJoin(r, 'aontu_meta', 'vendor'), ref))
  if (null != options.cache && null != expect) {
    // Content-addressed: the cache is keyed by the hash, so a cache hit
    // is already the right MEANING before anything is read from it.
    stores.push(pathJoin(options.cache, expect))
  }

  const dir = stores.find((d) => fs.existsSync(pathJoin(d, 'mod.aon')))
  if (undefined === dir) {
    refuse('module_missing',
      'module not fetched: ' + ref.path + '@' + ref.major +
      ' (run: aontu mod get)')
  }

  // The module's own `mod.aon` names its entry file. Read with the
  // evaluator rather than a regexp: a module file is ordinary Aontu,
  // and the language reading its own metadata is the point.
  const main = moduleMain(pathJoin(dir, 'mod.aon'), fs, options)
  const full = pathJoin(dir, main)

  if (!fs.existsSync(full)) {
    refuse('module_missing',
      'module not fetched: ' + ref.path + '@' + ref.major +
      ' (run: aontu mod get)')
  }

  const src = fs.readFileSync(full, 'utf8')

  if (null != expect) {
    // VERIFICATION IS ALWAYS LOCAL. The registry's annotation is
    // advisory; what decides is the hash of the module as it is on this
    // machine, recomputed now.
    const got = options.eval(src, full).hash
    if (got !== expect) {
      refuse('module_integrity',
        'module integrity: ' + ref.path + '@' + ref.major +
        ' expected ' + expect + ' got ' + got)
    }
  }

  return { full, src }
}


function moduleMain(file: string, fs: ModuleFs, options: ModuleOptions): string {
  const gen: any = options.eval(fs.readFileSync(file, 'utf8'), file).gen
  const main = gen?.mod?.main
  return 'string' === typeof main && '' !== main ? main : DEFAULT_MAIN
}


const DEFAULT_MAIN = 'main.aon'
