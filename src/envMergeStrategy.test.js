const { applyStrategy, detectConflicts, formatConflicts, STRATEGIES } = require('./envMergeStrategy');

const base     = { A: '1', B: '2', C: '3' };
const incoming = { A: '99', B: '2', D: '4' };

test('STRATEGIES lists expected entries', () => {
  expect(STRATEGIES).toContain('ours');
  expect(STRATEGIES).toContain('theirs');
  expect(STRATEGIES).toContain('union');
  expect(STRATEGIES).toContain('intersection');
  expect(STRATEGIES).toContain('interactive');
});

test('ours keeps base values on conflict, adds missing incoming keys', () => {
  const result = applyStrategy('ours', base, incoming);
  expect(result.A).toBe('1');  // base wins
  expect(result.B).toBe('2');  // same, no conflict
  expect(result.C).toBe('3');  // base only key preserved
  expect(result.D).toBe('4');  // incoming-only key added
});

test('theirs lets incoming win on conflict', () => {
  const result = applyStrategy('theirs', base, incoming);
  expect(result.A).toBe('99'); // incoming wins
  expect(result.B).toBe('2');
  expect(result.C).toBe('3');  // base-only preserved
  expect(result.D).toBe('4');
});

test('union includes all keys, incoming wins on conflict', () => {
  const result = applyStrategy('union', base, incoming);
  expect(Object.keys(result).sort()).toEqual(['A', 'B', 'C', 'D']);
  expect(result.A).toBe('99');
});

test('intersection keeps only shared keys, incoming value', () => {
  const result = applyStrategy('intersection', base, incoming);
  expect(Object.keys(result).sort()).toEqual(['A', 'B']);
  expect(result.A).toBe('99');
  expect(result.B).toBe('2');
  expect(result.C).toBeUndefined();
  expect(result.D).toBeUndefined();
});

test('interactive strategy throws descriptive error', () => {
  expect(() => applyStrategy('interactive', base, incoming)).toThrow(/interactive/);
});

test('unknown strategy throws', () => {
  expect(() => applyStrategy('bogus', base, incoming)).toThrow(/Unknown merge strategy/);
});

test('detectConflicts finds keys with differing values', () => {
  const conflicts = detectConflicts(base, incoming);
  expect(conflicts).toHaveLength(1);
  expect(conflicts[0].key).toBe('A');
  expect(conflicts[0].baseValue).toBe('1');
  expect(conflicts[0].incomingValue).toBe('99');
});

test('detectConflicts returns empty array when no conflicts', () => {
  expect(detectConflicts({ X: '1' }, { Y: '2' })).toEqual([]);
  expect(detectConflicts({ X: '1' }, { X: '1' })).toEqual([]);
});

test('formatConflicts returns no-conflict message', () => {
  expect(formatConflicts([])).toMatch(/No conflicts/);
});

test('formatConflicts shows conflict details', () => {
  const conflicts = detectConflicts(base, incoming);
  const output = formatConflicts(conflicts);
  expect(output).toMatch('A');
  expect(output).toMatch('1');
  expect(output).toMatch('99');
  expect(output).toMatch('1 conflict');
});
