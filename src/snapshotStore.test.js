const fs = require('fs');
const os = require('os');
const path = require('path');
const { saveSnapshot, loadSnapshot, listSnapshots, snapshotPath } = require('./snapshotStore');
const { createSnapshot } = require('./snapshot');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envpatch-snap-'));
}

describe('snapshotPath', () => {
  test('sanitizes label for filesystem', () => {
    const p = snapshotPath('my label/test', '/base');
    expect(p).toBe('/base/my_label_test.json');
  });

  test('uses label as filename', () => {
    expect(snapshotPath('dev', '/snapshots')).toBe('/snapshots/dev.json');
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  test('saves and loads a snapshot correctly', () => {
    const dir = tmpDir();
    const snap = createSnapshot({ API_KEY: 'abc', PORT: '8080' }, { label: 'prod' });
    const filePath = saveSnapshot(snap, dir);
    expect(fs.existsSync(filePath)).toBe(true);

    const loaded = loadSnapshot('prod', dir);
    expect(loaded.hash).toBe(snap.hash);
    expect(loaded.env).toEqual(snap.env);
    expect(loaded.label).toBe('prod');
  });

  test('throws if snapshot does not exist', () => {
    const dir = tmpDir();
    expect(() => loadSnapshot('nonexistent', dir)).toThrow('Snapshot not found: nonexistent');
  });

  test('creates directory if it does not exist', () => {
    const dir = path.join(tmpDir(), 'nested', 'dir');
    const snap = createSnapshot({ X: '1' }, { label: 'test' });
    expect(() => saveSnapshot(snap, dir)).not.toThrow();
    expect(fs.existsSync(dir)).toBe(true);
  });
});

describe('listSnapshots', () => {
  test('returns empty array when dir does not exist', () => {
    expect(listSnapshots('/nonexistent/path/xyz')).toEqual([]);
  });

  test('lists all saved snapshot labels', () => {
    const dir = tmpDir();
    saveSnapshot(createSnapshot({ A: '1' }, { label: 'alpha' }), dir);
    saveSnapshot(createSnapshot({ B: '2' }, { label: 'beta' }), dir);
    const labels = listSnapshots(dir);
    expect(labels).toContain('alpha');
    expect(labels).toContain('beta');
    expect(labels).toHaveLength(2);
  });

  test('ignores non-json files', () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'ignore me');
    saveSnapshot(createSnapshot({}, { label: 'only-me' }), dir);
    expect(listSnapshots(dir)).toEqual(['only-me']);
  });
});
