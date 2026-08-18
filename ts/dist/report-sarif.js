"use strict";
/* Copyright (c) 2025 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sarifReport = sarifReport;
const exactjson_1 = require("./exactjson");
// SARIF levels are error/warning/note; the report's severities are
// error/warning/info. Only `info` needs translating, but the map spells
// out all three so a new severity fails loudly here rather than
// silently emitting itself.
const SARIF_LEVEL = {
    error: 'error',
    warning: 'warning',
    info: 'note',
};
function sarifLocation(site) {
    const physical = {
        artifactLocation: { uri: site.file },
    };
    // SARIF regions are 1-based. A finding with no position — a parse
    // failure reports at -1:-1 — gets a location with no region rather
    // than an invented one.
    if (1 <= site.row) {
        physical.region = { startColumn: site.col, startLine: site.row };
    }
    return { physicalLocation: physical };
}
function sarifResult(finding) {
    // The engine orders sites data-first (the thing to fix), so the first
    // site is the primary location and the rest are related — which for a
    // two-site conflict puts the schema's declaration under
    // `relatedLocations`, exactly where a code-scanning UI shows "the
    // other side".
    const result = {
        level: SARIF_LEVEL[finding.severity],
        locations: [sarifLocation(finding.sites[0])],
        message: { text: finding.message },
        properties: finding,
        ruleId: 'aontu/' + finding.code,
    };
    const related = finding.sites.slice(1);
    if (0 < related.length) {
        result.relatedLocations = related.map(sarifLocation);
    }
    return result;
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
function sarifReport(report, version) {
    return (0, exactjson_1.exactJSON)({
        $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
        runs: [{
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
    }, 2);
} /* node:coverage ignore next 6 */
//# sourceMappingURL=report-sarif.js.map