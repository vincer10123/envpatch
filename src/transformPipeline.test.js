const { buildPipeline, runPipeline, serializePipeline, deserializePipeline } = require('./transformPipeline');

const env = {
  APP_HOST: 'localhost',
  APP_PORT: '3000',
  DB_URL: 'postgres://localhost/dev',
  SECRET_KEY: 'topsecret'
};

describe('buildPipeline', () => {
  it('applies steps in order', () => {
    const pipeline = buildPipeline([
      { type: 'omit', keys: ['SECRET_KEY'] },
      { type: 'stripPrefix', prefix: 'APP_' }
    ]);
    const result = pipeline(env);
    expect(result.HOST).toBe('localhost');
    expect(result.PORT).toBe('3000');
    expect(result.SECRET_KEY).toBeUndefined();
    expect(result.APP_HOST).toBeUndefined();
  });

  it('throws on unknown step type', () => {
    expect(() => buildPipeline([{ type: 'explode' }])(env)).toThrow('Unknown transform step');
  });
});

describe('runPipeline', () => {
  it('pick then prefix', () => {
    const result = runPipeline(env, [
      { type: 'pick', keys: ['APP_HOST', 'APP_PORT'] },
      { type: 'prefix', prefix: 'NEXT_PUBLIC_' }
    ]);
    expect(Object.keys(result)).toEqual(['NEXT_PUBLIC_APP_HOST', 'NEXT_PUBLIC_APP_PORT']);
  });

  it('rename step', () => {
    const result = runPipeline(env, [
      { type: 'rename', map: { APP_HOST: 'HOST', APP_PORT: 'PORT' } }
    ]);
    expect(result.HOST).toBe('localhost');
    expect(result.PORT).toBe('3000');
    expect(result.APP_HOST).toBeUndefined();
  });

  it('empty steps returns env unchanged', () => {
    expect(runPipeline(env, [])).toEqual(env);
  });
});

describe('serializePipeline / deserializePipeline', () => {
  it('round-trips correctly', () => {
    const steps = [
      { type: 'omit', keys: ['SECRET_KEY'] },
      { type: 'prefix', prefix: 'TEST_' }
    ];
    const raw = serializePipeline(steps);
    expect(typeof raw).toBe('string');
    const parsed = deserializePipeline(raw);
    expect(parsed).toEqual(steps);
  });
});
