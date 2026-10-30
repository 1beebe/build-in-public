import type { Env } from "./env";
import type { Session, Tokens } from "./session";

const AUTH_URL = "https://auth.buffer.com/auth";
const TOKEN_URL = "https://auth.buffer.com/token";
const API_URL = "https://api.buffer.com";

// The narrowest set the app needs: read the account and its tags and posts,
// create Ideas, and create a draft post linked to an Idea. offline_access gives
// a refresh token so people stay connected between weekly interviews.
export const SCOPES = "account:read ideas:read ideas:write posts:read posts:write offline_access";

// Stop starting new work when the 15-minute window gets this low, so one busy
// person can't use up the quota every other connected person shares.
const LOW_WATER = 5;
// Retry a 429 in-request only when the wait is short; otherwise tell the person.
const MAX_INLINE_WAIT_S = 5;

export class RateLimited extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Buffer asked us to wait ${retryAfterSeconds} seconds`);
  }
}

export class NeedsReconnect extends Error {
  constructor() {
    super("Buffer access was revoked or expired");
  }
}

export function authorizeUrl(env: Env, state: string, challenge: string): string {
  const u = new URL(AUTH_URL);
  u.searchParams.set("client_id", env.BUFFER_CLIENT_ID);
  u.searchParams.set("redirect_uri", `${env.APP_URL}/callback`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "consent");
  return u.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<Tokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    if (json.error === "invalid_grant") throw new NeedsReconnect();
    throw new Error(`Buffer token error: ${json.error ?? res.status} ${json.error_description ?? ""}`.trim());
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // Refresh a minute early so a request never goes out with a token about to lapse.
    expiresAt: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000,
  };
}

export function exchangeCode(env: Env, code: string, verifier: string): Promise<Tokens> {
  return tokenRequest({
    client_id: env.BUFFER_CLIENT_ID,
    client_secret: env.BUFFER_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${env.APP_URL}/callback`,
    code_verifier: verifier,
  });
}

// Refresh tokens are single-use: the new one must replace the old one before
// anything else uses it, so the caller saves the session right after this.
async function refresh(env: Env, tokens: Tokens): Promise<Tokens> {
  if (!tokens.refreshToken) throw new NeedsReconnect();
  const next = await tokenRequest({
    client_id: env.BUFFER_CLIENT_ID,
    client_secret: env.BUFFER_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
  });
  return { ...next, refreshToken: next.refreshToken ?? tokens.refreshToken };
}

export interface RateWindow {
  remaining: number;
  resetSeconds: number;
}

// Each response carries one RateLimit entry per window; fetch joins them into one
// string. We key them by window length, as Buffer's docs recommend.
export function parseRateLimit(res: Response): Record<number, RateWindow> {
  const out: Record<number, RateWindow> = {};
  const live = res.headers.get("ratelimit") ?? "";
  const policy = res.headers.get("ratelimit-policy") ?? "";
  const windows = new Map<string, number>();
  for (const p of policy.split(/,\s*(?=")/)) {
    const name = p.match(/"([^"]+)"/)?.[1];
    const w = p.match(/w=(\d+)/)?.[1];
    if (name && w) windows.set(name, Number(w));
  }
  for (const p of live.split(/,\s*(?=")/)) {
    const name = p.match(/"([^"]+)"/)?.[1];
    const r = p.match(/r=(\d+)/)?.[1];
    const t = p.match(/t=(\d+)/)?.[1];
    if (!name || r === undefined) continue;
    out[windows.get(name) ?? 0] = { remaining: Number(r), resetSeconds: Number(t ?? 0) };
  }
  return out;
}

export class BufferClient {
  // Set when a call refreshed the tokens; the route handler saves the session.
  public sessionChanged = false;
  public lastRate: Record<number, RateWindow> = {};

  constructor(private env: Env, private session: Session) {}

  get nearLimit(): boolean {
    const w = this.lastRate[900];
    return w !== undefined && w.remaining < LOW_WATER;
  }

  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    if (Date.now() >= this.session.tokens.expiresAt) {
      this.session.tokens = await refresh(this.env, this.session.tokens);
      this.sessionChanged = true;
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.session.tokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });
      this.lastRate = parseRateLimit(res);
      if (res.status === 401) throw new NeedsReconnect();
      if (res.status === 429) {
        const wait = Number(res.headers.get("retry-after") ?? "60");
        if (attempt === 1 && wait <= MAX_INLINE_WAIT_S) {
          await new Promise((r) => setTimeout(r, wait * 1000 + Math.random() * 250));
          continue;
        }
        throw new RateLimited(wait);
      }
      const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
      if (json.errors?.length) throw new Error(`Buffer API: ${json.errors.map((e) => e.message).join("; ")}`);
      return json.data as T;
    }
    throw new RateLimited(60);
  }
}

// ---- The calls the app makes. Each asks only for the fields it uses. ----

export interface Org {
  id: string;
  name: string;
}
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export async function getStart(client: BufferClient): Promise<{ orgs: Org[] }> {
  const data = await client.query<{ account: { organizations: Org[] } }>(
    `query Start { account { organizations { id name } } }`,
  );
  return { orgs: data.account.organizations };
}

export async function getTags(client: BufferClient, organizationId: string): Promise<Tag[]> {
  const data = await client.query<{ tagsV2: { edges: { node: Tag }[] } }>(
    `query Tags($o: OrganizationId!) { tagsV2(first: 50, input: { organizationId: $o }) { edges { node { id name color } } } }`,
    { o: organizationId },
  );
  return data.tagsV2.edges.map((e) => e.node);
}

export interface RecentIdea {
  id: string;
  title?: string;
  text?: string;
}

// Recent Ideas and posts, in one request, so questions can follow up on earlier
// answers and avoid repeating what they already posted.
export async function getRecent(
  client: BufferClient,
  organizationId: string,
): Promise<{ ideas: RecentIdea[]; posts: string[] }> {
  const data = await client.query<{
    ideas: { edges: { node: { id: string; content: { title?: string; text?: string } } }[] };
    posts: { edges: { node: { text: string } }[] };
  }>(
    `query Recent($o: OrganizationId!) {
      ideas(first: 30, input: { organizationId: $o }) { edges { node { id content { title text } } } }
      posts(first: 15, input: { organizationId: $o, sort: [{ field: createdAt, direction: desc }] }) { edges { node { text } } }
    }`,
    { o: organizationId },
  );
  return {
    ideas: data.ideas.edges.map((e) => ({ id: e.node.id, ...e.node.content })),
    posts: data.posts.edges.map((e) => e.node.text),
  };
}

export async function createIdea(
  client: BufferClient,
  organizationId: string,
  idea: { title: string; text: string; tags: Tag[]; aiAssisted: boolean },
): Promise<string> {
  const data = await client.query<{ createIdea: { id?: string; idea?: { id: string }; message?: string } }>(
    `mutation Save($input: CreateIdeaInput!) {
      createIdea(input: $input) {
        ... on Idea { id }
        ... on IdeaResponse { idea { id } }
        ... on MutationError { message }
      }
    }`,
    {
      input: {
        organizationId,
        content: {
          title: idea.title,
          text: idea.text,
          aiAssisted: idea.aiAssisted,
          tags: idea.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
        },
      },
    },
  );
  const id = data.createIdea.id ?? data.createIdea.idea?.id;
  if (!id) throw new Error(`Buffer didn't save the Idea: ${data.createIdea.message ?? "unknown error"}`);
  return id;
}
