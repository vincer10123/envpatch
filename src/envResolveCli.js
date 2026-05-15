#!/usr/bin/env node
// CLI: envpatch resolve <file1> [file2 ...] [--no-interpolate] [--override KEY=VALUE] [--trace]

const fs = require('fs');
const path = require('path');
const { resolveEnvs, resolveTrace, formatResolution } = require('./envResolve');
const { parse } = require('./parser');
const { serialize } = require('./parser');

function readEnv(filePath) {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

function parseOverride(str) {
  const idx = str.indexOf('=');
  if (idx === -1) throw new Error(`Invalid override: ${str}`);
  return [str.slice(0, idx), str.slice(idx + 1)];
}

function run(argv = process.argv.slice(2)) {
  const files = [];
  const overrides = {};
  let doInterpolate = true;
  let showTrace = false;
  let outputFormat = 'env'; // env | json | trace

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-interpolate') {
      doInterpolate = false;
    } else if (arg === '--trace') {
      showTrace = true;
    } else if (arg === '--json') {
      outputFormat = 'json';
    } else if (arg === '--override' || arg === '-o') {
      const [k, v] = parseOverride(argv[++i]);
      overrides[k] = v;
    } else if (!arg.startsWith('-')) {
      files.push(arg);
    }
  }

  if (files.length === 0) {
    console.error('Usage: envpatch resolve <file1> [file2 ...] [--no-interpolate] [--override KEY=VALUE] [--trace] [--json]');
    process.exit(1);
  }

  const labels = files;
  const contents = files.map(f => readEnv(f));
  const parsedLayers = contents.map(c => parse(c));

  const { resolved, unresolved } = resolveEnvs(contents, { interpolate: doInterpolate, overrides });

  if (showTrace || outputFormat === 'trace') {
    const trace = resolveTrace(labels, parsedLayers);
    // add overrides to trace
    Object.keys(overrides).forEach(k => { trace[k] = '--override'; });
    console.log(formatResolution(resolved, trace, unresolved));
    return;
  }

  if (outputFormat === 'json') {
    console.log(JSON.stringify(resolved, null, 2));
    return;
  }

  // default: .env format
  console.log(serialize(resolved));

  if (unresolved.length > 0) {
    console.error(`\nWarning: ${unresolved.length} unresolved reference(s): ${unresolved.join(', ')}`);
  }
}

if (require.main === module) run();
module.exports = { readEnv, run };
