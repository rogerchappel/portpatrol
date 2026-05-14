import type { Issue, PortFinding } from './types.js';

export function detectIssues(findings: PortFinding[]): Issue[] {
  const issues: Issue[] = [];
  const byPort = new Map<number, PortFinding[]>();

  for (const finding of findings) {
    const list = byPort.get(finding.port) ?? [];
    list.push(finding);
    byPort.set(finding.port, list);

    if (finding.port < 1024) {
      issues.push({
        code: 'privileged-port',
        severity: 'warning',
        title: `Port ${finding.port} is privileged`,
        port: finding.port,
        locations: [finding.location],
        remediation: 'Prefer an unprivileged development port above 1024 unless this service intentionally requires elevated binding.'
      });
    }

    if (finding.host === '0.0.0.0') {
      issues.push({
        code: 'wildcard-bind',
        severity: 'warning',
        title: `Port ${finding.port} binds every interface`,
        port: finding.port,
        locations: [finding.location],
        remediation: 'Use localhost/127.0.0.1 for local-only development services when possible.'
      });
    }
  }

  for (const [port, matches] of byPort) {
    const owners = new Set(matches.map((match) => `${match.source}:${match.owner}`));
    if (owners.size > 1) {
      issues.push({
        code: 'duplicate-port',
        severity: 'error',
        title: `Port ${port} appears in multiple places`,
        port,
        locations: matches.map((match) => match.location),
        remediation: 'Assign a single owner for this port or move one service to a different value.'
      });
    }

    const hasLive = matches.some((match) => match.source === 'live');
    const hasDeclared = matches.some((match) => match.source !== 'live');
    if (hasLive && hasDeclared) {
      issues.push({
        code: 'live-declared-conflict',
        severity: 'error',
        title: `Port ${port} is declared and already listening`,
        port,
        locations: matches.map((match) => match.location),
        remediation: 'Confirm the listener is the intended service before starting another process. PortPatrol never kills it for you.'
      });
    }
  }

  return issues.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || (a.port ?? 0) - (b.port ?? 0) || a.code.localeCompare(b.code));
}

function severityRank(severity: Issue['severity']): number {
  return severity === 'error' ? 3 : severity === 'warning' ? 2 : 1;
}
