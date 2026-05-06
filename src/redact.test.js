const { isSensitive, redactEnv, redactDiff, REDACTED } = require('./redact');

describe('isSensitive', () => {
  test('detects password keys', () => {
    expect(isSensitive('DB_PASSWORD')).toBe(true);
    expect(isSensitive('password')).toBe(true);
  });

  test('detects token keys', () => {
    expect(isSensitive('AUTH_TOKEN')).toBe(true);
    expect(isSensitive('ACCESS_TOKEN')).toBe(true);
  });

  test('detects api key variants', () => {
    expect(isSensitive('API_KEY')).toBe(true);
    expect(isSensitive('APIKEY')).toBe(true);
  });

  test('does not flag safe keys', () => {
    expect(isSensitive('PORT')).toBe(false);
    expect(isSensitive('NODE_ENV')).toBe(false);
    expect(isSensitive('APP_NAME')).toBe(false);
  });

  test('supports extra patterns', () => {
    expect(isSensitive('STRIPE_KEY', [/stripe/i])).toBe(true);
    expect(isSensitive('STRIPE_KEY', [])).toBe(false);
  });
});

describe('redactEnv', () => {
  const env = {
    PORT: '3000',
    NODE_ENV: 'production',
    DB_PASSWORD: 'supersecret',
    API_KEY: 'abc123',
    APP_NAME: 'myapp',
    SECRET_KEY: 'topsecret',
  };

  test('redacts sensitive values', () => {
    const result = redactEnv(env);
    expect(result.DB_PASSWORD).toBe(REDACTED);
    expect(result.API_KEY).toBe(REDACTED);
    expect(result.SECRET_KEY).toBe(REDACTED);
  });

  test('preserves safe values', () => {
    const result = redactEnv(env);
    expect(result.PORT).toBe('3000');
    expect(result.NODE_ENV).toBe('production');
    expect(result.APP_NAME).toBe('myapp');
  });

  test('supports extra patterns', () => {
    const result = redactEnv({ STRIPE_SECRET: 'sk_live_xxx' }, [/stripe/i]);
    expect(result.STRIPE_SECRET).toBe(REDACTED);
  });
});

describe('redactDiff', () => {
  const diffObj = {
    added: { API_KEY: 'newkey', PORT: '4000' },
    removed: { DB_PASSWORD: 'oldpass', HOST: 'localhost' },
    changed: {
      SECRET: { from: 'old', to: 'new' },
      APP_NAME: { from: 'foo', to: 'bar' },
    },
    unchanged: { NODE_ENV: 'production' },
  };

  test('redacts sensitive added keys', () => {
    const result = redactDiff(diffObj);
    expect(result.added.API_KEY).toBe(REDACTED);
    expect(result.added.PORT).toBe('4000');
  });

  test('redacts sensitive removed keys', () => {
    const result = redactDiff(diffObj);
    expect(result.removed.DB_PASSWORD).toBe(REDACTED);
    expect(result.removed.HOST).toBe('localhost');
  });

  test('redacts sensitive changed keys', () => {
    const result = redactDiff(diffObj);
    expect(result.changed.SECRET).toEqual({ from: REDACTED, to: REDACTED });
    expect(result.changed.APP_NAME).toEqual({ from: 'foo', to: 'bar' });
  });

  test('preserves unchanged keys', () => {
    const result = redactDiff(diffObj);
    expect(result.unchanged).toEqual({ NODE_ENV: 'production' });
  });
});
