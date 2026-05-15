const { compareAll, buildMatrix, findInconsistentKeys, formatComparison } = require('./envCompare');

const base = { HOST: 'localhost', PORT: '3000', DEBUG: 'false' };
const staging = { HOST: 'staging.example.com', PORT: '3000', LOG_LEVEL: 'info' };
const prod = { HOST: 'prod.example.com', PORT: '8080', DEBUG: 'false', LOG_LEVEL: 'warn' };

describe('compareAll', () => {
  test('returns diff for each target env', () => {
    const result = compareAll(base, { staging, prod });
    expect(result).toHaveProperty('staging');
    expect(result).toHaveProperty('prod');
    expect(result.staging.changed).toHaveProperty('HOST');
    expect(result.staging.removed).toHaveProperty('DEBUG');
    expect(result.staging.added).toHaveProperty('LOG_LEVEL');
  });

  test('redact option redacts sensitive keys', () => {
    const envWithSecret = { HOST: 'x', SECRET_KEY: 'supersecret' };
    const result = compareAll({ HOST: 'y' }, { env: envWithSecret }, { redact: true });
    const added = result.env.added;
    expect(added.SECRET_KEY).toBe('[REDACTED]');
  });

  test('returns empty diffs for identical envs', () => {
    const result = compareAll(base, { copy: { ...base } });
    expect(Object.keys(result.copy.added)).toHaveLength(0);
    expect(Object.keys(result.copy.removed)).toHaveLength(0);
    expect(Object.keys(result.copy.changed)).toHaveLength(0);
  });
});

describe('buildMatrix', () => {
  test('includes all keys from all envs', () => {
    const matrix = buildMatrix({ base, staging, prod });
    const keys = matrix.map(r => r.key);
    expect(keys).toContain('HOST');
    expect(keys).toContain('PORT');
    expect(keys).toContain('DEBUG');
    expect(keys).toContain('LOG_LEVEL');
  });

  test('marks missing keys as undefined', () => {
    const matrix = buildMatrix({ base, staging });
    const debugRow = matrix.find(r => r.key === 'DEBUG');
    expect(debugRow.base).toBe('false');
    expect(debugRow.staging).toBeUndefined();
  });

  test('keys are sorted alphabetically', () => {
    const matrix = buildMatrix({ base, prod });
    const keys = matrix.map(r => r.key);
    expect(keys).toEqual([...keys].sort());
  });
});

describe('findInconsistentKeys', () => {
  test('finds keys missing in some envs', () => {
    const result = findInconsistentKeys({ base, staging, prod });
    const debugEntry = result.find(r => r.key === 'DEBUG');
    expect(debugEntry).toBeDefined();
    expect(debugEntry.missingIn).toContain('staging');
  });

  test('returns empty array when all envs have same keys', () => {
    const a = { X: '1', Y: '2' };
    const b = { X: '3', Y: '4' };
    expect(findInconsistentKeys({ a, b })).toHaveLength(0);
  });
});

describe('formatComparison', () => {
  test('formats comparison results as string', () => {
    const result = compareAll(base, { staging, prod });
    const output = formatComparison(result);
    expect(output).toContain('[staging]');
    expect(output).toContain('[prod]');
    expect(output).toMatch(/\+\d+ -\d+ ~\d+/);
  });
});
