# PortPatrol — social hook pack (draft)

Use these as starting points. Edit the tone to match the platform.

## X / Twitter (280 chars max)

### Hook 1 — The pain
```
Your agent: "I'll start the server on port 3000."
Your other agent: "Same here."
EADDRINUSE. 😤

PortPatrol maps all declared ports in your project before agents trip over them.

git clone https://github.com/rogerchappel/portpatrol.git && cd portpatrol
npm ci && npm run build && npm install -g .
portpatrol scan .
```

### Hook 2 — The fix
```
"Which ports does this project use?"

Instead of opening 6 files to check:
portpatrol scan . --out docs/PORTS.md

One command. Deterministic output. Shareable handoff.

https://github.com/rogerchappel/portpatrol
```

### Hook 3 — The CI check
```
CI gate: fail if ports conflict.

portpatrol scan . --format json --fail-on conflict

Your agents get a clean port map. No more mystery 3000 conflicts.

https://github.com/rogerchappel/portpatrol
```

## LinkedIn (longer)

### Post 1
```
Port conflicts are everyone's favorite time-waster. Your agent starts a service on 3000. Your other agent does the same. EADDRINUSE.

PortPatrol is a small, read-only CLI that scans your project for port declarations — package.json scripts, .env, Docker Compose, docs, config files — and produces a deterministic map.

No network calls. No process killing. Just a clear report of what ports are declared and where.

Run it before your CI session. Attach the map to your handoff.

git clone https://github.com/rogerchappel/portpatrol.git && cd portpatrol
npm ci && npm run build && npm install -g .
portpatrol scan .

Open source: https://github.com/rogerchappel/portpatrol
```

## Reddit / Hacker News title ideas
- "A tiny CLI to map local dev ports before your agents trip over them"
- "PortPatrol: read-only port conflict detector for shared dev machines"
- "I got tired of EADDRINUSE so I built a port scanner for project files"
