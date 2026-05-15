#!/usr/bin/env node
// envDiffCli.js — CLI for multi-env diff comparison

const fs = require('fs');
const path = require('path');
const { parse } = require('./parser');
const { diffAll, summarizeDiffs, formatMultiDiff, findDivergentKeys } = require('./envDiff');

function readEnv(filePath) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  return parse(content);
}

function run(argv = process.argv.slice(2)) {
  const args = argv.filter(a => !a.startsWith('--'));
  const flags = argv.filter(a => a.startsWith('--'));

  const showSummary = flags.includes('--summary');
  const showDivergent = flags.includes('--divergent');

  if (args.length < 2) {
    console.error('Usage: envDiffCli <base.env> <env1.env> [env2.env ...] [--summary] [--divergent]');
    process.exit(1);
  }

  const [basePath, ...envPaths] = args;

  let base;
  try {
    base = readEnv(basePath);
  } catch (e) {
    console.error(`Failed to read base file: ${basePath}`);
    process.exit(1);
  }

  const envs = {};
  for (const p of envPaths) {
    const name = path.basename(p, path.extname(p));
    try {
      envs[name] = readEnv(p);
    } catch (e) {
      console.error(`Failed to read env file: ${p}`);
      process.exit(1);
    }
  }

  if (showDivergent) {
    const divergent = findDivergentKeys({ base, ...envs });
    const keys = Object.keys(divergent);
    if (keys.length === 0) {
      console.log('No divergent keys found.');
    } else {
      console.log(`Divergent keys (${keys.length}):\n`);
      for (const [key, vals] of Object.entries(divergent)) {
        console.log(`  ${key}:`);
        for (const [env, val] of Object.entries(vals)) {
          console.log(`    ${env}: ${val === undefined ? '(missing)' : val}`);
        }
      }
    }
    return;
  }

  const diffs = diffAll(base, envs);

  if (showSummary) {
    const summary = summarizeDiffs(diffs);
    console.log('Diff summary vs base:\n');
    for (const [name, s] of Object.entries(summary)) {
      console.log(`  ${name}: +${s.added} -${s.removed} ~${s.changed}`);
    }
    return;
  }

  console.log(formatMultiDiff(diffs));
}

if (require.main === module) run();

module.exports = { readEnv, run };
