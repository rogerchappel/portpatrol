#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

smoke_root="$(mktemp -d "${TMPDIR:-/tmp}/portpatrol-package-smoke.XXXXXX")"
trap 'rm -rf "$smoke_root"' EXIT

package_name="$(node -p "require('./package.json').name")"
package_version="$(node -p "require('./package.json').version")"
npm run build
pack_output="$(npm pack --json --pack-destination "$smoke_root")"
tarball_name="$(node -e '
const result = JSON.parse(process.argv[1]);
if (!Array.isArray(result) || result.length !== 1 || !result[0].filename) process.exit(1);
process.stdout.write(result[0].filename);
' "$pack_output")"
tarball="$smoke_root/$tarball_name"
install_prefix="$smoke_root/install"

npm install --global --prefix "$install_prefix" "$tarball"

installed_package="$install_prefix/lib/node_modules/$package_name/package.json"
installed_name="$(node -p "require(process.argv[1]).name" "$installed_package")"
installed_version="$(node -p "require(process.argv[1]).version" "$installed_package")"
test "$installed_name" = "$package_name"
test "$installed_version" = "$package_version"

cli="$install_prefix/bin/portpatrol"
help_output="$("$cli" --help)"
grep -Fq "Usage:" <<<"$help_output"
test "$("$cli" --version)" = "$package_version"

printf 'package smoke ok: %s@%s (%s)\n' "$installed_name" "$installed_version" "$tarball_name"
