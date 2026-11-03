// Before a deploy: lists behavior files changed since docs/what-it-does.md was
// last checked, and verifies the numbers table against the code.
//
//   npm run docs:check
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const doc = readFileSync("docs/what-it-does.md", "utf8");
let failed = false;

// 1. Numbers table
const rows = [...doc.matchAll(/^\| ([A-Z_]+) \| (.+?) \| (src\/[\w.]+) \|$/gm)];
for (const [, name, want, file] of rows) {
  const src = readFileSync(file, "utf8");
  const m = src.match(new RegExp(`const ${name}(?::[^=]+)? = ([^;\\n]+?);?\\s*(?://.*)?$`, "m"));
  const have = m?.[1].trim();
  if (have !== want.trim()) {
    console.log(`MISMATCH ${name} in ${file}: doc says ${want}, code says ${have ?? "(not found)"}`);
    failed = true;
  }
}
console.log(`${rows.length} numbers checked.`);

// 2. What changed since the last check
const since = doc.match(/Checked through: `([0-9a-f]{7,40})`/)?.[1];
if (!since) { console.log("No 'Checked through' commit found."); process.exit(1); }
const watched = /^(src\/|public\/build-flow\.html|README\.md|plugin\/skills\/|evals\/(personas|RUBRIC))/;
const log = execSync(`git log --format=%h%x09%s ${since}..HEAD -- src public/build-flow.html README.md plugin/skills evals`, { encoding: "utf8" }).trim();
const files = execSync(`git diff --name-only ${since}..HEAD`, { encoding: "utf8" }).split("\n").filter((f) => watched.test(f));
if (log) {
  console.log(`\nChanged since ${since}:\n${log}\n\nFiles: ${files.join(", ")}`);
  if (files.some((f) => f.startsWith("src/"))) {
    console.log("\nCode changed. Confirm each change above is reflected (or isn't user-facing), then bump 'Checked through'.");
  }
} else {
  console.log(`\nNothing user-facing changed since ${since}.`);
}
process.exit(failed ? 1 : 0);
