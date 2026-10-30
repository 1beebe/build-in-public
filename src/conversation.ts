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

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

// Turn the conversation into proposed Ideas. The model chooses the angles and
// which of their sentences belong together; the text is only ever their own
// words, and any quote that isn't found word for word in what they said is dropped.
export async function harvest(env: Env, agenda: Question[], turns: Turn[], pillars: Tag[]): Promise<Draft[]> {
  const theirs = turns.filter((t) => t.who === "you" && t.text.trim());
  const said = theirs.map((t) => norm(t.text));
  const pillarIds = new Set(pillars.map((p) => p.id));
  let drafts: Draft[] = [];

  if (hasModel(env) && theirs.length) {
    try {
      const text = await complete(
        env,
        `You turn an interview into post ideas for the person who was interviewed. You never write post copy. For each idea you write a short title naming the angle (under 12 words, plain, not clickbait), and you pick the exact sentences they said that carry it.`,
        `Their content pillars: ${pillars.map((p) => `${p.name} (id ${p.id})`).join(", ")}\n\nInterview:\n${transcript(turns)}\n\nPropose one idea per distinct thread they opened, strongest first: as few as 1, at most 6. Never use the same sentence in two ideas. Reply with JSON only: [{"title": "...", "quotes": ["exact sentences copied character for character from THEM lines"], "pillar": "<pillar id>"}]`,
      );
      const parsed = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)) as { title: string; quotes: string[]; pillar?: string }[];
      drafts = parsed
        .map((d) => ({
          title: String(d.title ?? "").trim().slice(0, 120),
          quotes: (d.quotes ?? []).map((q) => String(q).trim()).filter((q) => q && said.some((s) => s.includes(norm(q)))),
          pillar: d.pillar,
        }))
        .filter((d) => d.title && d.quotes.length)
        // Belt and braces: an idea whose words are all already used elsewhere is a duplicate.
        .filter(function (this: Set<string>, d) {
          const fresh = d.quotes.filter((q) => !this.has(norm(q)));
          d.quotes.forEach((q) => this.add(norm(q)));
          return fresh.length > 0;
        }, new Set<string>())
        .slice(0, 6)
        .map((d) => ({ id: randomToken(6), title: d.title, text: d.quotes.join("\n\n"), tagId: pillarIds.has(d.pillar ?? "") ? d.pillar : pillars[0]?.id }));
    } catch (err) {
      console.error("harvest failed, using one idea per answer", err);
    }
  }

  // Without a model, or if nothing usable came back: one Idea per answer,
  // titled by the question that drew it out.
  if (!drafts.length) {
    drafts = turns.flatMap((t, i) => {
      if (t.who !== "you" || t.text.trim().length < 20) return [];
      const asked = turns.slice(0, i).reverse().find((x) => x.who === "interviewer");
      return [{ id: randomToken(6), title: (asked?.text ?? "From your interview").slice(0, 120), text: t.text.trim(), tagId: pillars[0]?.id }];
    });
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
