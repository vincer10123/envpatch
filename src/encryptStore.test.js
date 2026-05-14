const fs = require('fs');
const os = require('os');
const path = require('path');
const { encryptFile, decryptFile, encryptedKeys, decryptToMemory } = require('./encryptStore');
const { isEncrypted } = require('./encrypt');
const { parse } = require('./parser');

function tmpFile(content) {
  const p = path.join(os.tmpdir(), `envpatch-enc-${Date.now()}-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

const PASS = 'testpassphrase';
const SAMPLE = 'DB_PASSWORD=secret\nHOST=localhost\nAPI_KEY=abc123\n';

afterEach(() => {});

describe('encryptFile', () => {
  test('encrypts all keys by default', () => {
    const f = tmpFile(SAMPLE);
    encryptFile(f, PASS);
    const env = parse(fs.readFileSync(f, 'utf8'));
    expect(isEncrypted(env.DB_PASSWORD)).toBe(true);
    expect(isEncrypted(env.HOST)).toBe(true);
    fs.unlinkSync(f);
  });

  test('encrypts only specified keys', () => {
    const f = tmpFile(SAMPLE);
    encryptFile(f, PASS, { keys: ['DB_PASSWORD'] });
    const env = parse(fs.readFileSync(f, 'utf8'));
    expect(isEncrypted(env.DB_PASSWORD)).toBe(true);
    expect(env.HOST).toBe('localhost');
    fs.unlinkSync(f);
  });

  test('sensitiveOnly encrypts sensitive keys', () => {
    const f = tmpFile(SAMPLE);
    encryptFile(f, PASS, { sensitiveOnly: true });
    const env = parse(fs.readFileSync(f, 'utf8'));
    expect(isEncrypted(env.DB_PASSWORD)).toBe(true);
    expect(isEncrypted(env.API_KEY)).toBe(true);
    expect(env.HOST).toBe('localhost');
    fs.unlinkSync(f);
  });
});

describe('decryptFile', () => {
  test('restores original values', () => {
    const f = tmpFile(SAMPLE);
    encryptFile(f, PASS);
    decryptFile(f, PASS);
    const env = parse(fs.readFileSync(f, 'utf8'));
    expect(env.DB_PASSWORD).toBe('secret');
    expect(env.HOST).toBe('localhost');
    fs.unlinkSync(f);
  });
});

describe('encryptedKeys', () => {
  test('lists encrypted keys', () => {
    const f = tmpFile(SAMPLE);
    encryptFile(f, PASS, { keys: ['DB_PASSWORD', 'API_KEY'] });
    const keys = encryptedKeys(f);
    expect(keys).toContain('DB_PASSWORD');
    expect(keys).toContain('API_KEY');
    expect(keys).not.toContain('HOST');
    fs.unlinkSync(f);
  });
});

describe('decryptToMemory', () => {
  test('returns decrypted env without modifying file', () => {
    const f = tmpFile(SAMPLE);
    encryptFile(f, PASS);
    const result = decryptToMemory(f, PASS);
    expect(result.DB_PASSWORD).toBe('secret');
    const onDisk = parse(fs.readFileSync(f, 'utf8'));
    expect(isEncrypted(onDisk.DB_PASSWORD)).toBe(true);
    fs.unlinkSync(f);
  });
});
