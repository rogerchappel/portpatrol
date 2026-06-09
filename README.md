# portpatrol

Map local dev ports before your agents trip over mystery servers. 🚦

`portpatrol` scans a project for ports declared in package scripts, `.env*`, Docker Compose, docs, and config files. It can also inspect live TCP listeners on demand, then emits deterministic Markdown or JSON for handoffs and CI.

## Install

```sh
npm install -g portpatrol
```

For local development:

```sh
npm install
npm run build
node dist/cli.js --help
```

## Quick start

```sh
portpatrol scan . --out docs/PORTS.md
portpatrol scan fixtures/conflict --format json --fail-on conflict
portpatrol suggest --range 3000-3999 --count 3
```

## Examples

Write a Markdown map:

```sh
portpatrol scan . --out docs/PORTS.md
```

Use strict JSON in CI:

```sh
portpatrol scan . --format json --fail-on conflict
```

Include read-only live listeners:

```sh
portpatrol scan . --live
```

Pick safe alternatives without changing files:

```sh
portpatrol suggest --range 3000-3999 --count 3
```

## What it checks

- duplicate declarations across files
- declared ports already listening when `--live` is used
- privileged ports below `1024`
- wildcard binds such as `0.0.0.0`
- localhost URLs in docs and config

## Safety model

PortPatrol is local-first and boring on purpose:

- no network calls
- no process killing
- no file mutation except explicit report output
- live listener inspection only with `--live`
- deterministic timestamps in reports for stable diffs

If it looks dangerous, PortPatrol points and barks; it does not bite.

## Agent workflow

1. Run `portpatrol scan . --format json` before starting smokes.
2. If conflicts exist, choose a new port instead of killing a mystery process.
3. Run `portpatrol suggest --range 3000-3999 --count 3` for safe candidates.
4. Attach the report to handoffs so the next agent has the same map.

## Configuration

V1 is zero-config. Use CLI flags for output format, output path, live inspection, failure threshold, range, and count. A project config file for reserved ranges is planned.

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Contributing

Small, fixture-backed changes are easiest to review. Add or update fixtures under `tests/fixtures`, cover behavior with `node:test`, and run the verification commands above before opening a PR.

## Security

Please report vulnerabilities privately using the guidance in [SECURITY.md](SECURITY.md). PortPatrol should remain read-only and local-first.

## License

MIT

## Release Readiness

Use the checked-in scripts before opening or publishing a release:

```sh
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

The package smoke uses `npm pack --dry-run` so the published file list can be reviewed without publishing.
