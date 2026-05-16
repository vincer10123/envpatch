// envPinCli.js — CLI interface for envPin: check, apply, add, list pins
const fs = require('fs');
const { parse, serialize } = require('./parser');
const { buildPinMap, checkPinViolations, applyPins, findMissingPins, formatPinViolations } = require('./envPin');
const { savePinConfig, loadPinConfig, listPinConfigs } = require('./envPinStore');

function readEnv(filePath) {
  return parse(fs.readFileSync(filePath, 'utf8'));
}

function writeEnv(filePath, env) {
  fs.writeFileSync(filePath, serialize(env), 'utf8');
}

function run(argv, storeDir = '.envpatch/pins') {
  const [command, ...args] = argv;

  if (command === 'check') {
    // envpatch pin check <envFile> <pinName>
    const [envFile, pinName] = args;
    const env = readEnv(envFile);
    const pinMap = loadPinConfig(storeDir, pinName || 'default');
    const violations = checkPinViolations(env, pinMap);
    const missing = findMissingPins(env, pinMap);
    if (violations.length === 0 && missing.length === 0) {
      console.log('All pins satisfied.');
    } else {
      if (violations.length > 0) console.log(formatPinViolations(violations));
      if (missing.length > 0) console.log(`Missing pinned keys: ${missing.join(', ')}`);
      process.exitCode = 1;
    }
    return;
  }

  if (command === 'apply') {
    // envpatch pin apply <envFile> <pinName>
    const [envFile, pinName] = args;
    const env = readEnv(envFile);
    const pinMap = loadPinConfig(storeDir, pinName || 'default');
    const result = applyPins(env, pinMap);
    writeEnv(envFile, result);
    console.log(`Applied pin config "${pinName || 'default'}" to ${envFile}.`);
    return;
  }

  if (command === 'add') {
    // envpatch pin add <pinName> KEY=VALUE [KEY=VALUE ...]
    const [pinName, ...pairs] = args;
    const existing = loadPinConfig(storeDir, pinName);
    const newPins = pairs.map((p) => {
      const idx = p.indexOf('=');
      return { key: p.slice(0, idx), value: p.slice(idx + 1) };
    });
    const updated = { ...existing, ...buildPinMap(newPins) };
    savePinConfig(storeDir, pinName, updated);
    console.log(`Saved ${newPins.length} pin(s) to "${pinName}".`);
    return;
  }

  if (command === 'list') {
    // envpatch pin list [pinName]
    const [pinName] = args;
    if (pinName) {
      const pinMap = loadPinConfig(storeDir, pinName);
      const entries = Object.entries(pinMap);
      if (entries.length === 0) console.log('No pins defined.');
      else entries.forEach(([k, v]) => console.log(`  ${k}=${v}`));
    } else {
      const names = listPinConfigs(storeDir);
      if (names.length === 0) console.log('No pin configs found.');
      else names.forEach((n) => console.log(`  ${n}`));
    }
    return;
  }

  console.error(`Unknown pin command: ${command}`);
  process.exitCode = 1;
}

module.exports = { readEnv, writeEnv, run };
