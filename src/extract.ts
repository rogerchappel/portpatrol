import { lineAndColumn, type TextFile } from './fs.js';
import type { PortFinding, PortSourceKind } from './types.js';

const URL_RE = /\bhttps?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+\]|[a-z0-9.-]+):(\d{2,5})\b/gi;
const HOST_PORT_RE = /(?<!\/)\b(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})\b/gi;
const FLAG_RE = /(?:--port|-p|PORT=|port[:=]\s*|listen\()\s*["']?(\d{2,5})\b/gi;
const PORT_PAIR_RE = /(["']?)(\d{1,5}(?:-\d{1,5})?):(\d{1,5}(?:-\d{1,5})?)\1(?![\d:-])/g;
const COMPOSE_PUBLISHED_RE = /["']?published["']?\s*:\s*(["']?)(\d{1,5}(?:-\d{1,5})?)\1(?![\d:-])/gi;

export function validPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

function expandRange(value: string): number[] | null {
  const [firstText, lastText, extra] = value.split('-');
  if (extra !== undefined || !firstText) return null;
  const first = Number(firstText);
  const last = lastText === undefined ? first : Number(lastText);
  if (!validPort(first) || !validPort(last) || last < first) return null;
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export function extractPorts(file: TextFile, source: PortSourceKind, owner: string): PortFinding[] {
  const findings: PortFinding[] = [];
  const seen = new Set<string>();

  function add(matchIndex: number, raw: string, portText: string, host?: string): void {
    const port = Number(portText);
    if (!validPort(port)) return;
    const loc = lineAndColumn(file.text, matchIndex);
    const key = `${port}:${loc.line}:${loc.column}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({
      port,
      protocol: raw.startsWith('https:') ? 'https' : raw.startsWith('http:') ? 'http' : 'tcp',
      host,
      owner,
      source,
      location: { file: file.relativePath, ...loc },
      raw: raw.trim(),
      confidence: source === 'docs' ? 'medium' : 'high'
    });
  }

  const patterns = source === 'compose'
    ? [URL_RE, HOST_PORT_RE, FLAG_RE, PORT_PAIR_RE]
    : [URL_RE, HOST_PORT_RE, FLAG_RE];

  for (const regex of patterns) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(file.text)) !== null) {
      if (regex === PORT_PAIR_RE) {
        if (!match[2] || !match[3]) continue;
        const published = expandRange(match[2]);
        const targets = expandRange(match[3]);
        if (!published || !targets || published.length !== targets.length) continue;
        if (published.length === 1 && published[0]! <= 23 && targets[0]! <= 59) continue;
        for (const port of published) add(match.index, match[0], String(port));
        continue;
      }
      const portText = match[2] ?? match[1];
      const host = match[2] ? match[1] : undefined;
      if (portText) add(match.index, match[0], portText, host);
    }
  }

  if (source === 'compose') {
    COMPOSE_PUBLISHED_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = COMPOSE_PUBLISHED_RE.exec(file.text)) !== null) {
      if (!match[2]) continue;
      const published = expandRange(match[2]);
      if (!published) continue;
      for (const port of published) add(match.index, match[0], String(port));
    }
  }

  return findings.sort((a, b) => a.location.line - b.location.line || (a.location.column ?? 0) - (b.location.column ?? 0) || a.port - b.port);
}
