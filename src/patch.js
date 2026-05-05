const { diff } = require('./diff');
const { merge } = require('./merge');
const { parse, serialize } = require('./parser');
const { validate } = require('./validate');

/**
 * Generate a patch object from base to target env strings
 * @param {string} baseContent - raw .env content (base)
 * @param {string} targetContent - raw .env content (target)
 * @returns {object} patch descriptor
 */
function createPatch(baseContent, targetContent) {
  const base = parse(baseContent);
  const target = parse(targetContent);
  const changes = diff(base, target);

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    changes,
  };
}

/**
 * Apply a patch object to a base env string
 * @param {string} baseContent - raw .env content
 * @param {object} patch - patch descriptor produced by createPatch
 * @param {object} [options]
 * @param {boolean} [options.strict=false] - throw on validation errors
 * @returns {{ content: string, warnings: string[] }}
 */
function applyPatch(baseContent, patch, options = {}) {
  const { strict = false } = options;

  if (!patch || patch.version !== 1) {
    throw new Error('Invalid or unsupported patch version');
  }

  const base = parse(baseContent);
  const merged = merge(base, patch.changes);

  const validation = validate(merged);
  if (strict && !validation.valid) {
    throw new Error(
      'Patch produced invalid env:\n' + validation.errors.join('\n')
    );
  }

  return {
    content: serialize(merged),
    warnings: validation.warnings || [],
  };
}

/**
 * Serialize a patch descriptor to JSON string
 * @param {object} patch
 * @returns {string}
 */
function serializePatch(patch) {
  return JSON.stringify(patch, null, 2);
}

/**
 * Parse a JSON patch string back into a patch descriptor
 * @param {string} json
 * @returns {object}
 */
function deserializePatch(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error('Failed to parse patch JSON: ' + e.message);
  }
}

module.exports = { createPatch, applyPatch, serializePatch, deserializePatch };
