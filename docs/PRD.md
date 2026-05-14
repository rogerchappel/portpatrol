# PortPatrol PRD

Status: in-progress

## One-liner
`portpatrol` maps local dev ports, package scripts, Docker Compose services, and live listeners so agents stop colliding with mystery servers. 🚦

## Source attribution
Created during the 2026-05-14 evening OSS Factory run. Web search was attempted for current developer-tool pain points, but the configured provider returned an authentication/plan error. This idea is based on local OSS Factory context, recurring dev-server collisions, and public patterns around `lsof`, Docker Compose, Vite/Next dev servers, and agentic local workflows; renamed/reframed as a deterministic offline port safety map.

## Target users
- Developers juggling multiple local apps and background services.
- Agents that need to choose safe ports before starting smokes.
- OSS maintainers documenting local development topologies.

## Problem
Local dev environments hide port ownership across package scripts, `.env` files, Docker Compose, README snippets, and already-running processes. Agents frequently fail smokes or kill the wrong thing because they cannot see the port map.

## Goals
- Scan a project offline for declared and implied local ports.
- Optionally inspect live listeners using local OS commands without network calls.
- Detect conflicts, reserved ranges, hardcoded localhost URLs, and risky kill suggestions.
- Emit deterministic Markdown and JSON reports for agent handoffs.
- Provide a safe `suggest` mode that recommends unused ports without mutating files.

## Non-goals
- Killing processes automatically.
- Managing cloud firewalls or remote hosts.
- Full network observability.

## V1 CLI

```bash
portpatrol scan . --out docs/PORTS.md
portpatrol scan fixtures/conflict --format json --fail-on conflict
portpatrol suggest --range 3000-3999 --count 3
```

## Functional requirements
1. Parse `package.json` scripts, `.env*`, Docker Compose YAML, README/docs snippets, and common config files for ports and localhost URLs.
2. Inspect live TCP listeners on macOS/Linux when `--live` is passed, using read-only local commands.
3. Detect duplicate declarations, live/declaration conflicts, privileged ports, wildcard binds, and stale documentation.
4. Emit stable Markdown/JSON with source locations, owners, severity, and suggested remediation.
5. Include fixture-backed tests for clean, conflict, compose, env, docs, and live-command parser cases.

## Acceptance criteria
- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass.
- `bash scripts/validate.sh` passes when present.
- Real CLI smoke scans checked-in fixtures and writes reports.
- README covers quick start, safety model, examples, config, and agent workflow usage.
- Public GitHub repo `rogerchappel/portpatrol` has useful description and topics.
