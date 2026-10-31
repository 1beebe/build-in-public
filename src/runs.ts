import type { Env } from "./env";
import type { Draft, Session, Turn } from "./session";
import { randomToken, seal, unseal } from "./crypto";

// Interview runs kept, with the person's consent (an opt-out box at setup),
// so the owner can see what happened and improve the interviewer. Encrypted
// at rest and gone after 14 days. Never their Buffer tokens or posts.
const KEEP_SECONDS = 14 * 86_400;

export interface RunEvent { at: string; what: string; ms?: number }

export interface Run {
  startedAt: string;
  updatedAt: string;
  source: string; // their repo, or their note
  targets: string[];
  turns: Turn[];
  events: RunEvent[];
  harvests: { at: string; mode: string; ms: number; drafts: Pick<Draft, "title" | "channel" | "format" | "flags" | "text" | "later">[] }[];
  saved: string[]; // titles they sent to Buffer
}

// Starts a fresh run for a new interview, or does nothing if they opted out.
export function beginRun(s: Session): void {
  s.runKey = s.keepLog === false ? undefined : `run:${(9_999_999_999_999 - Date.now()).toString().padStart(13, "0")}:${randomToken(6)}`;
}

// Read, change and write back this session's run. Logging must never break
// the interview, so failures are only reported to the console.
export async function logRun(env: Env, s: Session, change: (r: Run) => void): Promise<void> {
  if (!s.runKey || s.keepLog === false) return;
  try {
    const now = new Date().toISOString();
    const stored = await env.SESSIONS.get(s.runKey);
    const run: Run = stored
      ? await unseal<Run>(env.TOKEN_KEY, stored)
      : { startedAt: now, updatedAt: now, source: s.repo ?? s.weekNote ?? "", targets: s.targets ?? [], turns: [], events: [], harvests: [], saved: [] };
    change(run);
    run.turns = (s.turns ?? []).slice(0, 200);
    run.updatedAt = now;
    run.events = run.events.slice(-100);
    run.harvests = run.harvests.slice(-6);
    await env.SESSIONS.put(s.runKey, await seal(env.TOKEN_KEY, run), { expirationTtl: KEEP_SECONDS });
  } catch (err) {
    console.error("run log failed", err);
  }
}

export async function recentRuns(env: Env, limit = 30): Promise<Run[]> {
  const listed = await env.SESSIONS.list({ prefix: "run:", limit });
  const runs = await Promise.all(listed.keys.map(async ({ name }) => {
    const value = await env.SESSIONS.get(name);
    if (!value) return null;
    try { return await unseal<Run>(env.TOKEN_KEY, value); }
    catch { return null; }
  }));
  return runs.filter((x): x is Run => Boolean(x));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

export async function runsPage(env: Env): Promise<string> {
  const runs = await recentRuns(env);
  const body = runs.map((r) => {
    const you = r.turns.filter((t) => t.who === "you").length;
    const turns = r.turns.map((t) => `<li class="${t.who}"><b>${t.who === "you" ? "Them" : "Interviewer"}</b> ${esc(t.text)}</li>`).join("");
    const events = r.events.map((e) => `<li>${esc(when(e.at))} · ${esc(e.what)}${e.ms != null ? ` · ${(e.ms / 1000).toFixed(1)}s` : ""}</li>`).join("");
    const harvests = r.harvests.map((h) => `<h4>Harvest · ${esc(h.mode)} · ${(h.ms / 1000).toFixed(1)}s · ${esc(when(h.at))}</h4>` + h.drafts.map((d) =>
      `<div class="card"><b>${esc(d.title)}</b>${d.later ? " <small>(for later)</small>" : ""}${d.format ? `<small>${esc(d.channel ?? "any")} · ${esc(d.format)}</small>` : ""}${(d.flags ?? []).map((f) => `<small class="flag">${esc(f)}</small>`).join("")}<pre>${esc(d.text)}</pre></div>`).join("")).join("");
    return `<details><summary><b>${esc(when(r.startedAt))}</b> · ${you} answers · ${r.harvests.length} harvests · ${r.saved.length} saved · <span>${esc(r.source.slice(0, 80))}</span></summary>
<p class="meta">Channels: ${esc(r.targets.join(", ") || "none")} · last activity ${esc(when(r.updatedAt))}</p>
<ol class="turns">${turns}</ol>${events ? `<h3>Events</h3><ul>${events}</ul>` : ""}${harvests ? `<h3>Harvests</h3>${harvests}` : ""}${r.saved.length ? `<h3>Saved to Buffer</h3><ul>${r.saved.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</details>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Interviewer runs</title>
<style>:root{color-scheme:light dark;--bg:#faf8f5;--fg:#1d1b18;--muted:#6b665e;--line:#e4dfd7;--card:#f1ede6}@media (prefers-color-scheme:dark){:root{--bg:#171614;--fg:#eeeae4;--muted:#a39d93;--line:#34312c;--card:#211f1c}}
body{background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif;margin:0;padding:32px 16px}main{max-width:820px;margin:0 auto}h1{font-size:1.4rem;margin:0 0 4px}p{color:var(--muted);margin:0 0 20px}
details{border-bottom:1px solid var(--line);padding:12px 0}summary{cursor:pointer}summary span,.meta,small{color:var(--muted)}small{display:block;font-size:.85rem}.flag{color:#b4532c}
.turns{padding-left:20px}.turns li{margin:8px 0}.turns li.you b{color:#3c7a4b}.card{background:var(--card);border-radius:10px;padding:12px;margin:10px 0}pre{white-space:pre-wrap;font:inherit;margin:8px 0 0}h3{font-size:1rem;margin:20px 0 6px}h4{font-size:.9rem;margin:14px 0 4px;color:var(--muted)}</style></head>
<body><main><h1>Interview runs</h1><p>Runs from people who left "keep this transcript" ticked, newest first. Encrypted at rest, deleted after 14 days. <a href="/stats">Stats</a></p>${body || "<p>Nothing yet.</p>"}</main></body></html>`;
}
