// envPin.js — pin specific env keys to exact values, preventing accidental overwrite

/**
 * Build a pin map from an array of { key, value } pin definitions.
 * @param {Array<{key: string, value: string}>} pins
 * @returns {Object}
 */
function buildPinMap(pins) {
  return pins.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});
}

/**
 * Check an env object against a pin map.
 * Returns an array of violations where the env value differs from the pinned value.
 * @param {Object} env
 * @param {Object} pinMap
 * @returns {Array<{key: string, pinned: string, actual: string}>}
 */
function checkPinViolations(env, pinMap) {
  return Object.entries(pinMap)
    .filter(([key, pinned]) => key in env && env[key] !== pinned)
    .map(([key, pinned]) => ({ key, pinned, actual: env[key] }));
}

/**
 * Apply pins to an env object, overwriting any differing values.
 * @param {Object} env
 * @param {Object} pinMap
 * @returns {Object}
 */
function applyPins(env, pinMap) {
  return { ...env, ...pinMap };
}

/**
 * Find keys that are pinned but missing from the env entirely.
 * @param {Object} env
 * @param {Object} pinMap
 * @returns {string[]}
 */
function findMissingPins(env, pinMap) {
  return Object.keys(pinMap).filter((key) => !(key in env));
}

/**
 * Format violations into a human-readable string.
 * @param {Array<{key: string, pinned: string, actual: string}>} violations
 * @returns {string}
 */
function formatPinViolations(violations) {
  if (violations.length === 0) return 'No pin violations.';
  return violations
    .map((v) => `  [PIN VIOLATION] ${v.key}: expected "${v.pinned}", got "${v.actual}"`)
    .join('\n');
}

module.exports = { buildPinMap, checkPinViolations, applyPins, findMissingPins, formatPinViolations };
