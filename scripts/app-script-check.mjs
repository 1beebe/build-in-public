// The signed-in page is drawn by a script embedded in a template literal.
// A bad escape there is still valid TypeScript, but the browser throws the
// whole script away and the interview never appears. This check parses every
// inline script the page would send, and checks the error screen is present
// while the removed opening screen stays gone.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "app-script-"));
const out = join(dir, "pages.mjs");
execFileSync("node_modules/.bin/esbuild", ["src/pages.ts", "--bundle", "--format=esm", `--outfile=${out}`, "--platform=neutral"], { stdio: "inherit" });
const { appPage } = await import(pathToFileURL(out));
const html = appPage();
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (scripts.length < 2) {
  console.error(`Expected the app page to include its scripts, found ${scripts.length}.`);
  process.exit(1);
}
scripts.forEach((source, i) => {
  const file = join(dir, `script${i}.js`);
  writeFileSync(file, source);
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
});

if (html.includes("Opening your interview") || html.includes('id="loading"')) {
  console.error('The "Opening your interview" screen is back. Sign-in should go straight to the interview.');
  process.exit(1);
}
const boot = html.match(/<section id="boot"[^>]*>/);
if (!boot || !/\shidden\b/.test(boot[0])) {
  console.error("The error screen must be in the first HTML and hidden until something fails.");
  process.exit(1);
}
const app = scripts[scripts.length - 1];
if (app.includes("LOADING_AFTER") || app.includes("LOADING_HOLD")) {
  console.error("The page script still waits to show an opening screen.");
  process.exit(1);
}
if (!app.includes('tap \\"I\'m done. Find my stories\\".')) {
  console.error('The voice wrap-up line is not escaped, so the page script will not parse.');
  process.exit(1);
}
console.log(`App page scripts parse (${scripts.length}). No opening screen; the error screen stays hidden until a failure.`);
