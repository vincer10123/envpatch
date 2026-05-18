const { renameKeys, buildRenameMap, detectCollisions, renameSummary, formatRenameSummary } = require('./envRename');

describe('buildRenameMap', () => {
  test('builds map from pairs', () => {
    const map = buildRenameMap([{ from: 'OLD_KEY', to: 'NEW_KEY' }]);
    expect(map).toEqual({ OLD_KEY: 'NEW_KEY' });
  });

  test('throws on invalid pair', () => {
    expect(() => buildRenameMap([{ from: '', to: 'X' }])).toThrow();
  });
});

describe('renameKeys', () => {
  const env = { OLD_KEY: 'foo', KEEP: 'bar', ANOTHER: 'baz' };

  test('renames matching keys', () => {
    const result = renameKeys(env, { OLD_KEY: 'NEW_KEY' });
    expect(result.NEW_KEY).toBe('foo');
    expect(result.OLD_KEY).toBeUndefined();
  });

  test('preserves unmatched keys', () => {
    const result = renameKeys(env, { OLD_KEY: 'NEW_KEY' });
    expect(result.KEEP).toBe('bar');
    expect(result.ANOTHER).toBe('baz');
  });

  test('handles empty rename map', () => {
    const result = renameKeys(env, {});
    expect(result).toEqual(env);
  });

  test('handles multiple renames', () => {
    const result = renameKeys(env, { OLD_KEY: 'NEW_KEY', KEEP: 'RETAINED' });
    expect(result).toEqual({ NEW_KEY: 'foo', RETAINED: 'bar', ANOTHER: 'baz' });
  });
});

describe('detectCollisions', () => {
  test('detects when a rename target already exists as non-renamed key', () => {
    const env = { A: '1', B: '2', C: '3' };
    const collisions = detectCollisions(env, { A: 'C' });
    expect(collisions).toContain('C');
  });

  test('no collision when target does not exist', () => {
    const env = { A: '1', B: '2' };
    const collisions = detectCollisions(env, { A: 'Z' });
    expect(collisions).toHaveLength(0);
  });
});

describe('renameSummary', () => {
  test('reports renamed and missing keys', () => {
    const env = { OLD_KEY: 'foo', KEEP: 'bar' };
    const summary = renameSummary(env, { OLD_KEY: 'NEW_KEY', GONE: 'NEVER' });
    expect(summary.renamed).toEqual([{ from: 'OLD_KEY', to: 'NEW_KEY' }]);
    expect(summary.missing).toEqual(['GONE']);
  });
});

describe('formatRenameSummary', () => {
  test('formats summary to readable string', () => {
    const summary = { renamed: [{ from: 'A', to: 'B' }], missing: ['C'] };
    const out = formatRenameSummary(summary);
    expect(out).toContain('renamed: A -> B');
    expect(out).toContain('missing: C');
  });

  test('returns empty string for empty summary', () => {
    const out = formatRenameSummary({ renamed: [], missing: [] });
    expect(out).toBe('');
  });
});
