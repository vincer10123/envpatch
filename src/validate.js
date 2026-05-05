/**
 * Validate .env files against a schema (template) file.
 * The schema defines required keys; values are ignored.
 */

/**
 * @param {Record<string, string>} parsed - parsed env object to validate
 * @param {Record<string, string>} schema - parsed env object used as the schema/template
 * @returns {{ valid: boolean, missing: string[], extra: string[] }}
 */
function validate(parsed, schema) {
  const schemaKeys = new Set(Object.keys(schema));
  const parsedKeys = new Set(Object.keys(parsed));

  const missing = [...schemaKeys].filter((k) => !parsedKeys.has(k));
  const extra = [...parsedKeys].filter((k) => !schemaKeys.has(k));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Format a validation result into a human-readable string.
 * @param {{ valid: boolean, missing: string[], extra: string[] }} result
 * @returns {string}
 */
function formatValidation(result) {
  if (result.valid && result.extra.length === 0) {
    return '✓ Environment is valid and complete.';
  }

  const lines = [];

  if (!result.valid) {
    lines.push('✗ Missing required keys:');
    result.missing.forEach((k) => lines.push(`  - ${k}`));
  }

  if (result.extra.length > 0) {
    lines.push('⚠ Extra keys not in schema:');
    result.extra.forEach((k) => lines.push(`  + ${k}`));
  }

  return lines.join('\n');
}

module.exports = { validate, formatValidation };
