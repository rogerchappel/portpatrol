import path from 'node:path';
import { extractPorts } from './extract.js';
import type { TextFile } from './fs.js';
import type { PortFinding, PortSourceKind } from './types.js';

export function classifySource(file: TextFile): { source: PortSourceKind; owner: string } | undefined {
  const base = path.basename(file.relativePath).toLowerCase();
  if (base === 'package.json') return { source: 'package-script', owner: 'package scripts' };
  if (base.startsWith('.env')) return { source: 'env', owner: base };
  if (/docker-compose|compose\.(ya?ml|json)/i.test(file.relativePath)) return { source: 'compose', owner: 'docker compose' };
  if (/\.(md|mdx|txt)$/i.test(file.relativePath)) return { source: 'docs', owner: 'documentation' };
  if (/\.(ya?ml|json|toml|ini|conf|config|js|ts|mjs|cjs)$/i.test(file.relativePath)) return { source: 'config', owner: 'config' };
  return undefined;
}

export function scanFiles(files: TextFile[]): PortFinding[] {
  return files.flatMap((file) => {
    const classified = classifySource(file);
    if (!classified) return [];
    if (classified.source === 'package-script') return scanPackageJson(file);
    return extractPorts(file, classified.source, classified.owner);
  }).sort(compareFindings);
}

function scanPackageJson(file: TextFile): PortFinding[] {
  try {
    const pkg = JSON.parse(file.text) as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};
    const virtual = Object.entries(scripts)
      .map(([name, command]) => `"${name}": "${command}"`)
      .join('\n');
    return extractPorts({ ...file, text: virtual }, 'package-script', 'package scripts')
      .map((finding) => ({ ...finding, raw: `script ${finding.raw}` }));
  } catch {
    return extractPorts(file, 'package-script', 'package scripts');
  }
}

export function compareFindings(a: PortFinding, b: PortFinding): number {
  return a.port - b.port || a.location.file.localeCompare(b.location.file) || a.location.line - b.location.line;
}
