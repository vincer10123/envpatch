#!/usr/bin/env node
// envAliasCli.js — CLI wrapper for env alias operations

const fs = require('fs');
const path = require('path');
const { parse, serialize } = require('./parser');
const { buildAliasMap, applyAliases, resolveAliases, findConflicts } = require('./envAlias');

function readEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw);
}

function writeEnv(filePath, env) {
  fs.writeFileSync(filePath, serialize(env), 'utf8');
}

function loadAliasConfig(configPath) {
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed.aliases) throw new Error('Config must have an "aliases" key');
  return buildAliasMap(parsed.aliases);
}

function run(argv = process.argv.slice(2)) {
  const [command, envFile, configFile, outFile] = argv;

  if (!command || !envFile || !configFile) {
    console.error('Usage: envAliasCli <apply|resolve|check> <envFile> <aliasConfig> [outFile]');
    process.exit(1);
  }

  const env = readEnv(envFile);
  const aliasMap = loadAliasConfig(configFile);

  if (command === 'apply') {
    const result = applyAliases(env, aliasMap);
    const dest = outFile || envFile;
    writeEnv(dest, result);
    console.log(`Applied ${Object.keys(aliasMap).length} alias(es) -> ${dest}`);

  } else if (command === 'resolve') {
    const conflicts = findConflicts(env, aliasMap);
    if (conflicts.length > 0) {
      console.warn(`Warning: conflicting alias keys found: ${conflicts.join(', ')}`);
    }
    const result = resolveAliases(env, aliasMap);
    const dest = outFile || envFile;
    writeEnv(dest, result);
    console.log(`Resolved ${Object.keys(aliasMap).length} alias(es) -> ${dest}`);

  } else if (command === 'check') {
    const conflicts = findConflicts(env, aliasMap);
    if (conflicts.length === 0) {
      console.log('No alias conflicts found.');
    } else {
      console.warn('Alias conflicts detected:');
      for (const key of conflicts) {
        console.warn(`  ${key} -> ${aliasMap[key]}`);
      }
      process.exit(1);
    }

  } else {
    console.error(`Unknown command: ${command}. Use apply, resolve, or check.`);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, readEnv, writeEnv, loadAliasConfig };
