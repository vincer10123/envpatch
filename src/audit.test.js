import { describe, it, expect } from 'vitest';
import {
  createAuditEntry,
  formatAuditLog,
  filterByOperation,
  filterByDateRange,
  generateId,
} from './audit.js';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

describe('createAuditEntry', () => {
  it('creates an entry with required fields', () => {
    const entry = createAuditEntry('diff', { file: '.env' });
    expect(entry.operation).toBe('diff');
    expect(entry.meta).toEqual({ file: '.env' });
    expect(typeof entry.id).toBe('string');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('timestamp is a valid ISO string', () => {
    const entry = createAuditEntry('merge', {});
    expect(() => new Date(entry.timestamp)).not.toThrow();
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  });
});

describe('filterByOperation', () => {
  const log = [
    createAuditEntry('diff', {}),
    createAuditEntry('merge', {}),
    createAuditEntry('diff', {}),
    createAuditEntry('apply', {}),
  ];

  it('filters entries by operation', () => {
    const diffs = filterByOperation(log, 'diff');
    expect(diffs).toHaveLength(2);
    expect(diffs.every(e => e.operation === 'diff')).toBe(true);
  });

  it('returns empty array when no matches', () => {
    expect(filterByOperation(log, 'snapshot')).toHaveLength(0);
  });
});

describe('filterByDateRange', () => {
  const now = Date.now();
  const log = [
    { ...createAuditEntry('diff', {}), timestamp: new Date(now - 5000).toISOString() },
    { ...createAuditEntry('merge', {}), timestamp: new Date(now - 1000).toISOString() },
    { ...createAuditEntry('apply', {}), timestamp: new Date(now + 1000).toISOString() },
  ];

  it('filters entries within date range', () => {
    const from = new Date(now - 3000);
    const to = new Date(now + 500);
    const result = filterByDateRange(log, from, to);
    expect(result).toHaveLength(1);
    expect(result[0].operation).toBe('merge');
  });

  it('returns all when range is wide', () => {
    const result = filterByDateRange(log, new Date(now - 10000), new Date(now + 10000));
    expect(result).toHaveLength(3);
  });
});

describe('formatAuditLog', () => {
  it('formats entries as readable lines', () => {
    const log = [createAuditEntry('diff', { file: '.env.prod' })];
    const output = formatAuditLog(log);
    expect(output).toContain('diff');
    expect(output).toContain('.env.prod');
  });

  it('returns message for empty log', () => {
    expect(formatAuditLog([])).toMatch(/no audit/i);
  });
});
