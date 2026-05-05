/**
 * snapshotStore.js — Read/write snapshots from the filesystem
 */

const fs = require('fs');
const path = require('path');
const { serializeSnapshot, deserializeSnapshot } = require('./snapshot');

const DEFAULT_DIR = '.envpatch/snapshots';

/**
 * Resolve snapshot file path
 * @param {string} label
 * @param {string} dir
 * @returns {string}
 */
function snapshotPath(label, dir = DEFAULT_DIR) {
  const safe = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(dir, `${safe}.json`);
}

/**
 * Save a snapshot to disk
 * @param {Object} snapshot
 * @param {string} dir
 */
function saveSnapshot(snapshot, dir = DEFAULT_DIR) {
  fs.mkdirSync(dir, { recursive: true });
  const filePath = snapshotPath(snapshot.label, dir);
  fs.writeFileSync(filePath, serializeSnapshot(snapshot), 'utf8');
  return filePath;
}

/**
 * Load a snapshot by label
 * @param {string} label
 * @param {string} dir
 * @returns {Object}
 */
function loadSnapshot(label, dir = DEFAULT_DIR) {
  const filePath = snapshotPath(label, dir);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot not found: ${label}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return deserializeSnapshot(raw);
}

/**
 * List all saved snapshot labels
 * @param {string} dir
 * @returns {string[]}
 */
function listSnapshots(dir = DEFAULT_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

module.exports = { saveSnapshot, loadSnapshot, listSnapshots, snapshotPath };
