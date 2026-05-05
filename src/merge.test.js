const { merge, applyDiff } = require('./merge');

const base = {
  APP_NAME: 'myapp',
  DEBUG: 'false',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
};

describe('merge', () => {
  it('applies added changes', () => {
    const changes = [{ type: 'added', key: 'NEW_KEY', value: '123' }];
    const result = merge(base, changes);
    expect(result.NEW_KEY).toBe('123');
  });

  it('applies modified changes', () => {
    const changes = [{ type: 'modified', key: 'DEBUG', value: 'true' }];
    const result = merge(base, changes);
    expect(result.DEBUG).toBe('true');
  });

  it('applies removed changes', () => {
    const changes = [{ type: 'removed', key: 'DB_PORT' }];
    const result = merge(base, changes);
    expect(result.DB_PORT).toBeUndefined();
  });

  it('does not mutate the base object', () => {
    const changes = [{ type: 'modified', key: 'DEBUG', value: 'true' }];
    merge(base, changes);
    expect(base.DEBUG).toBe('false');
  });

  it('handles empty changes', () => {
    const result = merge(base, []);
    expect(result).toEqual(base);
  });

  it('handles multiple changes at once', () => {
    const changes = [
      { type: 'added', key: 'API_URL', value: 'https://api.example.com' },
      { type: 'modified', key: 'DB_HOST', value: 'db.prod.example.com' },
      { type: 'removed', key: 'DB_PORT' },
    ];
    const result = merge(base, changes);
    expect(result.API_URL).toBe('https://api.example.com');
    expect(result.DB_HOST).toBe('db.prod.example.com');
    expect(result.DB_PORT).toBeUndefined();
    expect(result.APP_NAME).toBe('myapp');
  });
});

describe('applyDiff', () => {
  it('is an alias or equivalent to merge', () => {
    const changes = [{ type: 'modified', key: 'DEBUG', value: 'true' }];
    const fromMerge = merge(base, changes);
    const fromApply = applyDiff(base, changes);
    expect(fromApply).toEqual(fromMerge);
  });
});
