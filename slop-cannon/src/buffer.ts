import type { Env } from "./env";
import type { Session, Tokens } from "./session";

const AUTH_URL = "https://auth.buffer.com/auth";
const TOKEN_URL = "https://auth.buffer.com/token";
const API_URL = "https://api.buffer.com";

// Read the account, its channels and queue; create and delete posts.
export const SCOPES = "account:read posts:read posts:write offline_access";

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
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    if (json.error === "invalid_grant") throw new NeedsReconnect();
    throw new Error(`Buffer token error: ${json.error ?? res.status} ${json.error_description ?? ""}`.trim());
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
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

// The 15-minute window's remaining requests, from Buffer's RateLimit header.
function remaining15(res: Response): number | undefined {
  const live = res.headers.get("ratelimit") ?? "";
  const policy = res.headers.get("ratelimit-policy") ?? "";
  const names = new Map<string, number>();
  for (const p of policy.split(/,\s*(?=")/)) {
    const name = p.match(/"([^"]+)"/)?.[1];
    const w = p.match(/w=(\d+)/)?.[1];
    if (name && w) names.set(name, Number(w));
  }
  for (const p of live.split(/,\s*(?=")/)) {
    const name = p.match(/"([^"]+)"/)?.[1];
    const r = p.match(/r=(\d+)/)?.[1];
    if (name && r !== undefined && names.get(name) === 900) return Number(r);
  }
  return undefined;
}

export class BufferClient {
  public sessionChanged = false;
  public remaining?: number;
  constructor(private env: Env, private session: Session) {}

  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    if (Date.now() >= this.session.tokens.expiresAt) {
      this.session.tokens = await refresh(this.env, this.session.tokens);
      this.sessionChanged = true;
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.session.tokens.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      this.remaining = remaining15(res) ?? this.remaining;
      if (res.status === 401) throw new NeedsReconnect();
      if (res.status === 429) {
        const wait = Number(res.headers.get("retry-after") ?? "60");
        if (attempt === 1 && wait <= 5) {
          await new Promise((r) => setTimeout(r, wait * 1000 + 200));
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

// ---- The calls the cannon makes ----

export interface Org {
  id: string;
  name: string;
  limits?: { scheduledPosts?: number }; // the plan's queue size per channel (10 on Free)
}

export async function getOrgs(client: BufferClient): Promise<{ orgs: Org[]; accountId?: string }> {
  const data = await client.query<{ account: { id?: string; organizations: Org[] } }>(
    `query Start { account { id organizations { id name limits { scheduledPosts } } } }`,
  ).catch(() =>
    client.query<{ account: { id?: string; organizations: Org[] } }>(`query Start { account { id organizations { id name } } }`),
  );
  return { orgs: data.account.organizations ?? [], accountId: data.account.id };
}

export interface ScheduleDay {
  day: string; // "mon"
  times: string[]; // "08:39" in the channel's timezone
  paused: boolean;
}

export interface Channel {
  id: string;
  service: string;
  name: string;
  timezone: string;
  queuePaused: boolean;
  schedule: ScheduleDay[];
}

interface RawChannel {
  id: string;
  service: string;
  name?: string;
  displayName?: string;
  isDisconnected?: boolean;
  isLocked?: boolean;
  timezone?: string;
  isQueuePaused?: boolean;
  postingSchedule?: ScheduleDay[];
}

const CHANNEL_FIELDS = "id service name displayName isDisconnected isLocked timezone isQueuePaused postingSchedule { day times paused }";

function toChannel(c: RawChannel): Channel {
  return {
    id: c.id,
    service: c.service,
    name: c.displayName || c.name || c.service,
    timezone: c.timezone || "UTC",
    queuePaused: Boolean(c.isQueuePaused),
    schedule: c.postingSchedule ?? [],
  };
}

export async function getChannels(client: BufferClient, organizationId: string): Promise<Channel[]> {
  let raw: RawChannel[];
  try {
    const data = await client.query<{ channels: RawChannel[] }>(
      `query Channels($o: OrganizationId!) { channels(input: { organizationId: $o }) { ${CHANNEL_FIELDS} } }`,
      { o: organizationId },
    );
    raw = data.channels;
  } catch {
    // The schedule may only be on the single-channel query: list, then read each.
    const data = await client.query<{ channels: RawChannel[] }>(
      `query Channels($o: OrganizationId!) { channels(input: { organizationId: $o }) { id service name displayName isDisconnected isLocked } }`,
      { o: organizationId },
    );
    raw = [];
    for (const c of data.channels.filter((c) => !c.isDisconnected && !c.isLocked)) {
      const one = await client.query<{ channel: RawChannel }>(
        `query Channel($id: ChannelId!) { channel(input: { id: $id }) { ${CHANNEL_FIELDS} } }`,
        { id: c.id },
      );
      raw.push(one.channel);
    }
  }
  return raw.filter((c) => c && !c.isDisconnected && !c.isLocked).map(toChannel);
}

// When each channel already has something scheduled, so the cannon skips those slots.
export async function getTaken(client: BufferClient, organizationId: string, channelIds: string[]): Promise<{ channelId: string; at: number }[]> {
  const out: { channelId: string; at: number }[] = [];
  let after: string | undefined;
  for (let page = 0; page < 3; page++) {
    const data = await client.query<{
      posts: { edges: { node: { dueAt?: string; channelId?: string } }[]; pageInfo?: { hasNextPage: boolean; endCursor?: string } };
    }>(
      `query Taken($o: OrganizationId!, $c: [ChannelId!], $after: String) {
        posts(first: 100, after: $after, input: { organizationId: $o, filter: { status: [scheduled], channelIds: $c } }) {
          edges { node { dueAt channelId } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { o: organizationId, c: channelIds, after },
    );
    for (const e of data.posts.edges) if (e.node.dueAt) out.push({ channelId: e.node.channelId ?? "", at: Date.parse(e.node.dueAt) });
    if (!data.posts.pageInfo?.hasNextPage) break;
    after = data.posts.pageInfo.endCursor;
  }
  return out;
}

export async function createPost(
  client: BufferClient,
  p: { channelId: string; service: string; text: string; dueAt: string; draft: boolean },
): Promise<{ id: string; dueAt?: string }> {
  const metadata: Record<string, unknown> = {};
  if (p.service === "facebook") metadata.facebook = { type: "post" };
  if (p.service === "googlebusiness") metadata.google = { type: "whats_new" };
  const data = await client.query<{ createPost: { post?: { id: string; dueAt?: string }; message?: string } }>(
    `mutation Fire($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess { post { id dueAt } }
        ... on MutationError { message }
      }
    }`,
    {
      input: {
        channelId: p.channelId,
        text: p.text,
        schedulingType: "automatic",
        mode: "customScheduled",
        dueAt: p.dueAt,
        ...(p.draft ? { saveToDraft: true } : {}),
        ...(Object.keys(metadata).length ? { metadata } : {}),
      },
    },
  );
  const post = data.createPost.post;
  if (!post?.id) throw new Error(data.createPost.message ?? "Buffer didn't take that post");
  return post;
}

export async function deletePost(client: BufferClient, id: string): Promise<void> {
  const data = await client.query<{ deletePost: { __typename?: string; message?: string } }>(
    `mutation Undo($id: PostId!) { deletePost(input: { id: $id }) { __typename ... on MutationError { message } } }`,
    { id },
  );
  if (/error/i.test(data.deletePost?.__typename ?? "")) throw new Error(data.deletePost.message ?? "Buffer didn't delete it");
}
