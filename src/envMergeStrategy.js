// Merge strategies for combining multiple .env files with conflict resolution

const STRATEGIES = ['ours', 'theirs', 'interactive', 'union', 'intersection'];

/**
 * Apply 'ours' strategy: keep base values on conflict
 */
function strategyOurs(base, incoming) {
  const result = { ...incoming };
  for (const key of Object.keys(base)) {
    result[key] = base[key];
  }
  return result;
}

/**
 * Apply 'theirs' strategy: incoming values win on conflict
 */
function strategyTheirs(base, incoming) {
  return { ...base, ...incoming };
}

/**
 * Apply 'union' strategy: include all keys, prefer incoming on conflict
 */
function strategyUnion(base, incoming) {
  return { ...base, ...incoming };
}

/**
 * Apply 'intersection' strategy: only keys present in both, prefer incoming
 */
function strategyIntersection(base, incoming) {
  const result = {};
  for (const key of Object.keys(base)) {
    if (key in incoming) {
      result[key] = incoming[key];
    }
  }
  return result;
}

/**
 * Detect conflicts between two env objects
 * Returns array of { key, baseValue, incomingValue }
 */
function detectConflicts(base, incoming) {
  const conflicts = [];
  for (const key of Object.keys(incoming)) {
    if (key in base && base[key] !== incoming[key]) {
      conflicts.push({ key, baseValue: base[key], incomingValue: incoming[key] });
    }
  }
  return conflicts;
}

/**
 * Apply a named merge strategy to two env objects
 */
function applyStrategy(strategy, base, incoming) {
  if (!STRATEGIES.includes(strategy)) {
    throw new Error(`Unknown merge strategy: ${strategy}. Valid: ${STRATEGIES.join(', ')}`);
  }
  switch (strategy) {
    case 'ours':         return strategyOurs(base, incoming);
    case 'theirs':       return strategyTheirs(base, incoming);
    case 'union':        return strategyUnion(base, incoming);
    case 'intersection': return strategyIntersection(base, incoming);
    case 'interactive':  throw new Error('interactive strategy requires CLI context; use detectConflicts + resolve manually');
  }
}

/**
 * Format a human-readable conflict summary
 */
function formatConflicts(conflicts) {
  if (conflicts.length === 0) return 'No conflicts detected.';
  const lines = [`${conflicts.length} conflict(s) detected:`];
  for (const { key, baseValue, incomingValue } of conflicts) {
    lines.push(`  ${key}`);
    lines.push(`    base:     ${baseValue}`);
    lines.push(`    incoming: ${incomingValue}`);
  }
  return lines.join('\n');
}

module.exports = { applyStrategy, detectConflicts, formatConflicts, STRATEGIES };
