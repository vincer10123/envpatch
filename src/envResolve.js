// Resolve final env values by layering multiple .env files in priority order
// Later files override earlier ones (like docker-compose env_file behavior)

const { parse } = require('./parser');
const { interpolate } = require('./interpolate');

/**
 * Layer multiple parsed envs, later entries win.
 * @param {Object[]} envs - array of parsed env objects
 * @returns {Object} merged env
 */
function layerEnvs(envs) {
  return Object.assign({}, ...envs);
}

/**
 * Resolve an ordered list of env file contents into a single env map.
 * Applies interpolation on the final merged result.
 * @param {string[]} contents - raw file contents in ascending priority order
 * @param {Object} options
 * @param {boolean} [options.interpolate=true] - whether to expand variable references
 * @param {Object} [options.overrides={}] - extra values with highest priority
 * @returns {{ resolved: Object, unresolved: string[] }}
 */
function resolveEnvs(contents, { interpolate: doInterpolate = true, overrides = {} } = {}) {
  const parsed = contents.map(c => parse(c));
  const layered = layerEnvs(parsed);
  const merged = Object.assign({}, layered, overrides);

  if (!doInterpolate) {
    return { resolved: merged, unresolved: [] };
  }

  const { env: resolved, unresolved } = interpolate(merged);
  return { resolved, unresolved };
}

/**
 * Build a resolution trace: for each key, which layer last defined it.
 * @param {string[]} labels - names for each layer (e.g. file paths)
 * @param {Object[]} envs - parsed env objects in same order as labels
 * @returns {Object} map of key -> label
 */
function resolveTrace(labels, envs) {
  const trace = {};
  envs.forEach((env, i) => {
    Object.keys(env).forEach(key => {
      trace[key] = labels[i];
    });
  });
  return trace;
}

/**
 * Format a human-readable resolution summary.
 * @param {Object} resolved
 * @param {Object} trace
 * @param {string[]} unresolved
 * @returns {string}
 */
function formatResolution(resolved, trace, unresolved) {
  const lines = [];
  lines.push(`Resolved ${Object.keys(resolved).length} variable(s):`);
  Object.keys(resolved).sort().forEach(key => {
    const src = trace[key] || 'override';
    lines.push(`  ${key}  <-  ${src}`);
  });
  if (unresolved.length > 0) {
    lines.push(`\nUnresolved references (${unresolved.length}):`);
    unresolved.forEach(k => lines.push(`  ${k}`));
  }
  return lines.join('\n');
}

module.exports = { layerEnvs, resolveEnvs, resolveTrace, formatResolution };
