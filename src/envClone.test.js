const { cloneEnv, mergeClone, cloneSummary } = require('./envClone');

const base = {
  APP_HOST: 'localhost',
  APP_PORT: '3000',
  DB_HOST: 'localhost',
  DB_PASS: 'secret',
  DEBUG: 'true',
};

describe('cloneEnv', () => {
  test('returns a copy when no options given', () => {
    const result = cloneEnv(base);
    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });

  test('pick filters to specified keys', () => {
    const result = cloneEnv(base, { pick: ['APP_HOST', 'APP_PORT'] });
    expect(Object.keys(result)).toEqual(['APP_HOST', 'APP_PORT']);
  });

  test('omit excludes specified keys', () => {
    const result = cloneEnv(base, { omit: ['DB_PASS', 'DEBUG'] });
    expect(result).not.toHaveProperty('DB_PASS');
    expect(result).not.toHaveProperty('DEBUG');
    expect(result).toHaveProperty('APP_HOST');
  });

  test('addPrefix prefixes all keys', () => {
    const result = cloneEnv({ HOST: 'x', PORT: '80' }, { addPrefix: 'STAGING_' });
    expect(result).toHaveProperty('STAGING_HOST', 'x');
    expect(result).toHaveProperty('STAGING_PORT', '80');
  });

  test('removePrefix strips prefix from keys', () => {
    const result = cloneEnv({ APP_HOST: 'x', APP_PORT: '80' }, { removePrefix: 'APP_' });
    expect(result).toHaveProperty('HOST', 'x');
    expect(result).toHaveProperty('PORT', '80');
  });

  test('pick + addPrefix combined', () => {
    const result = cloneEnv(base, { pick: ['DB_HOST', 'DB_PASS'], addPrefix: 'PROD_' });
    expect(Object.keys(result)).toEqual(['PROD_DB_HOST', 'PROD_DB_PASS']);
  });
});

describe('mergeClone', () => {
  test('adds new keys to target', () => {
    const target = { EXISTING: 'yes' };
    const cloned = { NEW_KEY: 'value' };
    const result = mergeClone(target, cloned);
    expect(result).toHaveProperty('EXISTING', 'yes');
    expect(result).toHaveProperty('NEW_KEY', 'value');
  });

  test('overwrites existing keys by default', () => {
    const target = { KEY: 'old' };
    const cloned = { KEY: 'new' };
    const result = mergeClone(target, cloned);
    expect(result.KEY).toBe('new');
  });

  test('does not overwrite when overwrite=false', () => {
    const target = { KEY: 'old' };
    const cloned = { KEY: 'new', EXTRA: 'added' };
    const result = mergeClone(target, cloned, false);
    expect(result.KEY).toBe('old');
    expect(result.EXTRA).toBe('added');
  });
});

describe('cloneSummary', () => {
  test('correctly categorizes added, overwritten, unchanged', () => {
    const source = { A: '1', B: '2', C: '3' };
    const result  = { A: '1', B: 'changed', C: '3', D: 'new' };
    const summary = cloneSummary(source, result);
    expect(summary.added).toContain('D');
    expect(summary.overwritten).toContain('B');
    expect(summary.unchanged).toContain('A');
    expect(summary.unchanged).toContain('C');
  });

  test('all added when source is empty', () => {
    const summary = cloneSummary({}, { X: '1', Y: '2' });
    expect(summary.added).toEqual(['X', 'Y']);
    expect(summary.overwritten).toHaveLength(0);
  });
});
