/**
 * Merges a patch env into a base env.
 * By default, keys in patch override base; missing keys can optionally be removed.
 */

/**
 * @typedef {Object} MergeOptions
 * @property {boolean} [removeAbsent=false] - If true, keys in base not in patch are removed
 * @property {boolean} [skipExisting=false]  - If true, existing keys in base are not overwritten
 */

/**
 * Merge patch into base.
 * @param {Record<string, string>} base
 * @param {Record<string, string>} patch
 * @param {MergeOptions} [options={}]
 * @returns {Record<string, string>}
 */
function merge(base, patch, options = {}) {
  const { removeAbsent = false, skipExisting = false } = options;

  const result = removeAbsent ? {} : { ...base };

  if (removeAbsent) {
    // Start fresh, only keep keys present in patch
    for (const [key, value] of Object.entries(patch)) {
      result[key] = value;
    }
    return result;
  }

  for (const [key, value] of Object.entries(patch)) {
    if (skipExisting && Object.prototype.hasOwnProperty.call(base, key)) {
      continue;
    }
    result[key] = value;
  }

  return result;
}

/**
 * Apply a diff (from diff.js) to a base env, producing a patched env.
 * @param {Record<string, string>} base
 * @param {import('./diff').EnvDiff} envDiff
 * @param {Record<string, string>} next - source of added/changed values
 * @returns {Record<string, string>}
 */
function applyDiff(base, envDiff, next) {
  const result = { ...base };

  for (const key of envDiff.added) {
    result[key] = next[key];
  }
  for (const key of envDiff.removed) {
    delete result[key];
  }
  for (const { key, to } of envDiff.changed) {
    result[key] = to;
  }

  return result;
}

module.exports = { merge, applyDiff };
