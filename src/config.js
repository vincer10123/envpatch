'use strict';

/**
 * Default configuration for envpatch CLI and library behaviour.
 */

const DEFAULT_CONFIG = {
  /** Comment prefix used when serializing env files */
  commentPrefix: '#',

  /** Whether to preserve blank lines during serialization */
  preserveBlankLines: true,

  /** Whether to quote values that contain spaces */
  quoteSpacedValues: true,

  /** Quote character to use when quoting values */
  quoteChar: '"',

  /** Keys that should never appear in diffs or patches (e.g. secrets) */
  redactedKeys: [],

  /** Placeholder used in place of redacted values */
  redactedPlaceholder: '***',

  /** Diff output format: 'text' | 'json' */
  diffFormat: 'text',
};

/**
 * Load config by merging defaults with optional overrides.
 * @param {Partial<typeof DEFAULT_CONFIG>} overrides
 * @returns {typeof DEFAULT_CONFIG}
 */
function loadConfig(overrides = {}) {
  const unknown = Object.keys(overrides).filter(k => !(k in DEFAULT_CONFIG));
  if (unknown.length > 0) {
    throw new Error(`Unknown config keys: ${unknown.join(', ')}`);
  }
  return Object.assign({}, DEFAULT_CONFIG, overrides);
}

/**
 * Redact sensitive keys from an env object according to config.
 * @param {Record<string, string>} env
 * @param {typeof DEFAULT_CONFIG} config
 * @returns {Record<string, string>}
 */
function redactEnv(env, config) {
  if (!config.redactedKeys || config.redactedKeys.length === 0) return env;
  const result = Object.assign({}, env);
  for (const key of config.redactedKeys) {
    if (key in result) {
      result[key] = config.redactedPlaceholder;
    }
  }
  return result;
}

module.exports = { DEFAULT_CONFIG, loadConfig, redactEnv };
