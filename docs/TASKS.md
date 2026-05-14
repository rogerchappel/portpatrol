# PortPatrol Tasks

## V1 MVP

- [x] Scaffold TypeScript CLI package.
- [x] Parse package scripts for port flags and localhost URLs.
- [x] Parse env, compose, docs, and config files for local ports.
- [x] Detect duplicate declarations, privileged ports, wildcard binds, and live/declaration conflicts.
- [x] Render deterministic Markdown and JSON reports.
- [x] Provide safe `suggest` mode for unused port choices.
- [x] Add fixture-backed tests and CLI smoke checks.
- [x] Document safety model, examples, contributing, and agent workflow.

## Next

- [ ] Add optional config file for reserved ranges and preferred project owners.
- [ ] Improve Docker Compose parsing with a full YAML parser when dependency policy allows it.
- [ ] Add SARIF output for CI annotations.
- [ ] Add stale-doc heuristics that compare docs against package scripts.
