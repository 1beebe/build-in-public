import type { Env } from "./env";
import type { Question, Session } from "./session";
import { CONVERSE, agendaBrief } from "./conversation";

// Live voice runs on OpenAI's realtime model, straight between the browser and
// OpenAI over WebRTC. The server only mints a short-lived key with the
// interviewer's brief baked in, so the OpenAI key never reaches the page.
const MODEL = "gpt-realtime-2.1";

const VOICE_RULES = `This is a live voice conversation.
- Before you ask about an agenda item, call show_work with its number so they can see it on screen while you talk.
- Never read code, file paths, hashes or URLs aloud. Say what the change does in plain words.
- Start with a short hello (a few words) and ask about the first agenda item.
- Let silences be. Don't fill them, and don't talk over someone who's thinking.
- If they say they're done, thank them in one sentence and tell them to press "Find my ideas".`;

export async function voiceSession(env: Env, s: Session): Promise<{ key: string; model: string }> {
  const agenda: Question[] = s.questions ?? [];
  const sofar = (s.turns ?? []).map((t) => `${t.who === "you" ? "THEM" : "YOU"}: ${t.text}`).join("\n");
  const instructions = [
    CONVERSE,
    VOICE_RULES,
    `Context:\n${s.brief ?? ""}`,
    `Agenda (numbered):\n${agendaBrief(agenda)}`,
    sofar ? `The conversation so far (pick up where it left off, don't repeat it):\n${sofar}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const terms = [...new Set([...(s.repo ?? "").split(/[\/_.-]/), ...agenda.flatMap((q) => q.source.replace(/^[^:]+: /, "").split(/\s+/))])]
    .filter((t) => t.length > 3)
    .slice(0, 40);
  const model = env.REALTIME_MODEL || MODEL;

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey(env)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 120 },
      session: {
        type: "realtime",
        model,
        instructions,
        max_output_tokens: 600,
        audio: {
          input: {
            transcription: { model: "gpt-4o-transcribe", prompt: `A builder talking about their project. Terms: ${terms.join(", ")}` },
            turn_detection: { type: "semantic_vad", eagerness: "low" },
          },
          output: { voice: env.REALTIME_VOICE || "marin" },
        },
        tools: [
          {
            type: "function",
            name: "show_work",
            description: "Show the person the agenda item you're about to ask about, so they can see the pull request, commit, issue or post on screen.",
            parameters: {
              type: "object",
              properties: { item: { type: "integer", description: "The agenda item's number." } },
              required: ["item"],
            },
          },
        ],
      },
    }),
  });
  if (!res.ok) throw new Error(`realtime ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { value: string };
  return { key: json.value, model };
}

export const openaiKey = (env: Env) => env.OPENAI_API_KEY || env.OPEN_AI_KEY;
