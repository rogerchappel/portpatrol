import { scanProject } from './scan.js';

export interface SuggestOptions {
  root: string;
  range: string;
  count: number;
  live: boolean;
}

export async function suggestPorts(options: SuggestOptions): Promise<number[]> {
  const [start, end] = parseRange(options.range);
  const report = await scanProject({ root: options.root, live: options.live });
  const used = new Set(report.findings.map((finding) => finding.port));
  const suggestions: number[] = [];
  for (let port = start; port <= end && suggestions.length < options.count; port += 1) {
    if (!used.has(port)) suggestions.push(port);
  }
  return suggestions;
}

export function parseRange(value: string): [number, number] {
  const match = value.match(/^(\d{1,5})-(\d{1,5})$/);
  if (!match) throw new Error(`Expected range like 3000-3999, got ${value}`);
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (start < 1 || end > 65535 || start > end) throw new Error(`Invalid port range ${value}`);
  return [start, end];
}
