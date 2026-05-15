#!/usr/bin/env node
// CLI: envpatch merge-strategy <base> <incoming> [--strategy=theirs] [--show-conflicts]

const fs   = require('fs');
const path = require('path');
const { parse, serialize } = require('./parser');
const { applyStrategy, detectConflicts, formatConflicts, STRATEGIES } = require('./envMergeStrategy');

function readEnv(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return parse(fs.readFileSync(abs, 'utf8'));
}

function writeEnv(filePath, env) {
  fs.writeFileSync(path.resolve(filePath), serialize(env), 'utf8');
}

function run(argv = process.argv.slice(2), out = console) {
  const args    = argv.filter(a => !a.startsWith('--'));
  const flags   = argv.filter(a => a.startsWith('--'));

  const strategyFlag   = flags.find(f => f.startsWith('--strategy='));
  const strategy       = strategyFlag ? strategyFlag.split('=')[1] : 'theirs';
  const showConflicts  = flags.includes('--show-conflicts');
  const outputFlag     = flags.find(f => f.startsWith('--output='));
  const outputFile     = outputFlag ? outputFlag.split('=')[1] : null;

  if (args.length < 2) {
    out.error('Usage: envpatch merge-strategy <base> <incoming> [--strategy=theirs] [--show-conflicts] [--output=file]');
    out.error(`Strategies: ${STRATEGIES.join(', ')}`);
    return 1;
  }

  if (!STRATEGIES.includes(strategy) || strategy === 'interactive') {
    out.error(`Invalid strategy: ${strategy}. Choose from: ${STRATEGIES.filter(s => s !== 'interactive').join(', ')}`);
    return 1;
  }

  let base, incoming;
  try {
    base     = readEnv(args[0]);
    incoming = readEnv(args[1]);
  } catch (e) {
    out.error(e.message);
    return 1;
  }

  const conflicts = detectConflicts(base, incoming);

  if (showConflicts) {
    out.log(formatConflicts(conflicts));
  }

  const merged = applyStrategy(strategy, base, incoming);

  if (outputFile) {
    writeEnv(outputFile, merged);
    out.log(`Merged env written to ${outputFile} using '${strategy}' strategy (${conflicts.length} conflict(s) resolved).`);
  } else {
    out.log(serialize(merged));
  }

  return 0;
}

module.exports = { readEnv, writeEnv, run };

if (require.main === module) {
  process.exit(run() ?? 0);
}
