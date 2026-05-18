const { buildScopeMap, extractScope, applyScopeOverrides, listScopes, formatScopes } = require('./envScope');

const sampleEnv = {
  DEV__DB_URL: 'postgres://localhost/dev',
  PROD__DB_URL: 'postgres://prod-host/app',
  DEV__DEBUG: 'true',
  PROD__DEBUG: 'false',
  APP_NAME: 'myapp',
};

test('buildScopeMap groups keys by scope prefix', () => {
  const map = buildScopeMap(sampleEnv);
  expect(map.dev).toEqual({ DB_URL: 'postgres://localhost/dev', DEBUG: 'true' });
  expect(map.prod).toEqual({ DB_URL: 'postgres://prod-host/app', DEBUG: 'false' });
  expect(map.app_name).toBeUndefined();
});

test('buildScopeMap ignores keys with no delimiter', () => {
  const map = buildScopeMap({ PLAIN: 'val', DEV__X: '1' });
  expect(Object.keys(map)).toEqual(['dev']);
});

test('extractScope returns only matching scope keys', () => {
  const result = extractScope(sampleEnv, 'dev');
  expect(result).toEqual({ DB_URL: 'postgres://localhost/dev', DEBUG: 'true' });
});

test('extractScope is case-insensitive for scope arg', () => {
  const result = extractScope(sampleEnv, 'PROD');
  expect(result.DB_URL).toBe('postgres://prod-host/app');
});

test('extractScope returns empty object for unknown scope', () => {
  expect(extractScope(sampleEnv, 'staging')).toEqual({});
});

test('applyScopeOverrides merges base with scope overrides', () => {
  const base = { DB_URL: 'default', LOG_LEVEL: 'info' };
  const result = applyScopeOverrides(base, sampleEnv, 'prod');
  expect(result.DB_URL).toBe('postgres://prod-host/app');
  expect(result.LOG_LEVEL).toBe('info');
});

test('applyScopeOverrides base keys not in scope are preserved', () => {
  const base = { FEATURE_FLAG: 'on' };
  const result = applyScopeOverrides(base, sampleEnv, 'dev');
  expect(result.FEATURE_FLAG).toBe('on');
  expect(result.DEBUG).toBe('true');
});

test('listScopes returns sorted unique scope names', () => {
  const scopes = listScopes(sampleEnv);
  expect(scopes).toEqual(['dev', 'prod']);
});

test('listScopes returns empty for plain env', () => {
  expect(listScopes({ FOO: 'bar', BAZ: 'qux' })).toEqual([]);
});

test('formatScopes produces readable output', () => {
  const map = { dev: { FOO: 'bar' }, prod: { FOO: 'baz' } };
  const out = formatScopes(map);
  expect(out).toContain('[dev]');
  expect(out).toContain('FOO=bar');
  expect(out).toContain('[prod]');
  expect(out).toContain('FOO=baz');
});
