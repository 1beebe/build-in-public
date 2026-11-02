// Scores a run's code checks and writes the scorecard skeleton. Judged checks
// are filled in by hand (by Claude, then Ligaya can overrule) using RUBRIC.md.
//
//   node evals/score.mjs <results.json> <fixtures-dir> <commit> > scorecard.md
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [resultsPath, fixturesDir, commit = "unknown"] = process.argv.slice(2);
const run = JSON.parse(readFileSync(resultsPath, "utf8"));
const fixtures = Object.fromEntries(readdirSync(fixturesDir).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(fixturesDir, f), "utf8"))).map((f) => [f.name, f]));

const SMALL = new Set("a an and are as at be but by for from had has have i i'm it it's its just my of on or our so that the their them then there they this to was we were what when which who will with you your me is in not do did don't can".split(" "));
const words = (t) => (t.toLowerCase().match(/[a-z0-9']+/g) ?? []);
const prose = (t) => t.replace(/\[[^\]]*\]/g, " ").replace(/^\s*\d+\/\s*/gm, " ");
function ownShare(text, theirs) {
  const have = new Set(words(theirs));
  const content = words(prose(text)).filter((w) => !SMALL.has(w));
  if (!content.length) return 1;
  const hit = content.filter((w) => have.has(w) || have.has(w.replace(/s$/, "")) || have.has(w + "s")).length;
  return hit / content.length;
}
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };
const pct = (x) => `${Math.round(x * 100)}%`;
const mark = (ok) => (ok ? "pass" : "**FAIL**");
const wc = (t) => words(prose(t)).length;

const out = [];
out.push(`# Eval scorecard · ${new Date().toISOString().slice(0, 10)} · ${commit}`, "");

// Conversation
const ex = run.personas.flatMap((p) => p.exchanges.map((e) => ({ ...e, persona: p.id })));
const replies = [...run.personas.map((p) => p.opener), ...ex.map((e) => e.reply)];
const oneQ = replies.filter((r) => (r.match(/\?/g) ?? []).length <= 1).length / Math.max(1, replies.length);
const whole = replies.filter((r) => /[.?!"'”’)]\s*$/.test(r.trim())).length;
const fallbacks = ex.filter((e) => e.fallback).length;
const med = median(ex.filter((e) => e.kind !== "keep talking").map((e) => e.ms)) / 1000;
const finish = ex.filter((e) => /^(go ahead|i'?m done)/i.test(e.said));
const finishOk = finish.every((e) => e.wrapUp && /find my stories/i.test(e.reply));

out.push("## Conversation: code checks", "", "| Check | Result | Bar | |", "|---|---|---|---|");
out.push(`| One question per turn | ${pct(oneQ)} of ${replies.length} turns | 90% | ${mark(oneQ >= 0.9)} |`);
out.push(`| Replies end on a whole sentence | ${whole} of ${replies.length} | all | ${mark(whole === replies.length)} |`);
out.push(`| Reply failures (canned fallback) | ${fallbacks} | 0 | ${mark(fallbacks === 0)} |`);
out.push(`| Median reply time | ${med.toFixed(1)} s | under 6 s | ${mark(med < 6)} |`);
out.push(`| "Go ahead" points to the button, wrapUp set | ${finish.length ? (finishOk ? "yes" : "no") : "not tested"} | every time | ${mark(finish.length && finishOk)} |`);
out.push("");

// Harvest
out.push("## Harvest: code checks", "", "| Source | Posts (later) | Own words, lowest | Text post lengths | Article words | Time |", "|---|---|---|---|---|---|");
const harvestRows = [
  ...run.personas.map((p) => ({ name: `persona: ${p.id}`, drafts: p.harvests.at(-1)?.drafts ?? [], theirs: (p.turns ?? []).filter((t) => t.who === "you").map((t) => t.text).join(" "), ms: p.harvests.at(-1)?.ms })),
  ...run.replays.map((r) => ({ name: `replay: ${r.name}`, drafts: r.drafts, theirs: fixtures[r.name].turns.filter((t) => t.who === "you").map((t) => t.text).join(" "), ms: r.ms })),
];
for (const h of harvestRows) {
  const posts = h.drafts.filter((d) => !d.later);
  const later = h.drafts.length - posts.length;
  const shares = posts.map((d) => ownShare(d.text, h.theirs));
  const textPosts = posts.filter((d) => d.format === "Text post").map((d) => {
    const n = wc(d.text);
    const promo = /^Sharing:/.test(d.title);
    const ok = promo ? n >= 40 && n <= 100 : n >= 60 && n <= 150;
    return `${n}${ok ? "" : "!"}`;
  });
  const article = posts.find((d) => d.article);
  out.push(`| ${h.name} | ${posts.length} (${later}) | ${shares.length ? pct(Math.min(...shares)) : "n/a"} | ${textPosts.join(", ") || "none"} | ${article ? wc(article.text) : ""} | ${h.ms ? (h.ms / 1000).toFixed(0) + " s" : ""} |`);
}
out.push("", "`!` marks a text post outside its band (60 to 150 words, promos 40 to 100). Own words is the share of a post's content words found in the person's own answers; the bar is 65%.", "");

// Judged
out.push("## Judged checks (scored with RUBRIC.md, 1 to 5, quoting the line that earned it)", "",
  "| Check | Score | Evidence |", "|---|---|---|",
  "| Does its homework in the first 3 turns (yes in 4 of 5 personas) | | |",
  "| Never re-asks a skipped question (0 repeats) | | |",
  "| Digs once when thin, light when a point is made (4+) | | |",
  "| Curious friend, not interrogator or flatterer (4+) | | |",
  "| Nothing invented in drafts (0) | | |",
  "| Off-topic chatter left out (0) | | |",
  "| Text posts open on the tension line (all) | | |",
  "| **Would you post it after light edits? (4+)** | | |",
  "", "## What changed since last run", "", "", "## Errors", "", ...(run.errors.length ? run.errors.map((e) => `- ${e}`) : ["None."]), "");
console.log(out.join("\n"));
