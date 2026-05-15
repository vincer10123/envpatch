/**
 * envSet.js — Safely set, unset, and update individual keys in a parsed env object
 */

'use strict';

/**
 * Set a key in an env object, returning a new object.
 * @param {Record<string,string>} env
 * @param {string} key
 * @param {string} value
 * @returns {Record<string,string>}
 */
function setKey(env, key, value) {
  if (!key || typeof key !== 'string') throw new Error('Key must be a non-empty string');
  if (typeof value !== 'string') throw new Error('Value must be a string');
  return { ...env, [key]: value };
}

/**
 * Unset (delete) a key from an env object, returning a new object.
 * @param {Record<string,string>} env
 * @param {string} key
 * @returns {Record<string,string>}
 */
function unsetKey(env, key) {
  if (!key || typeof key !== 'string') throw new Error('Key must be a non-empty string');
  const result = { ...env };
  delete result[key];
  return result;
}

/**
 * Update multiple keys at once using a patch object.
 * Keys with value null are removed.
 * @param {Record<string,string>} env
 * @param {Record<string,string|null>} updates
 * @returns {Record<string,string>}
 */
function updateKeys(env, updates) {
  let result = { ...env };
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) {
      delete result[key];
    } else if (typeof value === 'string') {
      result[key] = value;
    } else {
      throw new Error(`Invalid value for key "${key}": must be string or null`);
    }
  }
  return result;
}

/**
 * Rename a key, preserving value. Throws if source key does not exist.
 * @param {Record<string,string>} env
 * @param {string} oldKey
 * @param {string} newKey
 * @returns {Record<string,string>}
 */
function renameKey(env, oldKey, newKey) {
  if (!(oldKey in env)) throw new Error(`Key "${oldKey}" not found in env`);
  if (!newKey || typeof newKey !== 'string') throw new Error('New key must be a non-empty string');
  const result = { ...env, [newKey]: env[oldKey] };
  if (oldKey !== newKey) delete result[oldKey];
  return result;
}

module.exports = { setKey, unsetKey, updateKeys, renameKey };
