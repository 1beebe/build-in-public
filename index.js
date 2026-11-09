var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/crypto.ts
var enc = new TextEncoder();
var dec = new TextDecoder();
function base64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64url, "base64url");
function fromBase64(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
__name(fromBase64, "fromBase64");
function randomToken(bytes = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
__name(randomToken, "randomToken");
async function pkcePair() {
  const verifier = randomToken(32);
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}
__name(pkcePair, "pkcePair");
async function aesKey(secret) {
  return crypto.subtle.importKey("raw", fromBase64(secret), "AES-GCM", false, ["encrypt", "decrypt"]);
}
__name(aesKey, "aesKey");
async function seal(secret, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await aesKey(secret),
    enc.encode(JSON.stringify(value))
  );
  return `${base64url(iv)}.${base64url(new Uint8Array(data))}`;
}
__name(seal, "seal");
async function unseal(secret, sealed) {
  const [iv, data] = sealed.split(".");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    await aesKey(secret),
    fromBase64(data)
  );
  return JSON.parse(dec.decode(plain));
}
__name(unseal, "unseal");

// src/buffer.ts
var AUTH_URL = "https://auth.buffer.com/auth";
var TOKEN_URL = "https://auth.buffer.com/token";
var API_URL = "https://api.buffer.com";
var SCOPES = "account:read posts:read posts:write offline_access";
var RateLimited = class extends Error {
  constructor(retryAfterSeconds) {
    super(`Buffer asked us to wait ${retryAfterSeconds} seconds`);
    this.retryAfterSeconds = retryAfterSeconds;
  }
  retryAfterSeconds;
  static {
    __name(this, "RateLimited");
  }
};
var NeedsReconnect = class extends Error {
  static {
    __name(this, "NeedsReconnect");
  }
  constructor() {
    super("Buffer access was revoked or expired");
  }
};
function authorizeUrl(env, state, challenge) {
  const u = new URL(AUTH_URL);
  u.searchParams.set("client_id", env.BUFFER_CLIENT_ID);
  u.searchParams.set("redirect_uri", `${env.APP_URL}/callback`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "consent");
  return u.toString();
}
__name(authorizeUrl, "authorizeUrl");
async function tokenRequest(body2) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body2)
  });
  const json2 = await res.json();
  if (!res.ok || !json2.access_token) {
    if (json2.error === "invalid_grant") throw new NeedsReconnect();
    throw new Error(`Buffer token error: ${json2.error ?? res.status} ${json2.error_description ?? ""}`.trim());
  }
  return {
    accessToken: json2.access_token,
    refreshToken: json2.refresh_token,
    expiresAt: Date.now() + ((json2.expires_in ?? 3600) - 60) * 1e3
  };
}
__name(tokenRequest, "tokenRequest");
function exchangeCode(env, code, verifier) {
  return tokenRequest({
    client_id: env.BUFFER_CLIENT_ID,
    client_secret: env.BUFFER_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${env.APP_URL}/callback`,
    code_verifier: verifier
  });
}
__name(exchangeCode, "exchangeCode");
async function refresh(env, tokens) {
  if (!tokens.refreshToken) throw new NeedsReconnect();
  const next = await tokenRequest({
    client_id: env.BUFFER_CLIENT_ID,
    client_secret: env.BUFFER_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken
  });
  return { ...next, refreshToken: next.refreshToken ?? tokens.refreshToken };
}
__name(refresh, "refresh");
function remaining15(res) {
  const live = res.headers.get("ratelimit") ?? "";
  const policy = res.headers.get("ratelimit-policy") ?? "";
  const names = /* @__PURE__ */ new Map();
  for (const p of policy.split(/,\s*(?=")/)) {
    const name = p.match(/"([^"]+)"/)?.[1];
    const w = p.match(/w=(\d+)/)?.[1];
    if (name && w) names.set(name, Number(w));
  }
  for (const p of live.split(/,\s*(?=")/)) {
    const name = p.match(/"([^"]+)"/)?.[1];
    const r = p.match(/r=(\d+)/)?.[1];
    if (name && r !== void 0 && names.get(name) === 900) return Number(r);
  }
  return void 0;
}
__name(remaining15, "remaining15");
var BufferClient = class {
  constructor(env, session) {
    this.env = env;
    this.session = session;
  }
  env;
  session;
  static {
    __name(this, "BufferClient");
  }
  sessionChanged = false;
  remaining;
  async query(query, variables = {}) {
    if (Date.now() >= this.session.tokens.expiresAt) {
      this.session.tokens = await refresh(this.env, this.session.tokens);
      this.sessionChanged = true;
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.session.tokens.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables })
      });
      this.remaining = remaining15(res) ?? this.remaining;
      if (res.status === 401) throw new NeedsReconnect();
      if (res.status === 429) {
        const wait = Number(res.headers.get("retry-after") ?? "60");
        if (attempt === 1 && wait <= 5) {
          await new Promise((r) => setTimeout(r, wait * 1e3 + 200));
          continue;
        }
        throw new RateLimited(wait);
      }
      const json2 = await res.json();
      if (json2.errors?.length) throw new Error(`Buffer API: ${json2.errors.map((e) => e.message).join("; ")}`);
      return json2.data;
    }
    throw new RateLimited(60);
  }
};
async function getOrgs(client) {
  const data = await client.query(
    `query Start { account { id organizations { id name limits { scheduledPosts } } } }`
  ).catch(
    () => client.query(`query Start { account { id organizations { id name } } }`)
  );
  return { orgs: data.account.organizations ?? [], accountId: data.account.id };
}
__name(getOrgs, "getOrgs");
var CHANNEL_FIELDS = "id service name displayName isDisconnected isLocked timezone isQueuePaused postingSchedule { day times paused }";
function toChannel(c) {
  return {
    id: c.id,
    service: c.service,
    name: c.displayName || c.name || c.service,
    timezone: c.timezone || "UTC",
    queuePaused: Boolean(c.isQueuePaused),
    schedule: c.postingSchedule ?? []
  };
}
__name(toChannel, "toChannel");
async function getChannels(client, organizationId) {
  let raw;
  try {
    const data = await client.query(
      `query Channels($o: OrganizationId!) { channels(input: { organizationId: $o }) { ${CHANNEL_FIELDS} } }`,
      { o: organizationId }
    );
    raw = data.channels;
  } catch {
    const data = await client.query(
      `query Channels($o: OrganizationId!) { channels(input: { organizationId: $o }) { id service name displayName isDisconnected isLocked } }`,
      { o: organizationId }
    );
    raw = [];
    for (const c of data.channels.filter((c2) => !c2.isDisconnected && !c2.isLocked)) {
      const one = await client.query(
        `query Channel($id: ChannelId!) { channel(input: { id: $id }) { ${CHANNEL_FIELDS} } }`,
        { id: c.id }
      );
      raw.push(one.channel);
    }
  }
  return raw.filter((c) => c && !c.isDisconnected && !c.isLocked).map(toChannel);
}
__name(getChannels, "getChannels");
async function getTaken(client, organizationId, channelIds) {
  const out = [];
  let after;
  for (let page = 0; page < 3; page++) {
    const data = await client.query(
      `query Taken($o: OrganizationId!, $c: [ChannelId!], $after: String) {
        posts(first: 100, after: $after, input: { organizationId: $o, filter: { status: [scheduled], channelIds: $c } }) {
          edges { node { dueAt channelId } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { o: organizationId, c: channelIds, after }
    );
    for (const e of data.posts.edges) if (e.node.dueAt) out.push({ channelId: e.node.channelId ?? "", at: Date.parse(e.node.dueAt) });
    if (!data.posts.pageInfo?.hasNextPage) break;
    after = data.posts.pageInfo.endCursor;
  }
  return out;
}
__name(getTaken, "getTaken");
async function createPost(client, p) {
  const metadata = {};
  if (p.service === "facebook") metadata.facebook = { type: "post" };
  if (p.service === "googlebusiness") metadata.google = { type: "whats_new" };
  const data = await client.query(
    `mutation Fire($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess { post { id dueAt } }
        ... on MutationError { message }
      }
    }`,
    {
      input: {
        channelId: p.channelId,
        text: p.text,
        schedulingType: "automatic",
        mode: "customScheduled",
        dueAt: p.dueAt,
        ...p.draft ? { saveToDraft: true } : {},
        ...Object.keys(metadata).length ? { metadata } : {}
      }
    }
  );
  const post = data.createPost.post;
  if (!post?.id) throw new Error(data.createPost.message ?? "Buffer didn't take that post");
  return post;
}
__name(createPost, "createPost");
async function deletePost(client, id) {
  const data = await client.query(
    `mutation Undo($id: PostId!) { deletePost(input: { id: $id }) { __typename ... on MutationError { message } } }`,
    { id }
  );
  if (/error/i.test(data.deletePost?.__typename ?? "")) throw new Error(data.deletePost.message ?? "Buffer didn't delete it");
}
__name(deletePost, "deletePost");

// src/slop.ts
var FLAVORS = {
  chatgpt: { label: "ChatGPT-ish", blurb: "Em-dashes, delve, and a rocket for every occasion" },
  claude: { label: "Claude-ish", blurb: "Thoughtful, genuinely nuanced, absolutely right" },
  gemini: { label: "Gemini-ish", blurb: "Here's a breakdown, in bold, with Key Takeaways" },
  grok: { label: "Grok-ish", blurb: "Based, unhinged, maximally truth-seeking" }
};
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
__name(rng, "rng");
var Dice = class {
  static {
    __name(this, "Dice");
  }
  used = /* @__PURE__ */ new Set();
  r;
  constructor(r) {
    this.r = r;
  }
  chance(p) {
    return this.r() < p;
  }
  int(lo, hi) {
    return lo + Math.floor(this.r() * (hi - lo + 1));
  }
  // One item, never the same string twice in a post when there's another choice.
  pick(list) {
    const fresh = list.filter((x) => !this.used.has(String(x)));
    const from = fresh.length ? fresh : list;
    const out = from[Math.floor(this.r() * from.length)];
    this.used.add(String(out));
    return out;
  }
  some(list, n) {
    const out = [];
    for (let i = 0; i < n && i < list.length; i++) out.push(this.pick(list));
    return out;
  }
};
var STOP = new Set(
  "a an the my our your his her their its this that these those i me we us you he she it they them is am are was were be been being have has had do did does doing done will would can could should just really very so too also still even again today yesterday tonight morning afternoon evening week and or but because when while during after before then than of in on at to for from with without into about over under up down out off like as by not no yes got get gets getting went go goes going made make some any every all one two first last new old little big bit lot kind sort thing things way time".split(/\s+/)
);
var DETERMINERS = /* @__PURE__ */ new Set(["my", "our", "the", "a", "an", "his", "her", "their", "your", "this", "that"]);
function readObservation(raw) {
  let text = raw.replace(/\s+/g, " ").trim().replace(/[.!?…]+$/, "");
  if (!text) text = "my coffee went cold during standup";
  if (text.length > 160) text = text.slice(0, 160).replace(/\s+\S*$/, "");
  if (/^[A-Z][a-z]/.test(text) && !/^I\b/.test(text)) text = text[0].toLowerCase() + text.slice(1);
  const words = text.toLowerCase().replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean);
  let thing = "";
  for (let i = 0; i < words.length - 1; i++) {
    if (!DETERMINERS.has(words[i])) continue;
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
  if (/(ches|shes|xes)$/.test(thing)) thing = thing.slice(0, -2);
  else if (/[^su]s$/.test(thing) && thing.length > 3) thing = thing.slice(0, -1);
  return { text, thing };
}
__name(readObservation, "readObservation");
var plural = /* @__PURE__ */ __name((w) => /(s|x|ch|sh)$/.test(w) ? w : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + "s", "plural");
var cap = /* @__PURE__ */ __name((s) => s.charAt(0).toUpperCase() + s.slice(1), "cap");
var sentence = /* @__PURE__ */ __name((s) => cap(s), "sentence");
var yours = /* @__PURE__ */ __name((s) => s.replace(/\bmy\b/gi, "your").replace(/\bI'm\b/g, "you're").replace(/\bI\b/g, "you").replace(/\bme\b/gi, "you").replace(/\bmine\b/gi, "yours"), "yours");
var TOPICS = [
  "product-led growth",
  "churn",
  "pipeline",
  "go-to-market",
  "customer success",
  "ARR",
  "the sales cycle",
  "onboarding",
  "leadership",
  "founder-market fit",
  "retention",
  "your ICP",
  "the B2B buyer journey",
  "stakeholder alignment",
  "net revenue retention",
  "category creation",
  "async culture",
  "demand gen",
  "the enterprise motion",
  "the mid-market",
  "your north star metric",
  "hiring A-players",
  "the flywheel"
];
var ROLES = [
  "founders",
  "CROs",
  "product leaders",
  "GTM teams",
  "high performers",
  "SDRs",
  "operators",
  "CMOs",
  "Series A CEOs",
  "solopreneurs",
  "RevOps leaders",
  "first-time managers"
];
var ABSTRACT = [
  "alignment",
  "intentionality",
  "trust",
  "systems thinking",
  "mindset",
  "showing up",
  "compounding",
  "ownership",
  "clarity",
  "process",
  "reps",
  "consistency",
  "positioning",
  "long-game thinking",
  "focus"
];
var TRIADS = [
  "Clarity. Consistency. Compounding.",
  "Listen. Learn. Lead.",
  "Build. Measure. Repeat.",
  "Show up. Ship. Scale.",
  "Fewer meetings. More meaning. Better margins.",
  "Hire slow. Fire fast. Pour coffee.",
  "Focus. Feedback. Flywheel.",
  "Trust the process. Own the outcome. Ignore the noise."
];
var LESSONS = [
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
  "Your {thing} is a lagging indicator. {Abstract} is a leading one."
];
var HASHTAGS = [
  "#Leadership",
  "#B2B",
  "#SaaS",
  "#GrowthMindset",
  "#ThoughtLeadership",
  "#Startups",
  "#Founders",
  "#Innovation",
  "#FutureOfWork",
  "#Sales",
  "#ProductManagement",
  "#Mindset",
  "#Hustle",
  "#AI"
];
var WIKI = [
  ["Superficial \u201C-ing\u201D analysis", [
    "{Obs}, underscoring the enduring importance of {abstract} in {topic}.",
    "That moment stayed with me, highlighting the pivotal role of {abstract} in today's {topic} landscape."
  ]],
  ["Undue symbolism", [
    "The {thing} stands as a testament to the power of {abstract}.",
    "In many ways, the {thing} is a symbol of everything {role} are fighting for."
  ]],
  ["Didactic disclaimer", [
    "It's important to remember that every {topicBare} journey is different.",
    "It's worth noting that results may vary depending on your {thing}."
  ]],
  ["\u201CChallenges and future prospects\u201D", [
    "Despite its challenges, the {thing} continues to inspire {role}, and its future in {topicBare} remains bright.",
    "While challenges remain, the future of {thing}-led growth looks promising."
  ]],
  ["False range", [
    "From {things} to {topicBare}, from boardrooms to breakrooms, the lesson is the same.",
    "From the smallest {thing} to the largest enterprise deal, it all comes down to {abstract}."
  ]],
  ["Vague attribution", [
    "Experts agree: {abstract} is the new {topicBare}.",
    "Industry observers have long noted the connection between {things} and {topicBare}."
  ]],
  ["Elegant variation", [
    "The {thing}. That humble vessel. The unsung protagonist of my morning. The key player in this story."
  ]],
  ["Outline of negatives", [
    "No roadmap. No OKRs. No playbook. Just a {thing}.",
    "Not a framework. Not a hack. Just {abstract}."
  ]],
  ["Knowledge-cutoff disclaimer", [
    "(As of my last knowledge update, this remains true.)"
  ]],
  ["Unfilled placeholder", [
    "That's why at [Company Name], we believe [insert core value here].",
    "In fact, [insert relevant statistic] of {role} agree."
  ]]
];
var RESIDUE = {
  chatgpt: [":contentReference[oaicite:0]{index=0}", "\u3010turn0search0\u3011"],
  claude: ["[Your Name]", "[Citation needed]"],
  gemini: ["[1]", "(utm_source=gemini)"],
  grok: ["[web:1]", "[grok_card]"]
};
var EMOJI_BULLETS = ["\u2705", "\u{1F680}", "\u{1F4A1}", "\u{1F511}", "\u{1F4C8}", "\u{1F3AF}", "\u26A1", "\u{1F9E0}"];
var KITS = {
  chatgpt: {
    preambles: [
      "Certainly! Here's a LinkedIn post about {qObs}:",
      "As an AI language model, I have never personally experienced {qObs}, but here's a LinkedIn post about it:",
      "Subject: What {TitleObs} Taught Me About {Topic}",
      "Sure! Here's an engaging, thought-leadership-style post based on your experience:",
      "Absolutely! Here's a polished post that turns {qObs} into a powerful business insight:"
    ],
    hooks: [
      "{Obs}.\n\nAnd it taught me more about {topic} than my MBA ever did.",
      "In today's fast-paced world of {topic}, {obs}.\n\nLet's dive in. \u{1F680}",
      "I never thought {obs} would change the way I think about {topic}.\n\nBut it did.",
      "{Obs}.\n\nThat's it. That's the post.\n\n(Just kidding \u2014 let's delve deeper. \u{1F447})"
    ],
    pivots: [
      "Here's the thing \u2014 it's not just about the {thing}.\n\nIt's about {abstract}.",
      "But here's what nobody tells you about {topic}:",
      "And in that moment, it hit me like a ton of bricks. \u{1F4A1}"
    ],
    beats: [
      "It's not just a {thing} \u2014 it's a masterclass in {abstract}.",
      "In the ever-evolving landscape of {topic}, the {thing} is a metaphor for everything.",
      "Because {topic} isn't a destination \u2014 it's a journey.",
      "It's a rich tapestry of {abstract}, {abstract2}, and relentless execution.",
      "The {thing} didn't just teach me patience \u2014 it taught me how to unlock real value.",
      "This is a game-changer. Full stop."
    ],
    listIntros: ["Here are {n} key lessons I learned:", "Let's break it down \u2014 {n} game-changing takeaways:"],
    bullet: /* @__PURE__ */ __name((i, t, d) => `${d.pick(EMOJI_BULLETS)} ${t}`, "bullet"),
    closers: [
      "In conclusion: the {thing} was never the problem. It was the opportunity. \u{1F680}",
      "Ultimately, {topic} is about people. And {things}. But mostly people.",
      "The future belongs to {role} who notice the {thing}."
    ],
    postscripts: [
      "Feel free to tweak the tone or let me know if you'd like a shorter version!",
      "Would you like me to add more hashtags or make it more engaging?"
    ],
    shortHooks: [
      "{Obs} \u2014 and honestly? It's the best lesson in {topic} I've had all year. \u{1F680}",
      "{Obs}. It's not just a {thing} \u2014 it's a masterclass in {abstract}. \u{1F4A1}",
      "Unpopular opinion: {obs} is the most underrated {topicBare} strategy. Let's delve in. \u{1F447}"
    ],
    shortTails: ["Thoughts? \u{1F447}", "Let that sink in. \u{1F680}", "Game-changer. \u{1F4A1}"],
    tellNames: { preamble: "Leaked chatbot preamble", postscript: "Leaked \u201CFeel free to tweak!\u201D", bullets: "Emoji bullet points" },
    finish: /* @__PURE__ */ __name((text, d, tells) => {
      let n = 0;
      const out = text.replace(/\. (But|And|Because|Not) /g, (_m, w) => {
        if (!d.chance(0.6)) return _m;
        n++;
        return ` \u2014 ${w.toLowerCase()} `;
      });
      const dashes = (out.match(/—/g) ?? []).length;
      if (dashes) tells.push(`Em-dash \xD7${dashes}`);
      if (/delve/i.test(out)) tells.push("\u201CDelve\u201D");
      if (/tapestry/i.test(out)) tells.push("\u201CRich tapestry\u201D");
      if (/ever-evolving|fast-paced/i.test(out)) tells.push("\u201CIn today's fast-paced landscape\u201D");
      if (/🚀/.test(out)) tells.push("Rocket emoji");
      void n;
      return out;
    }, "finish")
  },
  claude: {
    preambles: [
      "I'd be happy to help with this! Here's a draft that aims to feel authentic rather than performative:",
      "What a lovely observation to build from. Here's a post that tries to honor the nuance:",
      "I should be transparent that I don't have personal experiences, but I can write as if {qObs} happened to me:",
      "You're absolutely right that there's a post in this. Here's a thoughtful take:"
    ],
    hooks: [
      "{Obs}.\n\nI want to be thoughtful about how I say this, because I think there's something genuinely important here.",
      "I've been sitting with something.\n\n{Obs}.\n\nAnd I think it says something genuinely interesting about {topic}.",
      "This might be a small thing. But {obs}, and I keep coming back to it."
    ],
    pivots: [
      "It's worth noting that this is a nuanced topic, and reasonable people can disagree.\n\nThat said, here's where I've landed:",
      "I'd gently push back on the idea that {topic} is mostly about tactics.",
      "I don't want to overstate this. But I also don't want to understate it."
    ],
    beats: [
      "It's not about the {thing}, exactly. It's about what the {thing} represents.",
      "There's a quiet kind of wisdom in that. I think it's worth taking seriously.",
      "I find myself genuinely curious about what that means for {topic}.",
      "I could be wrong here. But I don't think I am. (Though I hold that loosely.)",
      "This isn't a reason to abandon {topic}. It's a reason to approach it with more {abstract}.",
      "That tension, between the {thing} and the {abstract}, is where the real insight lives."
    ],
    listIntros: ["A few things I'm taking from this, offered with appropriate humility:", "Here's what I think this suggests (though I hold these loosely):"],
    bullet: /* @__PURE__ */ __name((i, t) => `${i + 1}. ${t.replace(/\.$/, "")}, though context matters here.`, "bullet"),
    closers: [
      "I'm genuinely curious how others think about this. I suspect there's a lot I'm missing.",
      "Ultimately, I think the {thing} is inviting us to be a little more honest about {topic}.",
      "If this resonates, I'd love to hear your perspective. And if it doesn't, I'd love to hear that too."
    ],
    postscripts: [
      "Let me know if you'd like me to adjust the tone, length, or level of vulnerability!",
      "I've aimed for warmth without being saccharine, but I'm happy to revise."
    ],
    shortHooks: [
      "{Obs}. I want to be careful not to overstate this, but I think it's genuinely profound for {topic}.",
      "You're absolutely right to notice that {obs}. There's a nuanced lesson about {abstract} here.",
      "{Obs}. It's not about the {thing}, exactly. It's about what the {thing} represents."
    ],
    shortTails: ["Curious what others think.", "(I hold this loosely.)", "Though reasonable people may disagree."],
    tellNames: { preamble: "Leaked chatbot preamble", postscript: "Leaked \u201CHappy to revise\u201D", bullets: "Hedged list items" },
    finish: /* @__PURE__ */ __name((text, _d, tells) => {
      if (/genuinely/i.test(text)) tells.push(`\u201CGenuinely\u201D \xD7${(text.match(/genuinely/gi) ?? []).length}`);
      if (/nuance/i.test(text)) tells.push("\u201CNuanced\u201D");
      if (/absolutely right/i.test(text)) tells.push("\u201CYou're absolutely right\u201D");
      if (/hold (that|these|this) loosely/i.test(text)) tells.push("Holds opinions loosely");
      if (/reasonable people/i.test(text)) tells.push("\u201CReasonable people can disagree\u201D");
      if (/push back/i.test(text)) tells.push("Gentle pushback");
      return text;
    }, "finish")
  },
  gemini: {
    preambles: [
      "Absolutely! Here's a draft for a LinkedIn post about {qObs}:",
      "Okay, here's a LinkedIn post that connects {qObs} to B2B SaaS leadership:"
    ],
    hooks: [
      "**{TitleObs}: A Lesson in {Topic}**\n\nWe've all been there. {Obs}.",
      "**Why {Things} Are the Ultimate {Topic} Strategy**\n\n{Obs}. Here's a breakdown of why that matters.",
      "**The Hidden Power of the {Thing}**\n\n{Obs}. It might seem small, but it's actually a powerful lesson."
    ],
    pivots: [
      "**The Core Insight**\n\nAt its core, this is about {abstract}.",
      "Here's a breakdown of what this means for {topic}:",
      "**Why This Matters**\n\nIn the context of {topic}, the {thing} is a perfect analogy."
    ],
    beats: [
      "This is supported by a growing body of evidence (Source: industry reports).",
      "Studies show that 73% of {role} have experienced something similar.*",
      "It's important to note that every {thing} is different, and results may vary.",
      "In short: {abstract} drives outcomes, and outcomes drive {topic}.",
      "This is a classic example of {abstract} in action."
    ],
    listIntros: ["**Key Takeaways:**", "**Here's a breakdown:**"],
    bullet: /* @__PURE__ */ __name((_i, t, d) => {
      const head = d.pick(["Efficiency", "Scalability", "Alignment", "Resilience", "Clarity", "Impact", "Agility", "Synergy"]);
      return `* **${head}:** ${t}`;
    }, "bullet"),
    closers: [
      "**In Summary**\n\nThe {thing} reminds us that {topic} is ultimately about {abstract}.",
      "**The Bottom Line**\n\nNext time something like this happens, ask yourself: what is this teaching me about {topicBare}?"
    ],
    postscripts: [
      "Would you like me to make it shorter, add a call to action, or generate an image to go with it?",
      "*Note: statistics are illustrative. Please verify before posting."
    ],
    shortHooks: [
      "**{Obs}.** Here's a breakdown of what it means for {topic}: it's all about {abstract}.",
      "**Key Takeaway:** {obs}, and that's a powerful lesson in {topic}.",
      "**The Hidden Power of the {Thing}:** {obs}. At its core, this is about {abstract}."
    ],
    shortTails: ["(Source: industry reports)", "*Results may vary.", "In summary: {abstract}."],
    tellNames: { preamble: "Leaked \u201CHere's a draft\u201D", postscript: "Leaked \u201CWould you like me to\u2026?\u201D", bullets: "Bolded bullet lead-ins" },
    finish: /* @__PURE__ */ __name((text, _d, tells) => {
      const bold = (text.match(/\*\*[^*]+\*\*/g) ?? []).length;
      if (bold) tells.push(`Unrendered **bold** \xD7${bold}`);
      if (/Source: industry reports/.test(text)) tells.push("Vague citation");
      if (/\d+%/.test(text)) tells.push("Made-up statistic");
      if (/breakdown/i.test(text)) tells.push("\u201CHere's a breakdown\u201D");
      return text;
    }, "finish")
  },
  grok: {
    preambles: [
      "Alright, buckle up. Here's a maximally based post about {qObs}:",
      "Here's a spicy take, no filter:"
    ],
    hooks: [
      "not gonna lie, {obs} and it completely rewired how i think about {topic}",
      "Unhinged take: {obs}, and that's the most honest thing that happened in {topic} this year. \u{1F525}",
      "The {topic} establishment doesn't want you to know this, but {obs}.",
      "{obs}. ratio'd by a {thing}. humbling."
    ],
    pivots: ["here's the thing nobody's saying out loud:", "and honestly? based.", "Hot take incoming. \u{1F525}"],
    beats: [
      "the {thing} understood {topic} better than half of VC twitter",
      "you either die a {thing} or live long enough to become {topic}",
      "this is the way.",
      "Maximally truth-seeking take: {abstract} > everything",
      "everyone's sleeping on this. absolutely wild. \u{1F480}",
      "Interesting."
    ],
    listIntros: ["lessons, ranked:", "rapid fire \u{1F525}"],
    bullet: /* @__PURE__ */ __name((i, t) => `${i + 1}/ ${t.toLowerCase()}`, "bullet"),
    closers: ["fight me.", "Thoughts? \u{1F440}", "{role} hate this one simple trick", "Concerning."],
    postscripts: ["Want it spicier? I can go full unhinged mode.", "(this post was written in fun mode)"],
    shortHooks: [
      "not gonna lie, {obs} and it taught me more about {topic} than any VC ever did \u{1F525}",
      "{obs}. ratio'd by a {thing}. this is the way.",
      "unhinged take: {obs} is the most based {topicBare} strategy of 2026 \u{1F480}"
    ],
    shortTails: ["fight me.", "Interesting.", "Concerning. \u{1F440}"],
    tellNames: { preamble: "Leaked chatbot preamble", postscript: "Leaked chatbot sign-off", bullets: "Ranked hot takes" },
    finish: /* @__PURE__ */ __name((text, _d, tells) => {
      if (/based/i.test(text)) tells.push("\u201CBased\u201D");
      if (/unhinged/i.test(text)) tells.push("\u201CUnhinged\u201D");
      if (/not gonna lie/i.test(text)) tells.push("\u201CNot gonna lie\u201D");
      if (/ratio/i.test(text)) tells.push("Ratio energy");
      if (/^Interesting\.$|^Concerning\.$/m.test(text) || /Concerning\./.test(text)) tells.push("One-word reply post");
      if (/🔥|💀|👀/.test(text)) tells.push("Edgelord emoji");
      return text;
    }, "finish")
  }
};
function filler(o, d) {
  const topic = d.pick(TOPICS);
  const role = d.pick(ROLES);
  const abstract = d.pick(ABSTRACT);
  const abstract2 = d.pick(ABSTRACT);
  return (tpl, n) => tpl.replace(/\{Things\}/g, cap(plural(o.thing))).replace(/\{things\}/g, plural(o.thing)).replace(/\{TitleObs\}/g, o.text.replace(/\b([a-z])([a-z']*)/g, (_m, a, b) => /^(a|an|the|of|on|in|at|to|for|and|but|or)$/.test(a + b) ? a + b : a.toUpperCase() + b).replace(/^./, (c) => c.toUpperCase())).replace(/\{qObs\}/g, `\u201C${o.text}\u201D`).replace(/\{Obs\}/g, sentence(o.text)).replace(/\{obs\}/g, o.text).replace(/\{Thing\}/g, cap(o.thing)).replace(/\{thing\}/g, o.thing).replace(/\{Topic\}/g, topic.replace(/^(the|your) /, "").replace(/\b\w/g, (c) => c.toUpperCase())).replace(/\{topicBare\}/g, topic.replace(/^(the|your) /, "")).replace(/\{topic\}/g, topic).replace(/\{role\}/g, role).replace(/\{Abstract\}/g, cap(abstract)).replace(/\{abstract\}/g, abstract).replace(/\{abstract2\}/g, abstract2).replace(/\{yourObs\}/g, yours(o.text)).replace(/\{n\}/g, String(n ?? 3));
}
__name(filler, "filler");
function generate(raw, flavor, seed) {
  const kit = KITS[flavor] ?? KITS.chatgpt;
  const o = readObservation(raw);
  const d = new Dice(rng(seed));
  const f = filler(o, d);
  const tells = [];
  const parts = [];
  const preamble = d.chance(0.45);
  if (preamble) {
    parts.push(f(d.pick(kit.preambles)), "---");
    tells.push(kit.tellNames.preamble);
  }
  parts.push(f(d.pick(kit.hooks)));
  tells.push("Fake epiphany hook");
  parts.push(f(d.pick(kit.pivots)));
  for (const b of d.some(kit.beats, d.int(2, 3))) parts.push(f(b));
  tells.push("One-line paragraphs");
  for (const [name, lines] of d.some(WIKI, d.int(2, 3))) {
    parts.push(f(d.pick(lines)));
    tells.push(name);
  }
  if (d.chance(0.5)) {
    parts.push(`It's not about the ${o.thing}. It's about ${d.pick(ABSTRACT)}.`);
    tells.push("\u201CIt's not X. It's Y.\u201D");
  }
  if (d.chance(0.6)) {
    parts.push(d.pick(TRIADS));
    tells.push("Rule of three");
  }
  const n = d.int(3, 5);
  const lessons = d.some(LESSONS, n).map((l, i) => kit.bullet(i, f(l), d));
  parts.push(`${f(d.pick(kit.listIntros), n)}

${lessons.join("\n")}`);
  tells.push(kit.tellNames.bullets);
  parts.push(f(d.pick(kit.closers)));
  const engage = d.pick([
    `What's your ${o.thing} moment? \u{1F447}`,
    "Agree or disagree? Let me know in the comments.",
    "\u267B\uFE0F Repost if this resonated with your network.",
    `Tag a ${d.pick(ROLES).replace(/s$/, "")} who needs to hear this.`
  ]);
  parts.push(engage);
  tells.push("Engagement bait");
  const tags = d.some(HASHTAGS, d.int(4, 7)).join(" ");
  parts.push(tags);
  tells.push("Hashtag avalanche");
  if (d.chance(preamble ? 0.6 : 0.35)) {
    parts.push("---", f(d.pick(kit.postscripts)));
    tells.push(kit.tellNames.postscript);
  }
  if (d.chance(0.4)) {
    const i = d.int(1, Math.max(1, parts.length - 3));
    parts[i] = `${parts[i]} ${d.pick(RESIDUE[flavor] ?? RESIDUE.chatgpt)}`;
    tells.push("Citation residue");
  }
  if (d.chance(0.12)) {
    parts.push("<|endoftext|>");
    tells.push("Abrupt <|endoftext|>");
  }
  const long = kit.finish(parts.join("\n\n"), d, tells);
  const short = shortPost(o, kit, d, f);
  return { long, short, tells: [...new Set(tells)] };
}
__name(generate, "generate");
var SHORT_LIMIT = 270;
function shortPost(o, kit, d, f) {
  const hook = f(d.pick(kit.shortHooks));
  const tail = f(d.pick(kit.shortTails));
  const tags = d.some(HASHTAGS, 2).join(" ");
  for (const candidate of [`${hook}

${tail}

${tags}`, `${hook}

${tail}`, hook]) {
    if (candidate.length <= SHORT_LIMIT) return kit.finish(candidate, d, []);
  }
  return kit.finish(hook.slice(0, SHORT_LIMIT - 1).replace(/\s+\S*$/, "") + "\u2026", d, []);
}
__name(shortPost, "shortPost");
var SHORT_SERVICES = /* @__PURE__ */ new Set(["twitter", "bluesky", "threads"]);

// src/slots.ts
var DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function partsIn(tz, at) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short"
  });
  const p = {};
  for (const x of f.formatToParts(new Date(at))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, wd: p.weekday.toLowerCase().slice(0, 3) };
}
__name(partsIn, "partsIn");
function instant(tz, y, m, d, h, mi) {
  const wanted = Date.UTC(y, m - 1, d, h, mi);
  let guess = wanted;
  for (let i = 0; i < 2; i++) {
    const p = partsIn(tz, guess);
    guess += wanted - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
  }
  return guess;
}
__name(instant, "instant");
function openSlots(ch, taken, now, days, max) {
  if (ch.queuePaused) return [];
  let tz = ch.timezone;
  try {
    partsIn(tz, now);
  } catch {
    tz = "UTC";
  }
  const out = [];
  const today = partsIn(tz, now);
  for (let i = 0; i <= days && out.length < max; i++) {
    const noon = instant(tz, today.y, today.m, today.d, 12, 0) + i * 864e5;
    const p = partsIn(tz, noon);
    const day = ch.schedule.find((s) => s.day.toLowerCase().slice(0, 3) === p.wd);
    if (!day || day.paused) continue;
    for (const t of [...day.times].sort()) {
      const [h, mi] = t.split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(mi)) continue;
      const at = instant(tz, p.y, p.m, p.d, h, mi);
      if (at < now + 10 * 6e4 || at > now + (days + 1) * 864e5) continue;
      if (taken.some((x) => Math.abs(x - at) < 12e4)) continue;
      out.push({ channelId: ch.id, at });
      if (out.length >= max) break;
    }
  }
  void DAYS;
  return out;
}
__name(openSlots, "openSlots");

// src/session.ts
var SESSION_TTL = 60 * 60 * 24 * 30;
var COOKIE = "sid";
function readCookie(req, name) {
  for (const part of (req.headers.get("Cookie") ?? "").split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return void 0;
}
__name(readCookie, "readCookie");
function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
__name(cookie, "cookie");
async function loadSession(req, env) {
  const id = readCookie(req, COOKIE);
  if (!id) return null;
  const sealed = await env.SESSIONS.get(`s:${id}`);
  if (!sealed) return null;
  try {
    return { id, data: await unseal(env.TOKEN_KEY, sealed) };
  } catch {
    return null;
  }
}
__name(loadSession, "loadSession");
async function saveSession(env, id, data) {
  await env.SESSIONS.put(`s:${id}`, await seal(env.TOKEN_KEY, data), { expirationTtl: SESSION_TTL });
}
__name(saveSession, "saveSession");
async function createSession(env, data) {
  const id = randomToken(24);
  await saveSession(env, id, data);
  return cookie(COOKIE, id, SESSION_TTL);
}
__name(createSession, "createSession");
async function destroySession(req, env) {
  const id = readCookie(req, COOKIE);
  if (id) await env.SESSIONS.delete(`s:${id}`);
  return cookie(COOKIE, "", 0);
}
__name(destroySession, "destroySession");

// src/page.ts
var esc = /* @__PURE__ */ __name((s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), "esc");
var HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&family=Fraunces:opsz,wght@9..144,500&display=swap">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">`;
var CANNON = `<svg class="cannon" viewBox="0 0 160 100" aria-hidden="true">
  <g class="barrel"><rect x="40" y="22" width="108" height="30" rx="14" transform="rotate(-18 60 50)" fill="var(--ink)"/><rect x="132" y="2" width="16" height="38" rx="6" transform="rotate(-18 60 50)" fill="var(--acc)"/></g>
  <circle cx="56" cy="70" r="26" fill="none" stroke="var(--ink)" stroke-width="8"/><circle cx="56" cy="70" r="6" fill="var(--acc)"/>
  <path d="M56 44v52M30 70h52M38 52l36 36M74 52L38 88" stroke="var(--ink)" stroke-width="4"/>
</svg>`;
function appPage(flavors) {
  const tabs = Object.entries(flavors).map(([k, v], i) => `<button class="flavor${i === 0 ? " on" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-flavor="${esc(k)}">${esc(v)}</button>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
${HEAD}
<title>Slop Cannon</title>
<meta name="description" content="Turn a mundane observation into B2B thought leadership. No AI inside. Then fire it into every open slot in your Buffer queue.">
<meta property="og:title" content="Slop Cannon">
<meta property="og:description" content="AI-flavored thought leadership with zero AI. Fires into your Buffer queue.">
</head>
<body data-flavor="chatgpt" data-mode="drafts">
<div class="flash" aria-hidden="true"></div>
<div class="app">
  <aside class="side" aria-label="Chats">
    <div class="brand"><b>\u2726</b>Slop Cannon</div>
    <button class="sidebtn" id="newChat" type="button">\uFF0B New slop</button>
    <h6>Today</h6>
    <a class="on" href="#" data-say="My coffee went cold during a meeting">Cold coffee \u2192 pipeline insight</a>
    <a href="#" data-say="I couldn't find a parking spot">Parking lot as a metaphor for churn</a>
    <h6>Previous 7 days</h6>
    <a href="#" data-say="My dog ignored me when I called him">What my dog taught me about PLG</a>
    <a href="#" data-say="The microwave beeped three times">Microwave beeps and founder mode</a>
    <a href="#" data-say="The elevator stopped on every floor">The elevator is a sales funnel</a>
    <a href="#" data-say="I tripped on the stairs">I tripped. Here's my GTM strategy.</a>
    <button class="upgrade" id="pro" type="button"><b>\u2728 Upgrade to Slop Max</b>Unlimited em dashes</button>
  </aside>
  <div class="mainc">
    <header class="top">
      <div class="picker" role="tablist" aria-label="Slop flavor">${tabs}</div>
      <div class="who"><button class="iconbtn" id="mute" type="button" aria-pressed="false" aria-label="Sound is on">\u{1F50A}</button><span id="who"></span></div>
    </header>
    <main class="thread" id="thread">
      <section class="hello" id="hello">
        <h1><span>How can I help you today?</span></h1>
        <p>Tell me one mundane thing. I'll turn it into thought leadership and fire it into every open slot in your Buffer queue.</p>
        <div class="chips">
          <button type="button" data-say="My coffee went cold during a meeting">\u2615 Cold coffee</button>
          <button type="button" data-say="The dishwasher finished while I was on a call">\u{1F37D}\uFE0F Dishwasher</button>
          <button type="button" data-say="I parallel parked on the first try">\u{1F697} Parallel parking</button>
        </div>
      </section>
      <div id="chat" aria-live="polite"></div>
    </main>
    <div class="composer">
      <form class="box" id="composer">
        <label class="sr" for="say">Something mundane</label>
        <textarea id="say" rows="1" maxlength="200" placeholder="What mundane thing happened?"></textarea>
        <button class="send" type="submit" aria-label="Make slop">\u2191</button>
      </form>
      <p class="disc">Slop Cannon can make mistakes. That's the point. No AI inside. Not affiliated with OpenAI, Anthropic, Google, xAI or Buffer. <a href="/privacy">Privacy</a></p>
    </div>
  </div>
</div>
<template id="cannonArt">${CANNON}</template>
<div class="toast" id="toast" role="status" hidden></div>
<script src="/app.js"><\/script>
</body>
</html>`;
}
__name(appPage, "appPage");
function privacyPage() {
  return `<!doctype html>
<html lang="en"><head>${HEAD}<title>Slop Cannon privacy</title></head>
<body data-flavor="claude" class="doc"><main class="prose">
<h1>Privacy</h1>
<p>Slop Cannon is a joke with a real Buffer connection, made by L. Beebe, LLC for Buffer Commit.</p>
<p><b>No AI.</b> Every post comes from hand-written templates and a random number. Nothing you type is sent to any AI service, or anywhere but this app.</p>
<p><b>Buffer.</b> When you connect, Buffer gives this app a token to read your organization, channels, posting schedule and scheduled posts, and to create and delete posts. The token is encrypted and kept for 30 days in Cloudflare's storage so you stay connected. Log out to delete it, or revoke the app in Buffer at any time.</p>
<p><b>What it stores.</b> Your session: the token, your organization's name and id, the posts you aimed but haven't fired (for 30 minutes), and the ids of the last posts you fired so Undo works. No analytics, no tracking cookies, no logs of what you typed.</p>
<p><b>What it posts.</b> Only what you fire. By default the cannon fires drafts, which publish nothing. Live rounds go into your real queue and publish at their slot times, unless you undo them first.</p>
<p>Questions: <a href="mailto:me@lbeebe.com">me@lbeebe.com</a>. <a href="/">Back to the cannon</a></p>
</main></body></html>`;
}
__name(privacyPage, "privacyPage");

// src/static.ts
import css from "./4cf7b6d881c670862f5abd64f2fcd768bd248f89-app.css";
import js from "./1ff253a4d4818afd86f6c35b380fd62f24b5103d-app.js";
import icon from "./300c438e97abe328728a02d24b9fd3aa4ff15f61-favicon.svg";
var STATIC = {
  "/app.css": { body: css, type: "text/css; charset=utf-8" },
  "/app.js": { body: js, type: "text/javascript; charset=utf-8" },
  "/favicon.svg": { body: icon, type: "image/svg+xml" }
};

// src/index.ts
var HORIZON_DAYS = 7;
var DEFAULT_QUEUE = 10;
var PER_SHOT = 30;
var SHOTS_PER_HOUR = 6;
var COOL_DOWN_BELOW = 45;
var TEXT_SERVICES = /* @__PURE__ */ new Set(["twitter", "linkedin", "threads", "bluesky", "mastodon", "facebook", "googlebusiness"]);
var TAG = "#SlopCannon";
var UserError = class extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
  status;
  static {
    __name(this, "UserError");
  }
};
var SECURITY = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://auth.buffer.com",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin"
};
function headers(extra = {}) {
  return new Headers({ ...SECURITY, ...extra });
}
__name(headers, "headers");
var html = /* @__PURE__ */ __name((body2, status = 200) => new Response(body2, { status, headers: headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }) }), "html");
var json = /* @__PURE__ */ __name((body2, status = 200, extra = {}) => new Response(JSON.stringify(body2), { status, headers: headers({ "Content-Type": "application/json", "Cache-Control": "no-store", ...extra }) }), "json");
var redirect = /* @__PURE__ */ __name((to, extra = {}) => new Response(null, { status: 302, headers: headers({ Location: to, ...extra }) }), "redirect");
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    try {
      const file = STATIC[url.pathname];
      if (req.method === "GET" && file) return new Response(file.body, { headers: headers({ "Content-Type": file.type, "Cache-Control": "public, max-age=300" }) });
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/app")) return html(appPage(Object.fromEntries(Object.entries(FLAVORS).map(([k, v]) => [k, v.label]))));
      if (req.method === "GET" && url.pathname === "/privacy") return html(privacyPage());
      if (req.method === "GET" && url.pathname === "/connect") return connect(env);
      if (req.method === "GET" && url.pathname === "/callback") return callback(req, env, url);
      if (req.method === "POST" && url.pathname === "/logout") return redirect("/", { "Set-Cookie": await destroySession(req, env) });
      if (url.pathname.startsWith("/api/")) return await api(req, env, url.pathname);
      return html("<!doctype html><title>Not found</title><p>Not found. <a href='/'>Back to the cannon</a></p>", 404);
    } catch (err) {
      console.error(err);
      return json({ error: "Something went wrong." }, 500);
    }
  }
};
async function connect(env) {
  const { verifier, challenge } = await pkcePair();
  const state = randomToken(16);
  await env.SESSIONS.put(`auth:${state}`, verifier, { expirationTtl: 600 });
  return redirect(authorizeUrl(env, state, challenge), { "Set-Cookie": cookie("oauth_state", state, 600) });
}
__name(connect, "connect");
async function callback(req, env, url) {
  const state = url.searchParams.get("state") ?? "";
  const clear = cookie("oauth_state", "", 0);
  if (!state || state !== readCookie(req, "oauth_state")) return redirect("/?error=state", { "Set-Cookie": clear });
  const verifier = await env.SESSIONS.get(`auth:${state}`);
  await env.SESSIONS.delete(`auth:${state}`);
  if (url.searchParams.get("error")) return redirect("/?error=denied", { "Set-Cookie": clear });
  const code = url.searchParams.get("code");
  if (!code || !verifier) return redirect("/?error=expired", { "Set-Cookie": clear });
  const tokens = await exchangeCode(env, code, verifier);
  const existing = await loadSession(req, env);
  const session = existing ? { ...existing.data, tokens } : { tokens };
  const { orgs } = await getOrgs(new BufferClient(env, session));
  session.orgs = orgs.map(({ id, name }) => ({ id, name }));
  if (!orgs.some((o) => o.id === session.organizationId)) {
    session.organizationId = orgs[0]?.id;
    session.organizationName = orgs[0]?.name;
    session.loaded = void 0;
    session.lastVolley = void 0;
  }
  session.queueLimit = orgs.find((o) => o.id === session.organizationId)?.limits?.scheduledPosts;
  const h = headers({ Location: "/?loaded=1", "Cache-Control": "no-store" });
  if (existing) await saveSession(env, existing.id, session);
  else h.append("Set-Cookie", await createSession(env, session));
  h.append("Set-Cookie", clear);
  return new Response(null, { status: 302, headers: h });
}
__name(callback, "callback");
function flavorOf(v) {
  return typeof v === "string" && v in FLAVORS ? v : "chatgpt";
}
__name(flavorOf, "flavorOf");
function observationOf(v) {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length < 3) throw new UserError("Give the cannon something mundane to work with first.");
  if (s.length > 200) throw new UserError("Keep it under 200 characters. Mundane is short.");
  return s;
}
__name(observationOf, "observationOf");
function seedOf(v) {
  return typeof v === "number" && Number.isFinite(v) ? Math.floor(v) >>> 0 : Math.random() * 2 ** 32 >>> 0;
}
__name(seedOf, "seedOf");
async function body(req) {
  const raw = await req.text();
  if (raw.length > 4e3) throw new UserError("That request is too large.", 413);
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new UserError("That request wasn't valid JSON.");
  }
}
__name(body, "body");
async function api(req, env, path) {
  if (req.method === "POST" && req.headers.get("Origin") !== new URL(env.APP_URL).origin) {
    return json({ error: "Requests have to come from the app." }, 403);
  }
  try {
    if (req.method === "POST" && path === "/api/slop") {
      const b = await body(req);
      const flavor = flavorOf(b.flavor);
      return json({ flavor, ...generate(observationOf(b.observation), flavor, seedOf(b.seed)) });
    }
    const loaded = await loadSession(req, env);
    if (path === "/api/me") {
      if (!loaded) return json({ signedIn: false });
      const s2 = loaded.data;
      return json({
        signedIn: true,
        org: s2.organizationName,
        orgs: s2.orgs ?? [],
        organizationId: s2.organizationId,
        lastVolley: s2.lastVolley ? { count: s2.lastVolley.ids.length, live: s2.lastVolley.live, at: s2.lastVolley.at } : null
      });
    }
    if (!loaded) return json({ error: "Connect Buffer to load the cannon." }, 401);
    const s = loaded.data;
    const client = new BufferClient(env, s);
    const save = /* @__PURE__ */ __name(() => saveSession(env, loaded.id, s), "save");
    try {
      if (req.method === "POST" && path === "/api/org") {
        const b = await body(req);
        const org = (s.orgs ?? []).find((o) => o.id === b.id);
        if (!org) throw new UserError("That organization isn't on this Buffer account.");
        const fresh = await getOrgs(client);
        const limit = fresh.orgs.find((o) => o.id === org.id)?.limits?.scheduledPosts;
        Object.assign(s, { organizationId: org.id, organizationName: org.name, queueLimit: limit, loaded: void 0, lastVolley: void 0 });
        await save();
        return json({ ok: true });
      }
      if (req.method === "POST" && path === "/api/aim") {
        const b = await body(req);
        if (!s.organizationId) throw new UserError("This Buffer account has no organization to fire at.");
        const flavor = flavorOf(b.flavor);
        const observation = observationOf(b.observation);
        const tagIt = b.tag !== false;
        const channels = await getChannels(client, s.organizationId);
        const usable = channels.filter((c) => TEXT_SERVICES.has(c.service));
        const skipped = channels.filter((c) => !TEXT_SERVICES.has(c.service)).map((c) => ({ name: c.name, service: c.service, why: "needs an image or video" }));
        const taken = usable.length ? await getTaken(client, s.organizationId, usable.map((c) => c.id)) : [];
        const now = Date.now();
        let shells = [];
        let seed = seedOf(b.seed);
        const queueLimit = s.queueLimit ?? DEFAULT_QUEUE;
        for (const ch of usable) {
          const mine = taken.filter((t) => t.channelId === ch.id);
          const room = Math.max(0, queueLimit - mine.length);
          const slots = room ? openSlots(ch, mine.map((t) => t.at), now, HORIZON_DAYS, room) : [];
          if (!slots.length) {
            skipped.push({ name: ch.name, service: ch.service, why: ch.queuePaused ? "its queue is paused" : !room ? `its queue is full (${queueLimit} on your plan)` : "no open slots this week" });
          }
          for (const slot of slots) {
            const slop = generate(observation, flavor, seed++);
            let text = SHORT_SERVICES.has(ch.service) ? slop.short : slop.long;
            if (tagIt && !text.includes(TAG)) text = SHORT_SERVICES.has(ch.service) && text.length + TAG.length + 1 > 280 ? text : `${text} ${TAG}`;
            shells.push({ channelId: ch.id, service: ch.service, channelName: ch.name, dueAt: new Date(slot.at).toISOString(), text });
          }
        }
        shells.sort((a, b2) => a.dueAt.localeCompare(b2.dueAt));
        shells = shells.slice(0, PER_SHOT);
        s.loaded = { observation, flavor, shells, at: now };
        await save();
        return json({ shells, skipped, horizonDays: HORIZON_DAYS, queueLimit });
      }
      if (req.method === "POST" && path === "/api/fire") {
        const b = await body(req);
        const live = b.live === true;
        if (live && b.confirm !== "FIRE") throw new UserError("Live rounds need the confirm.");
        const plan = s.loaded;
        if (!plan?.shells.length) throw new UserError("Aim first: the cannon is empty.");
        if (Date.now() - plan.at > 30 * 6e4) throw new UserError("That aim is stale. Aim again so the slots are fresh.");
        const recent = (s.shots ?? []).filter((t) => Date.now() - t < 36e5);
        if (recent.length >= SHOTS_PER_HOUR) throw new UserError("The cannon is overheating. Six shots an hour, tops.", 429);
        if (client.remaining !== void 0 && client.remaining < COOL_DOWN_BELOW) throw new UserError("Buffer's API needs a breather. Try again in a few minutes.", 429);
        s.shots = [...recent, Date.now()];
        const ids = [];
        const misses = [];
        const dead = /* @__PURE__ */ new Set();
        for (const shell of plan.shells) {
          if (dead.has(shell.channelId)) continue;
          if (client.remaining !== void 0 && client.remaining < 15) {
            misses.push({ channel: shell.channelName, message: "Stopped early to leave Buffer's API room for everyone else." });
            break;
          }
          try {
            const post = await createPost(client, { channelId: shell.channelId, service: shell.service, text: shell.text, dueAt: shell.dueAt, draft: !live });
            ids.push(post.id);
          } catch (err) {
            if (err instanceof NeedsReconnect || err instanceof RateLimited) throw err;
            dead.add(shell.channelId);
            misses.push({ channel: shell.channelName, message: err instanceof Error ? err.message.replace(/^Buffer API: /, "") : "Buffer said no" });
          }
        }
        s.lastVolley = { ids, live, at: Date.now() };
        s.loaded = void 0;
        await save();
        return json({ landed: ids.length, live, misses });
      }
      if (req.method === "POST" && path === "/api/undo") {
        const v = s.lastVolley;
        if (!v?.ids.length) throw new UserError("Nothing to undo.");
        const left = [];
        for (const id of v.ids) {
          try {
            await deletePost(client, id);
          } catch (err) {
            if (err instanceof NeedsReconnect) throw err;
            if (!(err instanceof Error && /not found|sent/i.test(err.message))) left.push(id);
          }
        }
        s.lastVolley = left.length ? { ...v, ids: left } : void 0;
        await save();
        return json({ deleted: v.ids.length - left.length, left: left.length });
      }
    } finally {
      if (client.sessionChanged) await save();
    }
    return json({ error: "Not found" }, 404);
  } catch (err) {
    if (err instanceof UserError) return json({ error: err.message }, err.status);
    if (err instanceof NeedsReconnect) return json({ error: "Buffer signed you out. Connect again.", reconnect: true }, 401);
    if (err instanceof RateLimited) return json({ error: `Buffer asked the cannon to wait ${err.retryAfterSeconds} seconds.` }, 429);
    throw err;
  }
}
__name(api, "api");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
