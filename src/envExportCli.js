#!/usr/bin/env node
// envExportCli.js — CLI for exporting .env files to other formats

const fs = require('fs');
const path = require('path');
const { parse } = require('./parser');
const { exportEnv } = require('./envExport');
const { redactEnv } = require('./redact');

const FORMATS = ['json', 'yaml', 'shell', 'docker'];

function readEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw);
}

function run(argv = process.argv.slice(2)) {
  const args = [...argv];

  let format = 'json';
  let outputFile = null;
  let redact = false;
  const inputs = [];

  while (args.length) {
    const arg = args.shift();
    if (arg === '--format' || arg === '-f') {
      format = args.shift();
      if (!FORMATS.includes(format)) {
        console.error(`Error: unsupported format "${format}". Choose from: ${FORMATS.join(', ')}`);
        process.exit(1);
      }
    } else if (arg === '--output' || arg === '-o') {
      outputFile = args.shift();
    } else if (arg === '--redact') {
      redact = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log([
        'Usage: envpatch export [options] <file>',
        '',
        'Options:',
        '  -f, --format <fmt>   Output format: json, yaml, shell, docker (default: json)',
        '  -o, --output <file>  Write output to file instead of stdout',
        '  --redact             Redact sensitive values before export',
        '  -h, --help           Show this help',
      ].join('\n'));
      return;
    } else {
      inputs.push(arg);
    }
  }

  if (inputs.length === 0) {
    console.error('Error: no input file specified.');
    process.exit(1);
  }

  let env = readEnv(inputs[0]);

  if (redact) {
    env = redactEnv(env);
  }

  const output = exportEnv(env, format);

  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, output + '\n', 'utf8');
    console.log(`Exported to ${outputFile} (format: ${format})`);
  } else {
    process.stdout.write(output + '\n');
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, readEnv };
