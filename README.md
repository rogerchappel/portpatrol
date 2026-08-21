# portpatrol

Map local dev ports before your agents trip over mystery servers. 🚦

`portpatrol` scans a project for ports declared in package scripts, `.env*`, Docker Compose, docs, and config files. It can also inspect live TCP listeners on demand, then emits deterministic Markdown or JSON for handoffs and CI.

## Install

PortPatrol is currently distributed from this repository. Install the latest
supported source revision with:

```sh
git clone https://github.com/rogerchappel/portpatrol.git
cd portpatrol
npm ci
npm run build
npm install -g .
portpatrol --version
```

When a versioned GitHub release is available, its attached npm tarball can be
installed without using the npm registry:

```sh
gh release download --repo rogerchappel/portpatrol --pattern 'portpatrol-*.tgz'
npm install -g ./portpatrol-*.tgz
portpatrol --help
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

The explicit `--out` file is excluded from that scan, so regenerating an
in-tree Markdown or JSON report does not treat the previous report as project
configuration. Other documentation and configuration files are still scanned.
Use `--out -` (or omit `--out`) to write the report to standard output.

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

Docker Compose scanning supports short port pairs and long-syntax `published`
host ports, including numeric and quoted YAML values. Matching ranges such as
`"4310-4312:3000-3002"` expand to host ports 4310, 4311, and 4312; malformed
or unequal-length ranges are ignored rather than partially reported.

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

The package smoke builds and packs the project, installs the resulting tarball
into an isolated temporary prefix, verifies its package name and version, and
runs `portpatrol --help` and `portpatrol --version`. It does not publish.

## Development

Run the same local checks that protect the package before opening a release or pull request:

- `npm run build`
- `npm test`
- `npm run check`
- `npm run smoke`
- `npm run package:smoke`
- `npm run release:check`
