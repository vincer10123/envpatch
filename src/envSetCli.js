'use strict';

/**
 * envSetCli.js — CLI subcommand handlers for set/unset/rename operations
 */

const fs = require('fs');
const path = require('path');
const { parse, serialize } = require('./parser');
const { setKey, unsetKey, updateKeys, renameKey } = require('./envSet');

function readEnv(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return parse(fs.readFileSync(abs, 'utf8'));
}

function writeEnv(filePath, env) {
  fs.writeFileSync(path.resolve(filePath), serialize(env), 'utf8');
}

/**
 * CLI handler: set KEY=VALUE in a .env file
 */
function cliSet(filePath, key, value, opts = {}) {
  const env = readEnv(filePath);
  const existed = key in env;
  const updated = setKey(env, key, value);
  writeEnv(filePath, updated);
  if (!opts.quiet) {
    console.log(existed ? `Updated ${key}` : `Added ${key}`);
  }
}

/**
 * CLI handler: unset KEY in a .env file
 */
function cliUnset(filePath, key, opts = {}) {
  const env = readEnv(filePath);
  if (!(key in env)) {
    if (!opts.quiet) console.warn(`Key "${key}" not present, nothing to unset.`);
    return;
  }
  const updated = unsetKey(env, key);
  writeEnv(filePath, updated);
  if (!opts.quiet) console.log(`Removed ${key}`);
}

/**
 * CLI handler: rename OLD_KEY NEW_KEY in a .env file
 */
function cliRename(filePath, oldKey, newKey, opts = {}) {
  const env = readEnv(filePath);
  const updated = renameKey(env, oldKey, newKey);
  writeEnv(filePath, updated);
  if (!opts.quiet) console.log(`Renamed ${oldKey} → ${newKey}`);
}

/**
 * CLI handler: apply a JSON patch of updates to a .env file
 * Patch format: { KEY: "value" } or { KEY: null } to remove
 */
function cliPatch(filePath, patchJson, opts = {}) {
  const updates = JSON.parse(patchJson);
  const env = readEnv(filePath);
  const updated = updateKeys(env, updates);
  writeEnv(filePath, updated);
  if (!opts.quiet) console.log(`Applied patch with ${Object.keys(updates).length} change(s)`);
}

module.exports = { cliSet, cliUnset, cliRename, cliPatch };
