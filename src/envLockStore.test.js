const fs = require('fs');
const os = require('os');
const path = require('path');
const { saveLockConfig, loadLockConfig, listLockConfigs, deleteLockConfig, lockPath } = require('./envLockStore');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envpatch-lock-'));
}

describe('envLockStore', () => {
  test('saves and loads a lock config', () => {
    const dir = tmpDir();
    const config = { locked: ['SECRET_KEY'], frozen: ['DB_URL'] };
    saveLockConfig(dir, config, 'production');
    const loaded = loadLockConfig(dir, 'production');
    expect(loaded.locked).toEqual(['SECRET_KEY']);
    expect(loaded.frozen).toEqual(['DB_URL']);
  });

  test('returns empty config when file does not exist', () => {
    const dir = tmpDir();
    const config = loadLockConfig(dir, 'nonexistent');
    expect(config.locked).toEqual([]);
    expect(config.frozen).toEqual([]);
  });

  test('lists saved lock configs', () => {
    const dir = tmpDir();
    saveLockConfig(dir, { locked: [], frozen: [] }, 'staging');
    saveLockConfig(dir, { locked: [], frozen: [] }, 'production');
    const list = listLockConfigs(dir);
    expect(list).toContain('staging');
    expect(list).toContain('production');
    expect(list).toHaveLength(2);
  });

  test('returns empty list when dir does not exist', () => {
    const list = listLockConfigs('/tmp/nonexistent-envpatch-xyz');
    expect(list).toEqual([]);
  });

  test('deletes a lock config', () => {
    const dir = tmpDir();
    saveLockConfig(dir, { locked: ['X'], frozen: [] }, 'temp');
    deleteLockConfig(dir, 'temp');
    const list = listLockConfigs(dir);
    expect(list).not.toContain('temp');
  });

  test('lockPath returns correct path', () => {
    const p = lockPath('/some/dir', 'prod');
    expect(p).toBe('/some/dir/prod.lock.json');
  });

  test('creates directory if missing on save', () => {
    const dir = path.join(os.tmpdir(), `envpatch-lock-mkdir-${Date.now()}`);
    saveLockConfig(dir, { locked: ['K'], frozen: [] });
    expect(fs.existsSync(dir)).toBe(true);
    fs.rmSync(dir, { recursive: true });
  });
});
