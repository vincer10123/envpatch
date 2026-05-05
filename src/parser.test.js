const { parse, serialize } = require('./parser');

describe('parse()', () => {
  test('parses simple key=value pairs', () => {
    const result = parse('FOO=bar\nBAZ=qux');
    expect(result.get('FOO')).toBe('bar');
    expect(result.get('BAZ')).toBe('qux');
  });

  test('ignores blank lines', () => {
    const result = parse('\nFOO=bar\n\nBAZ=qux\n');
    expect(result.size).toBe(2);
  });

  test('ignores comment lines', () => {
    const result = parse('# this is a comment\nFOO=bar');
    expect(result.size).toBe(1);
    expect(result.get('FOO')).toBe('bar');
  });

  test('strips inline comments', () => {
    const result = parse('FOO=bar # inline comment');
    expect(result.get('FOO')).toBe('bar');
  });

  test('handles double-quoted values', () => {
    const result = parse('FOO="hello world"');
    expect(result.get('FOO')).toBe('hello world');
  });

  test('handles single-quoted values', () => {
    const result = parse("FOO='hello world'");
    expect(result.get('FOO')).toBe('hello world');
  });

  test('handles empty values', () => {
    const result = parse('FOO=');
    expect(result.get('FOO')).toBe('');
  });

  test('handles values with equals signs', () => {
    const result = parse('FOO=bar=baz');
    expect(result.get('FOO')).toBe('bar=baz');
  });

  test('skips lines without equals sign', () => {
    const result = parse('INVALID_LINE\nFOO=bar');
    expect(result.size).toBe(1);
  });
});

describe('serialize()', () => {
  test('serializes a map to .env format', () => {
    const map = new Map([['FOO', 'bar'], ['BAZ', 'qux']]);
    const output = serialize(map);
    expect(output).toBe('FOO=bar\nBAZ=qux\n');
  });

  test('quotes values with spaces', () => {
    const map = new Map([['FOO', 'hello world']]);
    expect(serialize(map)).toContain('FOO="hello world"');
  });

  test('quotes empty values', () => {
    const map = new Map([['FOO', '']]);
    expect(serialize(map)).toContain('FOO=""');
  });

  test('round-trips a parsed env file', () => {
    const original = 'FOO=bar\nBAZ="hello world"\n';
    const parsed = parse(original);
    const serialized = serialize(parsed);
    const reparsed = parse(serialized);
    expect(reparsed.get('FOO')).toBe('bar');
    expect(reparsed.get('BAZ')).toBe('hello world');
  });
});
