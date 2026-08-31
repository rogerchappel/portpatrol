import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { scanProject } from '../src/scan.js';
import { toJson, toMarkdown } from '../src/report.js';
import { classifySource } from '../src/scanners.js';

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
  assert.deepEqual(report.findings.map((finding) => finding.port), [
    4310, 4310, 4311, 4320, 4321, 4322, 4330, 4331, 4332, 4340, 4341, 4342, 5432, 8025
  ]);
  assert.ok(report.issues.some((issue) => issue.code === 'duplicate-port' && issue.port === 4310));
});

test('scan distinguishes Compose override files from similarly named documentation', async () => {
  const report = await scanProject({ root: fixture('classification'), live: false });

  assert.deepEqual(report.findings.map(({ port, source, confidence }) => ({ port, source, confidence })), [
    { port: 4100, source: 'compose', confidence: 'high' },
    { port: 4300, source: 'docs', confidence: 'medium' }
  ]);
});

test('classifies standard Compose YAML filename variants by basename', () => {
  for (const relativePath of [
    'compose.yaml',
    'compose.yml',
    'compose.override.yaml',
    'compose.override.yml',
    'nested/docker-compose.yaml',
    'nested/docker-compose.yml',
    'nested/docker-compose.override.yaml',
    'nested/docker-compose.override.yml'
  ]) {
    assert.equal(classifySource({ absolutePath: relativePath, relativePath, text: '' })?.source, 'compose');
  }

  for (const relativePath of ['docs/docker-compose-guide.md', 'docker-compose-notes.txt', 'my-docker-compose.yaml']) {
    assert.notEqual(classifySource({ absolutePath: relativePath, relativePath, text: '' })?.source, 'compose');
  }
});

test('package script findings retain their original source locations', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portpatrol-package-location-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'package.json'), [
    '{',
    '  "scripts": {',
    '    "lint": "eslint .",',
    '    "dev": "vite --port 4310"',
    '  }',
    '}'
  ].join('\n'));

  const report = await scanProject({ root, live: false });

  assert.equal(report.findings[0]?.location.line, 4);
  assert.equal(report.findings[0]?.location.column, 18);
  assert.match(report.findings[0]?.raw ?? '', /^script dev:/);
});

test('package scripts support quoted port arguments without losing source locations', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portpatrol-package-quotes-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'package.json'), [
    '{',
    '  "scripts": {',
    '    "double": "vite --port \\"3000\\"",',
    '    "single": "vite -p \'4100\'",',
    '    "env": "PORT=\\"4200\\" node server.js",',
    '    "invalid": "vite --port \\"70000\\""',
    '  }',
    '}',
    ''
  ].join('\n'));

  const report = await scanProject({ root, live: false });

  assert.deepEqual(report.findings.map(({ port, raw, location }) => ({
    port,
    raw,
    line: location.line,
    column: location.column
  })), [
    { port: 3000, raw: 'script double: --port \\"3000', line: 3, column: 23 },
    { port: 4100, raw: "script single: -p '4100", line: 4, column: 23 },
    { port: 4200, raw: 'script env: PORT=\\"4200', line: 5, column: 13 }
  ]);
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
