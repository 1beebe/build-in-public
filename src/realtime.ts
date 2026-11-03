import type { Env } from "./env";
import type { Question, Session } from "./session";
import { agendaBrief, converseFor } from "./conversation";
import { SpendCapError, isSpendCap } from "./spend";

// The interviewer's full brief for a live voice session: who it is, the
// rules for talking out loud, what it knows, and where the conversation is.
function liveInstructions(s: Session, rules: string): string {
  const agenda: Question[] = s.questions ?? [];
  // Before they've said anything, the opening question on screen is replaced by the live hello.
  const answered = (s.turns ?? []).some((t) => t.who === "you");
  const sofar = !answered ? "" : (s.turns ?? []).map((t) => `${t.who === "you" ? "THEM" : "YOU"}: ${t.text}`).join("\n");
  return [
    converseFor(s.longform),
    rules,
    `Context:\n${s.brief ?? ""}`,
    `Threads you might get to (numbered):\n${agendaBrief(agenda)}`,
    sofar ? `The conversation so far (pick up where it left off, don't repeat it):\n${sofar}` : "",
    // Last, because the realtime model weighs the end of its instructions most.
    s.longform
      ? `Every turn: first, one short reflection of ten words or fewer, warm but not gushing. Then ONE open question about ONE thing. Never join two questions with "and" or offer examples to pick from. This is one longer piece: stay on its topic, go deeper with up to three or four follow-ups, ask for a concrete example or scene, and once ask what someone who disagrees would say. If they say next or move on, go to another part of the piece at once.`
      : `Every turn: first, one short reflection of ten words or fewer, warm but not gushing (mirror their phrase or name the point they made; never name a feeling they didn't name, and never sound like a therapist). Then ONE open question about ONE thing. Never "I love that", "such a", "vivid" or "lovely". Never join two questions with "and" or offer examples to pick from. If their last answer was a word or two, reassure them in a few words and ask about something new and easy. If an answer is vague with no point yet, ask one easy, concrete question to find it (what someone said, the moment, a before and after, who it was for). Once they've made a point, don't dig for an example: check lightly whether there's anything else on that, then move to a different thread. If they say next or move on, switch threads at once. When the threads run out before you have three different stories, widen out: what else they worked on, what it connects to, who it's for, what's next.`,
  ]
    .filter(Boolean)
    .join("\n\n");
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
- You have no tools and can't look anything up, open their repo or check anything during the call. Never say "let me take a look", "one sec" or "let me check": everything you know is already in your context below. If they ask whether you can see their repo, say yes and tell them what you know about it in a sentence, then ask your question.
- Never say "let me think", "hmm, let me think that through" or anything that announces thinking and then stops. If they ask what you'd ask them, or what you know, answer in that same turn with a real question.
- Let silences be. Someone who's thinking needs a moment.
- If you didn't catch what they said (it cut off, went silent, or was garbled), say so plainly and ask them to say it again. Never pretend you heard, and never guess what they meant.
- If they say they're done, thank them in one sentence and tell them to press "I'm done. Find my stories". Say "see you next time", never "next week".`;

export function liveOpening(s: Session): string {
  const answered = (s.turns ?? []).some((t) => t.who === "you");
  return answered
    ? "Speak first, in English: welcome them back in a few words and pick up where you left off with one question. Then listen."
    : s.longform
      ? "Speak first, in English: say hi in a few words, mention one specific thing you noticed in their recent posts or work, and ask whether the piece they want to write is about that or something else. Then listen."
      : s.weekNote && !s.repo
        ? "Speak first, in English: say hi in a few words, then open on what they said they want to talk about in their setup note (in your own words, never quoting it), and ask your first question about it. Then listen."
        : "Speak first, in English: say hi in a few words, show you've looked at their week by naming one specific thing they shipped or posted in plain words, and ask your first question about it. Then listen.";
}

/** The voice provider refused or failed to open a session. */
export class VoiceError extends Error {}

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
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    if (isSpendCap(res.status, body)) throw new SpendCapError(body);
    throw new VoiceError(`gpt-live ${res.status}: ${body}`);
  }
  const json = (await res.json()) as { transport?: { sdp?: string } };
  if (!json.transport?.sdp) throw new VoiceError("gpt-live: no SDP answer");
  return { sdp: json.transport.sdp, model, opening: liveOpening(s) };
}
