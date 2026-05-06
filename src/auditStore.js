import fs from 'fs';
import path from 'path';
import { createAuditEntry } from './audit.js';

export function auditPath(dir, name = 'audit.json') {
  return path.join(dir, name);
}

/**
 * Appends a new audit entry to the audit log file.
 * @param {string} dir - Directory to store the audit log
 * @param {string} operation
 * @param {object} meta
 */
export function logOperation(dir, operation, meta = {}) {
  const file = auditPath(dir);
  const entry = createAuditEntry(operation, meta);
  let entries = [];
  if (fs.existsSync(file)) {
    try {
      entries = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      entries = [];
    }
  }
  entries.push(entry);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(entries, null, 2));
  return entry;
}

/**
 * Loads all audit entries from the audit log file.
 * @param {string} dir
 * @returns {object[]}
 */
export function loadAuditLog(dir) {
  const file = auditPath(dir);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Clears the audit log file.
 * @param {string} dir
 */
export function clearAuditLog(dir) {
  const file = auditPath(dir);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
