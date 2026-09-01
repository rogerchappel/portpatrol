import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLsof, parseSs } from '../src/live.js';

test('parses lsof listener output', () => {
  const output = readFileSync('tests/fixtures/live/lsof.txt', 'utf8');
  const records = parseLsof(output);
  assert.deepEqual(records.map((record) => record.port), [3000, 8000, 65535]);
  assert.equal(records[1]?.host, '0.0.0.0');
  assert.equal(records[2]?.host, '[::1]');
});

test('parses ss listener output', () => {
  const output = readFileSync('tests/fixtures/live/ss.txt', 'utf8');
  const records = parseSs(output);
  assert.deepEqual(records.map((record) => record.port), [9229, 65535]);
  assert.deepEqual(records.map((record) => record.host), ['127.0.0.1', '[::]']);
});
