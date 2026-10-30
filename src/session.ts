import type { Env } from "./env";
import { randomToken, seal, unseal } from "./crypto";

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
}

export interface Question {
  id: string;
  text: string;
  // What the question points at, shown under it so the person sees why it was asked.
  source: string;
  sourceUrl?: string;
  // What the side panel shows: a pull request number, commit sha or issue
  // number in the repo, or the text of a Buffer post.
  ref?: { kind: "pull" | "commit" | "issue" | "post"; key: string };
  followUpOf?: string; // the question whose answer prompted this one
  audioUrl?: string; // the question read aloud, made on first listen
}

export interface Session {
  tokens: Tokens;
  organizationId?: string;
  organizationName?: string;
  repo?: string; // "owner/name"
  pillarTagIds?: string[];
  tags?: { id: string; name: string; color: string }[]; // cached from Buffer
  questions?: Question[];
  answered?: string[]; // question ids saved with an answer
  skipped?: string[]; // question ids saved as unanswered Ideas
  weekNote?: string; // their one-line "what did you work on", used only to aim questions
}

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days, matches a refresh token's useful life for us
const COOKIE = "sid";

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("Cookie") ?? "";
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return undefined;
}

export function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function loadSession(req: Request, env: Env): Promise<{ id: string; data: Session } | null> {
  const id = readCookie(req, COOKIE);
  if (!id) return null;
  const sealed = await env.SESSIONS.get(`s:${id}`);
  if (!sealed) return null;
  try {
    return { id, data: await unseal<Session>(env.TOKEN_KEY, sealed) };
  } catch {
    return null;
  }
}

export async function saveSession(env: Env, id: string, data: Session): Promise<void> {
  await env.SESSIONS.put(`s:${id}`, await seal(env.TOKEN_KEY, data), { expirationTtl: SESSION_TTL });
}

export async function createSession(env: Env, data: Session): Promise<{ id: string; setCookie: string }> {
  const id = randomToken(24);
  await saveSession(env, id, data);
  return { id, setCookie: cookie(COOKIE, id, SESSION_TTL) };
}

export async function destroySession(req: Request, env: Env): Promise<string> {
  const id = readCookie(req, COOKIE);
  if (id) await env.SESSIONS.delete(`s:${id}`);
  return cookie(COOKIE, "", 0);
}
