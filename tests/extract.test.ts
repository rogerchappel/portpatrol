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

test('extracts compose port pairs without treating clock times as ports', () => {
  const text = 'meeting: "09:30"\nports:\n  - "4310:3000"\n';
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'compose.yml', text }, 'compose', 'docker compose');

  assert.deepEqual(findings.map((finding) => finding.port), [4310]);
});

test('does not treat clock times in general configuration as port pairs', () => {
  const text = '{ "meeting": "09:30", "endpoint": "http://localhost:4310" }';
  const findings = extractPorts({ absolutePath: 'x', relativePath: 'settings.json', text }, 'config', 'config');

  assert.deepEqual(findings.map((finding) => finding.port), [4310]);
});
