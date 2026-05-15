'use strict';

const { setKey, unsetKey, updateKeys, renameKey } = require('./envSet');

describe('setKey', () => {
  it('adds a new key', () => {
    const result = setKey({ A: '1' }, 'B', '2');
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('overwrites an existing key', () => {
    const result = setKey({ A: '1' }, 'A', '99');
    expect(result.A).toBe('99');
  });

  it('does not mutate original', () => {
    const env = { A: '1' };
    setKey(env, 'B', '2');
    expect(env).toEqual({ A: '1' });
  });

  it('throws on empty key', () => {
    expect(() => setKey({}, '', 'val')).toThrow('Key must be a non-empty string');
  });

  it('throws if value is not a string', () => {
    expect(() => setKey({}, 'KEY', 42)).toThrow('Value must be a string');
  });
});

describe('unsetKey', () => {
  it('removes an existing key', () => {
    const result = unsetKey({ A: '1', B: '2' }, 'A');
    expect(result).toEqual({ B: '2' });
  });

  it('is a no-op if key does not exist', () => {
    const result = unsetKey({ A: '1' }, 'Z');
    expect(result).toEqual({ A: '1' });
  });

  it('does not mutate original', () => {
    const env = { A: '1' };
    unsetKey(env, 'A');
    expect(env).toEqual({ A: '1' });
  });

  it('throws on empty key', () => {
    expect(() => unsetKey({}, '')).toThrow('Key must be a non-empty string');
  });
});

describe('updateKeys', () => {
  it('sets multiple keys', () => {
    const result = updateKeys({ A: '1' }, { B: '2', C: '3' });
    expect(result).toEqual({ A: '1', B: '2', C: '3' });
  });

  it('removes keys with null value', () => {
    const result = updateKeys({ A: '1', B: '2' }, { B: null });
    expect(result).toEqual({ A: '1' });
  });

  it('throws on invalid value type', () => {
    expect(() => updateKeys({}, { KEY: 123 })).toThrow('Invalid value for key "KEY"');
  });
});

describe('renameKey', () => {
  it('renames a key preserving value', () => {
    const result = renameKey({ A: 'hello', B: '2' }, 'A', 'ALPHA');
    expect(result).toEqual({ ALPHA: 'hello', B: '2' });
  });

  it('is a no-op when old and new key are the same', () => {
    const result = renameKey({ A: '1' }, 'A', 'A');
    expect(result).toEqual({ A: '1' });
  });

  it('throws if source key does not exist', () => {
    expect(() => renameKey({ A: '1' }, 'Z', 'NEW')).toThrow('Key "Z" not found');
  });

  it('throws on empty new key', () => {
    expect(() => renameKey({ A: '1' }, 'A', '')).toThrow('New key must be a non-empty string');
  });
});
