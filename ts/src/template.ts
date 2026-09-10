/* Copyright (c) 2025 Richard Rodger, MIT License */


const MARKERS: Record<string, string> = {
  c: '//-',
  cc: '//-',
  cpp: '//-',
  cs: '//-',
  css: '/*-',
  go: '//-',
  h: '//-',
  hs: '---',
  java: '//-',
  js: '//-',
  jsx: '//-',
  kt: '//-',
  lua: '---',
  php: '//-',
  pl: '#-',
  py: '#-',
  rb: '#-',
  rs: '//-',
  scala: '//-',
  sh: '#-',
  sql: '---',
  swift: '//-',
  toml: '#-',
  ts: '//-',
  tsx: '//-',
  yaml: '#-',
  yml: '#-',
}

// The default marker, for a file whose extension names no token: the
// C-family line comment, which is the one the note is written in.
const DEFAULT_MARKER = '//-'

const BLOCK_CLOSE = '*/'


// The marker for a file, by its extension, or the C-family default.
// The extension decides, exactly as it decides what an include is
// (ADR-012) -- one rule, and no flag to remember for the common case.
function markerFor(path: string): string {
  const dot = path.lastIndexOf('.')
  const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  const ext = dot > slash ? path.slice(dot + 1).toLowerCase() : ''
  return MARKERS[ext] ?? DEFAULT_MARKER
}


// Is this marker the block form?
function isBlock(marker: string): boolean {
  return marker.startsWith('/*')
}


function indentOf(line: string): number {
  let i = 0
  while (i < line.length && (' ' === line[i] || '\t' === line[i])) {
    i++
  }
  return i
}


// The line without its trailing spaces and tabs.
function trimEnd(line: string): string {
  let end = line.length
  while (0 < end && (' ' === line[end - 1] || '\t' === line[end - 1])) {
    end--
  }
  return line.slice(0, end)
}


// The line without its indentation or its trailing spaces and tabs.
function trimLine(line: string): string {
  return trimEnd(line).slice(indentOf(line))
}


// One line of a template, read: its indentation, whether it is a
// marker, and the text it carries -- the aontu source for a marker,
// the output line for anything else.
type Line = {
  marker: boolean
  indent: string
  text: string
}


function readLine(line: string, marker: string): Line {
  const cut = indentOf(line)
  const indent = line.slice(0, cut)
  const rest = line.slice(cut)
  if (!rest.startsWith(marker)) {
    return { marker: false, indent: '', text: line }
  }
  let body = rest.slice(marker.length)
  if (isBlock(marker)) {
    const end = body.lastIndexOf(BLOCK_CLOSE)
    if (end < 0) {
      return { marker: false, indent: '', text: line }
    }
    body = trimEnd(body.slice(0, end))
  }
  if (body.startsWith(' ')) {
    body = body.slice(1)
  }
  return { marker: true, indent, text: body }
}


function quoteLine(text: string): string {
  const escaped = text.replace(/\\/g, '\\\\')
  return text.includes('`') ?
    '"' + escaped.replace(/"/g, '\\"') + '"' :
    '`' + escaped + '`'
}


function unquoteLine(text: string): string | undefined {
  const t = trimLine(text)
  if (2 > t.length) {
    return undefined
  }
  const quote = t[0]
  if (('`' !== quote && '"' !== quote) || t[t.length - 1] !== quote) {
    return undefined
  }
  const inner = t.slice(1, -1)
  let out = ''
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (quote === c) {
      return undefined
    }
    if ('\\' !== c) {
      out += c
      continue
    }
    const n = inner[++i]
    if ('\\' === n || (('"' === n) && '"' === quote)) {
      out += n
      continue
    }
    return undefined
  }
  return out
}


function desugarTemplate(src: string, marker?: string): string {
  const mark = marker ?? DEFAULT_MARKER
  const lines = src.split('\n')
  // A trailing newline is the file's, not a line of output: a text
  // file ends with one, and the round trip must not grow an empty
  // output line each pass.
  const tail = 1 < lines.length && '' === lines[lines.length - 1]
  if (tail) {
    lines.pop()
  }
  const out = lines.map((line) => {
    const read = readLine(line, mark)
    return read.marker ? read.indent + read.text : quoteLine(read.text)
  })
  return out.join('\n') + (tail ? '\n' : '')
}


function resugarTemplate(src: string, marker?: string): string {
  const mark = marker ?? DEFAULT_MARKER
  const lines = src.split('\n')
  const tail = 1 < lines.length && '' === lines[lines.length - 1]
  if (tail) {
    lines.pop()
  }
  const out = lines.map((line) => {
    const target = unquoteLine(line)
    if (undefined !== target && desugarTemplate(target, mark) === trimLine(line)) {
      return target
    }
    // THE MARKER STANDS AT THE LEFT MARGIN and the line's indentation
    // is written after it, so the aontu's own shape is on the page.
    // The one space is the marker's, which the reading takes back.
    const text = trimEnd(line)
    const close = isBlock(mark) ? ' ' + BLOCK_CLOSE : ''
    return '' === text ? mark + close : mark + ' ' + text + close
  })
  return out.join('\n') + (tail ? '\n' : '')
}


function templateOutputs(src: string, marker: string): boolean[] {
  const lines = src.split('\n')
  if (1 < lines.length && '' === lines[lines.length - 1]) {
    lines.pop()
  }
  return lines.map((line) => !readLine(line, marker).marker)
} /* node:coverage ignore next 9 */


export {
  desugarTemplate,
  resugarTemplate,
  templateOutputs,
  markerFor,
  DEFAULT_MARKER,
}
