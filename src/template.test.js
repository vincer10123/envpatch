const {
  generateTemplate,
  checkMissingKeys,
  checkExtraKeys,
  serializeTemplate,
  deserializeTemplate,
} = require('./template');

describe('generateTemplate', () => {
  const env = {
    APP_NAME: 'myapp',
    PORT: '3000',
    DB_PASSWORD: 'supersecret',
    API_KEY: 'abc123',
    DEBUG: 'true',
  };

  test('blanks sensitive keys by default', () => {
    const tmpl = generateTemplate(env);
    expect(tmpl.DB_PASSWORD).toBe('');
    expect(tmpl.API_KEY).toBe('');
    expect(tmpl.APP_NAME).toBe('myapp');
    expect(tmpl.PORT).toBe('3000');
  });

  test('blanks all keys when blankAll is true', () => {
    const tmpl = generateTemplate(env, { blankAll: true });
    Object.values(tmpl).forEach((v) => expect(v).toBe(''));
  });

  test('uses custom placeholder', () => {
    const tmpl = generateTemplate(env, { blankAll: true, placeholder: 'CHANGEME' });
    Object.values(tmpl).forEach((v) => expect(v).toBe('CHANGEME'));
  });

  test('preserves all keys', () => {
    const tmpl = generateTemplate(env);
    expect(Object.keys(tmpl)).toEqual(Object.keys(env));
  });
});

describe('checkMissingKeys', () => {
  const template = { APP_NAME: '', PORT: '', DB_PASSWORD: '' };

  test('returns empty array when all keys present', () => {
    const env = { APP_NAME: 'x', PORT: '3000', DB_PASSWORD: 'y' };
    expect(checkMissingKeys(template, env)).toEqual([]);
  });

  test('returns missing keys', () => {
    const env = { APP_NAME: 'x' };
    const missing = checkMissingKeys(template, env);
    expect(missing).toContain('PORT');
    expect(missing).toContain('DB_PASSWORD');
    expect(missing).not.toContain('APP_NAME');
  });
});

describe('checkExtraKeys', () => {
  const template = { APP_NAME: '', PORT: '' };

  test('returns empty array when no extra keys', () => {
    expect(checkExtraKeys(template, { APP_NAME: 'x', PORT: '3000' })).toEqual([]);
  });

  test('returns extra keys not in template', () => {
    const env = { APP_NAME: 'x', PORT: '3000', EXTRA_VAR: 'oops' };
    expect(checkExtraKeys(template, env)).toEqual(['EXTRA_VAR']);
  });
});

describe('serializeTemplate / deserializeTemplate', () => {
  test('round-trips a template', () => {
    const template = { APP_NAME: 'myapp', DB_PASSWORD: '', PORT: '3000' };
    const serialized = serializeTemplate(template);
    expect(typeof serialized).toBe('string');
    const parsed = deserializeTemplate(serialized);
    expect(parsed).toEqual(template);
  });
});
