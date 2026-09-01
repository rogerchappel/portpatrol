import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { validPort } from './extract.js';
import type { ListenerRecord, PortFinding } from './types.js';

const execFileAsync = promisify(execFile);

export function parseLsof(output: string): ListenerRecord[] {
  return output.split(/\r?\n/).slice(1).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    const parts = trimmed.split(/\s+/);
    const command = parts[0] ?? 'unknown';
    const pid = Number(parts[1]);
    const user = parts[2];
    const name = parts.slice(8).join(' ');
    const endpointMatch = name.match(/(\*|\[[^\]]+\]|[^:\s]+):(\d{1,5})(?:\s|$)/);
    if (!endpointMatch) return [];
    const port = Number(endpointMatch[2]);
    if (!validPort(port)) return [];
    return [{
      command,
      pid: Number.isFinite(pid) ? pid : undefined,
      user,
      protocol: 'tcp' as const,
      host: endpointMatch[1] === '*' ? '0.0.0.0' : endpointMatch[1],
      port,
      raw: line
    }];
  });
}

export function parseSs(output: string): ListenerRecord[] {
  return output.split(/\r?\n/).slice(1).flatMap((line) => {
    const local = line.trim().split(/\s+/)[3];
    if (!local) return [];
    const match = local.match(/(.+):(\d{1,5})$/);
    if (!match) return [];
    const port = Number(match[2]);
    if (!validPort(port)) return [];
    return [{ command: 'ss', protocol: 'tcp' as const, host: match[1], port, raw: line }];
  });
}

export async function getLiveFindings(): Promise<PortFinding[]> {
  const records = await readListeners();
  return records.map((record, index) => ({
    port: record.port,
    protocol: record.protocol,
    host: record.host,
    owner: record.pid ? `${record.command} pid ${record.pid}` : record.command,
    source: 'live',
    location: { file: '<live listeners>', line: index + 1 },
    raw: record.raw,
    confidence: 'high',
    notes: ['Read-only OS listener inspection']
  }));
}

async function readListeners(): Promise<ListenerRecord[]> {
  if (process.platform === 'darwin') {
    const { stdout } = await execFileAsync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { maxBuffer: 1024 * 1024 });
    return parseLsof(stdout);
  }
  try {
    const { stdout } = await execFileAsync('ss', ['-ltnp'], { maxBuffer: 1024 * 1024 });
    return parseSs(stdout);
  } catch {
    const { stdout } = await execFileAsync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { maxBuffer: 1024 * 1024 });
    return parseLsof(stdout);
  }
}
