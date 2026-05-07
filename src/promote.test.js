const { promote, formatPromotionSummary } = require('./promote');

const sourceEnv = `
APP_NAME=myapp
DB_HOST=prod-db.example.com
DB_PORT=5432
SECRET_KEY=supersecret
`.trim();

const targetEnv = `
APP_NAME=myapp
DB_HOST=staging-db.example.com
DB_PORT=5432
EXTRA_KEY=keepme
`.trim();

describe('promote', () => {
  test('promotes differing keys from source to target', () => {
    const { result, promoted, skipped } = promote(sourceEnv, targetEnv);
    expect(promoted).toContain('DB_HOST');
    expect(promoted).toContain('SECRET_KEY');
    expect(promoted).not.toContain('APP_NAME'); // same value
    expect(promoted).not.toContain('DB_PORT');  // same value
    expect(skipped).toHaveLength(0);
    expect(result['DB_HOST']).toBe('prod-db.example.com');
    expect(result['SECRET_KEY']).toBe('supersecret');
    expect(result['EXTRA_KEY']).toBe('keepme'); // preserved
  });

  test('respects only option', () => {
    const { promoted, skipped } = promote(sourceEnv, targetEnv, { only: ['DB_HOST'] });
    expect(promoted).toEqual(['DB_HOST']);
    expect(skipped).toContain('SECRET_KEY');
  });

  test('respects except option', () => {
    const { promoted, skipped } = promote(sourceEnv, targetEnv, { except: ['SECRET_KEY'] });
    expect(promoted).not.toContain('SECRET_KEY');
    expect(skipped).toContain('SECRET_KEY');
    expect(promoted).toContain('DB_HOST');
  });

  test('returns empty promoted when envs are in sync', () => {
    const { promoted } = promote(sourceEnv, sourceEnv);
    expect(promoted).toHaveLength(0);
  });

  test('result contains all target keys plus promoted keys', () => {
    const { result } = promote(sourceEnv, targetEnv);
    expect(result).toHaveProperty('EXTRA_KEY', 'keepme');
    expect(result).toHaveProperty('APP_NAME', 'myapp');
  });
});

describe('formatPromotionSummary', () => {
  test('shows promoted and skipped keys', () => {
    const summary = formatPromotionSummary(['DB_HOST', 'SECRET_KEY'], ['SKIP_ME'], 'prod', 'staging');
    expect(summary).toContain('prod → staging');
    expect(summary).toContain('+ DB_HOST');
    expect(summary).toContain('+ SECRET_KEY');
    expect(summary).toContain('- SKIP_ME');
  });

  test('shows in-sync message when nothing promoted', () => {
    const summary = formatPromotionSummary([], []);
    expect(summary).toContain('No keys were promoted');
  });
});
