/**
 * env-schema.js
 * Validate .env files against a JSON schema definition.
 * Schema format: { KEY: { type, required, pattern, default } }
 */

const VALID_TYPES = ['string', 'number', 'boolean', 'url', 'email'];

const TYPE_CHECKERS = {
  string: (v) => typeof v === 'string',
  number: (v) => !isNaN(Number(v)) && v.trim() !== '',
  boolean: (v) => v === 'true' || v === 'false' || v === '1' || v === '0',
  url: (v) => { try { new URL(v); return true; } catch { return false; } },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
};

function validateSchema(schema) {
  const errors = [];
  for (const [key, rule] of Object.entries(schema)) {
    if (rule.type && !VALID_TYPES.includes(rule.type)) {
      errors.push(`Schema error: unknown type "${rule.type}" for key "${key}"`);
    }
    if (rule.pattern) {
      try { new RegExp(rule.pattern); }
      catch { errors.push(`Schema error: invalid pattern for key "${key}"`); }
    }
  }
  return errors;
}

function checkAgainstSchema(env, schema) {
  const errors = [];
  const warnings = [];

  for (const [key, rule] of Object.entries(schema)) {
    const value = env[key];

    if (value === undefined || value === null || value === '') {
      if (rule.required) {
        errors.push(`Missing required key: ${key}`);
      } else if (rule.default !== undefined) {
        warnings.push(`Key "${key}" not set; expected default: ${rule.default}`);
      }
      continue;
    }

    if (rule.type && TYPE_CHECKERS[rule.type]) {
      if (!TYPE_CHECKERS[rule.type](value)) {
        errors.push(`Type mismatch for "${key}": expected ${rule.type}, got "${value}"`);
      }
    }

    if (rule.pattern) {
      const re = new RegExp(rule.pattern);
      if (!re.test(value)) {
        errors.push(`Pattern mismatch for "${key}": "${value}" does not match /${rule.pattern}/`);
      }
    }
  }

  const schemaKeys = new Set(Object.keys(schema));
  for (const key of Object.keys(env)) {
    if (!schemaKeys.has(key)) {
      warnings.push(`Undeclared key in schema: ${key}`);
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
}

function formatSchemaResult({ errors, warnings, valid }) {
  const lines = [];
  if (valid) lines.push('✔ Schema validation passed');
  else lines.push('✘ Schema validation failed');
  for (const e of errors) lines.push(`  ERROR: ${e}`);
  for (const w of warnings) lines.push(`  WARN:  ${w}`);
  return lines.join('\n');
}

module.exports = { validateSchema, checkAgainstSchema, formatSchemaResult };
