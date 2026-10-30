import type { Env } from "./env";
import type { Shipped } from "./github";
import type { RecentIdea } from "./buffer";
import type { Question } from "./session";
import { randomToken } from "./crypto";
import { generateText } from "./mindstudio";
import { countModelCall } from "./spend";

const MAX_QUESTIONS = 5;

type Item = { label: string; url: string; ref: NonNullable<Question["ref"]> };

function shippedLines(s: Shipped): Item[] {
  return [
    ...s.pulls.map((p) => ({
      label: `Merged PR: ${p.title}${p.body ? ` — ${p.body.slice(0, 300)}` : ""}`,
      url: p.url,
      ref: { kind: "pull" as const, key: String(p.number) },
    })),
    ...s.issues.map((i) => ({ label: `Closed issue: ${i.title}`, url: i.url, ref: { kind: "issue" as const, key: String(i.number) } })),
    ...s.commits.map((c) => ({ label: `Commit: ${c.message.split("\n")[0]}`, url: c.url, ref: { kind: "commit" as const, key: c.sha } })),
  ];
}

const POST_SOURCE = "Your latest Buffer post";

function postQuestion(post: string): Question {
  const quote = post.replace(/\s+/g, " ").trim();
  return {
    id: randomToken(8),
    text: `In your latest Buffer post you wrote "${quote.length > 70 ? quote.slice(0, 70) + "…" : quote}". What happened after it went out?`,
    source: POST_SOURCE,
    ref: { kind: "post", key: post.slice(0, 2000) },
  };
}

export async function planQuestions(
  shipped: Shipped,
  recent: { ideas: RecentIdea[]; posts: string[] },
  weekNote: string,
): Promise<Question[]> {
  // Skip work they've already posted about.
  const posted = recent.posts.join("\n").toLowerCase();
  const items = shippedLines(shipped)
    .filter((it) => {
      const title = it.label.replace(/^(Merged PR|Closed issue|Commit): /, "").split(" — ")[0].toLowerCase();
      return title.length < 12 || !posted.includes(title);
    })
    .slice(0, 40);
  return ruleQuestions(shipped, items, weekNote, recent.posts[0]);
}

export const hasModel = (env: Env) => Boolean(env.MINDSTUDIO_API_KEY || env.ANTHROPIC_API_KEY);

// MindStudio (DeepSeek) when it's set up, Claude as a fallback.
export async function complete(env: Env, system: string, message: string, timeoutMs?: number, maxTokens = 1200, deep = false): Promise<string> {
  system = system.slice(0, 12_000);
  message = message.slice(0, 40_000);
  maxTokens = Math.max(1, Math.min(maxTokens, 2_500));
  if (env.MINDSTUDIO_API_KEY) return generateText(env, system, message, timeoutMs, maxTokens, deep);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: message }] }),
  });
  if (!res.ok) throw new Error(`model ${res.status}`);
  const json = (await res.json()) as { content: { type: string; text?: string }[] };
  await countModelCall(env, deep ? "deep" : "chat");
  return json.content.find((c) => c.type === "text")?.text ?? "";
}

// Works with no model at all: specific, if less clever, questions about the
// biggest pieces of work in the repo this week.
function ruleQuestions(shipped: Shipped, items: Item[], weekNote: string, latestPost?: string): Question[] {
  const prompts = [
    (t: string) => `You shipped "${t}" this week. What made it the thing to work on now?`,
    (t: string) => `What broke or surprised you while you worked on "${t}"?`,
    (t: string) => `Who is "${t}" for, and what will they notice first?`,
    (t: string) => `If someone else were about to build "${t}", what would you tell them?`,
    (t: string) => `What did you decide not to do in "${t}", and why?`,
  ];
  const ranked = items
    .filter((it) => !NOISE.test(it.label))
    .sort((a, b) => weight(b.label) - weight(a.label))
    .slice(0, latestPost ? MAX_QUESTIONS - 1 : MAX_QUESTIONS);
  const out: Question[] = ranked.map((it, i) => {
    const title = it.label.replace(/^(Merged PR|Closed issue|Commit): /, "").split(" — ")[0].slice(0, 80);
    return { id: randomToken(8), text: prompts[i % prompts.length](title), source: it.label.split(" — ")[0], sourceUrl: it.url, ref: it.ref };
  });
  // One follow-up on what they last posted, after the GitHub questions.
  if (latestPost && out.length) out.push(postQuestion(latestPost));
  if (!out.length) {
    out.push({
      id: randomToken(8),
      text: weekNote
        ? `You said you worked on "${weekNote.slice(0, 80)}". What was the hardest part?`
        : `Nothing public changed in ${shipped.repo} this week. What did you work on that isn't in the repo yet?`,
      source: weekNote ? "What you said about your week" : shipped.repo,
    });
  }
  return out;
}

// Housekeeping commits nobody wants to be interviewed about.
const NOISE = /\b(typo|bump|formatting|lint|wip|merge|chore)\b/i;

function weight(label: string): number {
  const kind = label.startsWith("Merged PR") ? 300 : label.startsWith("Closed issue") ? 200 : 0;
  // Longer messages usually mean a more substantial change.
  return kind + Math.min(label.length, 200);
}
