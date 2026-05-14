export type PortProtocol = 'tcp' | 'udp' | 'http' | 'https' | 'unknown';
export type PortSourceKind = 'package-script' | 'env' | 'compose' | 'docs' | 'config' | 'live';
export type Severity = 'info' | 'warning' | 'error';

export interface SourceLocation {
  file: string;
  line: number;
  column?: number;
}

export interface PortFinding {
  port: number;
  protocol: PortProtocol;
  host?: string;
  owner: string;
  source: PortSourceKind;
  location: SourceLocation;
  raw: string;
  confidence: 'low' | 'medium' | 'high';
  notes?: string[];
}

export interface Issue {
  code: string;
  severity: Severity;
  title: string;
  port?: number;
  locations: SourceLocation[];
  remediation: string;
}

export interface ScanOptions {
  root: string;
  live: boolean;
  include?: string[];
  exclude?: string[];
}

export interface ScanReport {
  tool: 'portpatrol';
  version: string;
  root: string;
  generatedAt: string;
  findings: PortFinding[];
  issues: Issue[];
  summary: {
    totalFindings: number;
    uniquePorts: number;
    issueCounts: Record<Severity, number>;
  };
}

export interface ListenerRecord {
  command: string;
  pid?: number;
  user?: string;
  protocol: PortProtocol;
  host?: string;
  port: number;
  raw: string;
}
