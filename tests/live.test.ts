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

test('parses bracketed ss IPv6 local endpoints and rejects malformed ones', () => {
  const output = readFileSync('tests/fixtures/live/ss-ipv6.txt', 'utf8');
  const records = parseSs(output);
  assert.deepEqual(records.map(({ host, port }) => ({ host, port })), [
    { host: '[::1]', port: 3000 },
    { host: '[::ffff:127.0.0.1]', port: 4000 },
    { host: '[2001:db8::1]', port: 5000 },
    { host: '[fe80::1%lo]', port: 6000 }
  ]);
});
