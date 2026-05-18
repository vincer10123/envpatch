#!/usr/bin/env node
// envScopeCli.js — CLI for env scope operations

const fs = require('fs');
const path = require('path');
const { parse, serialize } = require('./parser');
const { buildScopeMap, extractScope, applyScopeOverrides, listScopes, formatScopes } = require('./envScope');

function readEnv(filePath) {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
  return parse(raw);
}

function writeEnv(filePath, env) {
  fs.writeFileSync(path.resolve(filePath), serialize(env), 'utf8');
}

function run(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;

  if (command === 'list') {
    const [file] = args;
    if (!file) { console.error('Usage: envScopeCli list <file>'); process.exit(1); }
    const env = readEnv(file);
    const scopes = listScopes(env);
    if (scopes.length === 0) {
      console.log('No scopes found.');
    } else {
      console.log('Scopes: ' + scopes.join(', '));
    }
    return;
  }

  if (command === 'show') {
    const [file] = args;
    if (!file) { console.error('Usage: envScopeCli show <file>'); process.exit(1); }
    const env = readEnv(file);
    const map = buildScopeMap(env);
    console.log(formatScopes(map));
    return;
  }

  if (command === 'extract') {
    const [scope, file, outFile] = args;
    if (!scope || !file) { console.error('Usage: envScopeCli extract <scope> <file> [outFile]'); process.exit(1); }
    const env = readEnv(file);
    const extracted = extractScope(env, scope);
    const output = serialize(extracted);
    if (outFile) {
      writeEnv(outFile, extracted);
      console.log(`Written to ${outFile}`);
    } else {
      console.log(output);
    }
    return;
  }

  if (command === 'apply') {
    const [scope, baseFile, scopedFile, outFile] = args;
    if (!scope || !baseFile || !scopedFile) {
      console.error('Usage: envScopeCli apply <scope> <baseFile> <scopedFile> [outFile]');
      process.exit(1);
    }
    const base = readEnv(baseFile);
    const scopedEnv = readEnv(scopedFile);
    const merged = applyScopeOverrides(base, scopedEnv, scope);
    if (outFile) {
      writeEnv(outFile, merged);
      console.log(`Written to ${outFile}`);
    } else {
      console.log(serialize(merged));
    }
    return;
  }

  console.error('Commands: list, show, extract, apply');
  process.exit(1);
}

if (require.main === module) run();
module.exports = { readEnv, writeEnv, run };
