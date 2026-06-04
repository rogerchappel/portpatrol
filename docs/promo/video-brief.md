# Video brief: "Find port conflicts before your agents do — PortPatrol demo"

## Target
- Length: 1.5–2 minute screen-cast
- Audience: Devs sharing machines, agent orchestrator users, CI engineers

## Hook (first 5 seconds)
- Terminal showing "EADDRINUSE: address already in use :::3000" error
- Voiceover/text: "Your agent started a server on port 3000. Another one was already there."

## Demo flow (screen recording)

1. Show a project with overlapping port declarations
2. Run `portpatrol scan . --format json --fail-on conflict`
3. Show the JSON report: ports 3000 declared in two scripts
4. Show `portpatrol suggest --range 3000-3999 --count 3`
5. Show `portpatrol scan . --live` (live listener check)
6. Show `portpatrol scan . --out docs/PORTS.md` generating the handoff file
7. Open `docs/PORTS.md` — clean Markdown map

## Key talking points
- Read-only — never kills processes or mutates files
- Scans package.json, .env, docker-compose, docs, config files
- Deterministic reports for stable CI diffs
- Works offline — no network calls

## File references (all exist in repo)
- `src/scan.ts` — the scanner engine
- `src/suggest.ts` — port suggestion logic
- `tests/fixtures/conflict/package.json` — overlapping ports fixture
- `tests/fixtures/compose/docker-compose.yml` — compose port fixture
- `examples/team-handoff-map.sh` — team handoff script (new)
- `docs/promo/social-hooks.md` — social post drafts (new)

## Call to action
- "npm install -g portpatrol"
- Run it before your next CI session
- PRs welcome — especially new scanner patterns

## What NOT to say
- Don't claim it works with Docker containers specifically — it scans files
- Don't claim it prevents conflicts — it detects and maps them
- Don't claim enterprise use or scale
