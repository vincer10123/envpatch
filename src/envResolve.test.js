const { layerEnvs, resolveEnvs, resolveTrace, formatResolution } = require('./envResolve');

describe('layerEnvs', () => {
  test('later env wins on conflict', () => {
    const a = { FOO: 'a', BAR: 'shared-a' };
    const b = { BAR: 'shared-b', BAZ: 'b' };
    expect(layerEnvs([a, b])).toEqual({ FOO: 'a', BAR: 'shared-b', BAZ: 'b' });
  });

  test('empty array returns empty object', () => {
    expect(layerEnvs([])).toEqual({});
  });

  test('single env is returned as-is', () => {
    const env = { A: '1' };
    expect(layerEnvs([env])).toEqual({ A: '1' });
  });
});

describe('resolveEnvs', () => {
  test('layers and resolves multiple file contents', () => {
    const base = 'APP=myapp\nPORT=3000';
    const override = 'PORT=4000\nDEBUG=true';
    const { resolved, unresolved } = resolveEnvs([base, override]);
    expect(resolved.APP).toBe('myapp');
    expect(resolved.PORT).toBe('4000');
    expect(resolved.DEBUG).toBe('true');
    expect(unresolved).toHaveLength(0);
  });

  test('overrides have highest priority', () => {
    const base = 'PORT=3000';
    const { resolved } = resolveEnvs([base], { overrides: { PORT: '9999' } });
    expect(resolved.PORT).toBe('9999');
  });

  test('skips interpolation when disabled', () => {
    const content = 'BASE=hello\nFULL=${BASE}_world';
    const { resolved } = resolveEnvs([content], { interpolate: false });
    expect(resolved.FULL).toBe('${BASE}_world');
  });

  test('returns unresolved keys for missing references', () => {
    const content = 'FULL=${MISSING}_suffix';
    const { unresolved } = resolveEnvs([content]);
    expect(unresolved).toContain('MISSING');
  });

  test('handles empty contents array', () => {
    const { resolved, unresolved } = resolveEnvs([]);
    expect(resolved).toEqual({});
    expect(unresolved).toHaveLength(0);
  });
});

describe('resolveTrace', () => {
  test('tracks which layer last defined each key', () => {
    const labels = ['.env', '.env.local'];
    const envs = [{ FOO: 'a', BAR: 'x' }, { BAR: 'y', BAZ: 'z' }];
    const trace = resolveTrace(labels, envs);
    expect(trace.FOO).toBe('.env');
    expect(trace.BAR).toBe('.env.local');
    expect(trace.BAZ).toBe('.env.local');
  });
});

describe('formatResolution', () => {
  test('produces readable summary', () => {
    const resolved = { A: '1', B: '2' };
    const trace = { A: '.env', B: '.env.local' };
    const output = formatResolution(resolved, trace, []);
    expect(output).toContain('Resolved 2');
    expect(output).toContain('A  <-  .env');
    expect(output).toContain('B  <-  .env.local');
  });

  test('lists unresolved keys when present', () => {
    const output = formatResolution({}, {}, ['MISSING_VAR']);
    expect(output).toContain('Unresolved references');
    expect(output).toContain('MISSING_VAR');
  });
});
