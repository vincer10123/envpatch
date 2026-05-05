const { diff, isEmpty, format } = require('./diff');

describe('diff', () => {
  const base = { HOST: 'localhost', PORT: '3000', SECRET: 'abc' };
  const next = { HOST: 'prod.example.com', PORT: '3000', API_KEY: 'xyz' };

  let result;

  beforeEach(() => {
    result = diff(base, next);
  });

  test('detects added keys', () => {
    expect(result.added).toEqual(['API_KEY']);
  });

  test('detects removed keys', () => {
    expect(result.removed).toEqual(['SECRET']);
  });

  test('detects changed keys', () => {
    expect(result.changed).toEqual([
      { key: 'HOST', from: 'localhost', to: 'prod.example.com' },
    ]);
  });

  test('unchanged keys are not reported', () => {
    const keys = [
      ...result.added,
      ...result.removed,
      ...result.changed.map((c) => c.key),
    ];
    expect(keys).not.toContain('PORT');
  });
});

describe('isEmpty', () => {
  test('returns true when envs are identical', () => {
    const env = { A: '1', B: '2' };
    expect(isEmpty(diff(env, { ...env }))).toBe(true);
  });

  test('returns false when there are changes', () => {
    expect(isEmpty(diff({ A: '1' }, { A: '2' }))).toBe(false);
  });
});

describe('format', () => {
  test('produces readable output', () => {
    const base = { OLD: 'val', SAME: 'x' };
    const next = { NEW: 'val2', SAME: 'x', CHANGED: 'after' };
    const d = diff(base, { ...next, CHANGED: 'after' }, );
    // rebuild with a changed key
    const d2 = diff({ OLD: 'val', SAME: 'x', CHANGED: 'before' }, next);
    const out = format(d2, next);
    expect(out).toContain('+ NEW=val2');
    expect(out).toContain('- OLD');
    expect(out).toContain('~ CHANGED: before → after');
  });

  test('returns empty string for empty diff', () => {
    const env = { A: '1' };
    expect(format(diff(env, { ...env }), env)).toBe('');
  });
});
