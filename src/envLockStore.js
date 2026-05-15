// envLockStore.js — Persist and load lock configs from disk
const fs = require('fs');
const path = require('path');

function lockPath(dir, name = 'default') {
  return path.join(dir, `${name}.lock.json`);
}

function saveLockConfig(dir, config, name = 'default') {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = lockPath(dir, name);
  fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf8');
}

function loadLockConfig(dir, name = 'default') {
  const file = lockPath(dir, name);
  if (!fs.existsSync(file)) return { locked: [], frozen: [] };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listLockConfigs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.lock.json'))
    .map((f) => f.replace('.lock.json', ''));
}

function deleteLockConfig(dir, name = 'default') {
  const file = lockPath(dir, name);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { lockPath, saveLockConfig, loadLockConfig, listLockConfigs, deleteLockConfig };
