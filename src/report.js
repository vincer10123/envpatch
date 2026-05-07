const { formatAuditLog } = require('./audit');
const { redactDiff } = require('./redact');
const { formatPromotionSummary } = require('./promote');

/**
 * Generate a diff report between two parsed envs.
 * @param {object} diffResult - output from diff()
 * @param {object} [options]
 * @param {boolean} [options.redact] - redact sensitive values
 * @returns {string}
 */
function diffReport(diffResult, options = {}) {
  const d = options.redact ? redactDiff(diffResult) : diffResult;
  const lines = ['=== Diff Report ==='];
  const { added = {}, removed = {}, changed = {} } = d;

  if (!Object.keys(added).length && !Object.keys(removed).length && !Object.keys(changed).length) {
    lines.push('No differences found.');
    return lines.join('\n');
  }

  for (const key of Object.keys(added)) lines.push(`+ ${key}=${added[key]}`);
  for (const key of Object.keys(removed)) lines.push(`- ${key}=${removed[key]}`);
  for (const key of Object.keys(changed)) {
    lines.push(`~ ${key}: ${changed[key].from} → ${changed[key].to}`);
  }
  return lines.join('\n');
}

/**
 * Generate an audit log report.
 * @param {object[]} entries - audit log entries
 * @param {object} [options]
 * @param {string} [options.operation] - filter by operation type
 * @returns {string}
 */
function auditReport(entries, options = {}) {
  const { filterByOperation } = require('./audit');
  const filtered = options.operation ? filterByOperation(entries, options.operation) : entries;
  const lines = ['=== Audit Report ==='];
  if (!filtered.length) {
    lines.push('No audit entries found.');
    return lines.join('\n');
  }
  lines.push(formatAuditLog(filtered));
  return lines.join('\n');
}

/**
 * Generate a promotion report.
 * @param {string[]} promoted
 * @param {string[]} skipped
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
function promotionReport(promoted, skipped, from, to) {
  const lines = ['=== Promotion Report ==='];
  lines.push(formatPromotionSummary(promoted, skipped, from, to));
  return lines.join('\n');
}

module.exports = { diffReport, auditReport, promotionReport };
