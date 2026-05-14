import path from 'node:path';
import { promises as fs } from 'node:fs';
import { walkProject } from './fs.js';
import { detectIssues } from './issues.js';
import { getLiveFindings } from './live.js';
import { scanFiles } from './scanners.js';
import type { ScanOptions, ScanReport, Severity } from './types.js';

export async function scanProject(options: ScanOptions): Promise<ScanReport> {
  const root = path.resolve(options.root);
  const files = await walkProject(root);
  const declared = scanFiles(files);
  const live = options.live ? await getLiveFindings() : [];
  const findings = [...declared, ...live].sort((a, b) => a.port - b.port || a.location.file.localeCompare(b.location.file));
  const issues = detectIssues(findings);

  return {
    tool: 'portpatrol',
    version: '0.1.0',
    root,
    generatedAt: new Date(0).toISOString(),
    findings,
    issues,
    summary: {
      totalFindings: findings.length,
      uniquePorts: new Set(findings.map((finding) => finding.port)).size,
      issueCounts: countIssues(issues)
    }
  };
}

export async function writeOutput(filePath: string | undefined, contents: string): Promise<void> {
  if (!filePath || filePath === '-') {
    process.stdout.write(contents);
    return;
  }
  await fs.mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  await fs.writeFile(filePath, contents, 'utf8');
}

function countIssues(issues: { severity: Severity }[]): Record<Severity, number> {
  return {
    info: issues.filter((issue) => issue.severity === 'info').length,
    warning: issues.filter((issue) => issue.severity === 'warning').length,
    error: issues.filter((issue) => issue.severity === 'error').length
  };
}
