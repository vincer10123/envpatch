const fs = require('fs');
const os = require('os');
const path = require('path');
const { run } = require('./envScopeCli');

function tmpFile(content) {
  const p = path.join(os.tmpdir(), `envscope-${Date.now()}-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

const scopedContent = `DEV__DB_URL=postgres://localhost/dev\nPROD__DB_URL=postgres://prod/app\nDEV__DEBUG=true\nAPP_NAME=myapp\n`;

test('list shows scopes in file', () => {
  const file = tmpFile(scopedContent);
  const logs = [];
  jest.spyOn(console, 'log').mockImplementation(m => logs.push(m));
  run(['list', file]);
  expect(logs.join(' ')).toMatch(/dev/);
  expect(logs.join(' ')).toMatch(/prod/);
  jest.restoreAllMocks();
});

test('list reports no scopes for plain env', () => {
  const file = tmpFile('FOO=bar\nBAZ=qux\n');
  const logs = [];
  jest.spyOn(console, 'log').mockImplementation(m => logs.push(m));
  run(['list', file]);
  expect(logs.join(' ')).toMatch(/No scopes/);
  jest.restoreAllMocks();
});

test('show outputs formatted scope map', () => {
  const file = tmpFile(scopedContent);
  const logs = [];
  jest.spyOn(console, 'log').mockImplementation(m => logs.push(m));
  run(['show', file]);
  const out = logs.join('\n');
  expect(out).toContain('[dev]');
  expect(out).toContain('[prod]');
  jest.restoreAllMocks();
});

test('extract prints scoped keys to stdout', () => {
  const file = tmpFile(scopedContent);
  const logs = [];
  jest.spyOn(console, 'log').mockImplementation(m => logs.push(m));
  run(['extract', 'dev', file]);
  const out = logs.join('\n');
  expect(out).toContain('DB_URL');
  expect(out).toContain('postgres://localhost/dev');
  jest.restoreAllMocks();
});

test('extract writes to outFile when provided', () => {
  const file = tmpFile(scopedContent);
  const out = path.join(os.tmpdir(), `envscope-out-${Date.now()}.env`);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  run(['extract', 'prod', file, out]);
  const written = fs.readFileSync(out, 'utf8');
  expect(written).toContain('DB_URL');
  expect(written).toContain('postgres://prod/app');
  jest.restoreAllMocks();
});

test('apply merges scope overrides onto base', () => {
  const base = tmpFile('DB_URL=default\nLOG_LEVEL=info\n');
  const scoped = tmpFile(scopedContent);
  const logs = [];
  jest.spyOn(console, 'log').mockImplementation(m => logs.push(m));
  run(['apply', 'prod', base, scoped]);
  const out = logs.join('\n');
  expect(out).toContain('DB_URL');
  expect(out).toContain('postgres://prod/app');
  expect(out).toContain('LOG_LEVEL');
  jest.restoreAllMocks();
});

test('unknown command exits with error', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  expect(() => run(['unknown'])).toThrow('exit');
  jest.restoreAllMocks();
});
