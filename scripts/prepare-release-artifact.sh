#!/usr/bin/env bash
set -euo pipefail

tag="${1:-}"
output_file="${2:-${GITHUB_OUTPUT:-}}"

if [ -z "$tag" ]; then
  echo "usage: $0 <tag> [github-output-file]" >&2
  exit 2
fi

package_name="$(node -p "require('./package.json').name")"
package_version="$(node -p "require('./package.json').version")"
expected_tag="v${package_version}"
expected_artifact="${package_name}-${package_version}.tgz"

if [ "$tag" != "$expected_tag" ]; then
  echo "release tag mismatch: expected $expected_tag, got $tag" >&2
  exit 1
fi

pack_json="$(npm pack --json)"
packed_name="$(node -e '
const value = JSON.parse(process.argv[1]);
if (!Array.isArray(value) || value.length !== 1 || typeof value[0].filename !== "string") process.exit(1);
process.stdout.write(value[0].filename);
' "$pack_json")"

shopt -s nullglob
artifacts=(./*.tgz)
if [ "${#artifacts[@]}" -ne 1 ] || [ "${artifacts[0]#./}" != "$expected_artifact" ] || [ "$packed_name" != "$expected_artifact" ]; then
  echo "release artifact mismatch: expected exactly $expected_artifact; npm reported $packed_name; found ${artifacts[*]:-(none)}" >&2
  exit 1
fi

artifact_package_json="$(tar -xOf "$expected_artifact" package/package.json)"
artifact_identity="$(node -e '
const pkg = JSON.parse(process.argv[1]);
process.stdout.write(`${pkg.name}@${pkg.version}`);
' "$artifact_package_json")"
expected_identity="${package_name}@${package_version}"
if [ "$artifact_identity" != "$expected_identity" ]; then
  echo "packed package identity mismatch: expected $expected_identity, got $artifact_identity" >&2
  exit 1
fi

artifact_path="$PWD/$expected_artifact"
if [ -n "$output_file" ]; then
  printf 'release_artifact=%s\n' "$artifact_path" >> "$output_file"
fi
printf '%s\n' "$artifact_path"
