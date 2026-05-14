/**
 * interpolate.js
 * Resolve variable references within .env files (e.g. BASE_URL=${HOST}:${PORT})
 */

/**
 * Expand variable references in a single value string.
 * References: ${VAR} or $VAR
 * Lookup order: provided env map, then process.env, then fallback ''
 */
function expandValue(value, env, seen = new Set()) {
  if (!value || !value.includes('$')) return value;

  return value.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/gi, (match, braced, bare) => {
    const key = braced || bare;

    if (seen.has(key)) {
      // Circular reference — leave as-is
      return match;
    }

    if (Object.prototype.hasOwnProperty.call(env, key)) {
      const nested = env[key];
      // Recursively expand in case the referenced value itself has references
      return expandValue(nested, env, new Set([...seen, key]));
    }

    if (Object.prototype.hasOwnProperty.call(process.env, key)) {
      return process.env[key];
    }

    return '';
  });
}

/**
 * Interpolate all values in an env map.
 * Returns a new map with all variable references resolved.
 */
function interpolate(env) {
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = expandValue(value, env);
  }
  return result;
}

/**
 * Find all unresolved references in an env map after interpolation.
 * Returns array of { key, ref } objects.
 */
function findUnresolved(env) {
  const interpolated = interpolate(env);
  const unresolved = [];

  for (const [key, value] of Object.entries(interpolated)) {
    const refs = [...value.matchAll(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/gi)];
    for (const match of refs) {
      unresolved.push({ key, ref: match[1] || match[2] });
    }
  }

  return unresolved;
}

module.exports = { expandValue, interpolate, findUnresolved };
