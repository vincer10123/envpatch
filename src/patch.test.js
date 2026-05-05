const { createPatch, applyPatch, serializePatch, deserializePatch } = require('./patch');

const base = `APP_NAME=myapp
DEBUG=false
DB_HOST=localhost
DB_PORT=5432
`;

const target = `APP_NAME=myapp
DEBUG=true
DB_HOST=db.prod.example.com
API_KEY=supersecret
`;

describe('createPatch', () => {
  it('produces a versioned patch with changes', () => {
    const patch = createPatch(base, target);
    expect(patch.version).toBe(1);
    expect(patch.createdAt).toBeDefined();
    expect(patch.changes).toBeDefined();
  });

  it('detects modified keys', () => {
    const patch = createPatch(base, target);
    const modified = patch.changes.filter((c) => c.type === 'modified');
    expect(modified.map((c) => c.key)).toContain('DEBUG');
    expect(modified.map((c) => c.key)).toContain('DB_HOST');
  });

  it('detects added keys', () => {
    const patch = createPatch(base, target);
    const added = patch.changes.filter((c) => c.type === 'added');
    expect(added.map((c) => c.key)).toContain('API_KEY');
  });

  it('detects removed keys', () => {
    const patch = createPatch(base, target);
    const removed = patch.changes.filter((c) => c.type === 'removed');
    expect(removed.map((c) => c.key)).toContain('DB_PORT');
  });
});

describe('applyPatch', () => {
  it('applies a patch and returns content', () => {
    const patch = createPatch(base, target);
    const { content } = applyPatch(base, patch);
    expect(content).toContain('DEBUG=true');
    expect(content).toContain('API_KEY=supersecret');
    expect(content).not.toContain('DB_PORT');
  });

  it('throws on invalid patch version', () => {
    expect(() => applyPatch(base, { version: 99, changes: [] })).toThrow(
      'Invalid or unsupported patch version'
    );
  });

  it('returns warnings array', () => {
    const patch = createPatch(base, target);
    const { warnings } = applyPatch(base, patch);
    expect(Array.isArray(warnings)).toBe(true);
  });
});

describe('serializePatch / deserializePatch', () => {
  it('round-trips a patch through JSON', () => {
    const patch = createPatch(base, target);
    const json = serializePatch(patch);
    const restored = deserializePatch(json);
    expect(restored.version).toBe(patch.version);
    expect(restored.changes).toEqual(patch.changes);
  });

  it('throws on malformed JSON', () => {
    expect(() => deserializePatch('not json')).toThrow('Failed to parse patch JSON');
  });
});
