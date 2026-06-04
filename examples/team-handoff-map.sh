#!/usr/bin/env bash
# PortPatrol — Team handoff example
#
# Before starting work on a shared project, run PortPatrol to generate
# a port map that the whole team can reference. New dev? Attach the
# report to your onboarding doc so they pick up the same map.
#
# Usage:
#   bash examples/team-handoff-map.sh /path/to/project
#
set -euo pipefail

PROJECT="${1:-.}"
REPORT="$PROJECT/docs/PORTS.md"

echo "▸ PortPatrol team handoff for: $PROJECT"
echo "▸ Scanning for declared ports ..."

npx portpatrol scan "$PROJECT" --out "$REPORT"

echo "✓ Port map written to $REPORT"
echo ""
echo "Share this file with your team. Next agent starts with the same map."

if [ -f "$REPORT" ]; then
  echo ""
  echo "--- Report preview ---"
  head -20 "$REPORT"
  echo "..."
  echo "(run 'cat $REPORT' for full report)"
fi
