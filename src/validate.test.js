const { validate, formatValidation } = require('./validate');

describe('validate', () => {
  const schema = { DB_HOST: 'localhost', DB_PORT: '5432', APP_SECRET: 'changeme' };

  test('returns valid when all schema keys are present', () => {
    const parsed = { DB_HOST: '10.0.0.1', DB_PORT: '5432', APP_SECRET: 'supersecret' };
    const result = validate(parsed, schema);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test('reports missing keys', () => {
    const parsed = { DB_HOST: '10.0.0.1' };
    const result = validate(parsed, schema);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('DB_PORT');
    expect(result.missing).toContain('APP_SECRET');
  });

  test('reports extra keys not in schema', () => {
    const parsed = { DB_HOST: 'x', DB_PORT: '5432', APP_SECRET: 'y', EXTRA_KEY: 'z' };
    const result = validate(parsed, schema);
    expect(result.extra).toEqual(['EXTRA_KEY']);
  });

  test('valid is true even when extra keys exist', () => {
    const parsed = { DB_HOST: 'x', DB_PORT: '5432', APP_SECRET: 'y', EXTRA_KEY: 'z' };
    const result = validate(parsed, schema);
    expect(result.valid).toBe(true);
  });

  test('empty parsed against non-empty schema is invalid', () => {
    const result = validate({}, schema);
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBe(3);
  });

  test('both empty returns valid with no extras', () => {
    const result = validate({}, {});
    expect(result.valid).toBe(true);
    expect(result.extra).toEqual([]);
  });
});

describe('formatValidation', () => {
  test('shows success message when fully valid', () => {
    const result = { valid: true, missing: [], extra: [] };
    expect(formatValidation(result)).toMatch(/valid and complete/);
  });

  test('lists missing keys', () => {
    const result = { valid: false, missing: ['DB_HOST', 'APP_SECRET'], extra: [] };
    const output = formatValidation(result);
    expect(output).toContain('DB_HOST');
    expect(output).toContain('APP_SECRET');
    expect(output).toContain('Missing required keys');
  });

  test('lists extra keys', () => {
    const result = { valid: true, missing: [], extra: ['DEBUG'] };
    const output = formatValidation(result);
    expect(output).toContain('DEBUG');
    expect(output).toContain('Extra keys');
  });
});
