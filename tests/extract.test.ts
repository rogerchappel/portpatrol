import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPorts } from '../src/extract.js';

test('extracts localhost urls and port flags', () => {
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'README.md', text: 'Use http://localhost:8080 then vite --port 5173' }, 'docs', 'docs');
  assert.deepEqual(findings.map((finding) => finding.port), [8080, 5173]);
});

test('ignores invalid port numbers', () => {
  const findings = extractPorts({ absolutePath: 'x', relativePath: '.env', text: 'URL=http://localhost:99999 PORT=7000' }, 'env', '.env');
  assert.deepEqual(findings.map((finding) => finding.port), [7000]);
});

test('extracts published ports from compose long syntax', () => {
  const text = `ports:
    - target: 3000
      published: 4310
    - target: 3001
      published: "4311"
    - target: 3002
      published: '08:30'`;
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'compose.yml', text }, 'compose', 'docker compose');
  assert.deepEqual(findings.map((finding) => finding.port), [4310, 4311]);
});

test('does not treat compose published fields as ports in other sources', () => {
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'notes.md', text: 'published: 4310' }, 'docs', 'docs');
  assert.deepEqual(findings, []);
});

test('extracts compose port pairs without treating clock times as ports', () => {
  const text = 'meeting: "09:30"\nports:\n  - "4310:3000"\n';
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'compose.yml', text }, 'compose', 'docker compose');

  assert.deepEqual(findings.map((finding) => finding.port), [4310]);
});

test('expands quoted and unquoted compose port ranges', () => {
  const text = `ports:
  - "4310-4312:3000-3002"
  - 4320-4322:3020-3022
  - target: 4000-4002
    published: '4330-4332'`;
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'compose.yml', text }, 'compose', 'docker compose');

  assert.deepEqual(findings.map(({ port }) => port), [4310, 4311, 4312, 4320, 4321, 4322, 4330, 4331, 4332]);
  assert.deepEqual(findings.slice(0, 3).map(({ raw }) => raw), Array(3).fill('"4310-4312:3000-3002"'));
  assert.deepEqual(findings.slice(0, 3).map(({ location }) => location), Array(3).fill({ file: 'compose.yml', line: 2, column: 5 }));
});

test('rejects malformed and mismatched compose ranges without partial findings', () => {
  const text = `ports:
  - "4310-4312:3000-3001"
  - "4400-:4000"
  - target: 5000
    published: "4500-"
  - target: 5001
    published: 4600-4599`;
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'compose.yml', text }, 'compose', 'docker compose');

  assert.deepEqual(findings, []);
});

test('does not treat clock times in general configuration as port pairs', () => {
  const text = '{ "meeting": "09:30", "endpoint": "http://localhost:4310" }';
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'settings.json', text }, 'config', 'config');

  assert.deepEqual(findings.map((finding) => finding.port), [4310]);
});
