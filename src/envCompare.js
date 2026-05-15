/**
 * envCompare.js — Compare two or more env files and produce a multi-env diff matrix
 */

const { diff } = require('./diff');
const { redactDiff } = require('./redact');

/**
 * Compare multiple envs against a base env.
 * Returns a map of envName -> diff result.
 * @param {object} base - parsed base env
 * @param {object} targets - { envName: parsedEnv, ... }
 * @param {object} [opts]
 * @param {boolean} [opts.redact=false]
 * @returns {object} { envName: diff }
 */
function compareAll(base, targets, opts = {}) {
  const results = {};
  for (const [name, env] of Object.entries(targets)) {
    let d = diff(base, env);
    if (opts.redact) d = redactDiff(d);
    results[name] = d;
  }
  return results;
}

/**
 * Build a matrix of all keys across envs with their values (or absence).
 * @param {object} envs - { envName: parsedEnv }
 * @returns {object[]} array of row objects: { key, [envName]: value|undefined }
 */
function buildMatrix(envs) {
  const allKeys = new Set();
  for (const env of Object.values(envs)) {
    Object.keys(env).forEach(k => allKeys.add(k));
  }

  const envNames = Object.keys(envs);
  return Array.from(allKeys).sort().map(key => {
    const row = { key };
    for (const name of envNames) {
      row[name] = envs[name][key];
    }
    return row;
  });
}

/**
 * Find keys that are missing in some but not all envs.
 * @param {object} envs - { envName: parsedEnv }
 * @returns {{ key: string, missingIn: string[] }[]}
 */
function findInconsistentKeys(envs) {
  const matrix = buildMatrix(envs);
  const envNames = Object.keys(envs);
  return matrix
    .filter(row => envNames.some(n => row[n] === undefined))
    .map(row => ({
      key: row.key,
      missingIn: envNames.filter(n => row[n] === undefined)
    }));
}

/**
 * Format a comparison summary as a human-readable string.
 * @param {object} compareResults - output of compareAll
 * @returns {string}
 */
function formatComparison(compareResults) {
  const lines = [];
  for (const [name, d] of Object.entries(compareResults)) {
    const added = Object.keys(d.added).length;
    const removed = Object.keys(d.removed).length;
    const changed = Object.keys(d.changed).length;
    lines.push(`[${name}] +${added} -${removed} ~${changed}`);
  }
  return lines.join('\n');
}

module.exports = { compareAll, buildMatrix, findInconsistentKeys, formatComparison };
