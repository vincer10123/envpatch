import { createHash } from 'crypto';

/**
 * Creates an audit log entry for an env operation.
 * @param {string} operation - 'diff' | 'merge' | 'patch' | 'snapshot'
 * @param {object} meta - Additional metadata
 * @returns {object} audit entry
 */
export function createAuditEntry(operation, meta = {}) {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    operation,
    ...meta,
  };
}

/**
 * Formats a list of audit entries as a human-readable log.
 * @param {object[]} entries
 * @returns {string}
 */
export function formatAuditLog(entries) {
  if (!entries || entries.length === 0) return '(no audit entries)';
  return entries
    .map((e) => {
      const parts = [`[${e.timestamp}]`, `[${e.operation.toUpperCase()}]`];
      if (e.user) parts.push(`user=${e.user}`);
      if (e.file) parts.push(`file=${e.file}`);
      if (e.keys && e.keys.length) parts.push(`keys=${e.keys.join(',')}`);
      if (e.note) parts.push(e.note);
      return parts.join(' ');
    })
    .join('\n');
}

/**
 * Filters audit entries by operation type.
 * @param {object[]} entries
 * @param {string} operation
 * @returns {object[]}
 */
export function filterByOperation(entries, operation) {
  return entries.filter((e) => e.operation === operation);
}

/**
 * Filters audit entries within a date range.
 * @param {object[]} entries
 * @param {Date} from
 * @param {Date} to
 * @returns {object[]}
 */
export function filterByDateRange(entries, from, to) {
  return entries.filter((e) => {
    const ts = new Date(e.timestamp);
    return ts >= from && ts <= to;
  });
}

function generateId() {
  return createHash('sha1')
    .update(Math.random().toString() + Date.now())
    .digest('hex')
    .slice(0, 8);
}
