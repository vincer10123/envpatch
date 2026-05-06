import { format as formatDiff } from './diff.js';
import { formatAuditLog } from './audit.js';
import { redactDiff, redactEnv } from './redact.js';

/**
 * Generate a human-readable diff report.
 * @param {object} diffResult - Result from diff()
 * @param {object} [options]
 * @param {boolean} [options.redact=false] - Redact sensitive values
 * @param {string} [options.title] - Optional report title
 * @returns {string}
 */
export function diffReport(diffResult, options = {}) {
  const { redact = false, title } = options;
  const d = redact ? redactDiff(diffResult) : diffResult;

  const lines = [];
  if (title) lines.push(`# ${title}`, '');

  lines.push('## Diff Summary');
  lines.push(`  Added:    ${Object.keys(d.added ?? {}).length}`);
  lines.push(`  Removed:  ${Object.keys(d.removed ?? {}).length}`);
  lines.push(`  Changed:  ${Object.keys(d.changed ?? {}).length}`);
  lines.push('');
  lines.push('## Details');
  lines.push(formatDiff(d));

  return lines.join('\n');
}

/**
 * Generate a human-readable audit log report.
 * @param {object[]} entries - Audit log entries
 * @param {object} [options]
 * @param {string} [options.title] - Optional report title
 * @param {number} [options.limit] - Max entries to include
 * @returns {string}
 */
export function auditReport(entries, options = {}) {
  const { title, limit } = options;
  const subset = limit ? entries.slice(-limit) : entries;

  const lines = [];
  if (title) lines.push(`# ${title}`, '');

  lines.push(`## Audit Log (${subset.length} entries)`);
  lines.push('');
  lines.push(formatAuditLog(subset));

  return lines.join('\n');
}
