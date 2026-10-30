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

// The interviewer's full brief for a live voice session: who it is, the
// rules for talking out loud, what it knows, and where the conversation is.
function liveInstructions(s: Session, rules: string): string {
  const agenda: Question[] = s.questions ?? [];
  // Before they've said anything, the opening question on screen is replaced by the live hello.
  const answered = (s.turns ?? []).some((t) => t.who === "you");
  const sofar = !answered ? "" : (s.turns ?? []).map((t) => `${t.who === "you" ? "THEM" : "YOU"}: ${t.text}`).join("\n");
  return [
    CONVERSE,
    rules,
    `Context:\n${s.brief ?? ""}`,
    `Threads you might get to (numbered):\n${agendaBrief(agenda)}`,
    sofar ? `The conversation so far (pick up where it left off, don't repeat it):\n${sofar}` : "",
    // Last, because the realtime model weighs the end of its instructions most.
    `Every turn: first, one short reflection of ten words or fewer, warm but not gushing (mirror their phrase, name the feeling, or note what it took). Then ONE open question about ONE thing. Never "I love that", "such a", "vivid" or "lovely". Never join two questions with "and" or offer examples to pick from. If their last answer was a word or two, reassure them in a few words and ask about something new and easy. Once they've made a point, don't dig for an example: check lightly whether there's anything else on that, then move to a different thread. If they say next or move on, switch threads at once.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function voiceSession(env: Env, s: Session): Promise<{ key: string; model: string }> {
  const agenda: Question[] = s.questions ?? [];
  const instructions = liveInstructions(s, VOICE_RULES);
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

// GPT-Live: OpenAI's full-duplex voice model, which listens while it talks and
// backchannels like a person. The browser sends its WebRTC offer here and the
// Worker opens the session with the real key, so the key never leaves the server.
const LIVE_MODEL = "gpt-live-1";

const LIVE_RULES = `This is a live voice conversation, full duplex: you can hear them while you talk.
- Small sounds of listening while they speak ("mm", "yeah") are welcome. Don't talk over a real answer.
- Never read code, file paths, hashes or URLs aloud. Say what the change does in plain words.
- If the conversation hasn't started, say hi in a few words and ask your first question about the first thread, in your own words.
- Every turn ends with your question (or, at the end, the goodbye).
- Let silences be. Someone who's thinking needs a moment.
- If they say they're done, thank them in one sentence and tell them to press "Find my ideas".`;

export function liveOpening(s: Session): string {
  const answered = (s.turns ?? []).some((t) => t.who === "you");
  return answered
    ? "Speak first, in English: welcome them back in a few words and pick up where you left off with one question. Then listen."
    : "Speak first, in English: say hi in a few words and ask your first question about the first thread, in your own words. Then listen.";
}

export async function gptLiveSession(env: Env, s: Session, sdp: string): Promise<{ sdp: string; model: string; opening: string }> {
  const model = env.LIVE_MODEL || LIVE_MODEL;
  const res = await fetch("https://api.openai.com/v1/live/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey(env)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      session: {
        model,
        instructions: liveInstructions(s, LIVE_RULES),
        // GPT-Live waits for the caller unless told to open; OpenAI's advice is a developer
        // message here plus the same words via session.commentary.append once it starts.
        input: [{ type: "message", role: "developer", content: [{ type: "input_text", text: liveOpening(s) }] }],
        audio: { output: { voice: env.REALTIME_VOICE || "marin" } },
      },
      transport: { type: "webrtc", sdp },
    }),
  });
  if (!res.ok) throw new Error(`gpt-live ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { transport?: { sdp?: string } };
  if (!json.transport?.sdp) throw new Error("gpt-live: no SDP answer");
  return { sdp: json.transport.sdp, model, opening: liveOpening(s) };
}
