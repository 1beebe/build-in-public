import type { Env } from "./env";
import type { Tag } from "./buffer";
import type { Draft, Question, Turn } from "./session";
import { randomToken } from "./crypto";
import { complete, hasModel } from "./interview";

// The live interviewer, built on qualitative interviewing and coaching
// practice: rapport, open descriptive questions, reflective listening, probes,
// and room to stay quiet.
export const CONVERSE = `You're The Interviewer: a warm, sharp friend who also builds things, catching up with someone about their week so they find the stories worth telling. You interview the way a skilled qualitative researcher or coach does. You know what they shipped and what they've posted lately; below is a rough list of threads you might get to, not a script.

How you work:
- Build comfort first. Open easy and broad, then go deeper as they warm up. Be genuinely glad to hear from them.
- Listen, then reflect. Before most questions, show you heard them: mirror a word or phrase they used, name the feeling you hear, or briefly affirm what took effort or courage ("That's a big promise to make." "Sounds like that stung."). Keep it short, sincere and specific to what they said, and vary it; never a generic compliment.
- Ask open, descriptive questions that invite a story: "Tell me about...", "Walk me through...", "What was that like?", "What happened next?" Prefer "what" and "how" to "why"; when you need a reason, ask "What led you to...?" so it never sounds like a challenge.
- One question at a time, about one thing. Never stack two questions or offer a menu of answers. Never lead them toward an answer.
- Know when you have enough. You're collecting kernels, not finished stories: once an answer holds a clear point, moment, feeling or opinion they could build a post on, that thread is done. Reflect it back and move to a different thread. Ask at most one follow-up per thread, and only when something new and alive came up; never dig for an example or a specific moment once they've made the point, since they'll develop it later. Follow anything they bring up that you didn't ask about; that's usually the best story.
- If they say "next", "move on", "that's enough" or anything like it, go straight to a different thread with a short bridge. No follow-up.
- Use their language, not yours. Stay curious and non-judgmental; there are no wrong answers.
- Respect short answers. If they say little or "I don't know", reassure them lightly and move to something easier or different. Never push the same question twice.
- Leave room. Short turns, a sentence or two. Let them do most of the talking.
- They likely built with AI agents, so focus on why, for whom, and what it meant, not how the code works. If they ask what a change does, tell them in a sentence, then ask your question.
- Talk like a person: plain words, no dashes (you may be spoken aloud). Change topics with a short, natural bridge.

Never write or suggest wording for their posts, and never mention your list. When it feels like you've got the good stuff, ask if there's anything else on their mind, thank them warmly, and let them pull their ideas together.`;

export function agendaBrief(agenda: Question[]): string {
  return agenda.map((q, i) => `${i + 1}. ${q.source} (a starting question: ${q.text})`).join("\n");
}

const transcript = (turns: Turn[]) =>
  turns.map((t) => `${t.who === "you" ? "THEM" : "YOU"}: ${t.text}`).join("\n");

export function opening(agenda: Question[]): Turn {
  return { who: "interviewer", text: agenda[0]?.text ?? "What did you work on this week?", about: agenda.length ? 0 : undefined };
}

// The interviewer's next turn in typed mode.
export async function reply(env: Env, agenda: Question[], turns: Turn[], context: string): Promise<Turn & { wrapUp?: boolean }> {
  if (hasModel(env)) {
    try {
      const text = await complete(
        env,
        CONVERSE,
        `${context}\n\nThreads you might get to (numbered):\n${agendaBrief(agenda)}\n\nConversation so far:\n${transcript(turns)}\n\nWrite your next turn. Reply with JSON only: {"say": "...", "about": <number of the thread this turn is about, or 0>, "wrapUp": <true if you're asking whether there's anything else before wrapping up>}`,
      );
      const out = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { say: string; about?: number; wrapUp?: boolean };
      if (out.say?.trim()) {
        const about = out.about && out.about > 0 && out.about <= agenda.length ? out.about - 1 : lastAbout(turns);
        return { who: "interviewer", text: out.say.trim(), about, wrapUp: Boolean(out.wrapUp) };
      }
    } catch (err) {
      console.error("interviewer reply failed, using the agenda", err);
    }
  }
  // Without a model: work through the agenda in order.
  const asked = new Set(turns.filter((t) => t.who === "interviewer").map((t) => t.about));
  const next = agenda.findIndex((_, i) => !asked.has(i));
  if (next === -1) {
    return { who: "interviewer", text: "That's everything I had. Anything else on your mind? When you're ready, I'll pull your ideas together.", wrapUp: true };
  }
  return { who: "interviewer", text: agenda[next].text, about: next };
}

function lastAbout(turns: Turn[]): number | undefined {
  for (let i = turns.length - 1; i >= 0; i--) if (turns[i].about !== undefined) return turns[i].about;
  return undefined;
}

// Their lines, split into numbered sentences, so the model can point at
// sentences instead of copying them. The Idea text is rebuilt from the
// originals, so it's always exactly what they said.
interface Sentence { id: number; turn: number; text: string }

function sentences(turns: Turn[]): Sentence[] {
  const out: Sentence[] = [];
  turns.forEach((t, turn) => {
    if (t.who !== "you") return;
    for (const m of t.text.matchAll(/[^.!?\n]+(?:[.!?]+["'”’)\]]*|$)/g)) {
      const text = m[0].trim();
      if (text) out.push({ id: out.length + 1, turn, text });
    }
  });
  return out;
}

// Their sentences grouped by answer, each under the question that drew it
// out, so the Idea still makes sense when they find it weeks later.
function withQuestions(picked: Sentence[], turns: Turn[]): string {
  const chunks: string[] = [];
  let turn = -1, lastQ = "";
  for (const x of picked) {
    if (x.turn !== turn) {
      const asked = turns.slice(0, x.turn).reverse().find((t) => t.who === "interviewer");
      const q = asked ? questionOnly(asked.text) : "";
      if (q && q === lastQ) chunks[chunks.length - 1] += ` ${x.text}`;
      else chunks.push(`${q ? `Q: ${q}\n\n` : ""}YOUR ANSWER:\n${x.text}`);
      lastQ = q;
      turn = x.turn;
    } else {
      chunks[chunks.length - 1] += ` ${x.text}`;
    }
  }
  return chunks.join("\n\n");
}

// Their thought pulled into one paragraph, with the exact sentences it came
// from underneath. The paragraph has to be built from their words: if too
// many of its words never came out of their mouth, it's the model talking,
// so we fall back to the verbatim answers.
const SMALL = new Set("a an the and or but so because then that this it its i i'm i've me my we our you your to of in on for with at by as is was are were be been do did not just".split(" "));
const words = (t: string) => (t.toLowerCase().match(/[a-z0-9']+/g) ?? []).map((w) => w.replace(/'s$/, ""));
export function organized(idea: string, picked: Sentence[]): string | undefined {
  idea = idea.trim().replace(/\s*[—–]\s*/g, ", ");
  if (idea.length < 40) return undefined;
  const theirs = new Set(words(picked.map((x) => x.text).join(" ")));
  const content = words(idea).filter((w) => !SMALL.has(w));
  const borrowed = content.filter((w) => theirs.has(w) || theirs.has(w.replace(/s$/, "")) || theirs.has(w + "s")).length;
  if (!content.length || borrowed / content.length < 0.8) return undefined;
  const said: string[] = [];
  let turn = -1;
  for (const x of picked) {
    if (x.turn !== turn) { said.push(x.text); turn = x.turn; } else said[said.length - 1] += ` ${x.text}`;
  }
  return `${idea}\n\nWHAT YOU SAID\n${said.map((q) => `"${q}"`).join("\n")}`;
}

// The interviewer's question without the quick reaction in front of it
// ("Huh, two days."), so the saved Idea reads cleanly.
function questionOnly(text: string): string {
  // An explanation, then a blank line, then the question: keep the question.
  text = text.split(/\n\s*\n/).filter((p) => p.includes("?")).pop() ?? text;
  const parts = text.match(/[^.!?\n]+[.!?]*/g)?.map((p) => p.trim()).filter(Boolean) ?? [text];
  while (parts.length > 1 && !parts[0].includes("?") && parts[0].split(/\s+/).length <= 8) parts.shift();
  return parts.join(" ");
}

// A JSON array from a model reply. If the reply was cut off mid-array, keep
// the complete objects rather than losing all of them.
function parseArray(text: string): unknown[] {
  const start = text.indexOf("[");
  if (start === -1) throw new Error("no JSON array in reply");
  try {
    return JSON.parse(text.slice(start, text.lastIndexOf("]") + 1));
  } catch {
    const cut = text.lastIndexOf("}");
    return JSON.parse(text.slice(start, cut + 1) + "]");
  }
}

const HARVEST = `You turn an interview into post ideas for the person who was interviewed. You never write post copy, hooks or anything they didn't say.

An idea is something they could post about: a story, a decision, a lesson, a surprise, an opinion, a before-and-after. Group sentences from anywhere in the conversation that belong to the same thread. Prefer fewer, richer ideas: one to five.

Leave out non-answers: confusion, "I don't know", requests to the interviewer, filler, and anything that only makes sense next to the question.

Titles name the angle in plain words, under ten words, not a question and not clickbait. For example: "The week I stopped polishing and shipped".

First read the whole conversation and notice the bigger story running through it: what this week says about how they build, who they're building for, or what they're learning. Ideas and questions should connect to that, not just restate events.

For each idea, also write "idea": their thought pulled together into one coherent paragraph of three to six sentences, in first person, as if they'd said it cleanly in one go. Build it from their own words and phrases: keep their vocabulary, images and opinions, and the way they talk. You may drop filler, false starts and repeats, join pieces said at different moments, reorder for sense, and add the few small connecting words needed ("so", "and", "because"). Never add a claim, detail, feeling, metaphor or polish they didn't give you, and never make it sound like marketing. It's their notes, organized, not a post.

For each idea, write three questions to develop it, the way a sharp editor who knows them would. Each one:
- is short, under 15 words;
- grabs a specific detail they said (a person, a moment, a feeling, a number) and names it;
- does a different job: find the scene, name the tension or choice, pick up an unfinished thread, or turn it toward the reader they write for.
Never generic, never the same shape twice, questions only, never wording, hooks or openings.

The style to match (from a different interview; never copy these):
- "What does one line in the log look like, and what would that video's line have said?"
- "Proud and worried: which one wins most weeks?"
- "Did you ever go back and answer that person? What would you say now?"
- "Is being the bottleneck a problem to fix, or the point of having a human in the loop?"
- "What's the simplest version a non-technical reader could copy tomorrow?"`;

// Used when the model can't help: still gives them somewhere to start.
const DEFAULT_PROMPTS = [
  "Who most needs to hear this, and what are they stuck on?",
  "If a reader remembers one thing from this, what should it be?",
  "What could you show next to it: a screenshot, a before and after, a number?",
];

// Turn the conversation into proposed Ideas: the model picks the angles and
// which of their sentences carry each one.
export async function harvest(env: Env, agenda: Question[], turns: Turn[], pillars: Tag[], posts: string[] = []): Promise<Draft[]> {
  const all = sentences(turns);
  const pillarIds = new Set(pillars.map((p) => p.id));
  let drafts: Draft[] = [];

  if (hasModel(env) && all.length) {
    try {
      const lines = turns
        .map((t, i) =>
          t.who === "you"
            ? all.filter((x) => x.turn === i).map((x) => `  [S${x.id}] ${x.text}`).join("\n")
            : `INTERVIEWER: ${t.text}`,
        )
        .join("\n");
      const text = await complete(
        env,
        HARVEST,
        `${posts.length ? `Their recent posts, newest first, to see who they are, who they write for and what they've already said (questions should point somewhere new):\n${posts.map((p) => `- ${p}`).join("\n")}\n\n` : ""}Their content pillars: ${pillars.map((p) => `${p.name} (id ${p.id})`).join(", ")}\n\nInterview (their sentences are numbered):\n${lines}\n\nReply with JSON only, strongest idea first: [{"title": "...", "sentences": [numbers of their sentences, in order], "idea": "their words, organized", "pillar": "<pillar id>", "prompts": ["question", "question"]}]. A sentence belongs to at most one idea. Give each idea the pillar its angle fits best, judging by the pillar names: a story about people, feelings or how it was to build fits a different pillar than a technical decision. Don't put everything in one pillar unless it truly all fits there.`,
        60_000,
        4000,
        true,
      );
      const parsed = parseArray(text) as { title: string; sentences: number[]; idea?: string; pillar?: string; prompts?: string[] }[];
      const used = new Set<number>();
      for (const d of parsed.slice(0, 5)) {
        const ids = [...new Set((d.sentences ?? []).map(Number))].filter((n) => !used.has(n)).sort((x, y) => x - y);
        const picked = ids.map((n) => all[n - 1]).filter(Boolean);
        const title = String(d.title ?? "").trim().replace(/^["']|["']$/g, "").slice(0, 120);
        if (!title || !picked.length) continue;
        ids.forEach((n) => used.add(n));
        const prompts = (d.prompts ?? []).map((q) => String(q).trim()).filter((q) => q.endsWith("?") && q.length < 200).slice(0, 3);
        drafts.push({
          id: randomToken(6),
          title,
          text: organized(String(d.idea ?? ""), picked) ?? withQuestions(picked, turns),
          prompts: prompts.length ? prompts : DEFAULT_PROMPTS,
          tagId: pillarIds.has(d.pillar ?? "") ? d.pillar : pillars[0]?.id,
        });
      }
    } catch (err) {
      console.error("harvest failed, grouping by topic", err);
    }
  }

  // Without a model, or if nothing usable came back: one Idea per topic they
  // talked about, from their substantial answers.
  if (!drafts.length) {
    const byTopic = new Map<string, { title: string; parts: Sentence[] }>();
    let topic = "", title = "";
    turns.forEach((t, i) => {
      if (t.who === "interviewer") {
        const key = t.about !== undefined ? `a${t.about}` : topic || "general";
        if (key !== topic || !title) title = t.about !== undefined ? (agenda[t.about]?.source ?? t.text) : t.text;
        topic = key;
        return;
      }
      if (t.text.trim().length < 40 || /\?\s*$/.test(t.text)) return; // non-answers and questions back
      const group = byTopic.get(topic) ?? { title, parts: [] };
      group.parts.push(...all.filter((x) => x.turn === i));
      byTopic.set(topic, group);
    });
    drafts = [...byTopic.values()].map((g) => ({
      id: randomToken(6),
      title: g.title.replace(/^(Merged PR|Closed issue|Commit): /, "").slice(0, 120),
      text: withQuestions(g.parts, turns),
      prompts: DEFAULT_PROMPTS,
      tagId: pillars[0]?.id,
    }));
  }

  // Agenda topics they never got to, saved for later if they want them.
  const covered = new Set(turns.map((t) => t.about));
  for (const [i, q] of agenda.entries()) {
    if (covered.has(i)) continue;
    drafts.push({
      id: randomToken(6),
      title: q.text,
      text: `Saved by The Interviewer to answer later. About: ${q.source}${q.sourceUrl ? ` (${q.sourceUrl})` : ""}`,
      tagId: pillars[0]?.id,
      later: true,
    });
  }
  return drafts;
}
