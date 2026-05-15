const { buildLockMap, checkViolations, filterLockedEntries, formatViolations } = require('./envLock');

const sampleDiff = [
  { key: 'DB_HOST', type: 'changed', oldValue: 'localhost', newValue: 'prod-db' },
  { key: 'SECRET_KEY', type: 'changed', oldValue: 'abc', newValue: 'xyz' },
  { key: 'API_URL', type: 'removed', oldValue: 'http://old', newValue: null },
  { key: 'NEW_FLAG', type: 'added', oldValue: null, newValue: 'true' },
  { key: 'UNCHANGED', type: 'unchanged', oldValue: 'same', newValue: 'same' },
];

describe('buildLockMap', () => {
  test('builds sets from config', () => {
    const map = buildLockMap({ locked: ['SECRET_KEY'], frozen: ['API_URL'] });
    expect(map.locked.has('SECRET_KEY')).toBe(true);
    expect(map.frozen.has('API_URL')).toBe(true);
    expect(map.locked.has('DB_HOST')).toBe(false);
  });

  test('handles empty config', () => {
    const map = buildLockMap({});
    expect(map.locked.size).toBe(0);
    expect(map.frozen.size).toBe(0);
  });
});

describe('checkViolations', () => {
  test('detects locked key change', () => {
    const map = buildLockMap({ locked: ['SECRET_KEY'] });
    const violations = checkViolations(sampleDiff, map);
    expect(violations).toHaveLength(1);
    expect(violations[0].key).toBe('SECRET_KEY');
    expect(violations[0].rule).toBe('locked');
  });

  test('detects frozen key removal', () => {
    const map = buildLockMap({ frozen: ['API_URL'] });
    const violations = checkViolations(sampleDiff, map);
    expect(violations).toHaveLength(1);
    expect(violations[0].key).toBe('API_URL');
    expect(violations[0].rule).toBe('frozen');
  });

  test('unchanged locked key has no violation', () => {
    const map = buildLockMap({ locked: ['UNCHANGED'] });
    const violations = checkViolations(sampleDiff, map);
    expect(violations).toHaveLength(0);
  });

  test('multiple violations', () => {
    const map = buildLockMap({ locked: ['SECRET_KEY', 'DB_HOST'], frozen: ['API_URL'] });
    const violations = checkViolations(sampleDiff, map);
    expect(violations).toHaveLength(3);
  });
});

describe('filterLockedEntries', () => {
  test('removes locked changed entries', () => {
    const map = buildLockMap({ locked: ['SECRET_KEY'] });
    const filtered = filterLockedEntries(sampleDiff, map);
    expect(filtered.find((e) => e.key === 'SECRET_KEY')).toBeUndefined();
    expect(filtered.find((e) => e.key === 'DB_HOST')).toBeDefined();
  });

  test('removes frozen removed entries', () => {
    const map = buildLockMap({ frozen: ['API_URL'] });
    const filtered = filterLockedEntries(sampleDiff, map);
    expect(filtered.find((e) => e.key === 'API_URL')).toBeUndefined();
  });
});

describe('formatViolations', () => {
  test('returns no violations message when empty', () => {
    expect(formatViolations([])).toBe('No lock violations.');
  });

  test('formats violations correctly', () => {
    const map = buildLockMap({ locked: ['SECRET_KEY'] });
    const violations = checkViolations(sampleDiff, map);
    const output = formatViolations(violations);
    expect(output).toContain('[LOCKED]');
    expect(output).toContain('SECRET_KEY');
  });
});
