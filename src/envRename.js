// Bulk rename keys across an env object using a rename map
// rename map: { oldKey: newKey, ... }

function renameKeys(env, renameMap) {
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    const newKey = renameMap[key] ?? key;
    result[newKey] = value;
  }
  return result;
}

function buildRenameMap(pairs) {
  // pairs: array of { from, to }
  const map = {};
  for (const { from, to } of pairs) {
    if (!from || !to) throw new Error(`Invalid rename pair: ${JSON.stringify({ from, to })}`);
    map[from] = to;
  }
  return map;
}

function detectCollisions(env, renameMap) {
  const collisions = [];
  const incoming = new Set(Object.values(renameMap));
  for (const key of Object.keys(env)) {
    if (incoming.has(key) && !renameMap[key]) {
      collisions.push(key);
    }
  }
  return collisions;
}

function renameSummary(env, renameMap) {
  const renamed = [];
  const missing = [];
  for (const [from, to] of Object.entries(renameMap)) {
    if (Object.prototype.hasOwnProperty.call(env, from)) {
      renamed.push({ from, to });
    } else {
      missing.push(from);
    }
  }
  return { renamed, missing };
}

function formatRenameSummary(summary) {
  const lines = [];
  for (const { from, to } of summary.renamed) {
    lines.push(`  renamed: ${from} -> ${to}`);
  }
  for (const key of summary.missing) {
    lines.push(`  missing: ${key} (not found in env)`);
  }
  return lines.join('\n');
}

module.exports = { renameKeys, buildRenameMap, detectCollisions, renameSummary, formatRenameSummary };
