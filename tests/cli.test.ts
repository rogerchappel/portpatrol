import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

for (const outputArgs of [[], ['--out', '-']]) {
  test(`scan ${outputArgs.length ? 'stdout output' : 'without --out'} does not exclude project files`, async (t) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portpatrol-cli-'));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    await fs.writeFile(path.join(root, 'notes.md'), 'The preview runs at http://localhost:4300.');
    const writes: string[] = [];
    const original = process.stdout.write;
    process.stdout.write = ((chunk: unknown) => { writes.push(String(chunk)); return true; }) as typeof process.stdout.write;
    try {
      assert.equal(await main(['scan', root, ...outputArgs]), 0);
    } finally {
      process.stdout.write = original;
    }
    assert.match(writes.join(''), /\| 4300 \|/);
  });
}
