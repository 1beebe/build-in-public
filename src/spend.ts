import type { Env } from "./env";

// A running estimate of what the app spends, so there's one place to look and
// a daily brake on voice. Estimates from list prices, not the bill: the
// provider dashboards are the truth, this is the early warning.
const VOICE_PER_MIN = { "gpt-live": 0.06, realtime: 0.08 } as const;
export type VoiceKind = keyof typeof VOICE_PER_MIN;
const MODEL_CALL = { deep: 0.03, chat: 0.002, speech: 0.01 } as const;

// App-wide voice minutes a day before new voice sessions switch to typing.
// About $10 a day at GPT-Live prices. DAILY_VOICE_MINUTES overrides it.
const DAILY_VOICE_MINUTES = 120;
// A live session pauses itself after 20 minutes on the page.
const MAX_SESSION_MIN = 20;

interface Day {
  openai: number;
  mindstudio: number;
  voiceMinutes: number;
  interviews: number;
}

const dayKey = (t = Date.now()) => `spend:${new Date(t).toISOString().slice(0, 10)}`;
const empty = (): Day => ({ openai: 0, mindstudio: 0, voiceMinutes: 0, interviews: 0 });

async function getDay(env: Env, key: string): Promise<Day> {
  return { ...empty(), ...((await env.SESSIONS.get<Day>(key, "json")) ?? {}) };
}

// Read-modify-write on KV can drop a write when two land at once. Fine for
// an estimate; never let a meter failure break the interview.
async function add(env: Env, change: Partial<Day>): Promise<void> {
  try {
    const key = dayKey();
    const day = await getDay(env, key);
    for (const [k, v] of Object.entries(change) as [keyof Day, number][]) day[k] += v;
    await env.SESSIONS.put(key, JSON.stringify(day), { expirationTtl: 60 * 60 * 24 * 120 });
  } catch (err) {
    console.error("spend meter failed", err);
  }
}

export const countInterview = (env: Env) => add(env, { interviews: 1 });
export const countModelCall = (env: Env, kind: keyof typeof MODEL_CALL) => add(env, { mindstudio: MODEL_CALL[kind] });

// The voice session in progress, kept on the person's session.
export interface VoiceClock {
  kind: VoiceKind;
  startedAt: number;
  counted: number; // minutes already added to the meter
}

// Called whenever the page syncs the live transcript: bills the minutes since
// the last sync, so the meter follows the conversation as it goes.
export async function tickVoice(env: Env, clock: VoiceClock | undefined): Promise<void> {
  if (!clock) return;
  const minutes = Math.min(MAX_SESSION_MIN, (Date.now() - clock.startedAt) / 60_000);
  const delta = minutes - clock.counted;
  if (delta < 0.05) return;
  clock.counted = minutes;
  await add(env, { voiceMinutes: delta, openai: delta * VOICE_PER_MIN[clock.kind] });
}

export async function voiceAllowedToday(env: Env): Promise<boolean> {
  const cap = Number(env.DAILY_VOICE_MINUTES) || DAILY_VOICE_MINUTES;
  return (await getDay(env, dayKey())).voiceMinutes < cap;
}

// OpenAI answers 429 when a hard spend limit or quota is reached.
export class SpendCapError extends Error {}
export function isSpendCap(status: number, body: string): boolean {
  return status === 429 && /spend_limit|quota|billing/i.test(body);
}

const usd = (n: number) => `$${n.toFixed(2)}`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// The owner's private view: the last 30 days, newest first.
export async function statsPage(env: Env): Promise<string> {
  const days = await Promise.all(
    Array.from({ length: 30 }, (_, i) => dayKey(Date.now() - i * 86_400_000)).map(async (k) => [k.slice(6), await getDay(env, k)] as const),
  );
  const month = new Date().toISOString().slice(0, 7);
  const mtd = days.filter(([d]) => d.startsWith(month)).reduce((a, [, d]) => a + d.openai + d.mindstudio, 0);
  const today = days[0][1];
  const cap = Number(env.DAILY_VOICE_MINUTES) || DAILY_VOICE_MINUTES;
  const rows = days
    .filter(([, d]) => d.openai || d.mindstudio || d.interviews)
    .map(
      ([date, d]) =>
        `<tr><td>${esc(date)}</td><td>${d.interviews}</td><td>${Math.round(d.voiceMinutes)}</td><td>${usd(d.openai)}</td><td>${usd(d.mindstudio)}</td><td><b>${usd(d.openai + d.mindstudio)}</b></td></tr>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Interviewer spend</title>
<style>:root{color-scheme:light dark;--bg:#faf8f5;--fg:#1d1b18;--muted:#6b665e;--line:#e4dfd7}@media (prefers-color-scheme:dark){:root{--bg:#171614;--fg:#eeeae4;--muted:#a39d93;--line:#34312c}}
body{background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif;margin:0;padding:32px 16px}main{max-width:720px;margin:0 auto}h1{font-size:1.4rem;margin:0 0 4px}p{color:var(--muted);margin:0 0 20px}
.big{display:flex;gap:32px;flex-wrap:wrap;margin:0 0 24px}.big div{font-size:1.6rem;font-weight:600}.big span{display:block;font-size:.8rem;font-weight:400;color:var(--muted)}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{text-align:right;padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap}th:first-child,td:first-child{text-align:left}th{font-size:.8rem;color:var(--muted);font-weight:500}</style></head>
<body><main><h1>What the Interviewer is spending</h1><p>Estimates from list prices, in UTC days. Your OpenAI and MindStudio usage pages have the real bill.</p>
<div class="big"><div>${usd(mtd)}<span>this month so far</span></div><div>${usd(today.openai + today.mindstudio)}<span>today</span></div><div>${Math.round(today.voiceMinutes)} / ${cap}<span>voice minutes today (then voice pauses)</span></div></div>
<div class="wrap"><table><thead><tr><th>Day</th><th>Interviews</th><th>Voice min</th><th>OpenAI</th><th>MindStudio</th><th>Total</th></tr></thead><tbody>${rows || `<tr><td colspan="6">Nothing yet.</td></tr>`}</tbody></table></div></main></body></html>`;
}
