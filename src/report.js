/**
 * Generate human-readable reports from diff and audit data,
 * with optional redaction of sensitive values.
 */

const { redactDiff, redactEnv } = require('./redact');

/**
 * Format a diff as a report string.
 * @param {object} diffObj
 * @param {object} [options]
 * @param {boolean} [options.redact=true]
 * @param {string} [options.title]
 * @returns {string}
 */
function diffReport(diffObj, { redact = true, title = 'Env Diff Report' } = {}) {
  const d = redact ? redactDiff(diffObj) : diffObj;
  const lines = [`=== ${title} ===`, ''];

  const added = Object.entries(d.added || {});
  const removed = Object.entries(d.removed || {});
  const changed = Object.entries(d.changed || {});

  if (added.length) {
    lines.push('Added:');
    added.forEach(([k, v]) => lines.push(`  + ${k}=${v}`));
    lines.push('');
  }
  if (removed.length) {
    lines.push('Removed:');
    removed.forEach(([k, v]) => lines.push(`  - ${k}=${v}`));
    lines.push('');
  }
  if (changed.length) {
    lines.push('Changed:');
    changed.forEach(([k, { from, to }]) =>
      lines.push(`  ~ ${k}: ${from} → ${to}`)
    );
    lines.push('');
  }
  if (!added.length && !removed.length && !changed.length) {
    lines.push('No differences found.');
    lines.push('');
  }

  lines.push(`Unchanged: ${Object.keys(d.unchanged || {}).length} key(s)`);
  return lines.join('\n');
}

/**
 * Format an audit log as a report string.
 * @param {object[]} entries
 * @param {object} [options]
 * @param {boolean} [options.redact=true]
 * @returns {string}
 */
function auditReport(entries, { redact = true } = {}) {
  if (!entries.length) return '=== Audit Log ===\n\nNo entries found.';

  const lines = ['=== Audit Log ===', ''];
  for (const entry of entries) {
    lines.push(`[${entry.timestamp}] ${entry.operation} (id: ${entry.id})`);
    if (entry.environment) lines.push(`  Environment: ${entry.environment}`);
    if (entry.diff) {
      const d = redact ? redactDiff(entry.diff) : entry.diff;
      const adds = Object.keys(d.added || {}).length;
      const removes = Object.keys(d.removed || {}).length;
      const changes = Object.keys(d.changed || {}).length;
      lines.push(`  Changes: +${adds} -${removes} ~${changes}`);
    }
    if (entry.meta) lines.push(`  Meta: ${JSON.stringify(entry.meta)}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

module.exports = { diffReport, auditReport };
