import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { scanProject } from '../src/scan.js';

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
  assert.deepEqual(report.findings.map((finding) => finding.port), [5432, 5432, 8025, 8025]);
});
