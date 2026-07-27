import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { scanProject } from '../src/scan.js';
import { toJson, toMarkdown } from '../src/report.js';

const fixture = (name: string) => path.join(process.cwd(), 'tests/fixtures', name);

test('scan finds clean fixture declarations', async () => {
  const report = await scanProject({ root: fixture('clean'), live: false });
  assert.equal(report.summary.uniquePorts, 2);
  assert.equal(report.issues.filter((issue) => issue.severity === 'error').length, 0);
});

test('scan flags duplicate declared ports', async () => {
  const report = await scanProject({ root: fixture('conflict'), live: false });
  assert.ok(report.issues.some((issue) => issue.code === 'duplicate-port' && issue.port === 3000));
  assert.ok(report.issues.some((issue) => issue.code === 'privileged-port' && issue.port === 80));
});

test('scan reads compose fixture ports', async () => {
  const report = await scanProject({ root: fixture('compose'), live: false });
  assert.deepEqual(report.findings.map((finding) => finding.port), [5432, 8025]);
});

for (const format of ['markdown', 'json'] as const) {
  test(`scan excludes its explicit ${format} report output on repeated runs`, async (t) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portpatrol-scan-'));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({
      scripts: { dev: 'vite --port 4100' }
    }));

    const output = path.join(root, format === 'markdown' ? 'PORTS.md' : 'ports.json');
    const first = await scanProject({ root, live: false, exclude: [output] });
    await fs.writeFile(output, format === 'markdown' ? toMarkdown(first) : toJson(first));
    const second = await scanProject({ root, live: false, exclude: [output] });

    assert.deepEqual(second.findings.map((finding) => finding.location.file), ['package.json']);
    assert.equal(second.issues.some((issue) => issue.code === 'duplicate-port'), false);
  });
}

test('scan still reads ordinary user-authored reports without an exclusion', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portpatrol-scan-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'notes.md'), 'The preview runs at http://localhost:4200.');

  const report = await scanProject({ root, live: false });

  assert.deepEqual(report.findings.map((finding) => finding.port), [4200]);
});
