/**
 * template.js
 * Generate .env.example / template files from existing .env files,
 * stripping values but preserving keys, comments, and structure.
 */

const { parse, serialize } = require('./parser');
const { isSensitive } = require('./redact');

/**
 * Generate a template from a parsed env object.
 * Sensitive keys get an empty value; non-sensitive keys keep their value
 * unless `blankAll` is true.
 * @param {Record<string, string>} env
 * @param {{ blankAll?: boolean, placeholder?: string }} options
 * @returns {Record<string, string>}
 */
function generateTemplate(env, options = {}) {
  const { blankAll = false, placeholder = '' } = options;
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    if (blankAll || isSensitive(key)) {
      result[key] = placeholder;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Check whether all required keys from a template exist in the target env.
 * Returns an array of missing key names.
 * @param {Record<string, string>} template
 * @param {Record<string, string>} env
 * @returns {string[]}
 */
function checkMissingKeys(template, env) {
  return Object.keys(template).filter((key) => !(key in env));
}

/**
 * Check for keys in env that are not present in the template (extra keys).
 * @param {Record<string, string>} template
 * @param {Record<string, string>} env
 * @returns {string[]}
 */
function checkExtraKeys(template, env) {
  return Object.keys(env).filter((key) => !(key in template));
}

/**
 * Serialize a template env object to a .env.example string.
 * @param {Record<string, string>} template
 * @returns {string}
 */
function serializeTemplate(template) {
  return serialize(template);
}

/**
 * Parse a .env.example string into an env object.
 * @param {string} content
 * @returns {Record<string, string>}
 */
function deserializeTemplate(content) {
  return parse(content);
}

module.exports = {
  generateTemplate,
  checkMissingKeys,
  checkExtraKeys,
  serializeTemplate,
  deserializeTemplate,
};
