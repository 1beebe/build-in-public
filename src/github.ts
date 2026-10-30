import type { Env } from "./env";

export interface Shipped {
  repo: string;
  description?: string;
  commits: { message: string; url: string; date: string }[];
  pulls: { title: string; body: string; url: string; mergedAt: string }[];
  issues: { title: string; url: string; closedAt: string }[];
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
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [meta, commits, pulls, issues] = await Promise.all([
    gh<{ description?: string; private?: boolean }>(env, `/repos/${repo}`),
    gh<{ html_url: string; commit: { message: string; author?: { date: string } } }[]>(
      env,
      `/repos/${repo}/commits?since=${since}&per_page=50`,
    ),
    gh<{ title: string; body?: string; html_url: string; merged_at?: string | null; user?: { type?: string } }[]>(
      env,
      `/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`,
    ),
    gh<{ title: string; html_url: string; closed_at?: string | null; pull_request?: unknown }[]>(
      env,
      `/repos/${repo}/issues?state=closed&since=${since}&per_page=30`,
    ),
  ]);
  return {
    repo,
    description: meta.description ?? undefined,
    commits: commits
      .map((c) => ({ message: c.commit.message.trim(), url: c.html_url, date: c.commit.author?.date ?? "" }))
      .filter((c) => !/^Merge (pull request|branch)/.test(c.message)),
    pulls: pulls
      .filter((p) => p.merged_at && p.merged_at >= since && p.user?.type !== "Bot")
      .map((p) => ({ title: p.title, body: (p.body ?? "").slice(0, 1200), url: p.html_url, mergedAt: p.merged_at! })),
    issues: issues
      .filter((i) => !i.pull_request && i.closed_at)
      .map((i) => ({ title: i.title, url: i.html_url, closedAt: i.closed_at! })),
  };
}
