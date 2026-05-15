#!/usr/bin/env node
/**
 * envCompareCli.js — CLI entry for comparing multiple .env files
 * Usage: node envCompareCli.js <base> <target1> [target2 ...] [--redact] [--matrix] [--json]
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('./parser');
const { compareAll, buildMatrix, findInconsistentKeys, formatComparison } = require('./envCompare');

function readEnv(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return parse(fs.readFileSync(abs, 'utf8'));
}

function run(argv = process.argv.slice(2)) {
  const flags = argv.filter(a => a.startsWith('--'));
  const files = argv.filter(a => !a.startsWith('--'));

  const redact = flags.includes('--redact');
  const matrix = flags.includes('--matrix');
  const json = flags.includes('--json');

  if (files.length < 2) {
    console.error('Usage: envpatch-compare <base> <target1> [target2 ...] [--redact] [--matrix] [--json]');
    process.exit(1);
  }

  const [baseFile, ...targetFiles] = files;

  let baseEnv;
  try {
    baseEnv = readEnv(baseFile);
  } catch (e) {
    console.error(`Error reading base file: ${e.message}`);
    process.exit(1);
  }

  const targets = {};
  for (const f of targetFiles) {
    const name = path.basename(f);
    try {
      targets[name] = readEnv(f);
    } catch (e) {
      console.error(`Error reading ${f}: ${e.message}`);
      process.exit(1);
    }
  }

  if (matrix) {
    const allEnvs = { [path.basename(baseFile)]: baseEnv, ...targets };
    const rows = buildMatrix(allEnvs);
    const inconsistent = findInconsistentKeys(allEnvs);
    if (json) {
      console.log(JSON.stringify({ matrix: rows, inconsistent }, null, 2));
    } else {
      console.log('Key matrix:');
      rows.forEach(row => {
        const vals = Object.entries(row)
          .filter(([k]) => k !== 'key')
          .map(([k, v]) => `${k}=${v ?? '(missing)'}`)
          .join('  ');
        console.log(`  ${row.key}: ${vals}`);
      });
      if (inconsistent.length) {
        console.log(`\nInconsistent keys (${inconsistent.length}):`);
        inconsistent.forEach(({ key, missingIn }) =>
          console.log(`  ${key} missing in: ${missingIn.join(', ')}`)
        );
      }
    }
    return;
  }

  const result = compareAll(baseEnv, targets, { redact });
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatComparison(result));
  }
}

if (require.main === module) run();
module.exports = { run };
