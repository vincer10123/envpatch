const { validateSchema, checkAgainstSchema, formatSchemaResult } = require('./env-schema');

const schema = {
  PORT:     { type: 'number',  required: true },
  APP_URL:  { type: 'url',     required: true },
  DEBUG:    { type: 'boolean', required: false, default: 'false' },
  EMAIL:    { type: 'email',   required: false },
  API_KEY:  { type: 'string',  required: true, pattern: '^[A-Za-z0-9_-]{16,}$' },
};

describe('validateSchema', () => {
  test('returns no errors for valid schema', () => {
    expect(validateSchema(schema)).toEqual([]);
  });

  test('reports unknown type', () => {
    const errors = validateSchema({ FOO: { type: 'uuid' } });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/unknown type/);
  });

  test('reports invalid regex pattern', () => {
    const errors = validateSchema({ FOO: { pattern: '[invalid(' } });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/invalid pattern/);
  });
});

describe('checkAgainstSchema', () => {
  const validEnv = {
    PORT:    '3000',
    APP_URL: 'https://example.com',
    DEBUG:   'true',
    EMAIL:   'admin@example.com',
    API_KEY: 'abcdefghijklmnop',
  };

  test('passes for a valid env', () => {
    const result = checkAgainstSchema(validEnv, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('errors on missing required key', () => {
    const env = { ...validEnv };
    delete env.PORT;
    const result = checkAgainstSchema(env, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('PORT'))).toBe(true);
  });

  test('errors on type mismatch', () => {
    const result = checkAgainstSchema({ ...validEnv, PORT: 'notanumber' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('PORT'))).toBe(true);
  });

  test('errors on pattern mismatch', () => {
    const result = checkAgainstSchema({ ...validEnv, API_KEY: 'short' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('API_KEY'))).toBe(true);
  });

  test('warns on undeclared key', () => {
    const result = checkAgainstSchema({ ...validEnv, MYSTERY: 'value' }, schema);
    expect(result.warnings.some(w => w.includes('MYSTERY'))).toBe(true);
  });

  test('warns when optional key missing but has default', () => {
    const env = { ...validEnv };
    delete env.DEBUG;
    const result = checkAgainstSchema(env, schema);
    expect(result.warnings.some(w => w.includes('DEBUG'))).toBe(true);
  });
});

describe('formatSchemaResult', () => {
  test('shows pass message when valid', () => {
    const out = formatSchemaResult({ errors: [], warnings: [], valid: true });
    expect(out).toMatch(/passed/);
  });

  test('shows fail message and errors when invalid', () => {
    const out = formatSchemaResult({ errors: ['Missing required key: PORT'], warnings: [], valid: false });
    expect(out).toMatch(/failed/);
    expect(out).toMatch(/PORT/);
  });
});
