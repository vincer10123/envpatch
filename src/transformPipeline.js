/**
 * transformPipeline.js — Chain multiple transforms into a reusable pipeline
 */

const { renameKeys, pickKeys, omitKeys, prefixKeys, stripPrefix, transformValues } = require('./transform');

const STEP_HANDLERS = {
  rename: (env, opts) => renameKeys(env, opts.map),
  pick: (env, opts) => pickKeys(env, opts.keys),
  omit: (env, opts) => omitKeys(env, opts.keys),
  prefix: (env, opts) => prefixKeys(env, opts.prefix),
  stripPrefix: (env, opts) => stripPrefix(env, opts.prefix),
  transformValues: (env, opts) => {
    const pattern = opts.keyPattern ? new RegExp(opts.keyPattern) : null;
    return transformValues(env, new Function('key', 'value', opts.fn), pattern);
  }
};

/**
 * Build a pipeline from an array of step descriptors
 * @param {Array<{type: string, ...opts}>} steps
 * @returns {Function} env => env
 */
function buildPipeline(steps) {
  return function runPipeline(env) {
    return steps.reduce((current, step) => {
      const handler = STEP_HANDLERS[step.type];
      if (!handler) throw new Error(`Unknown transform step: "${step.type}"`);
      return handler(current, step);
    }, env);
  };
}

/**
 * Run a pipeline defined as JSON (e.g. from config file)
 * @param {Object} env
 * @param {Array} steps
 * @returns {Object}
 */
function runPipeline(env, steps) {
  return buildPipeline(steps)(env);
}

/**
 * Serialize a pipeline to JSON string
 * @param {Array} steps
 * @returns {string}
 */
function serializePipeline(steps) {
  return JSON.stringify(steps, null, 2);
}

/**
 * Deserialize a pipeline from JSON string
 * @param {string} raw
 * @returns {Array}
 */
function deserializePipeline(raw) {
  return JSON.parse(raw);
}

module.exports = { buildPipeline, runPipeline, serializePipeline, deserializePipeline };
