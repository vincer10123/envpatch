// envImport.js — parse env vars from JSON, YAML, shell export, or Docker env format

const { serialize } = require('./parser');

function fromJSON(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error('Invalid JSON: ' + e.message);
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    throw new Error('JSON must be a flat key/value object');
  }
  const result = {};
  for (const [k, v] of Object.entries(parsed)) {
    result[k] = String(v);
  }
  return result;
}

function fromYAML(content) {
  // minimal YAML: only flat key: value pairs, no nesting
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();
    // strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

function fromShell(content) {
  // parse `export KEY=VALUE` or `KEY=VALUE` lines
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim().replace(/^export\s+/, '');
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

function fromDockerEnv(content) {
  // Docker env-file format: KEY=VALUE, no export, no quotes handling beyond basic
  return fromShell(content);
}

const FORMATS = { json: fromJSON, yaml: fromYAML, shell: fromShell, docker: fromDockerEnv };

function importEnv(content, format) {
  const fn = FORMATS[format];
  if (!fn) throw new Error(`Unknown import format: ${format}. Use: ${Object.keys(FORMATS).join(', ')}`);
  return fn(content);
}

module.exports = { fromJSON, fromYAML, fromShell, fromDockerEnv, importEnv };
