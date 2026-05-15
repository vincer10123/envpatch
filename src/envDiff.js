// envDiff.js — Compare multiple env files and produce a structured multi-env diff

const { diff } = require('./diff');

/**
 * Compare a list of named envs against a base env.
 * Returns an object keyed by env name with their diff vs base.
 */
function diffAll(base, envs) {
  const result = {};
  for (const [name, env] of Object.entries(envs)) {
    result[name] = diff(base, env);
  }
  return result;
}

/**
 * Find keys that differ across ALL provided envs (not just vs base).
 * Returns a map of key -> { [envName]: value | undefined }
 */
function findDivergentKeys(envs) {
  const allKeys = new Set();
  for (const env of Object.values(envs)) {
    for (const key of Object.keys(env)) allKeys.add(key);
  }

  const divergent = {};
  for (const key of allKeys) {
    const values = Object.entries(envs).map(([name, env]) => [name, env[key]]);
    const unique = new Set(values.map(([, v]) => v));
    if (unique.size > 1) {
      divergent[key] = Object.fromEntries(values);
    }
  }
  return divergent;
}

/**
 * Summarise how many adds/removes/changes each env has vs base.
 */
function summarizeDiffs(diffs) {
  const summary = {};
  for (const [name, d] of Object.entries(diffs)) {
    summary[name] = {
      added: d.filter(e => e.type === 'add').length,
      removed: d.filter(e => e.type === 'remove').length,
      changed: d.filter(e => e.type === 'change').length,
    };
  }
  return summary;
}

/**
 * Format a multi-env diff as a human-readable string.
 */
function formatMultiDiff(diffs) {
  const lines = [];
  for (const [name, entries] of Object.entries(diffs)) {
    lines.push(`=== ${name} ===`);
    if (entries.length === 0) {
      lines.push('  (no changes)');
    } else {
      for (const e of entries) {
        if (e.type === 'add') lines.push(`  + ${e.key}=${e.value}`);
        else if (e.type === 'remove') lines.push(`  - ${e.key}`);
        else if (e.type === 'change') lines.push(`  ~ ${e.key}: ${e.oldValue} → ${e.value}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

module.exports = { diffAll, findDivergentKeys, summarizeDiffs, formatMultiDiff };
