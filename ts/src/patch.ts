/* Copyright (c) 2025 Richard Rodger, MIT License */

// OVERLAY PATCH (G7 phase 5,
// docs/capability-review/g7-machine-access.md): change a document by
// APPENDING to an overlay, not by rewriting the file.
//
// This is the stage that needs no rewriter. An overlay entry is just
// another conjunct, and unification is order-independent, so appending
// `services: auth: owner: "identity-2"` to a second file and
// evaluating both is exactly the same value as writing it into the
// first — with no parsing of the target, no comment or layout damage,
// and nothing to preserve. The spec pins that equivalence rather than
// asserting it.
//
// What an overlay CANNOT do is change a PINNED value: the lattice
// refuses 5 against 3, and the report says so with the pinning site,
// which `why` then locates. The loop "set → conflict → why → edit the
// pinning site" is coherent with that last step manual; the
// format-preserving in-place edit is stage 2, and needs a
// comment-preserving CST the parser stack does not have.
//
// The verdict is G2's, unchanged: `vet(entry, overlay)` already asks
// exactly the right question — does this document hold against that
// truth, and if not, where — so `set` adds a writer, not a report.

import { vet } from './vet'
import type { VetFinding, VetReport, VetVerdict } from './vet'
import { pathParts } from './query'


export type PatchOptions = {
  // Where each document CAME FROM, so relative `@"file"` loads inside
  // them resolve from their own directories (vet's precedent).
  entryPath?: string
  overlayPath?: string
}

export type PatchReport = {
  // The overlay text as it would stand after the assignments: the
  // existing text plus one appended line each. The caller writes it —
  // an engine that touched the filesystem could not be used by a
  // server, and the CLI is the one place that knows about files.
  overlay: string
  // The appended lines alone, in order.
  appended: string[]
  verdict: VetVerdict
  findings: VetFinding[]
}


// An assignment is `<path>=<value>`, split at the FIRST `=`: a path
// segment is a name, and the value is arbitrary Aontu source, which
// may itself contain `=` (`a: min(1)` does not, but a string can).
export function parseAssignment(
  text: string): { path: string, value: string } | undefined {
  const eq = text.indexOf('=')
  if (eq < 1) {
    return undefined
  }
  const path = text.slice(0, eq).trim()
  const value = text.slice(eq + 1).trim()
  if ('' === value || 0 === pathParts(path).length) {
    return undefined
  }
  return { path, value }
}


// The path-flattened conjunct one assignment becomes:
// `$.a.b = 1` is `"a": "b": 1`. Keys are QUOTED — a segment may be a
// word the grammar spells otherwise (`if`), a number, or a name with
// a space in it, and quoting one key is the same value as writing it
// bare.
export function overlayLine(path: string, value: string): string {
  return pathParts(path).map((p) => JSON.stringify(p)).join(': ') +
    ': ' + value
}


// Append the assignments to the overlay and answer what the result
// holds. The report's verdict is the vet verdict of the ENTRY against
// the new overlay: `valid` when it holds and is concrete, `incomplete`
// when nothing contradicts but the truth is not yet satisfied,
// `invalid` when the overlay contradicts a pinned value, `error` when
// the entry itself does not stand up.
export function patch(
  entrySrc: string,
  overlaySrc: string,
  assignments: string[],
  opts?: PatchOptions,
): PatchReport {
  const options = opts ?? {}

  const appended: string[] = []
  for (const text of assignments) {
    const a = parseAssignment(text)
    if (null == a) {
      return {
        overlay: overlaySrc,
        appended: [],
        verdict: 'error',
        findings: [{
          code: 'patch_assignment',
          class: 'parse',
          severity: 'error',
          path: '$',
          message: `Not a <path>=<value> assignment: ${text}`,
          sites: [],
        }],
      }
    }
    appended.push(overlayLine(a.path, a.value))
  }

  const overlay = joinOverlay(overlaySrc, appended)

  // The file names ride as URLs as well as base paths, so a finding
  // names the entry and the overlay rather than vet's generic
  // `schema`/`data` labels — with two documents that both belong to
  // the caller, "which file" is the whole question.
  const report: VetReport = vet(entrySrc, overlay, {
    schemaPath: options.entryPath,
    dataPath: options.overlayPath,
    schemaUrl: options.entryPath,
    dataUrl: options.overlayPath,
  } as any)

  return {
    overlay,
    appended,
    verdict: report.verdict,
    findings: report.findings,
  }
}


// One line per assignment, after whatever the overlay already said. A
// trailing newline is kept when the file had one and added when it
// did not: a file that does not end in a newline is still a file, and
// appending to it must not join two entries into one line.
function joinOverlay(overlaySrc: string, appended: string[]): string {
  if (0 === appended.length) {
    return overlaySrc
  }
  const head = '' === overlaySrc || overlaySrc.endsWith('\n')
    ? overlaySrc
    : overlaySrc + '\n'
  return head + appended.join('\n') + '\n'
}
