#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from './args.js';
import { toJson, toMarkdown } from './report.js';
import { scanProject, writeOutput } from './scan.js';
import { suggestPorts } from './suggest.js';

const HELP = `portpatrol maps local dev ports before agents collide with mystery servers.

Usage:
  portpatrol scan [path] [--format markdown|json] [--out file] [--live] [--fail-on conflict|warning|none]
  portpatrol suggest [--range 3000-3999] [--count 3] [--live]

Examples:
  portpatrol scan . --out docs/PORTS.md
  portpatrol scan fixtures/conflict --format json --fail-on conflict
  portpatrol suggest --range 3000-3999 --count 3
`;

export async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    const args = parseArgs(argv);
    if (args.command === 'help') {
      process.stdout.write(HELP);
      return 0;
    }
    if (args.command === 'version') {
      process.stdout.write('0.1.0\n');
      return 0;
    }
    if (args.command === 'suggest') {
      const ports = await suggestPorts({ root: args.target, range: args.range, count: args.count, live: args.live });
      process.stdout.write(`${ports.join('\n')}\n`);
      return ports.length === args.count ? 0 : 2;
    }

    const report = await scanProject({
      root: args.target,
      live: args.live,
      exclude: args.out && args.out !== '-' ? [path.resolve(args.out)] : []
    });
    await writeOutput(args.out, args.format === 'json' ? toJson(report) : toMarkdown(report));

    if (args.failOn === 'conflict' && report.issues.some((issue) => issue.severity === 'error')) return 1;
    if (args.failOn === 'warning' && report.issues.some((issue) => issue.severity === 'error' || issue.severity === 'warning')) return 1;
    return 0;
  } catch (error) {
    process.stderr.write(`portpatrol: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = await main();
}
