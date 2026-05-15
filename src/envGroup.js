// envGroup.js — group and organize env keys by prefix or custom rules

/**
 * Group env keys by their prefix (e.g. DB_HOST -> group 'DB')
 * @param {Object} env
 * @param {string} separator
 * @returns {Object} map of group name -> { key: value }
 */
function groupByPrefix(env, separator = '_') {
  const groups = {};
  for (const [key, value] of Object.entries(env)) {
    const idx = key.indexOf(separator);
    const group = idx !== -1 ? key.slice(0, idx) : '__ungrouped__';
    if (!groups[group]) groups[group] = {};
    groups[group][key] = value;
  }
  return groups;
}

/**
 * Group env keys by a custom mapping of groupName -> key patterns (strings or RegExp)
 * @param {Object} env
 * @param {Object} groupDefs  e.g. { database: [/^DB_/], cache: ['REDIS_URL'] }
 * @returns {Object}
 */
function groupByRules(env, groupDefs) {
  const groups = {};
  const matched = new Set();

  for (const [groupName, patterns] of Object.entries(groupDefs)) {
    groups[groupName] = {};
    for (const [key, value] of Object.entries(env)) {
      for (const pattern of patterns) {
        const hits =
          pattern instanceof RegExp ? pattern.test(key) : key === pattern;
        if (hits) {
          groups[groupName][key] = value;
          matched.add(key);
        }
      }
    }
  }

  // collect unmatched keys
  const ungrouped = {};
  for (const [key, value] of Object.entries(env)) {
    if (!matched.has(key)) ungrouped[key] = value;
  }
  if (Object.keys(ungrouped).length) groups['__ungrouped__'] = ungrouped;

  return groups;
}

/**
 * Flatten grouped env back to a single flat object (groups are just metadata)
 * @param {Object} groups
 * @returns {Object}
 */
function flattenGroups(groups) {
  const env = {};
  for (const keys of Object.values(groups)) {
    Object.assign(env, keys);
  }
  return env;
}

/**
 * Format grouped env as a readable string with section headers
 * @param {Object} groups
 * @returns {string}
 */
function formatGroups(groups) {
  const lines = [];
  for (const [group, keys] of Object.entries(groups)) {
    lines.push(`# --- ${group} ---`);
    for (const [key, value] of Object.entries(keys)) {
      lines.push(`${key}=${value}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

module.exports = { groupByPrefix, groupByRules, flattenGroups, formatGroups };
