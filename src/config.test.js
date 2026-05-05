'use strict';

const { DEFAULT_CONFIG, loadConfig, redactEnv } = require('./config');

describe('loadConfig', () => {
  test('returns defaults when called with no args', () => {
    const cfg = loadConfig();
    expect(cfg).toEqual(DEFAULT_CONFIG);
  });

  test('merges overrides into defaults', () => {
    const cfg = loadConfig({ diffFormat: 'json', quoteChar: "'" });
    expect(cfg.diffFormat).toBe('json');
    expect(cfg.quoteChar).toBe("'");
    expect(cfg.commentPrefix).toBe('#');
  });

  test('throws on unknown config keys', () => {
    expect(() => loadConfig({ unknownKey: true })).toThrow('Unknown config keys: unknownKey');
  });

  test('does not mutate DEFAULT_CONFIG', () => {
    loadConfig({ diffFormat: 'json' });
    expect(DEFAULT_CONFIG.diffFormat).toBe('text');
  });

  test('accepts all valid keys without throwing', () => {
    expect(() =>
      loadConfig({
        commentPrefix: '//',
        preserveBlankLines: false,
        quoteSpacedValues: false,
        quoteChar: "'",
        redactedKeys: ['SECRET'],
        redactedPlaceholder: '<redacted>',
        diffFormat: 'json',
      })
    ).not.toThrow();
  });
});

describe('redactEnv', () => {
  const env = { FOO: 'bar', SECRET: 'topsecret', API_KEY: 'abc123' };

  test('returns env unchanged when no redactedKeys configured', () => {
    const cfg = loadConfig();
    expect(redactEnv(env, cfg)).toEqual(env);
  });

  test('replaces specified keys with placeholder', () => {
    const cfg = loadConfig({ redactedKeys: ['SECRET', 'API_KEY'] });
    const result = redactEnv(env, cfg);
    expect(result.SECRET).toBe('***');
    expect(result.API_KEY).toBe('***');
    expect(result.FOO).toBe('bar');
  });

  test('uses custom placeholder', () => {
    const cfg = loadConfig({ redactedKeys: ['SECRET'], redactedPlaceholder: '<hidden>' });
    const result = redactEnv(env, cfg);
    expect(result.SECRET).toBe('<hidden>');
  });

  test('ignores keys not present in env', () => {
    const cfg = loadConfig({ redactedKeys: ['NOT_PRESENT'] });
    expect(redactEnv(env, cfg)).toEqual(env);
  });

  test('does not mutate the original env object', () => {
    const cfg = loadConfig({ redactedKeys: ['SECRET'] });
    redactEnv(env, cfg);
    expect(env.SECRET).toBe('topsecret');
  });
});
