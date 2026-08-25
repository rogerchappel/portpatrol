import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = resolve("scripts/prepare-release-artifact.sh");

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), "portpatrol-release-contract-"));
  writeFileSync(join(cwd, "package.json"), JSON.stringify({ name: "portpatrol", version: "1.2.3", files: ["README.md"] }));
  writeFileSync(join(cwd, "README.md"), "fixture\n");
  return cwd;
}

function run(cwd: string, tag: string) {
  const output = join(cwd, "github-output");
  const result = spawnSync("bash", [script, tag, output], { cwd, encoding: "utf8" });
  return { ...result, output };
}

test("prepares the single expected artifact and hands off its absolute path", () => {
  const cwd = fixture();
  const result = run(cwd, "v1.2.3");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(result.output, "utf8"), `release_artifact=${cwd}/portpatrol-1.2.3.tgz\n`);
});

test("rejects a tag that does not exactly match package version", () => {
  const result = run(fixture(), "v1.2.4");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /release tag mismatch/);
});

test("rejects wrong or multiple artifacts", () => {
  for (const names of [["wrong-1.2.3.tgz"], ["old-a.tgz", "old-b.tgz"]]) {
    const cwd = fixture();
    for (const name of names) writeFileSync(join(cwd, name), "stale");
    const result = run(cwd, "v1.2.3");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /release artifact mismatch/);
  }
});

test("release workflow validates before notes and passes the validated path", () => {
  const workflow = readFileSync(resolve(".github/workflows/release.yml"), "utf8");
  const prepare = workflow.indexOf("id: artifact");
  const notes = workflow.indexOf("Generate release notes");
  const release = workflow.indexOf("gh release create");
  assert.ok(prepare > -1 && prepare < notes && notes < release);
  assert.match(workflow, /steps\.artifact\.outputs\.release_artifact/);
  assert.doesNotMatch(workflow, /\*\.tgz/);
});
