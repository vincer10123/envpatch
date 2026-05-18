#!/usr/bin/env node
// CLI: envpatch rename --file .env --from OLD_KEY --to NEW_KEY [--from ... --to ...] [--out .env]

const fs = require('fs');
const path = require('path');
const { parse, serialize } = require('./parser');
const { buildRenameMap, renameKeys, detectCollisions, renameSummary, formatRenameSummary } = require('./envRename');

function readEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content);
}

function writeEnv(filePath, env) {
  fs.writeFileSync(filePath, serialize(env), 'utf8');
}

function run(argv = process.argv.slice(2)) {
  const args = argv.slice();
  let file = null;
  let out = null;
  const pairs = [];
  let froms = [];
  let tos = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' || args[i] === '-f') file = args[++i];
    else if (args[i] === '--out' || args[i] === '-o') out = args[++i];
    else if (args[i] === '--from') froms.push(args[++i]);
    else if (args[i] === '--to') tos.push(args[++i]);
  }

  if (!file) {
    console.error('Usage: envpatch rename --file <env> --from OLD --to NEW [--out <env>]');
    process.exit(1);
  }

  if (froms.length !== tos.length || froms.length === 0) {
    console.error('Each --from must have a matching --to');
    process.exit(1);
  }

  for (let i = 0; i < froms.length; i++) {
    pairs.push({ from: froms[i], to: tos[i] });
  }

  const renameMap = buildRenameMap(pairs);
  const env = readEnv(file);

  const collisions = detectCollisions(env, renameMap);
  if (collisions.length > 0) {
    console.warn(`Warning: rename targets already exist as keys: ${collisions.join(', ')}`);
  }

  const summary = renameSummary(env, renameMap);
  const renamed = renameKeys(env, renameMap);

  const outFile = out || file;
  writeEnv(outFile, renamed);

  console.log(formatRenameSummary(summary));
  console.log(`Written to ${path.resolve(outFile)}`);
}

if (require.main === module) run();

module.exports = { readEnv, writeEnv, run };
