# PortPatrol Orchestration

PortPatrol is designed for human and agent handoffs in local-first development loops.

## Agent workflow

1. Run `portpatrol scan . --format json` before starting a dev server.
2. If errors are present, do not kill anything automatically; inspect the owners and pick a safe remediation.
3. Run `portpatrol suggest --range 3000-3999 --count 3` when a smoke needs a free port.
4. Attach `docs/PORTS.md` or JSON output to handoffs so the next agent inherits the same map.

## Safety contract

- Read-only file scanning.
- Live listener inspection only when `--live` is passed.
- No network calls.
- No process killing.
- No config mutation.

## CI pattern

```sh
portpatrol scan . --format json --fail-on conflict
```

Use `--fail-on warning` only after the project has cleaned up privileged ports and wildcard binds.
