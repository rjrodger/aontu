/* Copyright (c) 2025 Richard Rodger, MIT License */


// THE TEMPLATE SURFACE (docs/design/TEMPLATE.0.md; RENDER.0.md P8).
// A generator written in the TARGET's own syntax: a marked line is
// aontu source, and every other line is a line of output.
//
//   //- code: units: [{ path: "hi.ts", lang: "typescript", decls: [{
//   //-   k: "frag", of: emit($.svc, { match: { n: string }, body: [
//   export const NAME = "world"
//   //- ]}) }] }]
//
// That is the whole desugaring, and it is LINE-ORIENTED: nothing here
// parses aontu, and nothing here reads the target's syntax beyond its
// comment token. A marker line contributes its text to the document; an
// unmarked line contributes one quoted string, which is a body element
// where the marker lines left a list open.
//
// WHY A COMMENT TOKEN PLUS A DASH (D2). The generator file must stay
// valid in its own language -- so an editor highlights it, a compiler
// parses it, and a reviewer reads it -- and the one thing every
// language has that the target's own tools already ignore is a
// comment. Adding a dash distinguishes a marker from an ordinary
// comment, and derives for a language this table has never seen: the
// caller passes the token.
//
// A MARKER IS RECOGNISED AFTER LEADING WHITESPACE AND KEEPS ITS OWN
// INDENTATION (D2). That is what lets a template be written exactly
// where its output appears (D7): a body line is verbatim, so a line
// indented two spaces in the template is indented two spaces in the
// generated file, and the marker lines around it are indented to match
// the code they sit in rather than to the aontu they carry.
//
// THE SUGAR IS THE FIXPOINT OF THE TWO TRANSFORMS (D6), and that is
// the whole of the resugaring's safety. A canonical line that looks
// like a body element is rebuilt as a target line, the rebuild is
// desugared, and the rebuild is taken ONLY if that reproduces the
// canonical line. A line no target line can carry -- one that would
// itself read as a marker -- fails that test and stays where it is, so
// there is no table of escapes to get wrong and no line the round trip
// can lose.
//
// WHITESPACE CONTROL IS ABSENT AND UNNEEDED (D8): a marker line is not
// an output line at all, so no construct can leak a newline into the
// output. What IS significant is the template's own trailing
// whitespace -- a line of two spaces is two spaces of output -- which
// is why the canonical form quotes every body line explicitly. Note
// what `template --check` does and does not catch: it holds the FILE
// to the spelling these two transforms answer, so a marker written
// without its space or with its aontu indented after it is named; a
// body line an editor trimmed is still a valid template, and what
// names that is `render --check` against the committed output.


// A marker is a comment token plus a dash. These are the tokens the
// verb derives from a file's extension; any other language passes its
// own, which is why the surface needs no table of languages.
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

// A BLOCK MARKER CLOSES ITSELF. A language with no line comment (CSS
// is the one in the table) marks with `/*- … */`, and the closer is
// implied by the opener rather than named separately: there is one
// block form, and a marker that opens `/*-` ends `*/`.
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


// INDENTATION IS SPACES AND TABS, and nothing else. A host trim is not
// the same set in the two ports -- JavaScript's trims every Unicode
// space, Go's `TrimSpace` trims a different list -- and a line of a
// template file that began with one of the characters they disagree
// about would be a marker line in one engine and a line of output in
// the other. Twin of templateIndent in go/template.go.
function indentOf(line: string): number {
  let i = 0
  while (i < line.length && (' ' === line[i] || '\t' === line[i])) {
    i++
  }
  return i
}


// The line without its indentation or its trailing spaces and tabs.
function trimLine(line: string): string {
  let end = line.length
  while (0 < end && (' ' === line[end - 1] || '\t' === line[end - 1])) {
    end--
  }
  return line.slice(indentOf(line), end)
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
  // The block form's closer is part of the marker, not of the aontu.
  // A block marker line that never closes is not a marker line: the
  // language's own parser would not read it as a comment either.
  if (isBlock(marker)) {
    const end = body.lastIndexOf(BLOCK_CLOSE)
    if (end < 0) {
      return { marker: false, indent: '', text: line }
    }
    body = trimLine(body.slice(0, end))
  }
  // ONE SPACE AFTER THE MARKER IS THE MARKER'S, so `//- x: 1` carries
  // `x: 1` and the resugaring writes the space back. A marker written
  // without it carries the same aontu and is normalised on the round
  // trip, which `--check` reports as the drift it is.
  if (body.startsWith(' ')) {
    body = body.slice(1)
  }
  return { marker: true, indent, text: body }
}


// THE CANONICAL QUOTE IS CHOSEN PER LINE (D6). A backtick string
// carries `"` and `'` unescaped, which is most of what target code
// holds, so a line takes one unless it holds a backtick itself.
//
// A BACKSLASH IS ESCAPED IN EITHER QUOTE, and that is not what the
// design note assumed: this engine reads the escapes of a backtick
// string exactly as it reads a quoted one, and an unknown escape drops
// its backslash (`\p` is `p`), so a target line holding `\n` inside a
// string of its own would arrive in the output as a newline. Only the
// delimiter differs between the two forms.
function quoteLine(text: string): string {
  const escaped = text.replace(/\\/g, '\\\\')
  return text.includes('`') ?
    '"' + escaped.replace(/"/g, '\\"') + '"' :
    '`' + escaped + '`'
}


// The line a quoted body element carries, or undefined when the line
// is not one: anything but a lone string literal, and any escape the
// quoting above does not write. The fixpoint test below is what makes
// being conservative here safe -- a line this refuses stays aontu.
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


// DESUGAR: a template file becomes the canonical aontu document.
// A marker line is its own text, at its own indentation; every other
// line is one quoted string, which lands wherever the marker lines
// left a list open.
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


// RESUGAR: the canonical document becomes a template file. Every line
// is a marker line unless it is a body element that survives the
// fixpoint -- rebuild the target line, desugar the rebuild, and take
// it only if that answers the canonical line back.
function resugarTemplate(src: string, marker?: string): string {
  const mark = marker ?? DEFAULT_MARKER
  const lines = src.split('\n')
  const tail = 1 < lines.length && '' === lines[lines.length - 1]
  if (tail) {
    lines.pop()
  }
  const out = lines.map((line) => {
    // THE ELEMENT'S OWN INDENTATION IS NOT PART OF IT: the target line
    // is the string's content, and where the canonical form puts the
    // element on the page is the formatter's business. Comparing the
    // whole line instead would refuse every body element of a document
    // `aontu fmt` had indented, which is every document it has seen.
    const target = unquoteLine(line)
    if (undefined !== target && desugarTemplate(target, mark) === trimLine(line)) {
      return target
    }
    const cut = indentOf(line)
    const text = line.slice(cut)
    const open = line.slice(0, cut) + mark
    const close = isBlock(mark) ? ' ' + BLOCK_CLOSE : ''
    return '' === text ? open + close : open + ' ' + text + close
  })
  return out.join('\n') + (tail ? '\n' : '')
} /* node:coverage ignore next 8 */


export {
  desugarTemplate,
  resugarTemplate,
  markerFor,
  DEFAULT_MARKER,
}
