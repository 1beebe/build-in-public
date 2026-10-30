import type { Env } from "./env";
import { countModelCall } from "./spend";

// MindStudio's step API: one key reaches DeepSeek for the questions and the
// speech models for voice. A step is started, then polled until it finishes.
const BASE = "https://v1.mindstudio-api.com/developer/v2";
const STEP_TIMEOUT_MS = 25_000;

export class MindStudioError extends Error {}

export async function step<T>(env: Env, type: string, input: Record<string, unknown>, timeoutMs = STEP_TIMEOUT_MS): Promise<T> {
  const start = await fetch(`${BASE}/steps/${type}/execute-async`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.MINDSTUDIO_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ step: input }),
  });
  if (!start.ok) throw new MindStudioError(`${type} ${start.status}: ${(await start.text()).slice(0, 300)}`);
  const { executionToken } = (await start.json()) as { executionToken: string };

  const deadline = Date.now() + timeoutMs;
  for (let delay = 150; Date.now() < deadline; delay = Math.min(delay * 2, 2000)) {
    await new Promise((r) => setTimeout(r, delay));
    const res = await fetch(`${BASE}/steps/${type}/execute-async/poll/${executionToken}`);
    if (res.status >= 502 && res.status <= 504) continue;
    if (!res.ok) throw new MindStudioError(`${type} poll ${res.status}`);
    const poll = (await res.json()) as { status: string; output?: T; outputUrl?: string; message?: string; error?: string };
    if (poll.status === "pending") continue;
    if (poll.status === "error") throw new MindStudioError(`${type}: ${poll.message ?? poll.error ?? "failed"}`);
    if (poll.output != null) return poll.output;
    if (poll.outputUrl) return ((await (await fetch(poll.outputUrl)).json()) as { value: T }).value;
    throw new MindStudioError(`${type}: no output`);
  }
  throw new MindStudioError(`${type}: timed out`);
}

type CatalogModel = { id: string; name: string };

// Prefer the named Flash family deterministically. Catalog order is not a
// version signal, so never silently switch to whichever DeepSeek appears last.
export function selectInterviewModel(models: CatalogModel[]): CatalogModel | undefined {
  const usable = models.filter((m) => {
    const label = `${m.id} ${m.name}`;
    return /deepseek/i.test(label) && !/reason|r1|coder|pro/i.test(label);
  });
  const exactFlash = usable
    .filter((m) => /(?:v?4[.\s_-]?1.*flash|flash.*v?4[.\s_-]?1)/i.test(`${m.id} ${m.name}`))
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (exactFlash) return exactFlash;
  return usable.filter((m) => /flash/i.test(`${m.id} ${m.name}`)).sort((a, b) => a.id.localeCompare(b.id))[0];
}

// INTERVIEW_MODEL is the hard pin. Otherwise resolve the catalog's explicit
// DeepSeek Flash entry once a day and cache its concrete provider id.
export async function chatModel(env: Env): Promise<string> {
  if (env.INTERVIEW_MODEL) return env.INTERVIEW_MODEL;
  const cached = await env.SESSIONS.get("ms:model:deepseek-flash-v1");
  if (cached) return cached;
  const res = await fetch(`${BASE}/helpers/models/llm_chat`, { headers: { Authorization: `Bearer ${env.MINDSTUDIO_API_KEY}` } });
  if (!res.ok) throw new MindStudioError(`models ${res.status}`);
  const { models } = (await res.json()) as { models: CatalogModel[] };
  const pick = selectInterviewModel(models);
  if (!pick) throw new MindStudioError("DeepSeek Flash is not available");
  await env.SESSIONS.put("ms:model:deepseek-flash-v1", pick.id, { expirationTtl: 86400 });
  return pick.id;
}

// The one pass that needs judgment over the whole conversation: turning it
// into Ideas. Typed live turns stay on DeepSeek Flash for speed.
const THINKING_MODEL = "claude-5-5-sonnet";

export async function generateText(env: Env, system: string, message: string, timeoutMs?: number, maxTokens = 1200, deep = false): Promise<string> {
  system = system.slice(0, 12_000);
  message = message.slice(0, 40_000);
  maxTokens = Math.max(1, Math.min(maxTokens, 2_500));
  const modelOverride: Record<string, unknown> = {
    model: deep ? env.THINKING_MODEL || THINKING_MODEL : await chatModel(env),
    maxResponseTokens: maxTokens,
    preamble: system,
  };
  // Current Claude models reject temperature. It remains useful for the short,
  // conversational DeepSeek turns, where some variation keeps the interview natural.
  if (!deep) modelOverride.temperature = 0.6;
  const out = await step<{ content: string }>(env, "userMessage", {
    message,
    modelOverride,
  }, timeoutMs);
  await countModelCall(env, deep ? "deep" : "chat");
  return out.content;
}
