// envClone.js — clone an env file to a new target, optionally filtering or transforming keys

const { parse, serialize } = require('./parser');
const { pickKeys, omitKeys, prefixKeys, stripPrefix } = require('./transform');

/**
 * Clone env object with optional transformations.
 * @param {Object} env - parsed env object
 * @param {Object} options
 * @param {string[]} [options.pick]       - only include these keys
 * @param {string[]} [options.omit]       - exclude these keys
 * @param {string}   [options.addPrefix]  - add prefix to all keys
 * @param {string}   [options.removePrefix] - strip prefix from all keys
 * @param {boolean}  [options.overwrite]  - allow overwriting existing values (default true)
 * @returns {Object} cloned (and transformed) env object
 */
function cloneEnv(env, options = {}) {
  let result = { ...env };

  if (options.pick && options.pick.length > 0) {
    result = pickKeys(result, options.pick);
  }

  if (options.omit && options.omit.length > 0) {
    result = omitKeys(result, options.omit);
  }

  if (options.removePrefix) {
    result = stripPrefix(result, options.removePrefix);
  }

  if (options.addPrefix) {
    result = prefixKeys(result, options.addPrefix);
  }

  return result;
}

/**
 * Merge a cloned env into an existing target env.
 * @param {Object} target - existing env to merge into
 * @param {Object} cloned - cloned env to apply
 * @param {boolean} overwrite - whether to overwrite existing keys (default: true)
 * @returns {Object} merged result
 */
function mergeClone(target, cloned, overwrite = true) {
  const result = { ...target };
  for (const [key, value] of Object.entries(cloned)) {
    if (overwrite || !(key in result)) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Summarize what the clone operation changed.
 * @param {Object} source - original env
 * @param {Object} result - resulting env after clone+merge
 * @returns {Object} summary with added, overwritten, unchanged counts
 */
function cloneSummary(source, result) {
  const added = [];
  const overwritten = [];
  const unchanged = [];

  for (const key of Object.keys(result)) {
    if (!(key in source)) {
      added.push(key);
    } else if (source[key] !== result[key]) {
      overwritten.push(key);
    } else {
      unchanged.push(key);
    }
  }

  return { added, overwritten, unchanged };
}

module.exports = { cloneEnv, mergeClone, cloneSummary };
