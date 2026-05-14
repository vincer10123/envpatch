const { renameKeys, pickKeys, omitKeys, prefixKeys, stripPrefix, transformValues } = require('./transform');

const base = { APP_HOST: 'localhost', APP_PORT: '3000', DB_URL: 'postgres://localhost/dev', SECRET: 'abc' };

describe('renameKeys', () => {
  it('renames specified keys', () => {
    const result = renameKeys(base, { APP_HOST: 'HOST', APP_PORT: 'PORT' });
    expect(result.HOST).toBe('localhost');
    expect(result.PORT).toBe('3000');
    expect(result.APP_HOST).toBeUndefined();
  });

  it('drops key when mapped to null', () => {
    const result = renameKeys(base, { SECRET: null });
    expect(result.SECRET).toBeUndefined();
  });

  it('leaves unmentioned keys unchanged', () => {
    const result = renameKeys(base, { APP_HOST: 'HOST' });
    expect(result.DB_URL).toBe('postgres://localhost/dev');
  });
});

describe('pickKeys', () => {
  it('returns only specified keys', () => {
    const result = pickKeys(base, ['APP_HOST', 'SECRET']);
    expect(Object.keys(result)).toEqual(['APP_HOST', 'SECRET']);
  });

  it('ignores keys not present in env', () => {
    const result = pickKeys(base, ['MISSING']);
    expect(result).toEqual({});
  });
});

describe('omitKeys', () => {
  it('removes specified keys', () => {
    const result = omitKeys(base, ['SECRET', 'DB_URL']);
    expect(result.SECRET).toBeUndefined();
    expect(result.APP_HOST).toBe('localhost');
  });
});

describe('prefixKeys', () => {
  it('adds prefix to all keys', () => {
    const result = prefixKeys({ HOST: 'localhost', PORT: '3000' }, 'APP_');
    expect(result).toEqual({ APP_HOST: 'localhost', APP_PORT: '3000' });
  });
});

describe('stripPrefix', () => {
  it('strips prefix from matching keys', () => {
    const result = stripPrefix(base, 'APP_');
    expect(result.HOST).toBe('localhost');
    expect(result.PORT).toBe('3000');
    expect(result.DB_URL).toBe('postgres://localhost/dev');
  });
});

describe('transformValues', () => {
  it('applies fn to all values', () => {
    const result = transformValues(base, (k, v) => v.toUpperCase());
    expect(result.APP_HOST).toBe('LOCALHOST');
  });

  it('applies fn only to matching keys when pattern given', () => {
    const result = transformValues(base, (k, v) => '***', /SECRET/);
    expect(result.SECRET).toBe('***');
    expect(result.APP_HOST).toBe('localhost');
  });
});
