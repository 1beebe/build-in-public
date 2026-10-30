import type { Env } from "./env";
import { randomToken, seal, unseal } from "./crypto";

export interface FeedbackEntry {
  createdAt: string;
  kind: "feedback" | "bug";
  message: string;
  contact?: string;
  path?: string;
}

const DAY = 86_400;

async function visitorKey(req: Request, env: Env): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  const ip = req.headers.get("CF-Connecting-IP") ?? "local";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${env.TOKEN_KEY}:${day}:${ip}`));
  return `feedback-rate:${day}:${Array.from(new Uint8Array(bytes).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export async function storeFeedback(req: Request, env: Env, entry: FeedbackEntry): Promise<void> {
  const rateKey = await visitorKey(req, env);
  const used = Number(await env.SESSIONS.get(rateKey) ?? 0);
  if (used >= 5) throw new Error("rate");
  await env.SESSIONS.put(rateKey, String(used + 1), { expirationTtl: DAY * 2 });
  const newestFirst = (9_999_999_999_999 - Date.now()).toString().padStart(13, "0");
  const key = `feedback:${newestFirst}:${randomToken(6)}`;
  await env.SESSIONS.put(key, await seal(env.TOKEN_KEY, entry), { expirationTtl: DAY * 180 });
}

export async function recentFeedback(env: Env, limit = 30): Promise<FeedbackEntry[]> {
  const listed = await env.SESSIONS.list({ prefix: "feedback:", limit });
  const entries = await Promise.all(listed.keys.map(async ({ name }) => {
    const value = await env.SESSIONS.get(name);
    if (!value) return null;
    try { return await unseal<FeedbackEntry>(env.TOKEN_KEY, value); }
    catch { return null; }
  }));
  return entries.filter((x): x is FeedbackEntry => Boolean(x)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
