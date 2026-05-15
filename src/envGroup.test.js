const { groupByPrefix, groupByRules, flattenGroups, formatGroups } = require('./envGroup');

const sampleEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  REDIS_URL: 'redis://localhost',
  APP_NAME: 'myapp',
  APP_ENV: 'production',
  SECRET_KEY: 'abc123',
};

describe('groupByPrefix', () => {
  test('groups keys by prefix before first underscore', () => {
    const groups = groupByPrefix(sampleEnv);
    expect(groups['DB']).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
    expect(groups['REDIS']).toEqual({ REDIS_URL: 'redis://localhost' });
    expect(groups['APP']).toEqual({ APP_NAME: 'myapp', APP_ENV: 'production' });
    expect(groups['SECRET']).toEqual({ SECRET_KEY: 'abc123' });
  });

  test('puts keys without separator into __ungrouped__', () => {
    const env = { FOO: 'bar', HELLO: 'world' };
    const groups = groupByPrefix(env);
    expect(groups['__ungrouped__']).toEqual({ FOO: 'bar', HELLO: 'world' });
  });

  test('works with custom separator', () => {
    const env = { 'DB.HOST': 'localhost', 'DB.PORT': '5432', PLAIN: 'val' };
    const groups = groupByPrefix(env, '.');
    expect(groups['DB']).toEqual({ 'DB.HOST': 'localhost', 'DB.PORT': '5432' });
    expect(groups['__ungrouped__']).toEqual({ PLAIN: 'val' });
  });
});

describe('groupByRules', () => {
  test('groups by regex patterns', () => {
    const groups = groupByRules(sampleEnv, {
      database: [/^DB_/],
      cache: [/^REDIS_/],
    });
    expect(groups['database']).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
    expect(groups['cache']).toEqual({ REDIS_URL: 'redis://localhost' });
    expect(groups['__ungrouped__']).toHaveProperty('APP_NAME');
    expect(groups['__ungrouped__']).toHaveProperty('SECRET_KEY');
  });

  test('groups by exact string match', () => {
    const groups = groupByRules(sampleEnv, { secrets: ['SECRET_KEY'] });
    expect(groups['secrets']).toEqual({ SECRET_KEY: 'abc123' });
  });

  test('unmatched keys go to __ungrouped__', () => {
    const groups = groupByRules({ FOO: '1', BAR: '2' }, { mygroup: ['FOO'] });
    expect(groups['__ungrouped__']).toEqual({ BAR: '2' });
  });

  test('no ungrouped if all keys matched', () => {
    const groups = groupByRules({ FOO: '1' }, { g: ['FOO'] });
    expect(groups['__ungrouped__']).toBeUndefined();
  });
});

describe('flattenGroups', () => {
  test('merges all group keys into single object', () => {
    const groups = groupByPrefix(sampleEnv);
    const flat = flattenGroups(groups);
    expect(flat).toEqual(sampleEnv);
  });
});

describe('formatGroups', () => {
  test('produces section headers and key=value lines', () => {
    const groups = { DB: { DB_HOST: 'localhost' }, APP: { APP_ENV: 'prod' } };
    const out = formatGroups(groups);
    expect(out).toContain('# --- DB ---');
    expect(out).toContain('DB_HOST=localhost');
    expect(out).toContain('# --- APP ---');
    expect(out).toContain('APP_ENV=prod');
  });
});
