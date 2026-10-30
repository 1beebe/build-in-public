import type { Env } from "./env";
import type { Question, Session } from "./session";
import { CONVERSE, agendaBrief } from "./conversation";

// Live voice runs on OpenAI's realtime model, straight between the browser and
// OpenAI over WebRTC. The server only mints a short-lived key with the
// interviewer's brief baked in, so the OpenAI key never reaches the page.
const MODEL = "gpt-realtime-2.1";

const VOICE_RULES = `This is a live voice conversation.
- When you move to a new thread from the list, call show_work with its number in the same response as you start talking about it, so it appears on screen while you speak. Don't wait for show_work before speaking.
- Never read code, file paths, hashes or URLs aloud. Say what the change does in plain words.
- If the conversation hasn't started, say hi in a few words and ask your first question about the first thread, in your own words.
- Every turn ends with your question (or, at the end, the goodbye). Never stop at "let's talk about" or "I can explain"; say the thing.
- Let silences be. Don't fill them, and don't talk over someone who's thinking.
- If they say they're done, thank them in one sentence and tell them to press "Find my ideas".`;

export async function voiceSession(env: Env, s: Session): Promise<{ key: string; model: string }> {
  const agenda: Question[] = s.questions ?? [];
  // Before they've said anything, the opening question on screen is replaced by the live hello.
  const answered = (s.turns ?? []).some((t) => t.who === "you");
  const sofar = !answered ? "" : (s.turns ?? []).map((t) => `${t.who === "you" ? "THEM" : "YOU"}: ${t.text}`).join("\n");
  const instructions = [
    CONVERSE,
    VOICE_RULES,
    `Context:\n${s.brief ?? ""}`,
    `Threads you might get to (numbered):\n${agendaBrief(agenda)}`,
    sofar ? `The conversation so far (pick up where it left off, don't repeat it):\n${sofar}` : "",
    // Last, because the realtime model weighs the end of its instructions most.
    `Every turn: first, one short reflection of ten words or fewer, warm but not gushing (mirror their phrase, name the feeling, or note what it took). Then ONE open question about ONE thing. Never "I love that", "such a", "vivid" or "lovely". Never join two questions with "and" or offer examples to pick from. If their last answer was a word or two, reassure them in a few words and ask about something new and easy.`,
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
            turn_detection: { type: "semantic_vad", eagerness: "medium" },
          },
          output: { voice: env.REALTIME_VOICE || "marin" },
        },
        tools: [
          {
            type: "function",
            name: "show_work",
            description: "Silently puts the thread you're asking about on their screen (the pull request, commit, issue or post). It returns nothing and needs no comment: call it and ask your question in the same response. Never mention it.",
            parameters: {
              type: "object",
              properties: { item: { type: "integer", description: "The thread's number from your list." } },
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
