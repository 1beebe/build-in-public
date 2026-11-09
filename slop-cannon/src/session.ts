import type { Env } from "./env";
import { randomToken, seal, unseal } from "./crypto";
import type { Flavor } from "./slop";

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface Shell {
  channelId: string;
  service: string;
  channelName: string;
  dueAt: string; // ISO
  text: string;
}

export interface Session {
  tokens: Tokens;
  organizationId?: string;
  organizationName?: string;
  orgs?: { id: string; name: string }[];
  queueLimit?: number; // posts a channel's queue can hold on their plan
  loaded?: { observation: string; flavor: Flavor; shells: Shell[]; at: number }; // aimed, not fired
  lastVolley?: { ids: string[]; live: boolean; at: number }; // what the last shot created, for Undo
  shots?: number[]; // when they fired, for a per-hour cap
}

const SESSION_TTL = 60 * 60 * 24 * 30;
const COOKIE = "sid";

export function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.get("Cookie") ?? "").split(/;\s*/)) {
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

export async function createSession(env: Env, data: Session): Promise<string> {
  const id = randomToken(24);
  await saveSession(env, id, data);
  return cookie(COOKIE, id, SESSION_TTL);
}

export async function destroySession(req: Request, env: Env): Promise<string> {
  const id = readCookie(req, COOKIE);
  if (id) await env.SESSIONS.delete(`s:${id}`);
  return cookie(COOKIE, "", 0);
}
