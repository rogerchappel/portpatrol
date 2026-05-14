#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

rm -rf tmp/smoke
mkdir -p tmp/smoke

node dist/src/cli.js scan tests/fixtures/clean --out tmp/smoke/PORTS.md
test -s tmp/smoke/PORTS.md
grep -q "5173" tmp/smoke/PORTS.md

node dist/src/cli.js scan tests/fixtures/conflict --format json --out tmp/smoke/conflict.json || true
grep -q '"duplicate-port"' tmp/smoke/conflict.json

if node dist/src/cli.js scan tests/fixtures/conflict --format json --fail-on conflict > tmp/smoke/fail-on.json; then
  echo "expected fail-on conflict to exit non-zero" >&2
  exit 1
fi

node dist/src/cli.js suggest --range 4099-4101 --count 2 > tmp/smoke/suggest.txt
grep -q "4099" tmp/smoke/suggest.txt

echo "smoke ok"
