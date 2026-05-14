const { lintEnv, isLikelyEncrypted, formatLintResults } = require('./lint');

describe('isLikelyEncrypted', () => {
  it('returns true for enc: prefixed values', () => {
    expect(isLikelyEncrypted('enc:v1:abc123')).toBe(true);
  });

  it('returns false for plain values', () => {
    expect(isLikelyEncrypted('mysecret')).toBe(false);
    expect(isLikelyEncrypted('')).toBe(false);
  });
});

describe('lintEnv', () => {
  it('warns on lowercase keys', () => {
    const results = lintEnv({ myKey: 'value' });
    expect(results.some(r => r.code === 'KEY_CASING')).toBe(true);
  });

  it('does not warn on valid UPPER_SNAKE_CASE keys', () => {
    const results = lintEnv({ MY_KEY: 'value' });
    expect(results.some(r => r.code === 'KEY_CASING')).toBe(false);
  });

  it('warns on empty values', () => {
    const results = lintEnv({ MY_KEY: '' });
    expect(results.some(r => r.code === 'EMPTY_VALUE')).toBe(true);
  });

  it('does not warn on empty values when disabled', () => {
    const results = lintEnv({ MY_KEY: '' }, { warnEmptyValues: false });
    expect(results.some(r => r.code === 'EMPTY_VALUE')).toBe(false);
  });

  it('errors on sensitive plaintext keys', () => {
    const results = lintEnv({ API_TOKEN: 'abc123' });
    expect(results.some(r => r.code === 'SENSITIVE_PLAINTEXT' && r.level === 'error')).toBe(true);
  });

  it('does not error on encrypted sensitive values', () => {
    const results = lintEnv({ API_TOKEN: 'enc:v1:xyz' });
    expect(results.some(r => r.code === 'SENSITIVE_PLAINTEXT')).toBe(false);
  });

  it('returns empty array for clean env', () => {
    const results = lintEnv({ APP_NAME: 'myapp', PORT: '3000' });
    expect(results).toHaveLength(0);
  });

  it('can disable sensitive plaintext check', () => {
    const results = lintEnv({ DB_PASSWORD: 'plain' }, { warnSensitivePlaintext: false });
    expect(results.some(r => r.code === 'SENSITIVE_PLAINTEXT')).toBe(false);
  });
});

describe('formatLintResults', () => {
  it('returns a no-issues message for empty results', () => {
    expect(formatLintResults([])).toBe('No lint issues found.');
  });

  it('formats results with level and code', () => {
    const results = [{ key: 'FOO', level: 'warn', code: 'EMPTY_VALUE', message: 'Key "FOO" has an empty value' }];
    const output = formatLintResults(results);
    expect(output).toContain('[WARN]');
    expect(output).toContain('EMPTY_VALUE');
    expect(output).toContain('Key "FOO"');
  });

  it('formats multiple results on separate lines', () => {
    const results = [
      { key: 'A', level: 'warn', code: 'KEY_CASING', message: 'msg1' },
      { key: 'B', level: 'error', code: 'SENSITIVE_PLAINTEXT', message: 'msg2' },
    ];
    const lines = formatLintResults(results).split('\n');
    expect(lines).toHaveLength(2);
  });
});
