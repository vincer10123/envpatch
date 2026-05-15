// envLockCli.js — CLI commands for managing env lock configs
const fs = require('fs');
const { parse } = require('./parser');
const { diff } = require('./diff');
const { buildLockMap, checkViolations, filterLockedEntries, formatViolations } = require('./envLock');
const { saveLockConfig, loadLockConfig, listLockConfigs, deleteLockConfig } = require('./envLockStore');

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parse(fs.readFileSync(filePath, 'utf8'));
}

function run(argv, lockDir = '.envpatch/locks') {
  const [command, ...args] = argv;

  if (command === 'lock-add') {
    // lock-add <name> --locked KEY1,KEY2 --frozen KEY3
    const name = args[0];
    const lockedIdx = args.indexOf('--locked');
    const frozenIdx = args.indexOf('--frozen');
    const locked = lockedIdx !== -1 ? args[lockedIdx + 1].split(',') : [];
    const frozen = frozenIdx !== -1 ? args[frozenIdx + 1].split(',') : [];
    saveLockConfig(lockDir, { locked, frozen }, name);
    return `Lock config "${name}" saved (locked: [${locked}], frozen: [${frozen}]).`;
  }

  if (command === 'lock-list') {
    const configs = listLockConfigs(lockDir);
    if (configs.length === 0) return 'No lock configs found.';
    return configs.join('\n');
  }

  if (command === 'lock-show') {
    const name = args[0];
    const config = loadLockConfig(lockDir, name);
    return JSON.stringify(config, null, 2);
  }

  if (command === 'lock-delete') {
    const name = args[0];
    deleteLockConfig(lockDir, name);
    return `Lock config "${name}" deleted.`;
  }

  if (command === 'lock-check') {
    // lock-check <base.env> <target.env> <lockName>
    const [baseFile, targetFile, lockName] = args;
    const base = readEnv(baseFile);
    const target = readEnv(targetFile);
    const diffEntries = diff(base, target);
    const config = loadLockConfig(lockDir, lockName || 'default');
    const lockMap = buildLockMap(config);
    const violations = checkViolations(diffEntries, lockMap);
    if (violations.length === 0) return 'OK: No lock violations detected.';
    return `VIOLATIONS FOUND:\n${formatViolations(violations)}`;
  }

  return `Unknown command: ${command}\nAvailable: lock-add, lock-list, lock-show, lock-delete, lock-check`;
}

module.exports = { readEnv, run };
