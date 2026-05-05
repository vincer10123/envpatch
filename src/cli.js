#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { parse, serialize } = require('./parser');
const { diff, format } = require('./diff');
const { merge } = require('./merge');
const { validate, formatValidation } = require('./validate');
const { createPatch, applyPatch, serializePatch, deserializePatch } = require('./patch');

const [,, command, ...args] = process.argv;

function readEnvFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }
  return parse(fs.readFileSync(resolved, 'utf8'));
}

function writeFile(filePath, content) {
  fs.writeFileSync(path.resolve(filePath), content, 'utf8');
}

const commands = {
  diff(args) {
    const [fileA, fileB] = args;
    if (!fileA || !fileB) return console.error('Usage: envpatch diff <fileA> <fileB>');
    const a = readEnvFile(fileA);
    const b = readEnvFile(fileB);
    const result = diff(a, b);
    console.log(format(result));
  },

  merge(args) {
    const [base, override, output] = args;
    if (!base || !override) return console.error('Usage: envpatch merge <base> <override> [output]');
    const baseEnv = readEnvFile(base);
    const overrideEnv = readEnvFile(override);
    const merged = merge(baseEnv, overrideEnv);
    const content = serialize(merged);
    if (output) {
      writeFile(output, content);
      console.log(`Merged env written to ${output}`);
    } else {
      console.log(content);
    }
  },

  validate(args) {
    const [file, schemaFile] = args;
    if (!file || !schemaFile) return console.error('Usage: envpatch validate <file> <schema>');
    const env = readEnvFile(file);
    const schema = JSON.parse(fs.readFileSync(path.resolve(schemaFile), 'utf8'));
    const result = validate(env, schema);
    console.log(formatValidation(result));
    if (!result.valid) process.exit(1);
  },

  patch(args) {
    const [base, patchFile, output] = args;
    if (!base || !patchFile) return console.error('Usage: envpatch patch <base> <patchFile> [output]');
    const baseEnv = readEnvFile(base);
    const patchData = deserializePatch(fs.readFileSync(path.resolve(patchFile), 'utf8'));
    const patched = applyPatch(baseEnv, patchData);
    const content = serialize(patched);
    if (output) {
      writeFile(output, content);
      console.log(`Patched env written to ${output}`);
    } else {
      console.log(content);
    }
  },

  help() {
    console.log([
      'envpatch — diff and merge .env files safely',
      '',
      'Commands:',
      '  diff <fileA> <fileB>                  Show diff between two env files',
      '  merge <base> <override> [output]      Merge two env files',
      '  validate <file> <schema>              Validate env against a JSON schema',
      '  patch <base> <patchFile> [output]     Apply a patch file to an env',
    ].join('\n'));
  },
};

if (!command || !commands[command]) {
  commands.help();
  process.exit(command ? 1 : 0);
} else {
  commands[command](args);
}
