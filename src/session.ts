import type { Env } from "./env";
import { randomToken, seal, unseal } from "./crypto";
import type { VoiceClock } from "./spend";

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
}

export interface Turn {
  who: "interviewer" | "you";
  text: string;
  about?: number; // index into the agenda: what the side panel shows
}

// An Idea proposed from the conversation, waiting for review.
export interface Draft {
  id: string;
  title: string; // the angle, written by the model
  text: string; // their meaning and voice, lightly cleaned of speech debris
  prompts?: string[]; // questions that help shape it into a post (never wording)
  tagId?: string;
  later?: boolean; // an agenda topic they didn't get to
  channel?: string; // Buffer service this post is shaped for, e.g. "linkedin"
  format?: string; // "Text post", "Thread", "Carousel outline"...
  why?: string; // the editor's one-line reason for this channel and format
  flags?: string[]; // what we changed and they should know, e.g. a softened word
  extra?: boolean; // ranked below the top three: shown behind "Show more"
  sentences?: number[]; // which of their numbered sentences it was built from
}

export type HarvestMode = "draft" | "outline";

export interface Channel {
  id: string;
  service: string; // Buffer's service name: linkedin, twitter, threads...
  name: string;
  posts: number; // how many of their recent posts went out here
}

export interface Session {
  tokens: Tokens;
  organizationId?: string;
  organizationName?: string;
  repo?: string; // "owner/name"
  noRepo?: boolean; // they build outside GitHub and tell us about their work instead
  posts?: string[]; // their recent Buffer posts, to see who they are and who they write for
  tags?: { id: string; name: string; color: string }[]; // cached from Buffer
  questions?: Question[]; // the agenda: what the interviewer means to cover
  turns?: Turn[]; // the conversation, kept only until it's saved or reset
  drafts?: Draft[];
  saved?: string[]; // draft ids already sent to Buffer
  voiceStarts?: number[]; // when live voice sessions began, for a per-hour cap
  typedStarts?: number[]; // typed model calls, for a per-hour cap
  harvestStarts?: number[]; // harvest calls, for a daily cap
  voice?: VoiceClock; // the live session in progress, for the spend meter
  brief?: string; // repo, their note and recent posts, for the interviewer's context
  weekNote?: string; // plain-language work description when there is no repo
  channels?: Channel[]; // connected Buffer channels, read at setup
  targets?: string[]; // services they want stories shaped for
  harvestMode?: HarvestMode; // what the current drafts were made as
  keepLog?: boolean; // false if they unticked "keep this transcript" at setup
  runKey?: string; // where this interview's run log lives, when kept
  runLoggedAt?: number; // last voice transcript copy to the run log
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
