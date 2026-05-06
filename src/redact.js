/**
 * Redact sensitive values in env objects for safe logging/display.
 */

const DEFAULT_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /passphrase/i,
];

const REDACTED = '***REDACTED***';

/**
 * Check if a key should be redacted based on patterns.
 * @param {string} key
 * @param {RegExp[]} patterns
 * @returns {boolean}
 */
function isSensitive(key, patterns = DEFAULT_PATTERNS) {
  return patterns.some((pattern) => pattern.test(key));
}

/**
 * Redact sensitive values from a parsed env object.
 * @param {Record<string, string>} env
 * @param {RegExp[]} [extraPatterns]
 * @returns {Record<string, string>}
 */
function redactEnv(env, extraPatterns = []) {
  const patterns = [...DEFAULT_PATTERNS, ...extraPatterns];
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = isSensitive(key, patterns) ? REDACTED : value;
  }
  return result;
}

/**
 * Redact sensitive values from a diff object.
 * @param {object} diffObj - result of diff()
 * @param {RegExp[]} [extraPatterns]
 * @returns {object}
 */
function redactDiff(diffObj, extraPatterns = []) {
  const patterns = [...DEFAULT_PATTERNS, ...extraPatterns];
  const redact = (key, val) =>
    isSensitive(key, patterns) && val !== undefined ? REDACTED : val;

  return {
    added: Object.fromEntries(
      Object.entries(diffObj.added || {}).map(([k, v]) => [k, redact(k, v)])
    ),
    removed: Object.fromEntries(
      Object.entries(diffObj.removed || {}).map(([k, v]) => [k, redact(k, v)])
    ),
    changed: Object.fromEntries(
      Object.entries(diffObj.changed || {}).map(([k, { from, to }]) => [
        k,
        { from: redact(k, from), to: redact(k, to) },
      ])
    ),
    unchanged: diffObj.unchanged || {},
  };
}

module.exports = { isSensitive, redactEnv, redactDiff, REDACTED, DEFAULT_PATTERNS };
