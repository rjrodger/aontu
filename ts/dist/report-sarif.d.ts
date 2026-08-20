import type { VetReport } from './vet';
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
declare function sarifReport(report: VetReport, version: string): string;
export { sarifReport, };
