const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(passphrase, salt) {
  return crypto.scryptSync(passphrase, salt, KEY_LENGTH);
}

function encryptValue(value, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([salt, iv, tag, encrypted]);
  return 'enc:' + payload.toString('base64');
}

function decryptValue(encryptedValue, passphrase) {
  if (!encryptedValue.startsWith('enc:')) {
    throw new Error('Value is not encrypted');
  }
  const payload = Buffer.from(encryptedValue.slice(4), 'base64');
  const salt = payload.subarray(0, 16);
  const iv = payload.subarray(16, 16 + IV_LENGTH);
  const tag = payload.subarray(16 + IV_LENGTH, 16 + IV_LENGTH + TAG_LENGTH);
  const encrypted = payload.subarray(16 + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('enc:');
}

function encryptEnv(env, passphrase, keys = null) {
  const result = {};
  for (const [k, v] of Object.entries(env)) {
    if (v === null || v === undefined) {
      result[k] = v;
    } else if (keys === null || keys.includes(k)) {
      result[k] = isEncrypted(v) ? v : encryptValue(v, passphrase);
    } else {
      result[k] = v;
    }
  }
  return result;
}

function decryptEnv(env, passphrase) {
  const result = {};
  for (const [k, v] of Object.entries(env)) {
    result[k] = v && isEncrypted(v) ? decryptValue(v, passphrase) : v;
  }
  return result;
}

module.exports = { encryptValue, decryptValue, isEncrypted, encryptEnv, decryptEnv };
