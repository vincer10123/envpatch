const { expandValue, interpolate, findUnresolved } = require('./interpolate');

describe('expandValue', () => {
  test('returns plain value unchanged', () => {
    expect(expandValue('hello', {})).toBe('hello');
  });

  test('expands ${VAR} syntax', () => {
    expect(expandValue('${HOST}:3000', { HOST: 'localhost' })).toBe('localhost:3000');
  });

  test('expands $VAR syntax', () => {
    expect(expandValue('$HOST:3000', { HOST: 'localhost' })).toBe('localhost:3000');
  });

  test('expands multiple references', () => {
    const env = { PROTO: 'https', HOST: 'example.com', PORT: '443' };
    expect(expandValue('${PROTO}://${HOST}:${PORT}', env)).toBe('https://example.com:443');
  });

  test('falls back to empty string for unknown var', () => {
    expect(expandValue('${UNKNOWN}', {})).toBe('');
  });

  test('resolves nested references', () => {
    const env = { BASE: '${PROTO}://${HOST}', PROTO: 'http', HOST: 'localhost' };
    expect(expandValue('${BASE}/path', env)).toBe('http://localhost/path');
  });

  test('handles circular references gracefully', () => {
    const env = { A: '${B}', B: '${A}' };
    // Should not throw, circular ref left as-is
    const result = expandValue('${A}', env);
    expect(typeof result).toBe('string');
  });

  test('falls back to process.env', () => {
    process.env._TEST_INTERP_VAR = 'from-process';
    expect(expandValue('${_TEST_INTERP_VAR}', {})).toBe('from-process');
    delete process.env._TEST_INTERP_VAR;
  });
});

describe('interpolate', () => {
  test('returns new object with all values expanded', () => {
    const env = { HOST: 'localhost', PORT: '8080', URL: '${HOST}:${PORT}' };
    const result = interpolate(env);
    expect(result.URL).toBe('localhost:8080');
    expect(result.HOST).toBe('localhost');
  });

  test('does not mutate original env', () => {
    const env = { A: 'hello', B: '${A} world' };
    interpolate(env);
    expect(env.B).toBe('${A} world');
  });

  test('handles empty env', () => {
    expect(interpolate({})).toEqual({});
  });
});

describe('findUnresolved', () => {
  test('returns empty array when all refs resolved', () => {
    const env = { HOST: 'localhost', URL: '${HOST}/api' };
    expect(findUnresolved(env)).toEqual([]);
  });

  test('returns unresolved refs', () => {
    const env = { URL: '${HOST}/api' };
    const result = findUnresolved(env);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ key: 'URL', ref: 'HOST' });
  });

  test('returns multiple unresolved refs', () => {
    const env = { URL: '${PROTO}://${HOST}' };
    const result = findUnresolved(env);
    expect(result).toHaveLength(2);
  });
});
