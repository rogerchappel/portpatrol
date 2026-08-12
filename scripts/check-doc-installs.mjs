import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const markdownFiles = execFileSync("git", ["ls-files", "--", "*.md"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

const unavailableInstalls = [
  {
    pattern: /\bnpm\s+(?:install|i)\s+(?:--global|-g)\s+portpatrol(?:@\S+)?\b/,
    label: "npm registry install",
  },
  {
    pattern: /\bgh\s+release\s+download\b/,
    label: "GitHub release download",
  },
];
const futureOnly = /\b(?:future[- ]only|when|once|after)\b.*\b(?:available|published|released)\b/i;
const failures = [];

for (const file of markdownFiles) {
  const lines = readFileSync(file, "utf8").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    for (const install of unavailableInstalls) {
      if (!install.pattern.test(lines[index])) continue;

      const context = lines.slice(Math.max(0, index - 5), index + 1).join(" ");
      if (!futureOnly.test(context)) {
        failures.push(`${file}:${index + 1}: ${install.label} is not marked future-only`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Unavailable installation paths found in current-facing documentation:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Checked installation paths in ${markdownFiles.length} tracked Markdown files.`);
