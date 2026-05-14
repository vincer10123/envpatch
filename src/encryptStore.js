const fs = require('fs');
const path = require('path');
const { parse, serialize } = require('./parser');
const { encryptEnv, decryptEnv, isEncrypted } = require('./encrypt');
const { isSensitive } = require('./redact');

function encryptFile(filePath, passphrase, { keys = null, sensitiveOnly = false } = {}) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parse(raw);

  let targetKeys = keys;
  if (!targetKeys && sensitiveOnly) {
    targetKeys = Object.keys(env).filter(isSensitive);
  }

  const encrypted = encryptEnv(env, passphrase, targetKeys);
  fs.writeFileSync(filePath, serialize(encrypted), 'utf8');
  return encrypted;
}

function decryptFile(filePath, passphrase) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parse(raw);
  const decrypted = decryptEnv(env, passphrase);
  fs.writeFileSync(filePath, serialize(decrypted), 'utf8');
  return decrypted;
}

function encryptedKeys(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parse(raw);
  return Object.keys(env).filter(k => isEncrypted(env[k]));
}

function decryptToMemory(filePath, passphrase) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parse(raw);
  return decryptEnv(env, passphrase);
}

module.exports = { encryptFile, decryptFile, encryptedKeys, decryptToMemory };
