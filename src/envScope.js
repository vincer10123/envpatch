// envScope.js — Scope env vars by environment tag (e.g. dev, staging, prod)

/**
 * Build a scoped map from a flat env object using a prefix convention.
 * e.g. DEV__FOO=bar, PROD__FOO=baz => { dev: { FOO: 'bar' }, prod: { FOO: 'baz' } }
 */
function buildScopeMap(env, delimiter = '__') {
  const scopes = {};
  for (const [key, value] of Object.entries(env)) {
    const idx = key.indexOf(delimiter);
    if (idx > 0) {
      const scope = key.slice(0, idx).toLowerCase();
      const rest = key.slice(idx + delimiter.length);
      if (!scopes[scope]) scopes[scope] = {};
      scopes[scope][rest] = value;
    }
  }
  return scopes;
}

/**
 * Extract only the keys belonging to a given scope.
 */
function extractScope(env, scope, delimiter = '__') {
  const prefix = scope.toUpperCase() + delimiter;
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = value;
    }
  }
  return result;
}

/**
 * Merge a scoped env into a base env, scoped keys win.
 */
function applyScopeOverrides(base, env, scope, delimiter = '__') {
  const overrides = extractScope(env, scope, delimiter);
  return { ...base, ...overrides };
}

/**
 * List all unique scope names found in an env object.
 */
function listScopes(env, delimiter = '__') {
  const scopes = new Set();
  for (const key of Object.keys(env)) {
    const idx = key.indexOf(delimiter);
    if (idx > 0) {
      scopes.add(key.slice(0, idx).toLowerCase());
    }
  }
  return Array.from(scopes).sort();
}

/**
 * Format scope summary for display.
 */
function formatScopes(scopeMap) {
  const lines = [];
  for (const [scope, vars] of Object.entries(scopeMap)) {
    lines.push(`[${scope}]`);
    for (const [k, v] of Object.entries(vars)) {
      lines.push(`  ${k}=${v}`);
    }
  }
  return lines.join('\n');
}

module.exports = { buildScopeMap, extractScope, applyScopeOverrides, listScopes, formatScopes };
