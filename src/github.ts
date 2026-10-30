import type { Env } from "./env";

export interface Shipped {
  repo: string;
  description?: string;
  commits: { sha: string; message: string; url: string; date: string }[];
  pulls: { number: number; title: string; body: string; url: string; mergedAt: string }[];
  issues: { number: number; title: string; url: string; closedAt: string }[];
}

// One piece of work, in enough detail to show beside the question.
export interface Source {
  kind: "pull" | "commit" | "issue" | "post";
  title: string;
  body: string;
  url?: string;
  who?: string;
  when?: string;
  stats?: { additions: number; deletions: number; files: number };
  files: { name: string; status: string; additions: number; deletions: number; patch?: string }[];
}

export class RepoError extends Error {}

// Accepts "owner/name", "github.com/owner/name" or a full URL.
export function parseRepo(input: string): string | null {
  const m = input
    .trim()
    .replace(/\.git$/, "")
    .match(/^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

async function gh<T>(env: Env, path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "the-interviewer",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) throw new RepoError("That repo isn't public, or the link has a typo.");
  if (res.status === 409) return [] as T; // empty repo: nothing shipped yet
  if (res.status === 403 || res.status === 429) throw new RepoError("GitHub is rate-limiting us. Try again in a few minutes.");
  if (!res.ok) throw new RepoError(`GitHub returned ${res.status}.`);
  return (await res.json()) as T;
}

// Everything public that changed in the last `days` days. Merge commits and
// bot noise are dropped so questions land on work a person actually did.
export async function whatShipped(env: Env, repo: string, days = 7): Promise<Shipped> {
  // Cached briefly: setup, a restart and a second person on the same repo
  // shouldn't each spend four GitHub requests.
  const cacheKey = `ship:${repo.toLowerCase()}:${days}`;
  const cached = await env.SESSIONS.get<Shipped>(cacheKey, "json");
  if (cached) return cached;
  const fresh = await readShipped(env, repo, days);
  await env.SESSIONS.put(cacheKey, JSON.stringify(fresh), { expirationTtl: 600 });
  return fresh;
}

async function readShipped(env: Env, repo: string, days: number): Promise<Shipped> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [meta, commits, pulls, issues] = await Promise.all([
    gh<{ description?: string; private?: boolean }>(env, `/repos/${repo}`),
    gh<{ sha: string; html_url: string; commit: { message: string; author?: { date: string } } }[]>(
      env,
      `/repos/${repo}/commits?since=${since}&per_page=50`,
    ),
    gh<{ number: number; title: string; body?: string; html_url: string; merged_at?: string | null; user?: { type?: string } }[]>(
      env,
      `/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`,
    ),
    gh<{ number: number; title: string; html_url: string; closed_at?: string | null; pull_request?: unknown }[]>(
      env,
      `/repos/${repo}/issues?state=closed&since=${since}&per_page=30`,
    ),
  ]);
  return {
    repo,
    description: meta.description ?? undefined,
    commits: commits
      .map((c) => ({ sha: c.sha, message: c.commit.message.trim(), url: c.html_url, date: c.commit.author?.date ?? "" }))
      .filter((c) => !/^Merge (pull request|branch)/.test(c.message)),
    pulls: pulls
      .filter((p) => p.merged_at && p.merged_at >= since && p.user?.type !== "Bot")
      .map((p) => ({ number: p.number, title: p.title, body: (p.body ?? "").slice(0, 1200), url: p.html_url, mergedAt: p.merged_at! })),
    issues: issues
      .filter((i) => !i.pull_request && i.closed_at)
      .map((i) => ({ number: i.number, title: i.title, url: i.html_url, closedAt: i.closed_at! })),
  };
}

type GhFile = { filename: string; status: string; additions: number; deletions: number; patch?: string };

// Big diffs are trimmed: the panel is there to jog memory, not to review code.
const MAX_FILES_WITH_PATCH = 6;
const MAX_PATCH_LINES = 60;

function files(list: GhFile[]): Source["files"] {
  return list.slice(0, 30).map((f, i) => ({
    name: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    patch: i < MAX_FILES_WITH_PATCH && f.patch ? trimPatch(f.patch) : undefined,
  }));
}

function trimPatch(patch: string): string {
  const lines = patch.split("\n");
  return lines.length > MAX_PATCH_LINES ? [...lines.slice(0, MAX_PATCH_LINES), "…"].join("\n") : patch;
}

export async function getSource(env: Env, repo: string, kind: "pull" | "commit" | "issue", key: string): Promise<Source> {
  if (kind === "pull") {
    const [pr, changed] = await Promise.all([
      gh<{ title: string; body?: string; html_url: string; merged_at?: string; user?: { login: string }; additions: number; deletions: number; changed_files: number }>(
        env,
        `/repos/${repo}/pulls/${encodeURIComponent(key)}`,
      ),
      gh<GhFile[]>(env, `/repos/${repo}/pulls/${encodeURIComponent(key)}/files?per_page=30`),
    ]);
    return {
      kind,
      title: pr.title,
      body: (pr.body ?? "").slice(0, 3000),
      url: pr.html_url,
      who: pr.user?.login,
      when: pr.merged_at,
      stats: { additions: pr.additions, deletions: pr.deletions, files: pr.changed_files },
      files: files(changed),
    };
  }
  if (kind === "commit") {
    const c = await gh<{
      html_url: string;
      author?: { login: string } | null;
      commit: { message: string; author?: { name?: string; date?: string } };
      stats?: { additions: number; deletions: number };
      files?: GhFile[];
    }>(env, `/repos/${repo}/commits/${encodeURIComponent(key)}`);
    const [title, ...rest] = c.commit.message.trim().split("\n");
    return {
      kind,
      title,
      body: rest.join("\n").trim().slice(0, 3000),
      url: c.html_url,
      who: c.author?.login ?? c.commit.author?.name,
      when: c.commit.author?.date,
      stats: c.stats ? { additions: c.stats.additions, deletions: c.stats.deletions, files: c.files?.length ?? 0 } : undefined,
      files: files(c.files ?? []),
    };
  }
  const issue = await gh<{ title: string; body?: string; html_url: string; closed_at?: string; user?: { login: string } }>(
    env,
    `/repos/${repo}/issues/${encodeURIComponent(key)}`,
  );
  return {
    kind,
    title: issue.title,
    body: (issue.body ?? "").slice(0, 3000),
    url: issue.html_url,
    who: issue.user?.login,
    when: issue.closed_at,
    files: [],
  };
}
