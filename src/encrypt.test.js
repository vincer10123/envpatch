const { encryptValue, decryptValue, isEncrypted, encryptEnv, decryptEnv } = require('./encrypt');

const PASS = 'supersecret';

describe('isEncrypted', () => {
  test('detects encrypted values', () => {
    expect(isEncrypted('enc:abc123')).toBe(true);
  });
  test('returns false for plain values', () => {
    expect(isEncrypted('plaintext')).toBe(false);
    expect(isEncrypted('')).toBe(false);
  });
});

describe('encryptValue / decryptValue', () => {
  test('round-trips a value', () => {
    const enc = encryptValue('hello', PASS);
    expect(isEncrypted(enc)).toBe(true);
    expect(decryptValue(enc, PASS)).toBe('hello');
  });

  test('produces different ciphertext each time', () => {
    const a = encryptValue('hello', PASS);
    const b = encryptValue('hello', PASS);
    expect(a).not.toBe(b);
  });

  test('throws on wrong passphrase', () => {
    const enc = encryptValue('hello', PASS);
    expect(() => decryptValue(enc, 'wrongpass')).toThrow();
  });

  test('throws if value not encrypted', () => {
    expect(() => decryptValue('plaintext', PASS)).toThrow('Value is not encrypted');
  });
});

describe('encryptEnv', () => {
  const env = { DB_PASS: 'secret', HOST: 'localhost', PORT: '5432' };

  test('encrypts all keys by default', () => {
    const result = encryptEnv(env, PASS);
    expect(isEncrypted(result.DB_PASS)).toBe(true);
    expect(isEncrypted(result.HOST)).toBe(true);
  });

  test('encrypts only specified keys', () => {
    const result = encryptEnv(env, PASS, ['DB_PASS']);
    expect(isEncrypted(result.DB_PASS)).toBe(true);
    expect(result.HOST).toBe('localhost');
    expect(result.PORT).toBe('5432');
  });

  test('skips already encrypted values', () => {
    const already = encryptValue('secret', PASS);
    const result = encryptEnv({ DB_PASS: already }, PASS);
    expect(result.DB_PASS).toBe(already);
  });
});

describe('decryptEnv', () => {
  test('decrypts all encrypted values', () => {
    const env = { DB_PASS: encryptValue('secret', PASS), HOST: 'localhost' };
    const result = decryptEnv(env, PASS);
    expect(result.DB_PASS).toBe('secret');
    expect(result.HOST).toBe('localhost');
  });

  test('round-trips full env', () => {
    const env = { A: 'foo', B: 'bar' };
    const encrypted = encryptEnv(env, PASS);
    const decrypted = decryptEnv(encrypted, PASS);
    expect(decrypted).toEqual(env);
  });
});
