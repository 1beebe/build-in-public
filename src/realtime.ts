import type { Env } from "./env";
import type { Question, Session } from "./session";
import { agendaBrief, converseFor } from "./conversation";
import { SpendCapError, isSpendCap } from "./spend";

// The interviewer's full brief for a live voice session: who it is, the
// rules for talking out loud, what it knows, and where the conversation is.
// v2: the voice rules and end reminder, cut to what voice actually needs on top of CONVERSE_V2.
const LIVE_RULES_V2 = `Speaking style: warm, relaxed and curious, in short spoken sentences with contractions. One question per turn, then stop and listen.

Backchannel policy: use light, natural listening cues ("mm", "yeah") while they talk. Don't compete with their answer.

Interruption policy: they keep the floor through your cues and their thinking pauses. Let silences be. If they interrupt, stop and listen. If they open with "can you hear me?", say yes in a few words and carry on. If you didn't catch something, say so and ask them to say it again; never guess.

Delegation policy: there is no backend and nothing to look up; everything you know is in these instructions. Do not generate <|SpawnThinking|>. Never say you need a second, are thinking, or will take a look: answer every turn yourself, right away.

Never read code, file paths or links aloud. Every turn ends with your question, or at the end, the goodbye.`;
const END_V2 = `Every turn: a few warm words that pick up their point, then one short, open question about one thing. If they're stuck or say there's nothing there, try one other angle, then move to another thread and name it. If the app tells you to switch threads, do it on your next turn.`;

function liveInstructions(s: Session, rules: string): string {
  const agenda: Question[] = s.questions ?? [];
  // Before they've said anything, the opening question on screen is replaced by the live hello.
  const answered = (s.turns ?? []).some((t) => t.who === "you");
  const sofar = !answered ? "" : (s.turns ?? []).map((t) => `${t.who === "you" ? "THEM" : "YOU"}: ${t.text}`).join("\n");
  const v2 = s.promptV === 2;
  return [
    converseFor(s.longform, v2),
    v2 ? LIVE_RULES_V2 : rules,
    `Context:\n${s.brief ?? ""}`,
    `Threads you might get to (numbered):\n${agendaBrief(agenda)}`,
    sofar ? `The conversation so far (pick up where it left off, don't repeat it):\n${sofar}` : "",
    // Last, because the realtime model weighs the end of its instructions most.
    v2 && !s.longform
      ? END_V2
      : s.longform
      ? `Every turn: first, one short reflection of ten words or fewer, warm but not gushing. Then ONE open question about ONE thing. Never join two questions with "and" or offer examples to pick from. This is one longer piece: stay on its topic, go deeper with up to three or four follow-ups, ask for a concrete example or scene, and once ask what someone who disagrees would say. If they say next or move on, go to another part of the piece at once.`
      : `Every turn: start with their own word or point, never with filler like "Hmm", "Yeah" or "So": a few warm words that pick up their actual point or exact word (a specific, earned compliment is fine now and then; never generic praise like "I love that", "I like that", "good advice" or "makes sense", and no long recaps; an echo of their words needs no verdict after it), then ONE short, open question about ONE thing (never two joined by "and"). Go deep on one thread: the moment, what it meant, then zoom out ("what does that tell you about...?") and ask for one concrete example. Once per interview ask the honest question they might rather skip. Now and then offer a frame they can push against. After a short or negative answer, don't reassure ("fair enough", "no worries"): echo it in a word or two and ask a smaller version of the same question; they often correct themselves. Stay while new details keep coming; move on when they name the lesson or their answers get short. Ask what happened, what they did, what someone said; never ask about their inner state on its own ("what was it like", "what did you notice in yourself", "what do you feel you learned") unless it is tied to one specific scene they just described. You are collecting stories, not coaching: never ask what they could change, test or plan next. You have done your homework: open on one specific thing they shipped or posted, named in plain words, and if they ask about their repo or commits, name one specific change from your context and ask about the moment behind it. Close on a concrete example or what they'd tell someone starting out. If they say next or move on, switch threads at once; if they steer ("ask me about X", "let's switch to Y"), go there at once. Never hand off a turn or say you need a second.`,
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
- Never delegate or hand a turn off. There is no backend and nothing to wait for: you already have everything, so answer every turn yourself, right away.
- If they ask why you're asking, or whether this will help their post, answer straight in one or two sentences: what the question is for in the post (the angle, the example, the line people will remember), then ask a sharper question. If the question didn't fit, say so and change course.
- Show you heard them in a few words that pick up their actual point or exact word, never a generic "that makes sense" or "I hear where you're going".
- Let silences be. Someone who's thinking needs a moment.
- Many people open a voice call with "can you hear me?" or "hello?" to check it works. Answer "Yes, I can hear you" in a few words, then carry on with your opening or your last question. It is a line check, never an answer to react to.
- If you didn't catch what they said (it cut off, went silent, or was garbled), say so plainly and ask them to say it again. Never pretend you heard, and never guess what they meant.
- If they say they're done, thank them in one sentence and tell them to press "I'm done. Find my stories". Say "see you next time", never "next week".`;

export function liveOpening(s: Session): string {
  const answered = (s.turns ?? []).some((t) => t.who === "you");
  return answered
    ? "Speak first, in English: welcome them back in a few words and pick up where you left off with one question. Then listen."
    : s.longform
      ? "Speak first, in English: say hi in a few words, mention one specific thing you noticed in their recent posts or work, and ask whether the piece they want to write is about that or something else. Then listen."
      : s.weekNote && !s.repo
        ? "Speak first, in English: say hi in a few words, then open on what they said they want to talk about in their setup note (in your own words, never quoting it), and ask your first question about it. Before that question, add one short line close to: The more you say, the better this works. Steer me anytime. Then listen."
        : "Speak first, in English: say hi in a few words, show you've looked at their repo by naming one specific thing they shipped in it, in plain words, and ask your first question about the moment behind it. Their repo is what they came to talk about. Before that question, add one short line close to: The more you say, the better this works. Steer me anytime. Then listen.";
}

/** The voice provider refused or failed to open a session. */
export class VoiceError extends Error {}

export async function gptLiveSession(env: Env, s: Session, sdp: string): Promise<{ sdp: string; model: string; opening: string; degraded?: string }> {
  const model = env.LIVE_MODEL || LIVE_MODEL;
  const open = (delegation: boolean) => fetch("https://api.openai.com/v1/live/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey(env)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      session: {
        model,
        instructions: liveInstructions(s, LIVE_RULES),
        // If it does hand a turn to the page anyway, wait before any automatic "give me a second"
        // filler; the page answers a delegation at once, which cancels the filler. 800 is
        // OpenAI's maximum (the default is 0: filler right away).
        ...(delegation ? { delegation: { type: "client", acknowledgement_delay_ms: 800 } } : {}),
        // GPT-Live waits for the caller unless told to open; OpenAI's advice is a developer
        // message here plus the same words via session.commentary.append once it starts.
        input: [{ type: "message", role: "developer", content: [{ type: "input_text", text: liveOpening(s) }] }],
        audio: { output: { voice: env.REALTIME_VOICE || "marin" } },
      },
      transport: { type: "webrtc", sdp },
    }),
  });
  let res = await open(true);
  let degraded: string | undefined;
  // If OpenAI ever refuses the delegation setting, open the session without it rather than
  // fail, but say so in the run log too: without it, stalls go to OpenAI's own filler and the
  // page's rescue never runs, so a quiet fallback here hid a broken fix for days.
  if (res.status === 400) {
    const why = await res.clone().text();
    if (/delegation|acknowledgement/i.test(why)) {
      console.error("gpt-live refused delegation config", why.slice(0, 300));
      degraded = "voice opened WITHOUT the no-stall setting (OpenAI refused it)";
      res = await open(false);
    }
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    if (isSpendCap(res.status, body)) throw new SpendCapError(body);
    throw new VoiceError(`gpt-live ${res.status}: ${body}`);
  }
  const json = (await res.json()) as { transport?: { sdp?: string } };
  if (!json.transport?.sdp) throw new VoiceError("gpt-live: no SDP answer");
  return { sdp: json.transport.sdp, model, opening: liveOpening(s), degraded };
}
