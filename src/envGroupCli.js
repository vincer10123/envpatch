#!/usr/bin/env node
// envGroupCli.js — CLI wrapper for grouping env files by prefix or rule config

const fs = require('fs');
const path = require('path');
const { parse } = require('./parser');
const { groupByPrefix, groupByRules, formatGroups } = require('./envGroup');

function readEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw);
}

function loadGroupConfig(configPath) {
  const raw = fs.readFileSync(configPath, 'utf8');
  const json = JSON.parse(raw);
  // Convert string patterns to RegExp where indicated by leading/trailing /
  const defs = {};
  for (const [group, patterns] of Object.entries(json)) {
    defs[group] = patterns.map((p) => {
      if (typeof p === 'string' && p.startsWith('/') && p.endsWith('/')) {
        return new RegExp(p.slice(1, -1));
      }
      return p;
    });
  }
  return defs;
}

function run(argv = process.argv.slice(2)) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const flags = argv.filter((a) => a.startsWith('--'));

  const envFile = args[0];
  if (!envFile) {
    console.error('Usage: envGroupCli <envfile> [--prefix] [--rules=<config.json>]');
    process.exit(1);
  }

  const usePrefix = flags.includes('--prefix');
  const rulesFlag = flags.find((f) => f.startsWith('--rules='));
  const rulesFile = rulesFlag ? rulesFlag.split('=')[1] : null;

  const env = readEnv(envFile);
  let groups;

  if (rulesFile) {
    const defs = loadGroupConfig(path.resolve(rulesFile));
    groups = groupByRules(env, defs);
  } else if (usePrefix) {
    const sepFlag = flags.find((f) => f.startsWith('--sep='));
    const sep = sepFlag ? sepFlag.split('=')[1] : '_';
    groups = groupByPrefix(env, sep);
  } else {
    // default: group by prefix
    groups = groupByPrefix(env);
  }

  const outFlag = flags.find((f) => f.startsWith('--out='));
  const output = formatGroups(groups);

  if (outFlag) {
    const outFile = outFlag.split('=')[1];
    fs.writeFileSync(outFile, output + '\n', 'utf8');
    console.log(`Grouped env written to ${outFile}`);
  } else {
    console.log(output);
  }

  return groups;
}

if (require.main === module) run();

module.exports = { readEnv, loadGroupConfig, run };
