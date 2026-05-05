/**
 * snapshot.js — Capture and compare env file snapshots over time
 */

const crypto = require('crypto');
const { parse, serialize } = require('./parser');
const { diff } = require('./diff');

/**
 * Create a snapshot of a parsed env object
 * @param {Object} env - parsed env key/value map
 * @param {Object} meta - optional metadata (label, timestamp, etc.)
 * @returns {Object} snapshot
 */
function createSnapshot(env, meta = {}) {
  const timestamp = meta.timestamp || new Date().toISOString();
  const label = meta.label || 'snapshot';
  const hash = hashEnv(env);
  return { label, timestamp, hash, env: { ...env } };
}

/**
 * Compute a stable SHA-256 hash of an env map
 * @param {Object} env
 * @returns {string} hex hash
 */
function hashEnv(env) {
  const sorted = Object.keys(env)
    .sort()
    .map((k) => `${k}=${env[k]}`)
    .join('\n');
  return crypto.createHash('sha256').update(sorted).digest('hex').slice(0, 16);
}

/**
 * Compare two snapshots and return a diff summary
 * @param {Object} snapshotA
 * @param {Object} snapshotB
 * @returns {Object} { changed: bool, diff: Object }
 */
function compareSnapshots(snapshotA, snapshotB) {
  if (snapshotA.hash === snapshotB.hash) {
    return { changed: false, diff: null };
  }
  const result = diff(snapshotA.env, snapshotB.env);
  return { changed: true, diff: result };
}

/**
 * Serialize a snapshot to a JSON string
 * @param {Object} snapshot
 * @returns {string}
 */
function serializeSnapshot(snapshot) {
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Deserialize a snapshot from a JSON string
 * @param {string} raw
 * @returns {Object}
 */
function deserializeSnapshot(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed.hash || !parsed.env || !parsed.timestamp) {
    throw new Error('Invalid snapshot format');
  }
  return parsed;
}

module.exports = { createSnapshot, hashEnv, compareSnapshots, serializeSnapshot, deserializeSnapshot };
