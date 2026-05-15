// envLock.js — Lock specific keys to prevent accidental overwrite during merge/apply

/**
 * Load a lock config: { locked: ['KEY1', 'KEY2'], frozen: ['KEY3'] }
 * locked = cannot be changed
 * frozen = cannot be removed
 */
function buildLockMap(lockConfig = {}) {
  return {
    locked: new Set(lockConfig.locked || []),
    frozen: new Set(lockConfig.frozen || []),
  };
}

/**
 * Check if a diff entry violates any lock rules.
 * Returns array of violation objects.
 */
function checkViolations(diffEntries, lockMap) {
  const violations = [];
  for (const entry of diffEntries) {
    if (lockMap.locked.has(entry.key) && entry.type !== 'unchanged') {
      violations.push({
        key: entry.key,
        rule: 'locked',
        type: entry.type,
        message: `Key "${entry.key}" is locked and cannot be ${entry.type}.`,
      });
    }
    if (lockMap.frozen.has(entry.key) && entry.type === 'removed') {
      violations.push({
        key: entry.key,
        rule: 'frozen',
        type: entry.type,
        message: `Key "${entry.key}" is frozen and cannot be removed.`,
      });
    }
  }
  return violations;
}

/**
 * Filter diff entries to remove any that violate locks (safe apply mode).
 */
function filterLockedEntries(diffEntries, lockMap) {
  return diffEntries.filter((entry) => {
    if (lockMap.locked.has(entry.key) && entry.type !== 'unchanged') return false;
    if (lockMap.frozen.has(entry.key) && entry.type === 'removed') return false;
    return true;
  });
}

/**
 * Format violations for human-readable output.
 */
function formatViolations(violations) {
  if (violations.length === 0) return 'No lock violations.';
  return violations.map((v) => `[${v.rule.toUpperCase()}] ${v.message}`).join('\n');
}

module.exports = { buildLockMap, checkViolations, filterLockedEntries, formatViolations };
