const { parse, serialize } = require('./parser');
const { diff } = require('./diff');
const { merge } = require('./merge');
const { validate } = require('./validate');

/**
 * Promote values from a source env to a target env.
 * Only keys present in source are promoted; extra keys in target are preserved.
 * @param {string} sourceContent - raw .env content of source environment
 * @param {string} targetContent - raw .env content of target environment
 * @param {object} options
 * @param {string[]} [options.only]   - whitelist of keys to promote
 * @param {string[]} [options.except] - blacklist of keys to skip
 * @returns {{ result: object, promoted: string[], skipped: string[] }}
 */
function promote(sourceContent, targetContent, options = {}) {
  const source = parse(sourceContent);
  const target = parse(targetContent);
  const { only, except } = options;

  const promoted = [];
  const skipped = [];
  const patch = {};

  for (const key of Object.keys(source)) {
    if (only && !only.includes(key)) {
      skipped.push(key);
      continue;
    }
    if (except && except.includes(key)) {
      skipped.push(key);
      continue;
    }
    if (source[key] !== target[key]) {
      patch[key] = source[key];
      promoted.push(key);
    }
  }

  const result = merge(targetContent, patch);
  return { result, promoted, skipped };
}

/**
 * Build a human-readable summary of a promotion operation.
 * @param {string[]} promoted
 * @param {string[]} skipped
 * @param {string} [from]
 * @param {string} [to]
 * @returns {string}
 */
function formatPromotionSummary(promoted, skipped, from = 'source', to = 'target') {
  const lines = [`Promotion: ${from} → ${to}`];
  if (promoted.length === 0) {
    lines.push('  No keys were promoted (environments are in sync).');
  } else {
    lines.push(`  Promoted (${promoted.length}):`);
    for (const key of promoted) lines.push(`    + ${key}`);
  }
  if (skipped.length > 0) {
    lines.push(`  Skipped (${skipped.length}):`);
    for (const key of skipped) lines.push(`    - ${key}`);
  }
  return lines.join('\n');
}

module.exports = { promote, formatPromotionSummary };
