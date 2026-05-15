const { diffAll, findDivergentKeys, summarizeDiffs, formatMultiDiff } = require('./envDiff');

const base = { HOST: 'localhost', PORT: '3000', DEBUG: 'false' };
const staging = { HOST: 'staging.example.com', PORT: '3000', DEBUG: 'true', NEW_KEY: 'hello' };
const prod = { HOST: 'prod.example.com', PORT: '443' };

describe('diffAll', () => {
  it('returns diffs for each named env vs base', () => {
    const result = diffAll(base, { staging, prod });
    expect(result).toHaveProperty('staging');
    expect(result).toHaveProperty('prod');
    expect(result.staging.some(e => e.key === 'HOST' && e.type === 'change')).toBe(true);
    expect(result.prod.some(e => e.key === 'DEBUG' && e.type === 'remove')).toBe(true);
  });

  it('returns empty arrays for identical envs', () => {
    const result = diffAll(base, { same: { ...base } });
    expect(result.same).toEqual([]);
  });
});

describe('findDivergentKeys', () => {
  it('finds keys with different values across envs', () => {
    const divergent = findDivergentKeys({ staging, prod });
    expect(divergent).toHaveProperty('HOST');
    expect(divergent.HOST.staging).toBe('staging.example.com');
    expect(divergent.HOST.prod).toBe('prod.example.com');
  });

  it('includes keys missing in some envs', () => {
    const divergent = findDivergentKeys({ staging, prod });
    expect(divergent).toHaveProperty('DEBUG');
    expect(divergent.DEBUG.prod).toBeUndefined();
  });

  it('does not include keys with identical values', () => {
    const divergent = findDivergentKeys({ staging, prod });
    // PORT is 3000 in staging but 443 in prod — should be divergent
    expect(divergent).toHaveProperty('PORT');
    // If both had same PORT, it should not appear
    const same = findDivergentKeys({ a: { X: '1' }, b: { X: '1' } });
    expect(same).not.toHaveProperty('X');
  });
});

describe('summarizeDiffs', () => {
  it('counts add/remove/change per env', () => {
    const diffs = diffAll(base, { staging, prod });
    const summary = summarizeDiffs(diffs);
    expect(summary.staging.added).toBe(1);
    expect(summary.staging.changed).toBe(2);
    expect(summary.staging.removed).toBe(0);
    expect(summary.prod.removed).toBe(1);
  });

  it('returns zeros for identical env', () => {
    const diffs = diffAll(base, { copy: { ...base } });
    const summary = summarizeDiffs(diffs);
    expect(summary.copy).toEqual({ added: 0, removed: 0, changed: 0 });
  });
});

describe('formatMultiDiff', () => {
  it('formats diffs with section headers', () => {
    const diffs = diffAll(base, { staging });
    const output = formatMultiDiff(diffs);
    expect(output).toContain('=== staging ===');
    expect(output).toContain('+ NEW_KEY=hello');
    expect(output).toContain('~ HOST:');
  });

  it('shows no changes message for empty diff', () => {
    const diffs = diffAll(base, { copy: { ...base } });
    const output = formatMultiDiff(diffs);
    expect(output).toContain('(no changes)');
  });
});
