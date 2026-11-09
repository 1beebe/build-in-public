// The slop engine. No model, no API, no network: a seeded random walk through
// hand-written templates. AI slop is formulaic, so a formula can write it.
//
// generate() takes one mundane observation and returns a long post (LinkedIn,
// Facebook, Mastodon) and a short one (X, Bluesky, Threads), plus the list of
// tells it used, so the page can show its work.

export type Flavor = "chatgpt" | "claude" | "gemini" | "grok";

export const FLAVORS: Record<Flavor, { label: string; blurb: string }> = {
  chatgpt: { label: "ChatGPT-ish", blurb: "Em-dashes, delve, and a rocket for every occasion" },
  claude: { label: "Claude-ish", blurb: "Thoughtful, genuinely nuanced, absolutely right" },
  gemini: { label: "Gemini-ish", blurb: "Here's a breakdown, in bold, with Key Takeaways" },
  grok: { label: "Grok-ish", blurb: "Based, unhinged, maximally truth-seeking" },
};

export interface Slop {
  long: string;
  short: string;
  tells: string[];
}

// ---- Randomness you can replay: the same seed gives the same post. ----

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Dice {
  private used = new Set<string>();
  r: () => number;
  constructor(r: () => number) {
    this.r = r;
  }
  chance(p: number): boolean {
    return this.r() < p;
  }
  int(lo: number, hi: number): number {
    return lo + Math.floor(this.r() * (hi - lo + 1));
  }
  // One item, never the same string twice in a post when there's another choice.
  pick<T>(list: readonly T[]): T {
    const fresh = list.filter((x) => !this.used.has(String(x)));
    const from = fresh.length ? fresh : list;
    const out = from[Math.floor(this.r() * from.length)];
    this.used.add(String(out));
    return out;
  }
  some<T>(list: readonly T[], n: number): T[] {
    const out: T[] = [];
    for (let i = 0; i < n && i < list.length; i++) out.push(this.pick(list));
    return out;
  }
}

// ---- Reading the observation: no NLP, just enough to find "the thing". ----

const STOP = new Set(
  ("a an the my our your his her their its this that these those i me we us you he she it they them " +
    "is am are was were be been being have has had do did does doing done will would can could should " +
    "just really very so too also still even again today yesterday tonight morning afternoon evening week " +
    "and or but because when while during after before then than of in on at to for from with without into " +
    "about over under up down out off like as by not no yes got get gets getting went go goes going made make " +
    "some any every all one two first last new old little big bit lot kind sort thing things way time")
    .split(/\s+/),
);
const DETERMINERS = new Set(["my", "our", "the", "a", "an", "his", "her", "their", "your", "this", "that"]);

export interface Observation {
  text: string; // as typed, tidied: "my coffee went cold during standup"
  thing: string; // "coffee"
}

export function readObservation(raw: string): Observation {
  let text = raw.replace(/\s+/g, " ").trim().replace(/[.!?…]+$/, "");
  if (!text) text = "my coffee went cold during standup";
  if (text.length > 160) text = text.slice(0, 160).replace(/\s+\S*$/, "");
  // Lowercase the first letter so it reads mid-sentence, unless it's "I" or a name-like word.
  if (/^[A-Z][a-z]/.test(text) && !/^I\b/.test(text)) text = text[0].toLowerCase() + text.slice(1);
  const words = text.toLowerCase().replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean);
  let thing = "";
  // The noun right after "my", "the", "a"... is usually the star.
  for (let i = 0; i < words.length - 1; i++) {
    if (!DETERMINERS.has(words[i])) continue;
    // "the first try" → "try": step over a stop word or two to reach the noun.
    const next = words.slice(i + 1, i + 4).find((w) => !STOP.has(w) && w.length > 2);
    if (next) {
      thing = next;
      break;
    }
  }
  if (!thing) {
    const content = words.filter((w) => !STOP.has(w) && w.length > 2 && !/(ing|ed|ly)$/.test(w));
    thing = content.sort((a, b) => b.length - a.length)[0] ?? words.find((w) => !STOP.has(w)) ?? "moment";
  }
  thing = thing.replace(/'s$/, "");
  // One of a thing reads better in "It's not just a ___": plants → plant.
  if (/(ches|shes|xes)$/.test(thing)) thing = thing.slice(0, -2);
  else if (/[^su]s$/.test(thing) && thing.length > 3) thing = thing.slice(0, -1);
  return { text, thing };
}

const plural = (w: string) => (/(s|x|ch|sh)$/.test(w) ? w : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + "s");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// "I" stays "I"; "my coffee went cold" → "My coffee went cold".
const sentence = (s: string) => cap(s);
// Second-person version for advice lines: "my coffee" → "your coffee".
const yours = (s: string) =>
  s.replace(/\bmy\b/gi, "your").replace(/\bI'm\b/g, "you're").replace(/\bI\b/g, "you").replace(/\bme\b/gi, "you").replace(/\bmine\b/gi, "yours");

// ---- The shared B2B vocabulary ----

const TOPICS = [
  "product-led growth", "churn", "pipeline", "go-to-market", "customer success", "ARR", "the sales cycle",
  "onboarding", "leadership", "founder-market fit", "retention", "your ICP", "the B2B buyer journey",
  "stakeholder alignment", "net revenue retention", "category creation", "async culture", "demand gen",
  "the enterprise motion", "the mid-market", "your north star metric", "hiring A-players", "the flywheel",
];
const ROLES = [
  "founders", "CROs", "product leaders", "GTM teams", "high performers", "SDRs", "operators", "CMOs",
  "Series A CEOs", "solopreneurs", "RevOps leaders", "first-time managers",
];
const ABSTRACT = [
  "alignment", "intentionality", "trust", "systems thinking", "mindset", "showing up", "compounding",
  "ownership", "clarity", "process", "reps", "consistency", "positioning", "long-game thinking", "focus",
];
const TRIADS = [
  "Clarity. Consistency. Compounding.", "Listen. Learn. Lead.", "Build. Measure. Repeat.",
  "Show up. Ship. Scale.", "Fewer meetings. More meaning. Better margins.", "Hire slow. Fire fast. Pour coffee.",
  "Focus. Feedback. Flywheel.", "Trust the process. Own the outcome. Ignore the noise.",
];
const LESSONS = [
  "{Things} don't scale. Systems do.",
  "Your customers don't care about your {thing}. They care about outcomes.",
  "The best {role} treat every {thing} like a product launch.",
  "Speed is a feature. So is patience.",
  "If you're not embarrassed by your first {thing}, you shipped too late.",
  "Culture eats {topic} for breakfast.",
  "Small wins compound into big moats.",
  "{Abstract} is a strategy, not a vibe.",
  "Nobody remembers the {thing}. They remember how you made them feel.",
  "You can't A/B test your way out of a bad {thing}.",
  "The market rewards {abstract}, not perfection.",
  "Every {thing} is a feedback loop if you're paying attention.",
  "What got you here won't get you to {topic}.",
  "Done is better than perfect. Perfect is better than {thing}.",
  "Your {thing} is a lagging indicator. {Abstract} is a leading one.",
];
const HASHTAGS = [
  "#Leadership", "#B2B", "#SaaS", "#GrowthMindset", "#ThoughtLeadership", "#Startups", "#Founders",
  "#Innovation", "#FutureOfWork", "#Sales", "#ProductManagement", "#Mindset", "#Hustle", "#AI",
];

// ---- Wikipedia's "Signs of AI writing", as ingredients ----
// Each is [tell name, lines]. A post gets a few, dropped in between its beats.

const WIKI: [string, string[]][] = [
  ["Superficial “-ing” analysis", [
    "{Obs}, underscoring the enduring importance of {abstract} in {topic}.",
    "That moment stayed with me, highlighting the pivotal role of {abstract} in today's {topic} landscape.",
  ]],
  ["Undue symbolism", [
    "The {thing} stands as a testament to the power of {abstract}.",
    "In many ways, the {thing} is a symbol of everything {role} are fighting for.",
  ]],
  ["Didactic disclaimer", [
    "It's important to remember that every {topicBare} journey is different.",
    "It's worth noting that results may vary depending on your {thing}.",
  ]],
  ["“Challenges and future prospects”", [
    "Despite its challenges, the {thing} continues to inspire {role}, and its future in {topicBare} remains bright.",
    "While challenges remain, the future of {thing}-led growth looks promising.",
  ]],
  ["False range", [
    "From {things} to {topicBare}, from boardrooms to breakrooms, the lesson is the same.",
    "From the smallest {thing} to the largest enterprise deal, it all comes down to {abstract}.",
  ]],
  ["Vague attribution", [
    "Experts agree: {abstract} is the new {topicBare}.",
    "Industry observers have long noted the connection between {things} and {topicBare}.",
  ]],
  ["Elegant variation", [
    "The {thing}. That humble vessel. The unsung protagonist of my morning. The key player in this story.",
  ]],
  ["Outline of negatives", [
    "No roadmap. No OKRs. No playbook. Just a {thing}.",
    "Not a framework. Not a hack. Just {abstract}.",
  ]],
  ["Knowledge-cutoff disclaimer", [
    "(As of my last knowledge update, this remains true.)",
  ]],
  ["Unfilled placeholder", [
    "That's why at [Company Name], we believe [insert core value here].",
    "In fact, [insert relevant statistic] of {role} agree.",
  ]],
];

// Residue a copy-paste from each chatbot tends to leave behind.
const RESIDUE: Record<Flavor, string[]> = {
  chatgpt: [":contentReference[oaicite:0]{index=0}", "【turn0search0】"],
  claude: ["[Your Name]", "[Citation needed]"],
  gemini: ["[1]", "(utm_source=gemini)"],
  grok: ["[web:1]", "[grok_card]"],
};

const RESIDUE_TELL: Record<Flavor, string> = {
  chatgpt: "Leaked ChatGPT citation code",
  claude: "Unfilled placeholder left in",
  gemini: "Leaked source tag",
  grok: "Leaked Grok citation code",
};

// ---- What each flavor brings ----

interface FlavorKit {
  preambles: string[]; // the leaked "Sure! Here's a post" line
  hooks: string[];
  pivots: string[];
  beats: string[]; // one-line paragraphs
  listIntros: string[];
  bullet: (i: number, text: string, d: Dice) => string;
  closers: string[];
  postscripts: string[]; // the leaked "Want me to make it punchier?" line
  shortHooks: string[];
  shortTails: string[];
  tellNames: { preamble: string; postscript: string; bullets: string };
  finish: (text: string, d: Dice, tells: string[]) => string; // punctuation habits, applied last
}

const EMOJI_BULLETS = ["✅", "🚀", "💡", "🔑", "📈", "🎯", "⚡", "🧠"];

const KITS: Record<Flavor, FlavorKit> = {
  chatgpt: {
    preambles: [
      "Certainly! Here's a LinkedIn post about {qObs}:",
      "As an AI language model, I have never personally experienced {qObs}, but here's a LinkedIn post about it:",
      "Subject: What {TitleObs} Taught Me About {Topic}",
      "Sure! Here's an engaging, thought-leadership-style post based on your experience:",
      "Absolutely! Here's a polished post that turns {qObs} into a powerful business insight:",
    ],
    hooks: [
      "{Obs}.\n\nAnd it taught me more about {topic} than my MBA ever did.",
      "In today's fast-paced world of {topic}, {obs}.\n\nLet's dive in. 🚀",
      "I never thought {obs} would change the way I think about {topic}.\n\nBut it did.",
      "{Obs}.\n\nThat's it. That's the post.\n\n(Just kidding — let's delve deeper. 👇)",
    ],
    pivots: [
      "Here's the thing — it's not just about the {thing}.\n\nIt's about {abstract}.",
      "But here's what nobody tells you about {topic}:",
      "And in that moment, it hit me like a ton of bricks. 💡",
    ],
    beats: [
      "It's not just a {thing} — it's a masterclass in {abstract}.",
      "In the ever-evolving landscape of {topic}, the {thing} is a metaphor for everything.",
      "Because {topic} isn't a destination — it's a journey.",
      "It's a rich tapestry of {abstract}, {abstract2}, and relentless execution.",
      "The {thing} didn't just teach me patience — it taught me how to unlock real value.",
      "This is a game-changer. Full stop.",
    ],
    listIntros: ["Here are {n} key lessons I learned:", "Let's break it down — {n} game-changing takeaways:"],
    bullet: (i, t, d) => `${d.pick(EMOJI_BULLETS)} ${t}`,
    closers: [
      "In conclusion: the {thing} was never the problem. It was the opportunity. 🚀",
      "Ultimately, {topic} is about people. And {things}. But mostly people.",
      "The future belongs to {role} who notice the {thing}.",
    ],
    postscripts: [
      "Feel free to tweak the tone or let me know if you'd like a shorter version!",
      "Would you like me to add more hashtags or make it more engaging?",
    ],
    shortHooks: [
      "{Obs} — and honestly? It's the best lesson in {topic} I've had all year. 🚀",
      "{Obs}. It's not just a {thing} — it's a masterclass in {abstract}. 💡",
      "Unpopular opinion: {obs} is the most underrated {topicBare} strategy. Let's delve in. 👇",
    ],
    shortTails: ["Thoughts? 👇", "Let that sink in. 🚀", "Game-changer. 💡"],
    tellNames: { preamble: "Leaked chatbot preamble", postscript: "Leaked “Feel free to tweak!”", bullets: "Emoji bullet points" },
    finish: (text, d, tells) => {
      // Em-dashes where a period would do. The signature move.
      let n = 0;
      const out = text.replace(/\. (But|And|Because|Not) /g, (_m, w) => {
        if (!d.chance(0.6)) return _m;
        n++;
        return ` — ${w.toLowerCase()} `;
      });
      const dashes = (out.match(/—/g) ?? []).length;
      if (dashes) tells.push(`Em-dash ×${dashes}`);
      if (/delve/i.test(out)) tells.push("“Delve”");
      if (/tapestry/i.test(out)) tells.push("“Rich tapestry”");
      if (/ever-evolving|fast-paced/i.test(out)) tells.push("“In today's fast-paced landscape”");
      if (/🚀/.test(out)) tells.push("Rocket emoji");
      void n;
      return out;
    },
  },
  claude: {
    preambles: [
      "I'd be happy to help with this! Here's a draft that aims to feel authentic rather than performative:",
      "What a lovely observation to build from. Here's a post that tries to honor the nuance:",
      "I should be transparent that I don't have personal experiences, but I can write as if {qObs} happened to me:",
      "You're absolutely right that there's a post in this. Here's a thoughtful take:",
    ],
    hooks: [
      "{Obs}.\n\nI want to be thoughtful about how I say this, because I think there's something genuinely important here.",
      "I've been sitting with something.\n\n{Obs}.\n\nAnd I think it says something genuinely interesting about {topic}.",
      "This might be a small thing. But {obs}, and I keep coming back to it.",
    ],
    pivots: [
      "It's worth noting that this is a nuanced topic, and reasonable people can disagree.\n\nThat said, here's where I've landed:",
      "I'd gently push back on the idea that {topic} is mostly about tactics.",
      "I don't want to overstate this. But I also don't want to understate it.",
    ],
    beats: [
      "It's not about the {thing}, exactly. It's about what the {thing} represents.",
      "There's a quiet kind of wisdom in that. I think it's worth taking seriously.",
      "I find myself genuinely curious about what that means for {topic}.",
      "I could be wrong here. But I don't think I am. (Though I hold that loosely.)",
      "This isn't a reason to abandon {topic}. It's a reason to approach it with more {abstract}.",
      "That tension, between the {thing} and the {abstract}, is where the real insight lives.",
    ],
    listIntros: ["A few things I'm taking from this, offered with appropriate humility:", "Here's what I think this suggests (though I hold these loosely):"],
    bullet: (i, t) => `${i + 1}. ${t.replace(/\.$/, "")}, though context matters here.`,
    closers: [
      "I'm genuinely curious how others think about this. I suspect there's a lot I'm missing.",
      "Ultimately, I think the {thing} is inviting us to be a little more honest about {topic}.",
      "If this resonates, I'd love to hear your perspective. And if it doesn't, I'd love to hear that too.",
    ],
    postscripts: [
      "Let me know if you'd like me to adjust the tone, length, or level of vulnerability!",
      "I've aimed for warmth without being saccharine, but I'm happy to revise.",
    ],
    shortHooks: [
      "{Obs}. I want to be careful not to overstate this, but I think it's genuinely profound for {topic}.",
      "You're absolutely right to notice that {obs}. There's a nuanced lesson about {abstract} here.",
      "{Obs}. It's not about the {thing}, exactly. It's about what the {thing} represents.",
    ],
    shortTails: ["Curious what others think.", "(I hold this loosely.)", "Though reasonable people may disagree."],
    tellNames: { preamble: "Leaked chatbot preamble", postscript: "Leaked “Happy to revise”", bullets: "Hedged list items" },
    finish: (text, _d, tells) => {
      if (/genuinely/i.test(text)) tells.push(`“Genuinely” ×${(text.match(/genuinely/gi) ?? []).length}`);
      if (/nuance/i.test(text)) tells.push("“Nuanced”");
      if (/absolutely right/i.test(text)) tells.push("“You're absolutely right”");
      if (/hold (that|these|this) loosely/i.test(text)) tells.push("Holds opinions loosely");
      if (/reasonable people/i.test(text)) tells.push("“Reasonable people can disagree”");
      if (/push back/i.test(text)) tells.push("Gentle pushback");
      return text;
    },
  },
  gemini: {
    preambles: [
      "Absolutely! Here's a draft for a LinkedIn post about {qObs}:",
      "Okay, here's a LinkedIn post that connects {qObs} to B2B SaaS leadership:",
    ],
    hooks: [
      "**{TitleObs}: A Lesson in {Topic}**\n\nWe've all been there. {Obs}.",
      "**Why {Things} Are the Ultimate {Topic} Strategy**\n\n{Obs}. Here's a breakdown of why that matters.",
      "**The Hidden Power of the {Thing}**\n\n{Obs}. It might seem small, but it's actually a powerful lesson.",
    ],
    pivots: [
      "**The Core Insight**\n\nAt its core, this is about {abstract}.",
      "Here's a breakdown of what this means for {topic}:",
      "**Why This Matters**\n\nIn the context of {topic}, the {thing} is a perfect analogy.",
    ],
    beats: [
      "This is supported by a growing body of evidence (Source: industry reports).",
      "Studies show that 73% of {role} have experienced something similar.*",
      "It's important to note that every {thing} is different, and results may vary.",
      "In short: {abstract} drives outcomes, and outcomes drive {topic}.",
      "This is a classic example of {abstract} in action.",
    ],
    listIntros: ["**Key Takeaways:**", "**Here's a breakdown:**"],
    bullet: (_i, t, d) => {
      const head = d.pick(["Efficiency", "Scalability", "Alignment", "Resilience", "Clarity", "Impact", "Agility", "Synergy"]);
      return `* **${head}:** ${t}`;
    },
    closers: [
      "**In Summary**\n\nThe {thing} reminds us that {topic} is ultimately about {abstract}.",
      "**The Bottom Line**\n\nNext time something like this happens, ask yourself: what is this teaching me about {topicBare}?",
    ],
    postscripts: [
      "Would you like me to make it shorter, add a call to action, or generate an image to go with it?",
      "*Note: statistics are illustrative. Please verify before posting.",
    ],
    shortHooks: [
      "**{Obs}.** Here's a breakdown of what it means for {topic}: it's all about {abstract}.",
      "**Key Takeaway:** {obs}, and that's a powerful lesson in {topic}.",
      "**The Hidden Power of the {Thing}:** {obs}. At its core, this is about {abstract}.",
    ],
    shortTails: ["(Source: industry reports)", "*Results may vary.", "In summary: {abstract}."],
    tellNames: { preamble: "Leaked “Here's a draft”", postscript: "Leaked “Would you like me to…?”", bullets: "Bolded bullet lead-ins" },
    finish: (text, _d, tells) => {
      const bold = (text.match(/\*\*[^*]+\*\*/g) ?? []).length;
      if (bold) tells.push(`Unrendered **bold** ×${bold}`);
      if (/Source: industry reports/.test(text)) tells.push("Vague citation");
      if (/\d+%/.test(text)) tells.push("Made-up statistic");
      if (/breakdown/i.test(text)) tells.push("“Here's a breakdown”");
      return text;
    },
  },
  grok: {
    preambles: [
      "Alright, buckle up. Here's a maximally based post about {qObs}:",
      "Here's a spicy take, no filter:",
    ],
    hooks: [
      "not gonna lie, {obs} and it completely rewired how i think about {topic}",
      "Unhinged take: {obs}, and that's the most honest thing that happened in {topic} this year. 🔥",
      "The {topicBare} establishment doesn't want you to know this, but {obs}.",
      "{obs}. ratio'd by a {thing}. humbling.",
    ],
    pivots: ["here's the thing nobody's saying out loud:", "and honestly? based.", "Hot take incoming. 🔥"],
    beats: [
      "the {thing} understood {topic} better than half of VC twitter",
      "you either die a {thing} or live long enough to become {topic}",
      "this is the way.",
      "Maximally truth-seeking take: {abstract} > everything",
      "everyone's sleeping on this. absolutely wild. 💀",
      "Interesting.",
    ],
    listIntros: ["lessons, ranked:", "rapid fire 🔥"],
    bullet: (i, t) => `${i + 1}/ ${t.toLowerCase()}`,
    closers: ["fight me.", "Thoughts? 👀", "{role} hate this one simple trick", "Concerning."],
    postscripts: ["Want it spicier? I can go full unhinged mode.", "(this post was written in fun mode)"],
    shortHooks: [
      "not gonna lie, {obs} and it taught me more about {topic} than any VC ever did 🔥",
      "{obs}. ratio'd by a {thing}. this is the way.",
      "unhinged take: {obs} is the most based {topicBare} strategy of 2026 💀",
    ],
    shortTails: ["fight me.", "Interesting.", "Concerning. 👀"],
    tellNames: { preamble: "Leaked chatbot preamble", postscript: "Leaked chatbot sign-off", bullets: "Ranked hot takes" },
    finish: (text, _d, tells) => {
      if (/based/i.test(text)) tells.push("“Based”");
      if (/unhinged/i.test(text)) tells.push("“Unhinged”");
      if (/not gonna lie/i.test(text)) tells.push("“Not gonna lie”");
      if (/ratio/i.test(text)) tells.push("Ratio energy");
      if (/^Interesting\.$|^Concerning\.$/m.test(text) || /Concerning\./.test(text)) tells.push("One-word reply post");
      if (/🔥|💀|👀/.test(text)) tells.push("Edgelord emoji");
      return text;
    },
  },
};

// ---- Filling the templates ----

function filler(o: Observation, d: Dice) {
  const topic = d.pick(TOPICS);
  const role = d.pick(ROLES);
  const abstract = d.pick(ABSTRACT);
  const abstract2 = d.pick(ABSTRACT);
  return (tpl: string, n?: number): string =>
    tpl
      .replace(/\{Things\}/g, cap(plural(o.thing)))
      .replace(/\{things\}/g, plural(o.thing))
      .replace(/\{TitleObs\}/g, o.text.replace(/\b([a-z])([a-z']*)/g, (_m, a, b) => (/^(a|an|the|of|on|in|at|to|for|and|but|or)$/.test(a + b) ? a + b : a.toUpperCase() + b)).replace(/^./, (c) => c.toUpperCase()))
      .replace(/\{qObs\}/g, `“${o.text}”`)
      .replace(/\{Obs\}/g, sentence(o.text))
      .replace(/\{obs\}/g, o.text)
      .replace(/\{Thing\}/g, cap(o.thing))
      .replace(/\{thing\}/g, o.thing)
      .replace(/\{Topic\}/g, topic.replace(/^(the|your) /, "").replace(/\b\w/g, (c) => c.toUpperCase()))
      .replace(/\{topicBare\}/g, topic.replace(/^(the|your) /, ""))
      .replace(/\{topic\}/g, topic)
      .replace(/\{role\}/g, role)
      .replace(/\{Abstract\}/g, cap(abstract))
      .replace(/\{abstract\}/g, abstract)
      .replace(/\{abstract2\}/g, abstract2)
      .replace(/\{yourObs\}/g, yours(o.text))
      .replace(/\{n\}/g, String(n ?? 3));
}

// ---- Post shapes. Each slot gets a different one, so a barrage reads like
// a feed of different thought leaders who all went to the same workshop. ----

type F = (t: string, n?: number) => string;
type Shape = (o: Observation, kit: FlavorKit, d: Dice, f: F, tells: string[]) => string[];

// A business word for each letter, for acronym frameworks.
const ACRO: Record<string, string[]> = {
  a: ["Alignment", "Accountability", "Agility", "Ambition"], b: ["Boldness", "Bandwidth", "Buy-in", "Belief"],
  c: ["Clarity", "Customers", "Culture", "Consistency"], d: ["Discipline", "Data", "Disruption", "Drive"],
  e: ["Execution", "Empathy", "Excellence", "Energy"], f: ["Focus", "Feedback", "Frameworks", "Flywheels"],
  g: ["Grit", "Growth", "Gratitude", "Go-to-market"], h: ["Hustle", "Humility", "Hypergrowth", "Honesty"],
  i: ["Innovation", "Intentionality", "Impact", "Iteration"], j: ["Journey", "Judgment", "Joy", "Just shipping"],
  k: ["KPIs", "Kindness", "Knowledge", "Keeping score"], l: ["Leadership", "Leverage", "Learning", "Listening"],
  m: ["Mindset", "Momentum", "Metrics", "Moats"], n: ["North stars", "Networking", "Nimbleness", "No excuses"],
  o: ["Ownership", "Outcomes", "Optimization", "Obsession"], p: ["Purpose", "Pipeline", "Product-market fit", "Persistence"],
  q: ["Quality", "Quotas", "Questions", "Quiet confidence"], r: ["Resilience", "Retention", "Revenue", "Relentlessness"],
  s: ["Synergy", "Scale", "Strategy", "Storytelling"], t: ["Trust", "Traction", "Transparency", "Teamwork"],
  u: ["Urgency", "Upside", "Unit economics", "Unlearning"], v: ["Vision", "Velocity", "Value", "Vulnerability"],
  w: ["Wins", "Workflows", "Why", "Willpower"], x: ["eXecution", "eXperience", "eXcellence", "X-factor"],
  y: ["Yes-and", "Yield", "Your why", "YoY growth"], z: ["Zeal", "Zero-to-one", "Zen", "Zoom calls"],
};

const listicle: Shape = (o, kit, d, f, tells) => {
  const parts = [f(d.pick(kit.hooks)), f(d.pick(kit.pivots))];
  tells.push("Fake epiphany hook");
  for (const b of d.some(kit.beats, d.int(1, 2))) parts.push(f(b));
  if (d.chance(0.5)) { parts.push(f(`It's not about the {thing}. It's about {abstract2}.`)); tells.push("“It's not X. It's Y.”"); }
  const n = d.int(3, 5);
  parts.push(`${f(d.pick(kit.listIntros), n)}\n\n${d.some(LESSONS, n).map((l, i) => kit.bullet(i, f(l), d)).join("\n")}`);
  tells.push(kit.tellNames.bullets);
  parts.push(f(d.pick(kit.closers)));
  return parts;
};

const announcement: Shape = (o, kit, d, f, tells) => {
  tells.push("Humbled and honored", "Mundane life event as career milestone");
  return [
    f(d.pick(["I'm humbled and honored to share some personal news:", "Some personal news I've been sitting on:", "After a lot of reflection, I'm thrilled to announce:"])),
    f("{Obs}. 🎉"),
    f(d.pick(["This journey wasn't easy. There were doubters. There were late nights. There was so much {abstract}.", "When I started, people said it couldn't be done. They said the {thing} wasn't ready. They said I wasn't ready."])),
    f(d.pick(["None of this would be possible without my incredible team, my mentors, and of course the {thing} itself.", "I want to thank everyone who believed in me, especially the {thing}."])),
    f("This is just the beginning. Next stop: {topicBare}. 🚀"),
    f(d.pick(kit.closers)),
  ];
};

const dialogue: Shape = (o, kit, d, f, tells) => {
  tells.push("Fictional dialogue with a stranger", "Everybody clapped energy");
  const who = d.pick(["My barista", "A stranger on the train", "My 6-year-old", "My Uber driver", "An intern", "My neighbor's dog walker"]);
  return [
    f("{Obs}."),
    `${who} looked at me and asked: “Why does this matter?”`,
    f(d.pick(["I paused. Then I said: “Because {abstract} is the only moat left.”", "I smiled and said: “Because that's how {topicBare} works.”"])),
    "Silence.",
    f(d.pick(["Then they said something I'll never forget: “That's the best answer I've ever heard about {topicBare}.”", "Then they whispered: “I needed to hear that today.”"])),
    "Everybody on the call went quiet. Then they started taking notes.",
    f("The lesson? {Abstract} shows up in the places you least expect. Even in {qObs}."),
    f(d.pick(kit.closers)),
  ];
};

const framework: Shape = (o, kit, d, f, tells) => {
  tells.push("Made-up acronym framework", "Trademark symbol on a vibe");
  const letters = o.thing.replace(/[^a-z]/gi, "").slice(0, 7).toLowerCase().split("");
  const rows = letters.map((c) => `${c.toUpperCase()} — ${d.pick(ACRO[c] ?? ACRO.s)}`);
  return [
    f("{Obs}. So naturally, I built a framework."),
    f("Introducing the {THING} Method™:").replace("{THING}", o.thing.toUpperCase()),
    rows.join("\n"),
    f(d.pick(["I've used it with three Fortune 500 companies and one very confused {thing}.", "It took me 12 years and one {thing} to figure this out. You're getting it for free."])),
    f("Save this. Your future self (and your {topicBare}) will thank you."),
  ];
};

const unpopular: Shape = (o, kit, d, f, tells) => {
  tells.push("“Unpopular opinions” that are extremely popular");
  const opinions = d.some([
    "{Things} are underrated.", "Most meetings could be a {thing}.", "Your {topicBare} strategy is just a {thing} with a slide deck.",
    "{Abstract} beats talent when talent doesn't have {abstract}.", "Hustle culture is dead. Long live {abstract}.",
    "If your {thing} doesn't scare you, it's not big enough.", "Nobody reads your OKRs. They read your {things}.",
    "You don't need a mentor. You need a {thing}.", "Work-life balance is a {thing}.",
  ], 4).map((x, i) => `${i + 1}. ${f(x)}`);
  return [f(d.pick(["Unpopular opinions after {qObs}:", "Hot takes nobody asked for, inspired by {qObs}:"])), opinions.join("\n"), "Which one did I get wrong? (I didn't.)"];
};

const broetry: Shape = (o, kit, d, f, tells) => {
  tells.push("Broetry (one word per line)");
  const words = f("{Obs}.").split(/\s+/).slice(0, 9);
  return [
    words.join("\n"),
    "And?",
    f(d.pick(["That's {topicBare}.", "That's leadership.", "That's the job."])),
    "Most people won't get this.",
    "The ones who do?",
    f("They're building the future of {topicBare}."),
  ];
};

const vulnerable: Shape = (o, kit, d, f, tells) => {
  tells.push("Crying-CEO vulnerability post", "Selfie-implied caption");
  return [
    "I don't usually post things like this.",
    f("But today, {obs}, and I cried in my car for twenty minutes."),
    f("Not because of the {thing}. Because of what it meant."),
    f(d.pick(["For years I thought {topicBare} was about numbers. It's about people. And {things}.", "I realized I'd been optimizing for revenue when I should have been optimizing for {abstract}."])),
    "So I'm making a change, starting today.",
    f("To everyone out there pretending to be fine: I see you. 💛"),
    "(Photo of me crying attached. Authenticity matters.)",
  ];
};

const beforeAfter: Shape = (o, kit, d, f, tells) => {
  tells.push("Before / after transformation", "Arrow emoji as logic");
  return [
    f("Before {qObs}:\n❌ Chasing vanity metrics\n❌ Saying yes to everything\n❌ Ignoring my {thing}"),
    f("After {qObs}:\n✅ {Abstract}\n✅ Radical focus\n✅ 3x pipeline 📈"),
    "Same person. Different mindset. ➡️",
    f(d.pick(["The {thing} didn't change. I did.", "It was never about the {thing}. It was always about {abstract}."])),
  ];
};

const hiring: Shape = (o, kit, d, f, tells) => {
  tells.push("Hiring post nobody can apply to");
  return [
    f("{Obs}. So we're hiring. 🚀"),
    f("Role: Chief {Thing} Officer\nLocation: Remote (but we'll know if you're not grinding)\nComp: Competitive equity in {abstract}"),
    f("You might be a fit if you:\n• Have 10+ years of experience with {things} (they were invented last year)\n• Thrive in ambiguity, chaos and back-to-back syncs\n• Treat every {thing} like it's your last"),
    "No recruiters. Unless you're good. DM me “🚀”.",
  ];
};

const SHAPES: Shape[] = [listicle, announcement, dialogue, framework, unpopular, broetry, vulnerable, beforeAfter, hiring];

export function generate(raw: string, flavor: Flavor, seed: number): Slop {
  const kit = KITS[flavor] ?? KITS.chatgpt;
  const o = readObservation(raw);
  const d = new Dice(rng(seed));
  const f = filler(o, d);
  const tells: string[] = [];
  const parts: string[] = [];

  const preamble = d.chance(0.4);
  if (preamble) {
    parts.push(f(d.pick(kit.preambles)), "---");
    tells.push(kit.tellNames.preamble);
  }
  // Consecutive seeds walk through the shapes, so a barrage never repeats one back to back.
  const shape = SHAPES[seed % SHAPES.length];
  parts.push(...shape(o, kit, d, f, tells));
  tells.push("One-line paragraphs");
  // Wikipedia's tells and the flavor's voice, sprinkled into the middle.
  const middle: string[] = [];
  for (const [name, lines] of d.some(WIKI, d.int(1, 2))) { middle.push(f(d.pick(lines))); tells.push(name); }
  if (shape !== listicle) for (const b of d.some(kit.beats, 1)) middle.push(f(b));
  if (d.chance(0.5)) { middle.push(d.pick(TRIADS)); tells.push("Rule of three"); }
  const at = Math.max(preamble ? 3 : 1, parts.length - 1);
  parts.splice(at, 0, ...middle);

  parts.push(d.pick([
    `What's your ${o.thing} moment? 👇`,
    "Agree or disagree? Let me know in the comments.",
    "♻️ Repost if this resonated with your network.",
    `Tag a ${d.pick(ROLES).replace(/s$/, "")} who needs to hear this.`,
    "Comment “SLOP” and I'll DM you the full playbook.",
    "Follow me for more insights like this. 🔔",
  ]));
  tells.push("Engagement bait");
  parts.push(d.some(HASHTAGS, d.int(4, 7)).join(" "));
  tells.push("Hashtag avalanche");

  if (d.chance(preamble ? 0.6 : 0.3)) {
    parts.push("---", f(d.pick(kit.postscripts)));
    tells.push(kit.tellNames.postscript);
  }
  if (d.chance(0.35)) {
    const i = d.int(1, Math.max(1, parts.length - 3));
    parts[i] = `${parts[i]} ${d.pick(RESIDUE[flavor] ?? RESIDUE.chatgpt)}`;
    tells.push(RESIDUE_TELL[flavor] ?? RESIDUE_TELL.chatgpt);
  }
  if (d.chance(0.1)) {
    parts.push("<|endoftext|>");
    tells.push("Abrupt <|endoftext|>");
  }
  const long = kit.finish(parts.join("\n\n"), d, tells);
  const short = shortPost(o, kit, d, f, seed);
  return { long, short, tells: [...new Set(tells)] };
}

// Short posts any flavor can wear, on top of each flavor's own hooks.
const SHARED_SHORT = [
  "{Obs}. Most people would move on. I wrote a 14-part thread about {topicBare}. 🧵",
  "Hot take: {things} are just {topicBare} with better branding.",
  "I'm humbled to announce that {obs}. Grateful for this journey. 🙏",
  "{Obs}.\n\nThat's it.\n\nThat's the {topicBare} strategy.",
  "My barista asked why {obs} matters. I said “{abstract}.” She started crying.",
  "Introducing the {THING} Method™. Comment “SLOP” for the PDF.",
  "Before: chasing metrics.\nAfter {qObs}: chasing {abstract}. 📈",
  "We're hiring a Chief {Thing} Officer. 10 years of {thing} experience required.",
  "If {obs} doesn't teach you about {topicBare}, nothing will.",
];

const SHORT_LIMIT = 270; // under X's 280, Bluesky's 300, Threads' 500

function shortPost(o: Observation, kit: FlavorKit, d: Dice, f: F, seed: number): string {
  const tpl = seed % 2 ? d.pick(kit.shortHooks) : d.pick(SHARED_SHORT);
  const hook = f(tpl).replace("{THING}", o.thing.toUpperCase());
  const tail = f(d.pick(kit.shortTails));
  const tags = d.some(HASHTAGS, 2).join(" ");
  for (const candidate of [`${hook}\n\n${tail}\n\n${tags}`, `${hook}\n\n${tail}`, hook]) {
    if (candidate.length <= SHORT_LIMIT) return kit.finish(candidate, d, []);
  }
  return kit.finish(hook.slice(0, SHORT_LIMIT - 1).replace(/\s+\S*$/, "") + "…", d, []);
}

// Services that only take a short post.
export const SHORT_SERVICES = new Set(["twitter", "bluesky", "threads"]);
