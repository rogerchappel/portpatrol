import { lineAndColumn, type TextFile } from './fs.js';
import type { PortFinding, PortSourceKind } from './types.js';

const URL_RE = /\bhttps?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+\]|[a-z0-9.-]+):(\d{2,5})\b/gi;
const HOST_PORT_RE = /(?<!\/)\b(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})\b/gi;
const FLAG_RE = /(?:--port|-p|PORT=|port[:=]\s*|listen\()\s*["']?(\d{2,5})\b/gi;
const PORT_PAIR_RE = /["']?(\d{2,5}):(\d{2,5})["']?/g;

export function validPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
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

  for (const regex of [URL_RE, HOST_PORT_RE, FLAG_RE, PORT_PAIR_RE]) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(file.text)) !== null) {
      const portText = regex === PORT_PAIR_RE ? match[1] : match[2] ?? match[1];
      const host = regex !== PORT_PAIR_RE && match[2] ? match[1] : undefined;
      if (portText) add(match.index, match[0], portText, host);
    }
  }

  return findings.sort((a, b) => a.location.line - b.location.line || (a.location.column ?? 0) - (b.location.column ?? 0) || a.port - b.port);
}
