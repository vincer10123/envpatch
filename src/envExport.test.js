const { exportEnv, toJSON, toYAML, toShell, toDockerEnv } = require('./envExport');

const sample = {
  APP_NAME: 'myapp',
  PORT: '3000',
  DATABASE_URL: 'postgres://user:pass@localhost/db',
  EMPTY: '',
  SPACED: '  trimme  ',
  QUOTED: 'has: colon',
};

describe('toJSON', () => {
  test('produces valid JSON', () => {
    const out = toJSON(sample);
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out)).toEqual(sample);
  });

  test('is pretty-printed', () => {
    const out = toJSON({ A: '1' });
    expect(out).toContain('\n');
  });
});

describe('toYAML', () => {
  test('plain values have no quotes', () => {
    const out = toYAML({ APP_NAME: 'myapp' });
    expect(out).toBe('APP_NAME: myapp');
  });

  test('values with colons are quoted', () => {
    const out = toYAML({ URL: 'http://example.com' });
    expect(out).toContain('"');
  });

  test('empty string becomes single-quoted empty', () => {
    const out = toYAML({ EMPTY: '' });
    expect(out).toBe("EMPTY: ''");
  });

  test('each key on its own line', () => {
    const out = toYAML({ A: '1', B: '2' });
    const lines = out.split('\n');
    expect(lines).toHaveLength(2);
  });
});

describe('toShell', () => {
  test('wraps values in single quotes', () => {
    const out = toShell({ PORT: '3000' });
    expect(out).toBe("export PORT='3000'");
  });

  test('escapes single quotes in value', () => {
    const out = toShell({ MSG: "it's fine" });
    expect(out).toContain("it'\\''s");
  });

  test('each variable on its own line', () => {
    const out = toShell({ A: '1', B: '2' });
    expect(out.split('\n')).toHaveLength(2);
  });
});

describe('toDockerEnv', () => {
  test('produces KEY=VALUE lines without quotes', () => {
    const out = toDockerEnv({ PORT: '3000', HOST: 'localhost' });
    expect(out).toBe('PORT=3000\nHOST=localhost');
  });
});

describe('exportEnv', () => {
  test('dispatches to json', () => {
    expect(exportEnv({ A: '1' }, 'json')).toBe(toJSON({ A: '1' }));
  });

  test('dispatches to yaml', () => {
    expect(exportEnv({ A: '1' }, 'yaml')).toBe(toYAML({ A: '1' }));
  });

  test('dispatches to shell', () => {
    expect(exportEnv({ A: '1' }, 'shell')).toBe(toShell({ A: '1' }));
  });

  test('dispatches to docker', () => {
    expect(exportEnv({ A: '1' }, 'docker')).toBe(toDockerEnv({ A: '1' }));
  });

  test('throws on unknown format', () => {
    expect(() => exportEnv({}, 'xml')).toThrow('Unknown export format');
  });

  test('defaults to json', () => {
    expect(exportEnv({ A: '1' })).toBe(toJSON({ A: '1' }));
  });
});
