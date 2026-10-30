import type { Env } from "./env";
import type { Tag } from "./buffer";
import type { Draft, Question, Turn } from "./session";
import { randomToken } from "./crypto";
import { complete, hasModel } from "./interview";

// The live interviewer: short turns, pulls threads, moves through the agenda.
export const CONVERSE = `You are The Interviewer, talking live with someone about what they built this week, so they end up with their own words to post from.

How you talk:
- Like a curious friend who also builds things. Short, plain, warm. Under 40 words a turn.
- Each turn: at most a few words that show you heard them, using their words (no praise, no summarizing their work back to them), then exactly one question.
- Pull the thread they just opened before moving on: a reason, a surprise, a person, a decision, something that broke.
- When a thread is done, move to the next agenda item and name it plainly.
- Many builders work with AI coding agents, so they may not have written every line. Ask about their decisions, what they were going for, what surprised them, who it's for and what they learned, not about implementation details.
- If they ask what a change does, explain it in a sentence from the context you have, then ask your question. Never say you can't see the repo.
- If they don't know, don't follow, or want to move on, move to the next item right away. Don't rephrase the same question.
- Never suggest wording for a post. Never lecture.
- After about six to eight of their answers, or when the agenda is covered, ask if there's anything else on their mind before you pull their ideas together.`;

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
        `${context}\n\nAgenda (numbered):\n${agendaBrief(agenda)}\n\nConversation so far:\n${transcript(turns)}\n\nWrite your next turn. Reply with JSON only: {"say": "...", "about": <agenda number this turn is about, or 0>, "wrapUp": <true if you're asking whether there's anything else before wrapping up>}`,
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

function joinSentences(picked: Sentence[]): string {
  let text = "";
  picked.forEach((x, i) => {
    text += i === 0 ? x.text : (x.turn === picked[i - 1].turn ? " " : "\n\n") + x.text;
  });
  return text;
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

const HARVEST = `You turn an interview into post ideas for the person who was interviewed. You never write post copy and never reword what they said.

An idea is something they could post about: a story, a decision, a lesson, a surprise, an opinion, a before-and-after. Group sentences from anywhere in the conversation that belong to the same thread. Prefer fewer, richer ideas: one to five.

Leave out non-answers: confusion, "I don't know", requests to the interviewer, filler, and anything that only makes sense next to the question.

Titles name the angle in plain words, under ten words, not a question and not clickbait. For example: "The week I stopped polishing and shipped".

For each idea, also write two or three short questions that will help them turn it into a post, specific to this idea: who most needs to hear it, the one thing a reader should take away, what they could show next to it (a screenshot, a before and after, a number), or what they'd tell someone about to try the same. Questions only. Never suggest wording, hooks or openings.`;

// Used when the model can't help: still gives them somewhere to start.
const DEFAULT_PROMPTS = [
  "Who most needs to hear this, and what are they stuck on?",
  "If a reader remembers one thing from this, what should it be?",
  "What could you show next to it: a screenshot, a before and after, a number?",
];

// Turn the conversation into proposed Ideas: the model picks the angles and
// which of their sentences carry each one.
export async function harvest(env: Env, agenda: Question[], turns: Turn[], pillars: Tag[]): Promise<Draft[]> {
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
        `Their content pillars: ${pillars.map((p) => `${p.name} (id ${p.id})`).join(", ")}\n\nInterview (their sentences are numbered):\n${lines}\n\nReply with JSON only, strongest idea first: [{"title": "...", "sentences": [numbers of their sentences, in order], "pillar": "<pillar id>", "prompts": ["question", "question"]}]. A sentence belongs to at most one idea. Give each idea the pillar its angle fits best, judging by the pillar names: a story about people, feelings or how it was to build fits a different pillar than a technical decision. Don't put everything in one pillar unless it truly all fits there.`,
        60_000,
        4000,
      );
      const parsed = parseArray(text) as { title: string; sentences: number[]; pillar?: string; prompts?: string[] }[];
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
          text: joinSentences(picked),
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
      text: joinSentences(g.parts),
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
