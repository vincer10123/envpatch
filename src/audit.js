import { randomBytes } from 'crypto';

/**
 * Generate a short unique id for audit entries.
 * @returns {string}
 */
export function generateId() {
  return randomBytes(6).toString('hex');
}

/**
 * Create a single audit log entry.
 * @param {string} operation - e.g. 'diff', 'merge', 'apply', 'snapshot'
 * @param {object} meta - arbitrary metadata about the operation
 * @returns {object}
 */
export function createAuditEntry(operation, meta = {}) {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    operation,
    meta,
  };
}

/**
 * Filter audit log entries by operation type.
 * @param {object[]} log
 * @param {string} operation
 * @returns {object[]}
 */
export function filterByOperation(log, operation) {
  return log.filter(entry => entry.operation === operation);
}

/**
 * Filter audit log entries within a date range (inclusive).
 * @param {object[]} log
 * @param {Date} from
 * @param {Date} to
 * @returns {object[]}
 */
export function filterByDateRange(log, from, to) {
  return log.filter(entry => {
    const ts = new Date(entry.timestamp);
    return ts >= from && ts <= to;
  });
}

/**
 * Format an audit log array into a human-readable string.
 * @param {object[]} log
 * @returns {string}
 */
export function formatAuditLog(log) {
  if (!log || log.length === 0) {
    return 'No audit entries found.';
  }

  return log
    .map(entry => {
      const meta = Object.entries(entry.meta)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      return `[${entry.timestamp}] (${entry.id}) ${entry.operation}${meta ? ' ' + meta : ''}`;
    })
    .join('\n');
}
