const {
  createSnapshot,
  hashEnv,
  compareSnapshots,
  serializeSnapshot,
  deserializeSnapshot,
} = require('./snapshot');

describe('hashEnv', () => {
  test('same keys produce same hash', () => {
    const a = { FOO: 'bar', BAZ: 'qux' };
    const b = { BAZ: 'qux', FOO: 'bar' };
    expect(hashEnv(a)).toBe(hashEnv(b));
  });

  test('different values produce different hash', () => {
    expect(hashEnv({ FOO: 'bar' })).not.toBe(hashEnv({ FOO: 'baz' }));
  });

  test('returns 16-char hex string', () => {
    expect(hashEnv({ A: '1' })).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('createSnapshot', () => {
  test('includes hash, env, timestamp, label', () => {
    const env = { DB_HOST: 'localhost', PORT: '3000' };
    const snap = createSnapshot(env, { label: 'dev' });
    expect(snap.label).toBe('dev');
    expect(snap.env).toEqual(env);
    expect(snap.hash).toBeTruthy();
    expect(snap.timestamp).toBeTruthy();
  });

  test('uses default label if not provided', () => {
    const snap = createSnapshot({});
    expect(snap.label).toBe('snapshot');
  });

  test('env is a copy, not reference', () => {
    const env = { A: '1' };
    const snap = createSnapshot(env);
    env.A = '2';
    expect(snap.env.A).toBe('1');
  });
});

describe('compareSnapshots', () => {
  const base = createSnapshot({ FOO: 'bar', BAZ: 'qux' }, { label: 'a' });

  test('identical snapshots return changed: false', () => {
    const same = createSnapshot({ FOO: 'bar', BAZ: 'qux' }, { label: 'b' });
    const result = compareSnapshots(base, same);
    expect(result.changed).toBe(false);
    expect(result.diff).toBeNull();
  });

  test('different snapshots return changed: true with diff', () => {
    const updated = createSnapshot({ FOO: 'newval', BAZ: 'qux' }, { label: 'c' });
    const result = compareSnapshots(base, updated);
    expect(result.changed).toBe(true);
    expect(result.diff).toBeTruthy();
  });
});

describe('serializeSnapshot / deserializeSnapshot', () => {
  test('round-trips correctly', () => {
    const snap = createSnapshot({ KEY: 'val' }, { label: 'test' });
    const raw = serializeSnapshot(snap);
    const restored = deserializeSnapshot(raw);
    expect(restored.hash).toBe(snap.hash);
    expect(restored.env).toEqual(snap.env);
  });

  test('throws on invalid snapshot JSON', () => {
    expect(() => deserializeSnapshot(JSON.stringify({ bad: true }))).toThrow();
  });
});
