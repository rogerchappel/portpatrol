import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { parseRange, suggestPorts } from '../src/suggest.js';

test('parses valid ranges', () => {
  assert.deepEqual(parseRange('3000-3002'), [3000, 3002]);
});

test('suggest skips ports found in fixtures', async () => {
  const ports = await suggestPorts({ root: path.join(process.cwd(), 'tests/fixtures/clean'), range: '4099-4101', count: 2, live: false });
  assert.deepEqual(ports, [4099, 4101]);
});
