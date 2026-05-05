'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CLI = path.resolve(__dirname, 'cli.js');

function run(args, opts = {}) {
  try {
    return {
      stdout: execSync(`node ${CLI} ${args}`, { encoding: 'utf8', ...opts }),
      code: 0,
    };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', code: err.status };
  }
}

function tmpFile(content) {
  const file = path.join(os.tmpdir(), `envpatch-test-${Date.now()}-${Math.random().toString(36).slice(2)}.env`);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

describe('cli', () => {
  test('shows help when no command given', () => {
    const { stdout, code } = run('');
    expect(stdout).toContain('envpatch');
    expect(code).toBe(0);
  });

  test('exits 1 for unknown command', () => {
    const { code } = run('unknown');
    expect(code).toBe(1);
  });

  test('diff prints changes between two env files', () => {
    const a = tmpFile('FOO=bar\nBAZ=qux\n');
    const b = tmpFile('FOO=changed\nNEW=val\n');
    const { stdout, code } = run(`diff ${a} ${b}`);
    expect(code).toBe(0);
    expect(stdout).toContain('FOO');
    expect(stdout).toContain('changed');
  });

  test('merge outputs merged env', () => {
    const base = tmpFile('FOO=base\nKEEP=yes\n');
    const override = tmpFile('FOO=override\nNEW=added\n');
    const { stdout, code } = run(`merge ${base} ${override}`);
    expect(code).toBe(0);
    expect(stdout).toContain('FOO=override');
    expect(stdout).toContain('KEEP=yes');
    expect(stdout).toContain('NEW=added');
  });

  test('merge writes to output file when specified', () => {
    const base = tmpFile('A=1\n');
    const override = tmpFile('B=2\n');
    const out = path.join(os.tmpdir(), `envpatch-out-${Date.now()}.env`);
    const { code } = run(`merge ${base} ${override} ${out}`);
    expect(code).toBe(0);
    expect(fs.existsSync(out)).toBe(true);
    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('A=1');
    fs.unlinkSync(out);
  });

  test('diff errors if files missing', () => {
    const { code } = run('diff');
    expect(code).not.toBe(0);
  });
});
