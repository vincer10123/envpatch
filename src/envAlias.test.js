const { buildAliasMap, applyAliases, resolveAliases, findConflicts } = require('./envAlias');

describe('buildAliasMap', () => {
  test('returns normalized map from valid input', () => {
    const map = buildAliasMap({ DB_URL: 'DATABASE_URL', APP_KEY: 'SECRET_KEY' });
    expect(map).toEqual({ DB_URL: 'DATABASE_URL', APP_KEY: 'SECRET_KEY' });
  });

  test('trims whitespace from keys and values', () => {
    const map = buildAliasMap({ ' ALIAS ': ' ORIGINAL ' });
    expect(map).toEqual({ ALIAS: 'ORIGINAL' });
  });

  test('throws on non-object input', () => {
    expect(() => buildAliasMap(null)).toThrow();
    expect(() => buildAliasMap(['a', 'b'])).toThrow();
  });

  test('throws on empty string keys', () => {
    expect(() => buildAliasMap({ '': 'ORIGINAL' })).toThrow();
    expect(() => buildAliasMap({ ALIAS: '' })).toThrow();
  });
});

describe('applyAliases', () => {
  const env = { DATABASE_URL: 'postgres://localhost/db', PORT: '3000' };
  const aliasMap = { DB_URL: 'DATABASE_URL', MISSING: 'NOT_IN_ENV' };

  test('adds alias keys for existing originals', () => {
    const result = applyAliases(env, aliasMap);
    expect(result.DB_URL).toBe('postgres://localhost/db');
  });

  test('does not add alias for missing originals', () => {
    const result = applyAliases(env, aliasMap);
    expect(result).not.toHaveProperty('MISSING');
  });

  test('preserves original keys', () => {
    const result = applyAliases(env, aliasMap);
    expect(result.DATABASE_URL).toBe('postgres://localhost/db');
    expect(result.PORT).toBe('3000');
  });

  test('does not mutate original env', () => {
    applyAliases(env, aliasMap);
    expect(env).not.toHaveProperty('DB_URL');
  });
});

describe('resolveAliases', () => {
  const aliasMap = { DB_URL: 'DATABASE_URL' };

  test('renames alias key to original key', () => {
    const env = { DB_URL: 'postgres://localhost/db', PORT: '3000' };
    const result = resolveAliases(env, aliasMap);
    expect(result.DATABASE_URL).toBe('postgres://localhost/db');
    expect(result).not.toHaveProperty('DB_URL');
  });

  test('original takes precedence when both exist', () => {
    const env = { DB_URL: 'alias-value', DATABASE_URL: 'real-value' };
    const result = resolveAliases(env, aliasMap);
    expect(result.DATABASE_URL).toBe('real-value');
    expect(result).not.toHaveProperty('DB_URL');
  });

  test('leaves env unchanged if alias not present', () => {
    const env = { PORT: '3000' };
    const result = resolveAliases(env, aliasMap);
    expect(result).toEqual({ PORT: '3000' });
  });
});

describe('findConflicts', () => {
  test('returns alias keys that clash with non-target env keys', () => {
    const env = { DB_URL: 'something', DATABASE_URL: 'real' };
    const aliasMap = { DB_URL: 'DATABASE_URL' };
    // DB_URL is the alias, DATABASE_URL is the target — no conflict since DB_URL is the alias
    const conflicts = findConflicts(env, aliasMap);
    expect(conflicts).toEqual([]);
  });

  test('detects conflict when alias matches an unrelated env key', () => {
    const env = { DB_URL: 'standalone-value' };
    const aliasMap = { DB_URL: 'DATABASE_URL' };
    const conflicts = findConflicts(env, aliasMap);
    expect(conflicts).toContain('DB_URL');
  });

  test('returns empty array when no conflicts', () => {
    const env = { PORT: '3000' };
    const aliasMap = { DB_URL: 'DATABASE_URL' };
    expect(findConflicts(env, aliasMap)).toEqual([]);
  });
});
