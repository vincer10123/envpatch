/**
 * Generate human-readable reports for diff, audit, promotion, and lint results.
 */

const { format } = require('./diff');
const { formatAuditLog } = require('./audit');
const { formatPromotionSummary } = require('./promote');
const { formatLintResults } = require('./lint');

/**
 * @param {object} diffResult
 * @returns {string}
 */
function diffReport(diffResult) {
  const lines = ['=== Diff Report ==='];
  const formatted = format(diffResult);
  lines.push(formatted || 'No differences found.');
  return lines.join('\n');
}

/**
 * @param {import('./audit').AuditEntry[]} entries
 * @returns {string}
 */
function auditReport(entries) {
  const lines = ['=== Audit Log ==='];
  lines.push(formatAuditLog(entries) || 'No audit entries.');
  return lines.join('\n');
}

/**
 * @param {object} promotionResult
 * @returns {string}
 */
function promotionReport(promotionResult) {
  const lines = ['=== Promotion Report ==='];
  lines.push(formatPromotionSummary(promotionResult));
  return lines.join('\n');
}

/**
 * @param {import('./lint').LintResult[]} lintResults
 * @param {object} [options]
 * @param {string} [options.filename]
 * @returns {string}
 */
function lintReport(lintResults, options = {}) {
  const { filename } = options;
  const header = filename ? `=== Lint Report: ${filename} ===` : '=== Lint Report ===';
  const errors = lintResults.filter(r => r.level === 'error').length;
  const warnings = lintResults.filter(r => r.level === 'warn').length;
  const summary = `${errors} error(s), ${warnings} warning(s)`;
  return [header, formatLintResults(lintResults), summary].join('\n');
}

module.exports = { diffReport, auditReport, promotionReport, lintReport };
