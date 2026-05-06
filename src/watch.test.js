import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { watchEnv } from './watch.js';

function tmpFile() {
  const p = path.join(os.tmpdir(), `envpatch-watch-${Date.now()}.env`);
  fs.writeFileSync(p, '');
  return p;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('watchEnv', () => {
  let file;

  beforeEach(() => {
    file = tmpFile();
  });

  afterEach(() => {
    try { fs.unlinkSync(file); } catch {}
  });

  it('throws if onChange is not a function', () => {
    expect(() => watchEnv(file, {})).toThrow('options.onChange must be a function');
  });

  it('returns a stop() method', () => {
    const handle = watchEnv(file, { onChange: () => {} });
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });

  it('calls onChange when file content changes', async () => {
    fs.writeFileSync(file, 'FOO=bar\n');
    const changes = [];

    const handle = watchEnv(file, {
      environment: 'test',
      onChange: (diffResult, entry) => {
        changes.push({ diffResult, entry });
      },
    });

    await sleep(100);
    fs.writeFileSync(file, 'FOO=bar\nBAZ=qux\n');
    await sleep(400);

    handle.stop();

    expect(changes.length).toBeGreaterThanOrEqual(1);
    expect(changes[0].diffResult.added).toHaveProperty('BAZ', 'qux');
    expect(changes[0].entry.operation).toBe('watch');
  });

  it('does not call onChange when content is unchanged', async () => {
    fs.writeFileSync(file, 'FOO=bar\n');
    const changes = [];

    const handle = watchEnv(file, {
      onChange: () => changes.push(1),
    });

    await sleep(100);
    // Write identical content
    fs.writeFileSync(file, 'FOO=bar\n');
    await sleep(400);

    handle.stop();
    expect(changes.length).toBe(0);
  });
});
