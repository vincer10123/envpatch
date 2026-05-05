/**
 * Computes a diff between two parsed .env objects.
 * Returns an object describing added, removed, and changed keys.
 */

/**
 * @typedef {Object} EnvDiff
 * @property {string[]} added   - Keys present in next but not in base
 * @property {string[]} removed - Keys present in base but not in next
 * @property {{ key: string, from: string, to: string }[]} changed - Keys whose values differ
 */

/**
 * Diff two env maps.
 * @param {Record<string, string>} base
 * @param {Record<string, string>} next
 * @returns {EnvDiff}
 */
function diff(base, next) {
  const added = [];
  const removed = [];
  const changed = [];

  const baseKeys = new Set(Object.keys(base));
  const nextKeys = new Set(Object.keys(next));

  for (const key of nextKeys) {
    if (!baseKeys.has(key)) {
      added.push(key);
    } else if (base[key] !== next[key]) {
      changed.push({ key, from: base[key], to: next[key] });
    }
  }

  for (const key of baseKeys) {
    if (!nextKeys.has(key)) {
      removed.push(key);
    }
  }

  return { added, removed, changed };
}

/**
 * Returns true if the diff has no changes.
 * @param {EnvDiff} d
 * @returns {boolean}
 */
function isEmpty(d) {
  return d.added.length === 0 && d.removed.length === 0 && d.changed.length === 0;
}

/**
 * Formats a diff as a human-readable string.
 * @param {EnvDiff} d
 * @param {Record<string, string>} next - used to print added values
 * @returns {string}
 */
function format(d, next) {
  const lines = [];

  for (const key of d.added) {
    lines.push(`+ ${key}=${next[key]}`);
  }
  for (const key of d.removed) {
    lines.push(`- ${key}`);
  }
  for (const { key, from, to } of d.changed) {
    lines.push(`~ ${key}: ${from} → ${to}`);
  }

  return lines.join('\n');
}

module.exports = { diff, isEmpty, format };
