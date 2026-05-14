/**
 * Lint .env files for common issues and style violations.
 */

const SENSITIVE_PATTERN = /secret|password|passwd|token|api_key|private/i;
const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9_]*$/;
const EMPTY_VALUE_PATTERN = /^\s*$/;

/**
 * @param {Record<string, string>} env
 * @param {object} [options]
 * @param {boolean} [options.warnEmptyValues]
 * @param {boolean} [options.warnLowercase]
 * @param {boolean} [options.warnSensitivePlaintext]
 * @returns {LintResult[]}
 */
function lintEnv(env, options = {}) {
  const {
    warnEmptyValues = true,
    warnLowercase = true,
    warnSensitivePlaintext = true,
  } = options;

  const results = [];

  for (const [key, value] of Object.entries(env)) {
    if (warnLowercase && !UPPER_SNAKE_CASE.test(key)) {
      results.push({
        key,
        level: 'warn',
        code: 'KEY_CASING',
        message: `Key "${key}" should be UPPER_SNAKE_CASE`,
      });
    }

    if (warnEmptyValues && EMPTY_VALUE_PATTERN.test(value)) {
      results.push({
        key,
        level: 'warn',
        code: 'EMPTY_VALUE',
        message: `Key "${key}" has an empty value`,
      });
    }

    if (warnSensitivePlaintext && SENSITIVE_PATTERN.test(key) && !isLikelyEncrypted(value)) {
      results.push({
        key,
        level: 'error',
        code: 'SENSITIVE_PLAINTEXT',
        message: `Key "${key}" appears sensitive but value is stored in plaintext`,
      });
    }
  }

  return results;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isLikelyEncrypted(value) {
  // matches enc:v1: prefix used by encrypt.js
  return /^enc:v\d+:/.test(value);
}

/**
 * @param {LintResult[]} results
 * @returns {string}
 */
function formatLintResults(results) {
  if (results.length === 0) return 'No lint issues found.';
  return results
    .map(r => `[${r.level.toUpperCase()}] ${r.code}: ${r.message}`)
    .join('\n');
}

module.exports = { lintEnv, isLikelyEncrypted, formatLintResults };
