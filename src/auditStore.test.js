import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { logOperation, loadAuditLog, clearAuditLog, auditPath } from './auditStore.js';
import { formatAuditLog, filterByOperation, filterByDateRange } from './audit.js';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envpatch-audit-'));
}

describe('auditStore', () => {
  let dir;

  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('logs an operation and returns an entry', () => {
    const entry = logOperation(dir, 'diff', { file: '.env', keys: ['DB_URL'] });
    expect(entry.operation).toBe('diff');
    expect(entry.file).toBe('.env');
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
  });

  it('persists entries across calls', () => {
    logOperation(dir, 'diff', { file: '.env' });
    logOperation(dir, 'merge', { file: '.env.prod' });
    const entries = loadAuditLog(dir);
    expect(entries).toHaveLength(2);
    expect(entries[0].operation).toBe('diff');
    expect(entries[1].operation).toBe('merge');
  });

  it('returns empty array when no log exists', () => {
    expect(loadAuditLog(dir)).toEqual([]);
  });

  it('clears the audit log', () => {
    logOperation(dir, 'patch', {});
    clearAuditLog(dir);
    expect(loadAuditLog(dir)).toEqual([]);
    expect(fs.existsSync(auditPath(dir))).toBe(false);
  });

  it('formatAuditLog renders entries', () => {
    logOperation(dir, 'snapshot', { file: '.env', user: 'ci', keys: ['SECRET'] });
    const entries = loadAuditLog(dir);
    const log = formatAuditLog(entries);
    expect(log).toContain('[SNAPSHOT]');
    expect(log).toContain('user=ci');
    expect(log).toContain('keys=SECRET');
  });

  it('formatAuditLog handles empty entries', () => {
    expect(formatAuditLog([])).toBe('(no audit entries)');
  });

  it('filterByOperation returns matching entries', () => {
    logOperation(dir, 'diff', {});
    logOperation(dir, 'merge', {});
    logOperation(dir, 'diff', {});
    const entries = loadAuditLog(dir);
    const diffs = filterByOperation(entries, 'diff');
    expect(diffs).toHaveLength(2);
  });

  it('filterByDateRange returns entries in range', () => {
    logOperation(dir, 'diff', {});
    const entries = loadAuditLog(dir);
    const from = new Date(Date.now() - 5000);
    const to = new Date(Date.now() + 5000);
    expect(filterByDateRange(entries, from, to)).toHaveLength(1);
    const future = new Date(Date.now() + 10000);
    expect(filterByDateRange(entries, future, new Date(future.getTime() + 1000))).toHaveLength(0);
  });
});
