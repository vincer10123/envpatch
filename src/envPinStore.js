// envPinStore.js — persist and load pin configs from disk
const fs = require('fs');
const path = require('path');

function pinPath(dir, name) {
  return path.join(dir, `${name}.pins.json`);
}

/**
 * Save a pin map to disk.
 * @param {string} dir
 * @param {string} name
 * @param {Object} pinMap
 */
function savePinConfig(dir, name, pinMap) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(pinPath(dir, name), JSON.stringify(pinMap, null, 2), 'utf8');
}

/**
 * Load a pin map from disk. Returns {} if not found.
 * @param {string} dir
 * @param {string} name
 * @returns {Object}
 */
function loadPinConfig(dir, name) {
  const file = pinPath(dir, name);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * List all saved pin config names in a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function listPinConfigs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.pins.json'))
    .map((f) => f.replace('.pins.json', ''));
}

/**
 * Delete a pin config by name.
 * @param {string} dir
 * @param {string} name
 */
function deletePinConfig(dir, name) {
  const file = pinPath(dir, name);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { pinPath, savePinConfig, loadPinConfig, listPinConfigs, deletePinConfig };
