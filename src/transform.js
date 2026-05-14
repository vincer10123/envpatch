/**
 * transform.js — Apply key/value transformations to .env objects
 */

/**
 * Rename keys according to a mapping { oldKey: newKey }
 * @param {Object} env
 * @param {Object} keyMap
 * @returns {Object}
 */
function renameKeys(env, keyMap) {
  const result = {};
  for (const [k, v] of Object.entries(env)) {
    const newKey = keyMap[k] !== undefined ? keyMap[k] : k;
    if (newKey !== null) result[newKey] = v;
  }
  return result;
}

/**
 * Filter env to only include specified keys
 * @param {Object} env
 * @param {string[]} keys
 * @returns {Object}
 */
function pickKeys(env, keys) {
  return Object.fromEntries(
    Object.entries(env).filter(([k]) => keys.includes(k))
  );
}

/**
 * Remove specified keys from env
 * @param {Object} env
 * @param {string[]} keys
 * @returns {Object}
 */
function omitKeys(env, keys) {
  return Object.fromEntries(
    Object.entries(env).filter(([k]) => !keys.includes(k))
  );
}

/**
 * Apply a prefix to all keys
 * @param {Object} env
 * @param {string} prefix
 * @returns {Object}
 */
function prefixKeys(env, prefix) {
  return Object.fromEntries(
    Object.entries(env).map(([k, v]) => [`${prefix}${k}`, v])
  );
}

/**
 * Strip a prefix from all keys (only keys that have it)
 * @param {Object} env
 * @param {string} prefix
 * @returns {Object}
 */
function stripPrefix(env, prefix) {
  return Object.fromEntries(
    Object.entries(env).map(([k, v]) => [
      k.startsWith(prefix) ? k.slice(prefix.length) : k,
      v
    ])
  );
}

/**
 * Apply a value transformer function to all (or matching) keys
 * @param {Object} env
 * @param {Function} fn  (key, value) => newValue
 * @param {RegExp|null} keyPattern  optional filter
 * @returns {Object}
 */
function transformValues(env, fn, keyPattern = null) {
  return Object.fromEntries(
    Object.entries(env).map(([k, v]) => [
      k,
      keyPattern === null || keyPattern.test(k) ? fn(k, v) : v
    ])
  );
}

module.exports = { renameKeys, pickKeys, omitKeys, prefixKeys, stripPrefix, transformValues };
