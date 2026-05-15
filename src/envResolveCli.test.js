const fs = require('fs');
const os = require('os');
const path = require('path');
const { run } = require('./envResolveCli');

function tmpFile(content) {
  const p = path.join(os.tmpdir(), `envresolve-${Date.now()}-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(p, content);
  return p;
}

describe('envResolveCli run()', () => {
  let output;
  let errOutput;
  beforeEach(() => {
    output = [];
    errOutput = [];
    jest.spyOn(console, 'log').mockImplementation((...a) => output.push(a.join(' ')));
    jest.spyOn(console, 'error').mockImplementation((...a) => errOutput.push(a.join(' ')));
  });
  afterEach(() => jest.restoreAllMocks());

  test('exits with error when no files given', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => run([])).toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  test('outputs merged env in .env format', () => {
    const f1 = tmpFile('APP=myapp\nPORT=3000');
    const f2 = tmpFile('PORT=4000\nDEBUG=true');
    run([f1, f2]);
    const combined = output.join('\n');
    expect(combined).toContain('APP=myapp');
    expect(combined).toContain('PORT=4000');
    expect(combined).toContain('DEBUG=true');
  });

  test('--json flag outputs JSON', () => {
    const f = tmpFile('FOO=bar\nBAZ=qux');
    run([f, '--json']);
    const parsed = JSON.parse(output[0]);
    expect(parsed.FOO).toBe('bar');
    expect(parsed.BAZ).toBe('qux');
  });

  test('--override flag takes highest priority', () => {
    const f = tmpFile('PORT=3000');
    run([f, '--json', '--override', 'PORT=9999']);
    const parsed = JSON.parse(output[0]);
    expect(parsed.PORT).toBe('9999');
  });

  test('--trace flag shows resolution trace', () => {
    const f1 = tmpFile('A=1');
    const f2 = tmpFile('A=2\nB=3');
    run([f1, f2, '--trace']);
    const combined = output.join('\n');
    expect(combined).toContain('Resolved');
    expect(combined).toContain('<-');
  });

  test('--no-interpolate skips variable expansion', () => {
    const f = tmpFile('BASE=hello\nFULL=${BASE}_world');
    run([f, '--json', '--no-interpolate']);
    const parsed = JSON.parse(output[0]);
    expect(parsed.FULL).toBe('${BASE}_world');
  });

  test('warns about unresolved references', () => {
    const f = tmpFile('FULL=${GHOST}_suffix');
    run([f]);
    expect(errOutput.some(e => e.includes('unresolved'))).toBe(true);
  });
});
