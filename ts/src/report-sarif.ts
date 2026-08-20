/* Copyright (c) 2025 Richard Rodger, MIT License */

// SARIF rendering for a vet report (G2 phase 5,
// docs/capability-review/g2-validation-verb.md).
//
// A MINIMAL SARIF 2.1.0 profile, and deliberately nothing more: one
// run, one `result` per finding, the finding's first site as the
// primary location, its remaining sites under `relatedLocations`, and
// the whole finding object embedded in `properties` so a SARIF consumer
// still holds the native contract. No fixes, no code flows, no
// baselines — the JSON report is the native contract, SARIF is the
// interchange skin CI systems already ingest (GitHub code scanning
// uploads, PR annotation).
//
// This is library API, not CLI plumbing, for the same reason the vet
// engine is: an embedder (and G7's MCP server later) must be able to
// emit the interchange form without shelling out. The Go twin is
// go/report_sarif.go, and the two are held to byte parity over the
// shared fixture pair in test/spec/files/vet-sarif/ — with the message
// text and producer version redacted, exactly as test/spec/vet.tsv
// carves the message out of its goldens, because prose and the two
// independent version series are deliberately not in cross-port parity.

import type { VetReport, VetFinding, VetSite } from './vet'

import { exactJSON } from './exactjson'


// SARIF levels are error/warning/note; the report's severities are
// error/warning/info. Only `info` needs translating, but the map spells
// out all three so a new severity fails loudly here rather than
// silently emitting itself.
const SARIF_LEVEL: Record<string, string> = {
  error: 'error',
  warning: 'warning',
  info: 'note',
}


// A site's file is a filesystem path, and a SARIF artifactLocation.uri
// is a URI reference: `#`, `%`, spaces and every other URI-significant
// character must be percent-encoded or a consumer parses the path as
// something else (text after `#` becomes a fragment). Encoded BY BYTE
// over UTF-8, with RFC 3986's unreserved and path characters kept
// literal, so the Go twin produces identical bytes from an identical
// loop (go/report_sarif.go sarifURI).
function sarifUri(path: string): string {
  const bytes = Buffer.from(path, 'utf8')
  let out = ''
  for (const b of bytes) {
    const c = String.fromCharCode(b)
    if (b < 128 && /[A-Za-z0-9\-._~/!$&'()*+,;=:@]/.test(c)) {
      out += c
    }
    else {
      out += '%' + b.toString(16).toUpperCase().padStart(2, '0')
    }
  }
  return out
}


function sarifLocation(site: VetSite): any {
  const physical: any = {
    artifactLocation: { uri: sarifUri(site.file) },
  }
  // SARIF regions are 1-based. A finding with no position — a parse
  // failure reports at -1:-1 — gets a location with no region rather
  // than an invented one.
  if (1 <= site.row) {
    physical.region = { startColumn: site.col, startLine: site.row }
  }
  return { physicalLocation: physical }
}


function sarifResult(finding: VetFinding): any {
  // The engine orders sites data-first (the thing to fix), so the first
  // site is the primary location and the rest are related — which for a
  // two-site conflict puts the schema's declaration under
  // `relatedLocations`, exactly where a code-scanning UI shows "the
  // other side".
  const result: any = {
    level: SARIF_LEVEL[finding.severity],
    locations: [sarifLocation(finding.sites[0])],
    message: { text: finding.message },
    properties: finding,
    ruleId: 'aontu/' + finding.code,
  }
  const related = finding.sites.slice(1)
  if (0 < related.length) {
    result.relatedLocations = related.map(sarifLocation)
  }
  return result
}


/**
 * Render a vet report as SARIF 2.1.0 text (a minimal profile: one run,
 * one result per finding, the finding embedded in `properties`).
 *
 * @param report   A report from `vet()`.
 * @param version  The producer version for `tool.driver.version` —
 *                 the CLI passes its package version; the two ports'
 *                 version series are independent by design.
 * @returns        The SARIF JSON text, indented two spaces, keys in
 *                 the canonical emitter's sorted order.
 */
function sarifReport(report: VetReport, version: string): string {
  return exactJSON({
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [{
      // An `error` verdict means the run could not be set up (an
      // unusable schema): zero findings from a FAILED run must not
      // read like zero findings from a clean one, so the failure is
      // carried in SARIF's own invocation metadata rather than by an
      // indistinguishable empty result list.
      invocations: [{
        executionSuccessful: 'error' !== report.verdict,
      }],
      results: report.findings.map(sarifResult),
      tool: {
        driver: {
          informationUri: 'https://github.com/rjrodger/aontu',
          name: 'aontu',
          version,
        },
      },
    }],
    version: '2.1.0',
  }, 2)
} /* node:coverage ignore next 6 */


export {
  sarifReport,
}
