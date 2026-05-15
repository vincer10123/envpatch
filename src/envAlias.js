// envAlias.js — map keys to aliases across environments

/**
 * Build an alias map from a plain object { alias: originalKey }
 * Returns a normalized map with validation.
 */
function buildAliasMap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Alias map must be a plain object');
  }
  const map = {};
  for (const [alias, original] of Object.entries(raw)) {
    if (typeof alias !== 'string' || typeof original !== 'string') {
      throw new Error(`Invalid alias entry: ${alias} -> ${original}`);
    }
    if (alias.trim() === '' || original.trim() === '') {
      throw new Error('Alias keys and values must be non-empty strings');
    }
    map[alias.trim()] = original.trim();
  }
  return map;
}

/**
 * Apply aliases to an env object.
 * For each alias -> original, if original exists in env,
 * add the alias key with that value. Existing keys are not removed.
 */
function applyAliases(env, aliasMap) {
  const result = { ...env };
  for (const [alias, original] of Object.entries(aliasMap)) {
    if (Object.prototype.hasOwnProperty.call(env, original)) {
      result[alias] = env[original];
    }
  }
  return result;
}

/**
 * Resolve aliases in an env — replace alias keys with their canonical names.
 * If both alias and original exist, original takes precedence.
 */
function resolveAliases(env, aliasMap) {
  const result = { ...env };
  for (const [alias, original] of Object.entries(aliasMap)) {
    if (Object.prototype.hasOwnProperty.call(result, alias)) {
      if (!Object.prototype.hasOwnProperty.call(result, original)) {
        result[original] = result[alias];
      }
      delete result[alias];
    }
  }
  return result;
}

/**
 * Find alias conflicts: alias key already exists in env as a real key
 * (i.e., it's not itself an alias target).
 */
function findConflicts(env, aliasMap) {
  const conflicts = [];
  const targets = new Set(Object.values(aliasMap));
  for (const alias of Object.keys(aliasMap)) {
    if (
      Object.prototype.hasOwnProperty.call(env, alias) &&
      !targets.has(alias)
    ) {
      conflicts.push(alias);
    }
  }
  return conflicts;
}

module.exports = { buildAliasMap, applyAliases, resolveAliases, findConflicts };
