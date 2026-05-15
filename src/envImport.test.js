const { fromJSON, fromYAML, fromShell, fromDockerEnv, importEnv } = require('./envImport');

describe('fromJSON', () => {
  it('parses flat object', () => {
    expect(fromJSON('{"A":"1","B":"hello"}')).toEqual({ A: '1', B: 'hello' });
  });
  it('coerces numbers to strings', () => {
    expect(fromJSON('{"PORT":3000}')).toEqual({ PORT: '3000' });
  });
  it('throws on invalid JSON', () => {
    expect(() => fromJSON('not json')).toThrow('Invalid JSON');
  });
  it('throws on array input', () => {
    expect(() => fromJSON('["a"]')).toThrow('flat key/value object');
  });
});

describe('fromYAML', () => {
  it('parses simple key: value lines', () => {
    const yaml = 'APP_NAME: myapp\nPORT: 8080';
    expect(fromYAML(yaml)).toEqual({ APP_NAME: 'myapp', PORT: '8080' });
  });
  it('strips surrounding quotes', () => {
    expect(fromYAML('KEY: "hello world"')).toEqual({ KEY: 'hello world' });
    expect(fromYAML("KEY: 'hi'")).toEqual({ KEY: 'hi' });
  });
  it('ignores comment lines', () => {
    const yaml = '# comment\nFOO: bar';
    expect(fromYAML(yaml)).toEqual({ FOO: 'bar' });
  });
  it('ignores blank lines', () => {
    expect(fromYAML('\n\nX: 1\n')).toEqual({ X: '1' });
  });
});

describe('fromShell', () => {
  it('parses KEY=VALUE lines', () => {
    expect(fromShell('A=1\nB=two')).toEqual({ A: '1', B: 'two' });
  });
  it('strips export keyword', () => {
    expect(fromShell('export FOO=bar')).toEqual({ FOO: 'bar' });
  });
  it('strips quotes', () => {
    expect(fromShell('MSG="hello world"')).toEqual({ MSG: 'hello world' });
  });
  it('ignores comments', () => {
    expect(fromShell('# skip\nX=1')).toEqual({ X: '1' });
  });
});

describe('fromDockerEnv', () => {
  it('parses docker env file format', () => {
    const content = 'DB_HOST=localhost\nDB_PORT=5432';
    expect(fromDockerEnv(content)).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });
});

describe('importEnv', () => {
  it('dispatches to correct parser', () => {
    expect(importEnv('{"Z":"9"}', 'json')).toEqual({ Z: '9' });
    expect(importEnv('K: v', 'yaml')).toEqual({ K: 'v' });
    expect(importEnv('K=v', 'shell')).toEqual({ K: 'v' });
    expect(importEnv('K=v', 'docker')).toEqual({ K: 'v' });
  });
  it('throws on unknown format', () => {
    expect(() => importEnv('', 'toml')).toThrow('Unknown import format');
  });
});
