import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "portpatrol-quick-start-"));

try {
  const readme = readFileSync("README.md", "utf8");
  if (/portpatrol scan fixtures\/conflict\b/.test(readme)) {
    throw new Error("README Quick start still depends on a repository-only fixture");
  }

  execFileSync("npm", ["run", "build"], { stdio: "inherit" });
  const pack = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--pack-destination", root], {
      encoding: "utf8",
    }),
  );
  if (!Array.isArray(pack) || pack.length !== 1 || !pack[0].filename) {
    throw new Error("npm pack did not return exactly one artifact");
  }

  const prefix = join(root, "install");
  execFileSync("npm", ["install", "--global", "--prefix", prefix, join(root, pack[0].filename)], {
    stdio: "inherit",
  });

  const example = join(root, "portpatrol-conflict");
  mkdirSync(example);
  writeFileSync(
    join(example, "package.json"),
    '{"scripts":{"web":"vite --port 3000","api":"node server.js --port 3000"}}\n',
  );

  const result = spawnSync(
    join(prefix, "bin", "portpatrol"),
    ["scan", ".", "--format", "json", "--fail-on", "conflict"],
    { cwd: example, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 1) {
    throw new Error(`Quick start expected conflict exit 1, received ${result.status}: ${result.stderr}`);
  }

  const report = JSON.parse(result.stdout);
  if (!report.issues?.some((issue) => issue.severity === "error")) {
    throw new Error("Quick start did not report the documented conflict");
  }

  console.log(`Quick start package check passed with ${report.issues.length} issue(s).`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
