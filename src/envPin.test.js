const { buildPinMap, checkPinViolations, applyPins, findMissingPins, formatPinViolations } = require('./envPin');

describe('buildPinMap', () => {
  it('converts array of pins to a map', () => {
    const pins = [{ key: 'NODE_ENV', value: 'production' }, { key: 'PORT', value: '8080' }];
    expect(buildPinMap(pins)).toEqual({ NODE_ENV: 'production', PORT: '8080' });
  });

  it('returns empty object for empty array', () => {
    expect(buildPinMap([])).toEqual({});
  });
});

describe('checkPinViolations', () => {
  const pinMap = { NODE_ENV: 'production', PORT: '8080' };

  it('returns violations for mismatched values', () => {
    const env = { NODE_ENV: 'development', PORT: '8080' };
    const violations = checkPinViolations(env, pinMap);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toEqual({ key: 'NODE_ENV', pinned: 'production', actual: 'development' });
  });

  it('returns empty array when all pins match', () => {
    const env = { NODE_ENV: 'production', PORT: '8080' };
    expect(checkPinViolations(env, pinMap)).toEqual([]);
  });

  it('ignores keys not present in env', () => {
    const env = { PORT: '8080' };
    expect(checkPinViolations(env, pinMap)).toEqual([]);
  });
});

describe('applyPins', () => {
  it('overwrites env values with pinned values', () => {
    const env = { NODE_ENV: 'development', PORT: '3000', OTHER: 'x' };
    const pinMap = { NODE_ENV: 'production', PORT: '8080' };
    expect(applyPins(env, pinMap)).toEqual({ NODE_ENV: 'production', PORT: '8080', OTHER: 'x' });
  });

  it('adds missing pinned keys', () => {
    const env = { OTHER: 'x' };
    const pinMap = { NODE_ENV: 'production' };
    expect(applyPins(env, pinMap)).toEqual({ OTHER: 'x', NODE_ENV: 'production' });
  });
});

describe('findMissingPins', () => {
  it('returns keys pinned but not in env', () => {
    const env = { PORT: '8080' };
    const pinMap = { NODE_ENV: 'production', PORT: '8080' };
    expect(findMissingPins(env, pinMap)).toEqual(['NODE_ENV']);
  });

  it('returns empty array when all pins present', () => {
    const env = { NODE_ENV: 'production', PORT: '8080' };
    const pinMap = { NODE_ENV: 'production', PORT: '8080' };
    expect(findMissingPins(env, pinMap)).toEqual([]);
  });
});

describe('formatPinViolations', () => {
  it('returns no-violation message for empty array', () => {
    expect(formatPinViolations([])).toBe('No pin violations.');
  });

  it('formats violations correctly', () => {
    const violations = [{ key: 'NODE_ENV', pinned: 'production', actual: 'development' }];
    const out = formatPinViolations(violations);
    expect(out).toContain('NODE_ENV');
    expect(out).toContain('production');
    expect(out).toContain('development');
    expect(out).toContain('[PIN VIOLATION]');
  });
});
