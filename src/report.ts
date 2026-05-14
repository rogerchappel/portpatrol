import type { Issue, ScanReport } from './types.js';

export function toJson(report: ScanReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function toMarkdown(report: ScanReport): string {
  const lines: string[] = [];
  lines.push('# PortPatrol Report', '');
  lines.push(`Root: \`${report.root}\``);
  lines.push(`Generated: ${report.generatedAt}`, '');
  lines.push('## Summary', '');
  lines.push(`- Findings: ${report.summary.totalFindings}`);
  lines.push(`- Unique ports: ${report.summary.uniquePorts}`);
  lines.push(`- Errors: ${report.summary.issueCounts.error}`);
  lines.push(`- Warnings: ${report.summary.issueCounts.warning}`);
  lines.push(`- Info: ${report.summary.issueCounts.info}`, '');

  lines.push('## Ports', '');
  if (report.findings.length === 0) {
    lines.push('No local ports found.', '');
  } else {
    lines.push('| Port | Source | Owner | Location | Raw |', '| ---: | --- | --- | --- | --- |');
    for (const finding of report.findings) {
      lines.push(`| ${finding.port} | ${finding.source} | ${escapeCell(finding.owner)} | ${escapeCell(`${finding.location.file}:${finding.location.line}`)} | ${escapeCell(finding.raw)} |`);
    }
    lines.push('');
  }

  lines.push('## Issues', '');
  if (report.issues.length === 0) {
    lines.push('No conflicts or risky bindings detected.', '');
  } else {
    for (const issue of report.issues) lines.push(...renderIssue(issue), '');
  }

  lines.push('## Safety', '', 'PortPatrol is read-only. It reports possible owners and remediation, but never kills processes or rewrites configuration.');
  return `${lines.join('\n')}\n`;
}

function renderIssue(issue: Issue): string[] {
  return [
    `### ${issue.severity.toUpperCase()}: ${issue.title}`,
    '',
    `- Code: \`${issue.code}\``,
    `- Locations: ${issue.locations.map((location) => `\`${location.file}:${location.line}\``).join(', ')}`,
    `- Remediation: ${issue.remediation}`
  ];
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
