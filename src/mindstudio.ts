import type { Env } from "./env";

// MindStudio's step API: one key reaches DeepSeek for the questions and the
// speech models for voice. A step is started, then polled until it finishes.
const BASE = "https://v1.mindstudio-api.com/developer/v2";
const STEP_TIMEOUT_MS = 25_000;

export class MindStudioError extends Error {}

export async function step<T>(env: Env, type: string, input: Record<string, unknown>): Promise<T> {
  const start = await fetch(`${BASE}/steps/${type}/execute-async`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.MINDSTUDIO_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ step: input }),
  });
  if (!start.ok) throw new MindStudioError(`${type} ${start.status}: ${(await start.text()).slice(0, 300)}`);
  const { executionToken } = (await start.json()) as { executionToken: string };

  const deadline = Date.now() + STEP_TIMEOUT_MS;
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

// DeepSeek's newest chat model, unless INTERVIEW_MODEL pins one. Looked up
// once a day so a new DeepSeek release is picked up without a deploy.
export async function chatModel(env: Env): Promise<string> {
  if (env.INTERVIEW_MODEL) return env.INTERVIEW_MODEL;
  const cached = await env.SESSIONS.get("ms:model");
  if (cached) return cached;
  const res = await fetch(`${BASE}/helpers/models/llm_chat`, { headers: { Authorization: `Bearer ${env.MINDSTUDIO_API_KEY}` } });
  if (!res.ok) throw new MindStudioError(`models ${res.status}`);
  const { models } = (await res.json()) as { models: { id: string; name: string }[] };
  const deepseek = models.filter((m) => /deepseek/i.test(`${m.id} ${m.name}`) && !/reason|r1|coder/i.test(`${m.id} ${m.name}`));
  const pick = deepseek[deepseek.length - 1] ?? models.find((m) => /deepseek/i.test(m.id));
  if (!pick) throw new MindStudioError("no DeepSeek model available");
  await env.SESSIONS.put("ms:model", pick.id, { expirationTtl: 86400 });
  return pick.id;
}

export async function generateText(env: Env, system: string, message: string): Promise<string> {
  const out = await step<{ content: string }>(env, "userMessage", {
    message,
    modelOverride: { model: await chatModel(env), temperature: 0.6, maxResponseTokens: 1200, preamble: system },
  });
  return out.content;
}

const VOICE_MODEL = "gpt-realtime-2.1-mini-tts";

export async function speak(env: Env, text: string): Promise<string> {
  const out = await step<{ audioUrl: string }>(env, "textToSpeech", {
    text,
    speechModelOverride: {
      model: env.VOICE_MODEL || VOICE_MODEL,
      config: { instructions: "A warm, curious interviewer. Unhurried, plain, friendly. Not a radio host." },
    },
  });
  return out.audioUrl;
}

export async function transcribe(env: Env, audioUrl: string, keyterms: string[]): Promise<string> {
  const out = await step<{ text: string }>(env, "transcribeAudio", {
    audioUrl,
    prompt: "A builder answering an interview question about their software project.",
    transcriptionModelOverride: { model: "elevenlabs-scribe-v2", config: { keyterms: keyterms.slice(0, 50) } },
  });
  return out.text.trim();
}
