import fs from 'fs';
import { parse } from './parser.js';
import { diff, isEmpty } from './diff.js';
import { createAuditEntry } from './audit.js';
import { logOperation } from './auditStore.js';

/**
 * Watch a .env file for changes and emit diffs on each save.
 * @param {string} filePath - Path to the .env file to watch
 * @param {object} options
 * @param {function} options.onChange - Called with (diffResult, auditEntry) on each change
 * @param {function} [options.onError] - Called with (error) on watch errors
 * @param {string} [options.environment='default'] - Environment label for audit entries
 * @returns {{ stop: function }} - Object with a stop() method to end watching
 */
export function watchEnv(filePath, options = {}) {
  const { onChange, onError, environment = 'default' } = options;

  if (typeof onChange !== 'function') {
    throw new Error('options.onChange must be a function');
  }

  let previousEnv = loadSafe(filePath);

  const watcher = fs.watch(filePath, { persistent: false }, (eventType) => {
    if (eventType !== 'change') return;

    try {
      const nextEnv = loadSafe(filePath);
      const diffResult = diff(previousEnv, nextEnv);

      if (!isEmpty(diffResult)) {
        previousEnv = nextEnv;
        const entry = createAuditEntry('watch', environment, diffResult);
        logOperation(entry).catch(() => {});
        onChange(diffResult, entry);
      }
    } catch (err) {
      if (typeof onError === 'function') onError(err);
    }
  });

  watcher.on('error', (err) => {
    if (typeof onError === 'function') onError(err);
  });

  return {
    stop() {
      watcher.close();
    },
  };
}

function loadSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return parse(raw);
  } catch {
    return {};
  }
}
