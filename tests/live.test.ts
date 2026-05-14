import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLsof, parseSs } from '../src/live.js';

test('parses lsof listener output', () => {
  const output = readFileSync('tests/fixtures/live/lsof.txt', 'utf8');
  const records = parseLsof(output);
  assert.deepEqual(records.map((record) => record.port), [3000, 8000]);
  assert.equal(records[1]?.host, '0.0.0.0');
});

test('parses ss listener output', () => {
  const records = parseSs('State Recv-Q Send-Q Local Address:Port Peer Address:Port Process\nLISTEN 0 128 127.0.0.1:9229 0.0.0.0:* users:(("node",pid=1,fd=2))\n');
  assert.equal(records[0]?.port, 9229);
});
