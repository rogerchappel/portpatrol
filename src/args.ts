export interface ParsedArgs {
  command: 'scan' | 'suggest' | 'help' | 'version';
  target: string;
  format: 'markdown' | 'json';
  out?: string;
  live: boolean;
  failOn: 'conflict' | 'warning' | 'none';
  range: string;
  count: number;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [commandRaw, ...rest] = argv;
  const command = commandRaw === 'suggest' || commandRaw === 'scan' ? commandRaw : commandRaw === '--version' || commandRaw === '-v' ? 'version' : 'help';
  const parsed: ParsedArgs = {
    command,
    target: '.',
    format: 'markdown',
    live: false,
    failOn: 'none',
    range: '3000-3999',
    count: 1
  };

  const args = command === 'help' ? argv : command === 'version' ? [] : rest;
  if (command === 'scan' && args[0] && !args[0].startsWith('-')) parsed.target = String(args.shift());

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--format') parsed.format = requireValue(args, ++index, '--format') as ParsedArgs['format'];
    else if (arg === '--out') parsed.out = requireValue(args, ++index, '--out', true);
    else if (arg === '--live') parsed.live = true;
    else if (arg === '--fail-on') parsed.failOn = requireValue(args, ++index, '--fail-on') as ParsedArgs['failOn'];
    else if (arg === '--range') parsed.range = requireValue(args, ++index, '--range');
    else if (arg === '--count') parsed.count = Number(requireValue(args, ++index, '--count'));
    else if (arg === '--help' || arg === '-h') parsed.command = 'help';
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!['markdown', 'json'].includes(parsed.format)) throw new Error('--format must be markdown or json');
  if (!['conflict', 'warning', 'none'].includes(parsed.failOn ?? 'none')) throw new Error('--fail-on must be conflict, warning, or none');
  if (!Number.isInteger(parsed.count) || parsed.count < 1) throw new Error('--count must be a positive integer');
  return parsed;
}

function requireValue(args: string[], index: number, flag: string, allowStdout = false): string {
  const value = args[index];
  if (!value || (value.startsWith('-') && !(allowStdout && value === '-'))) throw new Error(`${flag} requires a value`);
  return value;
}
