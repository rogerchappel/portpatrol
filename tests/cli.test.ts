import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/cli.js';

test('help exits successfully', async () => {
  const writes: string[] = [];
  const original = process.stdout.write;
  process.stdout.write = ((chunk: unknown) => { writes.push(String(chunk)); return true; }) as typeof process.stdout.write;
  try {
    assert.equal(await main(['--help']), 0);
  } finally {
    process.stdout.write = original;
  }
  assert.match(writes.join(''), /portpatrol scan/);
});
