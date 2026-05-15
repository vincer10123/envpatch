#!/usr/bin/env node
// envImportCli.js — CLI for importing env vars from various formats into a .env file

const fs = require('fs');
const path = require('path');
const { importEnv } = require('./envImport');
const { serialize } = require('./parser');
const { parse } = require('./parser');

function readFile(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function writeEnv(filePath, env) {
  fs.writeFileSync(filePath, serialize(env), 'utf8');
}

function run(argv = process.argv.slice(2)) {
  const args = argv.filter(a => !a.startsWith('--'));
  const flags = argv.filter(a => a.startsWith('--'));

  const getFlag = (name) => {
    const f = flags.find(f => f.startsWith(`--${name}=`));
    return f ? f.split('=').slice(1).join('=') : null;
  };
  const hasFlag = (name) => flags.includes(`--${name}`);

  const [inputFile, outputFile] = args;
  const format = getFlag('format') || 'json';
  const merge = hasFlag('merge');

  if (!inputFile || !outputFile) {
    console.error('Usage: envImportCli <inputFile> <outputFile> --format=<json|yaml|shell|docker> [--merge]');
    process.exit(1);
  }

  let content;
  try {
    content = readFile(inputFile);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  let imported;
  try {
    imported = importEnv(content, format);
  } catch (e) {
    console.error('Import error: ' + e.message);
    process.exit(1);
  }

  let final = imported;
  if (merge && fs.existsSync(outputFile)) {
    const existing = parse(readFile(outputFile));
    final = { ...existing, ...imported };
  }

  writeEnv(outputFile, final);
  const count = Object.keys(imported).length;
  console.log(`Imported ${count} key(s) from ${path.basename(inputFile)} (${format}) → ${path.basename(outputFile)}${merge ? ' [merged]' : ''}`);
}

if (require.main === module) run();

module.exports = { readFile, writeEnv, run };
