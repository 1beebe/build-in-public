import type { Env } from "./env";
import { pkcePair, randomToken } from "./crypto";
import {
  BufferClient,
  NeedsReconnect,
  RateLimited,
  authorizeUrl,
  createDraft,
  createIdea,
  SCOPE_VERSION,
  exchangeCode,
  getChannels,
  getRecent,
  getStart,
  getTags,
  type Org,
  type Tag,
} from "./buffer";
import { RepoError, getSource, parseRepo, whatShipped, type Shipped, type Source } from "./github";
import { hasModel, planQuestions } from "./interview";
import { clip } from "./interview";
import { channelLabel, harvest, opening, reply, harvestArticle, LONGFORM_OPENING } from "./conversation";
import { gptLiveSession, openaiKey, VoiceError } from "./realtime";
import { MindStudioError } from "./mindstudio";
import { storeFeedback } from "./feedback";
import { beginRun, logRun, runsPage } from "./runs";
import { forget, loadMemory, memoryView, recall, remember, setMemoryOn } from "./memory";
import { appPage, landingPage, privacyPage } from "./pages";
import { SpendCapError, countFunnel, countInterview, modelAllowedToday, statsPage, tickVoice, voiceAllowedToday } from "./spend";
import { cookie, createSession, destroySession, loadSession, readCookie, saveSession, type Channel, type HarvestMode, type Session, type Turn } from "./session";

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https://buffer.com",
    "connect-src 'self' https://api.github.com https://api.openai.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; "),
  "Permissions-Policy": "camera=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const responseHeaders = (headers?: HeadersInit): Headers => {
  const out = new Headers(SECURITY_HEADERS);
  if (headers) new Headers(headers).forEach((value, key) => out.set(key, value));
  return out;
};

const html = (body: string, init: ResponseInit = {}) =>
  new Response(body, {
    ...init,
    headers: responseHeaders({ "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8", ...Object.fromEntries(new Headers(init.headers)) }),
  });
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders({ "Cache-Control": "no-store", "Content-Type": "application/json" }),
  });
const redirect = (to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 302, headers: responseHeaders({ "Cache-Control": "no-store", Location: to, ...headers }) });
const textResponse = (body: string, status: number) =>
  new Response(body, { status, headers: responseHeaders({ "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" }) });

class UserError extends Error {}
class UsageLimitError extends Error {}
class RequestTooLarge extends Error {}

const MAX_BODY_BYTES = 64_000;
const MAX_TURN_CHARS = 1_500;
const MAX_TRANSCRIPT_CHARS = 24_000;
const MAX_TURNS = 32;
const TYPED_CALLS_PER_HOUR = 20;
const VOICE_STARTS_PER_HOUR = 4;
const HARVESTS_PER_DAY = 6;
// The owner runs the eval suite against production, which needs more room.
const OWNER_CAP_FACTOR = 10;

function textInput(value: unknown, max: number, tooLong: string): string {
  const text = String(value ?? "").replace(/\0/g, "").trim();
  if (text.length > max) throw new UserError(tooLong);
  return text;
}

function transcriptSize(turns: Session["turns"] = []): number {
  return turns.reduce((n, t) => n + t.text.length, 0);
}

function reserveWindow(list: number[] | undefined, windowMs: number, cap: number, message: string): number[] {
  const now = Date.now();
  const live = (list ?? []).filter((t) => now - t < windowMs);
  if (live.length >= cap) throw new UsageLimitError(message);
  return [...live, now];
}

function boundedTurns(value: unknown, agendaSize: number): NonNullable<Session["turns"]> {
  if (!Array.isArray(value)) return [];
  const out: NonNullable<Session["turns"]> = [];
  let chars = 0;
  for (const raw of (value as Record<string, unknown>[]).slice(0, MAX_TURNS)) {
    const text = String(raw.text ?? "").replace(/\0/g, "").trim().slice(0, MAX_TURN_CHARS);
    if (!text) continue;
    const room = MAX_TRANSCRIPT_CHARS - chars;
    if (room <= 0) break;
    const kept = text.slice(0, room);
    out.push({
      who: raw.who === "you" ? "you" : "interviewer",
      text: kept,
      about: Number.isInteger(raw.about) && (raw.about as number) >= 0 && (raw.about as number) < agendaSize ? (raw.about as number) : undefined,
    });
    chars += kept.length;
  }
  return out;
}

async function limitedBody(req: Request): Promise<string> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RequestTooLarge();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (req.method === "GET" && url.pathname === "/") {
        await countFunnel(env, "view");
        const error = url.searchParams.get("error");
        // Already connected: straight back to their interview, not a second sign-in.
        if (!error && (await loadSession(req, env))) return redirect("/app");
        return html(
          landingPage(
            error === "reconnect"
              ? "Buffer needs you to connect again. Your interview is kept."
              : error === "denied"
                ? "No problem. Nothing was connected."
                : error
                  ? "The Buffer sign-in didn't finish. Try again."
                  : undefined,
          ),
        );
      }
      if (req.method === "GET" && url.pathname === "/privacy") return html(privacyPage());
      if (req.method === "GET" && (url.pathname === "/stats" || url.pathname === "/runs")) {
        if (!(await isOwner(req, env))) return textResponse("Not found", 404);
        const page = url.pathname === "/stats" ? await statsPage(env) : await runsPage(env);
        return html(page, { headers: { "Cache-Control": "no-store" } });
      }
      if (req.method === "GET" && url.pathname === "/connect") return connect(env);
      if (req.method === "GET" && url.pathname === "/callback") return callback(req, env, url);
      if (req.method === "POST" && url.pathname === "/feedback") return feedback(req, env);
      if (req.method === "POST" && url.pathname === "/logout") {
        return redirect("/", { "Set-Cookie": await destroySession(req, env) });
      }
      if (req.method === "GET" && url.pathname === "/app") {
        return (await loadSession(req, env)) ? html(appPage()) : redirect("/");
      }
      if (url.pathname.startsWith("/api/")) return api(req, env, url.pathname);
      return textResponse("Not found", 404);
    } catch (err) {
      console.error(err);
      return textResponse("Something went wrong.", 500);
    }
  },
} satisfies ExportedHandler<Env>;

// Never trust the organization id cached in the session for admin access.
// Re-read the organizations this Buffer grant can actually see.
async function isOwner(req: Request, env: Env): Promise<boolean> {
  const loaded = await loadSession(req, env);
  if (!env.OWNER_ORG_ID || !loaded) return false;
  try {
    const client = new BufferClient(env, loaded.data);
    const { orgs } = await getStart(client);
    if (client.sessionChanged) await saveSession(env, loaded.id, loaded.data);
    return orgs.some((org) => org.id === env.OWNER_ORG_ID);
  } catch {
    return false;
  }
}

async function connect(env: Env): Promise<Response> {
  await countFunnel(env, "connectStart");
  const { verifier, challenge } = await pkcePair();
  const state = randomToken(16);
  // The verifier never leaves the server. The state is also pinned to this
  // browser by cookie, so a callback started elsewhere is refused.
  await env.SESSIONS.put(`auth:${state}`, verifier, { expirationTtl: 600 });
  return redirect(authorizeUrl(env, state, challenge), { "Set-Cookie": cookie("oauth_state", state, 600) });
}

async function callback(req: Request, env: Env, url: URL): Promise<Response> {
  const state = url.searchParams.get("state") ?? "";
  const clear = cookie("oauth_state", "", 0);
  if (!state || state !== readCookie(req, "oauth_state")) return redirect("/?error=state", { "Set-Cookie": clear });
  const verifier = await env.SESSIONS.get(`auth:${state}`);
  await env.SESSIONS.delete(`auth:${state}`);
  if (url.searchParams.get("error") === "access_denied") return redirect("/?error=denied", { "Set-Cookie": clear });
  const code = url.searchParams.get("code");
  if (!code || !verifier) return redirect("/?error=expired", { "Set-Cookie": clear });

  const tokens = await exchangeCode(env, code, verifier);
  // Signing in again keeps their setup and any interview in progress.
  const existing = await loadSession(req, env);
  const session: Session = existing ? { ...existing.data, tokens, scopeVersion: SCOPE_VERSION } : { tokens, scopeVersion: SCOPE_VERSION };
  const { orgs, accountId } = await getStart(new BufferClient(env, session));
  // A different Buffer account signing in on this browser starts clean.
  if (session.accountId && accountId && session.accountId !== accountId) session.keepMemory = false;
  session.accountId = accountId;
  if (!orgs.some((o) => o.id === session.organizationId)) {
    Object.assign(session, { organizationId: undefined, organizationName: undefined, repo: undefined, questions: [], turns: [], drafts: [], saved: [], savedAsIdeas: [] });
  }
  if (orgs.length === 1 && !session.organizationId) Object.assign(session, { organizationId: orgs[0].id, organizationName: orgs[0].name });
  const headers = responseHeaders({ "Cache-Control": "no-store", Location: "/app" });
  if (existing) await saveSession(env, existing.id, session);
  else headers.append("Set-Cookie", (await createSession(env, session)).setCookie);
  await countFunnel(env, "connect");
  headers.append("Set-Cookie", clear);
  return new Response(null, { status: 302, headers });
}

async function feedback(req: Request, env: Env): Promise<Response> {
  if (req.headers.get("Origin") !== new URL(env.APP_URL).origin) return json({ error: "Requests have to come from the app." }, 403);
  const length = Number(req.headers.get("Content-Length") ?? 0);
  if (length > 8_000) return json({ error: "That feedback is too large." }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await limitedBody(req);
    if (new TextEncoder().encode(raw).byteLength > 8_000) return json({ error: "That feedback is too large." }, 413);
    body = JSON.parse(raw || "{}");
  }
  catch { return json({ error: "That feedback wasn't valid." }, 400); }
  if (String(body.website ?? "")) return json({ ok: true }); // quiet honeypot for form bots
  const kind = body.kind === "bug" ? "bug" : "feedback";
  let message: string, contact: string, path: string;
  try {
    message = textInput(body.message, 2_000, "Keep feedback to 2,000 characters or fewer.");
    contact = textInput(body.contact, 200, "Keep contact details to 200 characters or fewer.");
    path = textInput(body.path, 200, "That page path is too long.");
  } catch (err) {
    if (err instanceof UserError) return json({ error: err.message }, 400);
    throw err;
  }
  if (message.length < 5) return json({ error: "Tell me a little more first." }, 400);
  try {
    await storeFeedback(req, env, { createdAt: new Date().toISOString(), kind, message, contact: contact || undefined, path: path || undefined });
  } catch (err) {
    if (err instanceof Error && err.message === "rate") return json({ error: "Thanks—that's enough feedback for today." }, 429);
    throw err;
  }
  await countFunnel(env, "feedback");
  return json({ ok: true });
}

async function api(req: Request, env: Env, path: string): Promise<Response> {
  if (req.method === "POST" && req.headers.get("Origin") !== new URL(env.APP_URL).origin) {
    return json({ error: "Requests have to come from the app." }, 403);
  }
  const length = Number(req.headers.get("Content-Length") ?? 0);
  if (req.method === "POST" && length > MAX_BODY_BYTES) return json({ error: "That request is too large." }, 413);
  const loaded = await loadSession(req, env);
  if (!loaded) return json({ error: "Not connected" }, 401);
  // Saving drafts needs a permission older sign-ins didn't grant. Connecting
  // again keeps their setup and interview.
  if (loaded.data.scopeVersion !== SCOPE_VERSION) return json({ error: "Connect Buffer again." }, 401);
  const { id, data: s } = loaded;
  const client = new BufferClient(env, s);
  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    let raw: string;
    try { raw = await limitedBody(req); }
    catch (err) { if (err instanceof RequestTooLarge) return json({ error: "That request is too large." }, 413); throw err; }
    try {
      body = JSON.parse(raw || "{}") as Record<string, unknown>;
    } catch {
      return json({ error: "That request wasn't valid JSON." }, 400);
    }
  }

  try {
    let result: unknown;
    switch (path) {
      case "/api/state":
        result = await view(env, client, s, true);
        break;
      case "/api/setup": {
        // One input accepts either a public repo or a plain-language note.
        const work = textInput(body.work, 500, "Keep that to 500 characters or fewer.");
        const repo = parseRepo(work) ?? undefined;
        const noRepo = !repo;
        if (noRepo && work.length < 15) throw new UserError("Paste a public GitHub repo, or tell me a sentence or two about what you worked on.");
        if (body.organizationId && String(body.organizationId) !== s.organizationId) {
          const requested = String(body.organizationId);
          const { orgs } = await getStart(client);
          if (!orgs.some((org) => org.id === requested)) throw new UserError("Choose a Buffer organization from your account.");
          s.organizationId = requested;
        }
        if (repo) await whatShipped(env, repo, 1); // fails fast with a clear message if the repo isn't public
        // The channels to shape stories for, from the ones they have connected.
        const connected = new Set((s.channels ?? []).map((c) => c.service));
        const targets = Array.isArray(body.targets) ? [...new Set(body.targets.map(String))].filter((t) => connected.has(t)).slice(0, 6) : undefined;
        // "both" = one longer piece plus standalone short posts from the same talk.
        const longform = (body.longform === true || body.format === "long" || body.format === "both") && longformOffered(env, s);
        const alsoShort = longform && (body.format === "both" || body.alsoShort === true);
        const keepMemory = body.keepMemory === true;
        if (!s.accountId) s.accountId = (await getStart(client)).accountId;
        if (s.accountId) await setMemoryOn(env, s.accountId, keepMemory);
        Object.assign(s, { repo, noRepo, weekNote: repo ? undefined : work, targets, keepLog: body.keepLog !== false, keepMemory, longform, alsoShort, questions: [], turns: [], drafts: [], saved: [], savedAsIdeas: [], harvestMode: undefined });
        result = await view(env, client, s, true);
        break;
      }
      case "/api/start": {
        if ((!s.repo && !s.noRepo) || !s.organizationId) throw new UserError("Finish setup first.");
        // Without a repo, the setup note is all the interviewer has to start from.
        if (!s.repo && (s.weekNote ?? "").trim().length < 15) throw new UserError("Tell me a sentence or two about what you're working on, so I know where to start.");
        const noShip: Shipped = { repo: "", commits: [], pulls: [], issues: [] };
        const began = Date.now();
        // Memory doesn't depend on the repo or posts, so it's read at the same time.
        const [shipped, recent, recalled] = await Promise.all([s.repo ? whatShipped(env, s.repo) : noShip, getRecent(client, s.organizationId), recall(env, s)]);
        const fetched = Date.now() - began;
        s.questions = await planQuestions(shipped, recent, s.weekNote ?? "");
        // If they asked to be remembered, open on what they were in the middle of last time.
        if (recalled.question) s.questions = [recalled.question, ...s.questions].slice(0, 5);
        s.posts = recent.posts.map((p) => p.slice(0, 300));
        s.brief = [
          s.repo
            ? [
                `Repo: ${shipped.repo}${shipped.description ? ` — ${shipped.description}` : ""}`,
                shipped.readme ? `What the project is, from the start of its README (their own description; use it to know what they're building and for whom): ${shipped.readme.slice(0, 1500)}` : "",
                shippedSummary(shipped) ? `What they shipped lately (newest first):\n${shippedSummary(shipped)}` : "",
                buildNotes(shipped),
                TECH_DEPTH,
              ].filter(Boolean).join("\n")
            : "They don't have a GitHub repo for this. Everything you know about their work is what they told you below, so let them show you around it.",
          s.weekNote ? `What they said they worked on this week: ${s.weekNote}` : "They didn't add a note about their week (that's optional; it doesn't mean they did nothing).",
          ...(() => {
            const where = s.targets ?? mainServices(s.channels ?? []);
            return where.length
              ? [`They publish on ${where.map(channelLabel).join(", ")}. Without saying so, lean toward moments that would make a good story there: a scene, a choice, something they could show.`]
              : [];
          })(),
          `Their recent posts, newest first. They show who they are, what they care about and who they write for. Use them to show you know them and to connect what they say now to what they've said before:`,
          ...recent.posts.slice(0, 8).map((p) => `- ${p.slice(0, 200)}`),
        ].join("\n");
        if (recalled.brief) s.brief += `\n${recalled.brief}`;
        if (s.longform) s.brief += "\nThey chose to work on one longer piece today, like a newsletter issue or an article. The piece is the topic; their repo, threads and posts are what you know about them, to draw on whenever it connects.";
        if (s.alsoShort) s.brief += "\nThey also want a few standalone short posts from this conversation. Go deep on the piece, but when a side story comes up (a decision, a surprise, a moment with a user) that could stand on its own, take one easy follow-up on it before coming back to the piece.";
        // Long-form opens on something they've said lately, so it's clear the interviewer knows them.
        const lately = recent.posts[0] ? clip(recent.posts[0].replace(/\s+/g, " "), 70) : "";
        const first = s.longform
          ? { who: "interviewer" as const, text: lately ? `Tell me about the piece you want to write. Is it about something you've posted lately, like "${lately}", or something new?` : LONGFORM_OPENING }
          : !recalled.question && hasModel(env)
            ? await modelOpener(env, s)
            : opening(s.questions);
        console.log(`start timings: fetch ${fetched}ms, total ${Date.now() - began}ms`);
        Object.assign(s, { turns: [first], drafts: [], saved: [], savedAsIdeas: [], voice: undefined });
        beginRun(s);
        await logRun(env, s, (r) => r.events.push({ at: new Date().toISOString(), what: `started with ${s.questions?.length ?? 0} threads${s.longform ? ", long-form" : ""}` }));
        await countInterview(env);
        result = await view(env, client, s);
        break;
      }
      case "/api/say": {
        const text = textInput(body.text, MAX_TURN_CHARS, `Keep each answer to ${MAX_TURN_CHARS.toLocaleString()} characters or fewer.`);
        if (!text) throw new UserError("Say something first.");
        if (!s.questions?.length || !s.turns) throw new UserError("Start an interview first.");
        if (s.turns.length >= MAX_TURNS || transcriptSize(s.turns) + text.length > MAX_TRANSCRIPT_CHARS) {
          throw new UserError("That's a full interview. Find your stories, then start a new one.");
        }
        // Last words typed before "Find my stories": keep them, no reply needed.
        if (body.final === true) {
          s.turns.push({ who: "you", text });
          await logRun(env, s, (r) => r.events.push({ at: new Date().toISOString(), what: "kept unsent words before finding stories" }));
          result = await view(env, client, s);
          break;
        }
        if (hasModel(env)) {
          if (!(await modelAllowedToday(env, "typed"))) throw new UsageLimitError("Typed interviews are resting for today. Try again tomorrow.");
          s.typedStarts = reserveWindow(s.typedStarts, 3600_000, TYPED_CALLS_PER_HOUR * capFactor(env, s), "That's a lot of answers in one hour. Take a short break, then continue.");
          await saveSession(env, id, s); // reserve before the paid call
        }
        s.turns.push({ who: "you", text });
        const asked = Date.now();
        const { fallback, ...next } = await reply(env, s.questions, s.turns, s.brief ?? "", s.longform);
        s.turns.push(next);
        await logRun(env, s, (r) => r.events.push({ at: new Date().toISOString(), what: fallback ? "typed reply FAILED, used the canned agenda question" : "typed reply", ms: Date.now() - asked }));
        result = { ...(await view(env, client, s)), replyFallback: Boolean(fallback), replyMs: Date.now() - asked };
        break;
      }
      case "/api/live": {
        // The page posts its WebRTC offer and gets the GPT-Live answer.
        if (!openaiKey(env)) throw new UserError("Live voice isn't turned on yet. Type instead.");
        if (!s.questions?.length) throw new UserError("Start an interview first.");
        const sdp = textInput(body.sdp, 16_000, "The voice connection request was too large. Try again.");
        if (!sdp.startsWith("v=")) throw new UserError("The voice connection didn't start. Try again.");
        // textInput trims, and an SDP must end with CRLF or OpenAI rejects it ("unmarshal SDP: EOF").
        const offer = sdp.endsWith("\r\n") ? sdp : sdp + "\r\n";
        const now = Date.now();
        s.voiceStarts = reserveWindow(s.voiceStarts, 3600_000, VOICE_STARTS_PER_HOUR, "That's a lot of voice sessions in one hour. Type for now, or come back in a bit.");
        if (!(await voiceAllowedToday(env))) throw new UserError(VOICE_RESTING);
        await saveSession(env, id, s); // reserve before the paid session
        try {
          result = await gptLiveSession(env, s, offer);
        } catch (err) {
          // OpenAI refused before any audio, so nothing was spent: give the start back.
          if (err instanceof VoiceError) { s.voiceStarts = s.voiceStarts?.slice(0, -1); await saveSession(env, id, s); }
          throw err;
        }
        s.voice = { kind: "gpt-live", startedAt: now, counted: 0 };
        await logRun(env, s, (r) => r.events.push({ at: new Date().toISOString(), what: "voice started" }));
        break;
      }
      case "/api/voice-turns": {
        // The live conversation's transcript, sent from the page as it goes.
        if (!s.turns) throw new UserError("Start an interview first.");
        const agendaSize = s.questions?.length ?? 0;
        s.turns = boundedTurns(body.turns, agendaSize);
        await tickVoice(env, s.voice);
        // The page sends these often; keep the run's copy at most a minute behind.
        if (!s.runLoggedAt || Date.now() - s.runLoggedAt > 60_000) {
          s.runLoggedAt = Date.now();
          await logRun(env, s, () => {});
        }
        result = { ok: true };
        break;
      }
      case "/api/harvest": {
        if (!s.turns?.some((t) => t.who === "you")) throw new UserError("Answer at least one question first.");
        // A story draft or an outline they'll write themselves. The transcript
        // option never reaches here: the page builds it.
        const mode: HarvestMode = body.mode === "outline" ? "outline" : "draft";
        if (s.drafts?.length && (s.harvestMode ?? "draft") === mode && (s.harvestedTurns ?? s.turns.length) === s.turns.length) {
          result = await view(env, client, s); // idempotent: never pay twice for the same transcript
          break;
        }
        if (hasModel(env)) {
          if (!(await modelAllowedToday(env, "harvest"))) throw new UsageLimitError("Idea harvesting is resting for today. Your interview is saved; try again tomorrow.");
          s.harvestStarts = reserveWindow(s.harvestStarts, 86400_000, HARVESTS_PER_DAY * capFactor(env, s), "You've harvested several interviews today. Your conversation is saved; try again tomorrow.");
          await saveSession(env, id, s); // reserve before the paid call
        }
        const pillars = s.tags ?? [];
        await tickVoice(env, s.voice);
        s.voice = undefined; // the conversation's over; stop the meter
        const began = Date.now();
        if (s.longform && s.alsoShort) {
          // Both at once: the piece and its share posts, then standalone posts from the same talk.
          const [piece, short] = await Promise.all([
            harvestArticle(env, s.turns, s.posts, s.targets ?? [], mode),
            harvest(env, s.questions ?? [], s.turns, pillars, s.posts, s.targets ?? [], mode),
          ]);
          s.drafts = [...piece, ...short];
        } else {
          s.drafts = s.longform
            ? await harvestArticle(env, s.turns, s.posts, s.targets ?? [], mode)
            : await harvest(env, s.questions ?? [], s.turns, pillars, s.posts, s.targets ?? [], mode);
        }
        s.harvestMode = mode;
        s.harvestedTurns = s.turns.length;
        await remember(env, s, s.drafts ?? []);
        await logRun(env, s, (r) => r.harvests.push({
          at: new Date().toISOString(),
          mode: s.longform ? `long-form ${mode}` : mode,
          ms: Date.now() - began,
          drafts: (s.drafts ?? []).map(({ title, channel, format, flags, text, later }) => ({ title, channel, format, flags, text, later })),
        }));
        s.saved = [];
        s.savedAsIdeas = [];
        result = await view(env, client, s);
        break;
      }
      case "/api/more": {
        // They found few stories and want to keep talking: the interviewer
        // comes back with a fresh angle, and the next harvest reads it all.
        if (!s.turns?.some((t) => t.who === "you")) throw new UserError("Start an interview first.");
        if (hasModel(env)) {
          if (!(await modelAllowedToday(env, "typed"))) throw new UsageLimitError("Typed interviews are resting for today. Try voice, or come back tomorrow.");
          s.typedStarts = reserveWindow(s.typedStarts, 3600_000, TYPED_CALLS_PER_HOUR * capFactor(env, s), "That's a lot of answers in one hour. Take a short break, then continue.");
          await saveSession(env, id, s);
        }
        const found = (s.drafts ?? []).filter((d) => !d.later).length;
        const note = s.longform
          ? `\n\nThey just read the draft of their piece and came back to keep talking. Welcome them back in a few words, without recapping, and ask one easy, open question about a part of the piece that's still thin.`
          : `\n\nThey just looked for stories and found ${found === 1 ? "only one" : found === 0 ? "none yet" : `only ${found}`}, so they came back to keep talking. Welcome them back in a few words, without recapping, and ask one easy, open question from a fresh angle you haven't covered yet.`;
        const { fallback, wrapUp: _ended, ...next } = await reply(env, s.questions ?? [], s.turns, (s.brief ?? "").slice(0, 12000) + note, s.longform);
        s.turns.push(next);
        s.drafts = []; // back to talking: a reload lands on the conversation, and the next harvest reads it all
        await logRun(env, s, (r) => r.events.push({ at: new Date().toISOString(), what: fallback ? "keep talking, reply FAILED" : "keep talking" }));
        result = { ...(await view(env, client, s)), replyFallback: Boolean(fallback) };
        break;
      }
      case "/api/save": {
        // The reviewed drafts, as edited on the page. Saved one by one, so a
        // rate limit part way through keeps what's done and says so.
        const picked = Array.isArray(body.drafts) ? (body.drafts as Record<string, unknown>[]).slice(0, 12) : [];
        if (!picked.length) throw new UserError("Pick at least one story to save.");
        const savedBefore = s.saved?.length ?? 0;
        for (const d of picked) {
          const draft = s.drafts?.find((x) => x.id === d.id);
          if (!draft || s.saved?.includes(draft.id)) continue; // a double click must not create a second Idea
          const title = String(d.title ?? draft.title).trim().slice(0, 200);
          const words = textInput(d.text ?? draft.text, 10_000, "Keep each piece to 10,000 characters or fewer. For a longer article, copy or download it instead.");
          if (!words) continue;
          // Their words first, then the shaping questions, clearly set apart.
          const prompts = (Array.isArray(d.prompts) ? d.prompts : draft.prompts ?? []).map((q) => String(q).trim().slice(0, 200)).filter(Boolean).slice(0, 5);
          const tags = (s.tags ?? []).filter((t) => t.id === d.tagId);
          const day = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const where = draft.format ? `${channelLabel(draft.channel)} · ${draft.format}` : "";
          const text = draft.later
            ? words
            : [
                `INTERVIEW ${day} | ${s.harvestMode === "outline" ? "outline in your words" : "story draft from your words, lightly edited"}${where ? ` | ${where}` : ""}`,
                draft.why ? `WHY THIS SHAPE: ${draft.why}` : "",
                words,
                prompts.length ? `QUESTIONS TO FINISH OR ADAPT IT\n${prompts.map((q) => `- ${q}`).join("\n")}` : "",
              ].filter(Boolean).join("\n\n");
          if (client.nearLimit) throw new RateLimited(60);
          const ideaTitle = draft.later || /^INTERVIEW \|/.test(title) ? title : `INTERVIEW | ${draft.article ? "Article | " : where ? `${where} | ` : ""}${title}`;
          // Each story goes to its channel's Drafts in Buffer, ready to edit and
          // schedule. Outlines carry their questions; drafts stay clean to post.
          const channel = (s.channels ?? []).find((c) => c.service === draft.channel) ??
            (s.channels ?? []).find((c) => c.service === (s.targets ?? [])[0]) ?? (s.channels ?? [])[0];
          const draftText = draft.later
            ? `${title}\n\n${words}`
            : s.harvestMode === "outline" && prompts.length
              ? `${words}\n\nQuestions to finish it:\n${prompts.map((q) => `- ${q}`).join("\n")}`
              : words;
          let asDraft = false;
          // The long-form piece itself can't be a Buffer post: it's kept as an Idea.
          if (channel && !draft.article) {
            try {
              await createDraft(client, { channelId: channel.id, service: channel.service, text: draftText, format: draft.format, tagIds: tags.map((t) => t.id) });
              asDraft = true;
            } catch (err) {
              if (err instanceof RateLimited || err instanceof NeedsReconnect) throw err;
              console.error("draft refused, saving as an Idea", err);
              await logRun(env, s, (r) => r.events.push({ at: new Date().toISOString(), what: `draft refused for ${channel.service}, saved as Idea: ${String(err).slice(0, 160)}` }));
            }
          }
          if (!asDraft) {
            await createIdea(client, s.organizationId!, {
              title: ideaTitle,
              text,
              tags,
              services: draft.channel ? [draft.channel] : undefined,
              aiAssisted: true, // their words, but the AI chose and arranged them
            });
            if (!draft.article) (s.savedAsIdeas ??= []).push(draft.id);
          }
          (s.saved ??= []).push(draft.id);
          await saveSession(env, id, s);
        }
        if ((s.saved?.length ?? 0) > savedBefore) {
          await countFunnel(env, "save");
          const titles = (s.drafts ?? []).filter((d) => s.saved?.includes(d.id)).map((d) => d.title);
          await logRun(env, s, (r) => (r.saved = titles));
        }
        result = await view(env, client, s);
        break;
      }
      case "/api/source": {
        const q = s.questions?.find((x) => x.id === new URL(req.url).searchParams.get("q"));
        if (!q?.ref || !s.repo) throw new UserError("Nothing to show for this question.");
        return json(await source(env, s.repo, q.ref)); // read-only: the session doesn't change
      }
      case "/api/memory/forget": {
        // One remembered item, or with no id, the whole memory.
        if (!s.accountId) throw new UserError("There's nothing remembered yet.");
        const entryId = body.id ? String(body.id).slice(0, 40) : undefined;
        if (!entryId && body.all !== true) throw new UserError("Choose what to forget.");
        await forget(env, s.accountId, entryId);
        if (!entryId) s.keepMemory = false;
        result = await view(env, client, s);
        break;
      }
      case "/api/reset":
        Object.assign(s, { questions: [], turns: [], drafts: [], saved: [], savedAsIdeas: [], brief: undefined, voice: undefined, harvestMode: undefined, runKey: undefined });
        result = await view(env, client, s);
        break;
      default:
        return json({ error: "Not found" }, 404);
    }
    await saveSession(env, id, s);
    return json(result);
  } catch (err) {
    if (client.sessionChanged) await saveSession(env, id, s); // never lose a rotated refresh token
    if (err instanceof NeedsReconnect) return json({ error: "Connect Buffer again." }, 401);
    if (err instanceof RateLimited) {
      const mins = Math.max(1, Math.ceil(err.retryAfterSeconds / 60));
      return json({ error: `Buffer needs a short break. Try again in about ${mins} minute${mins > 1 ? "s" : ""}. Nothing was lost.` }, 429);
    }
    if (err instanceof UsageLimitError) return json({ error: err.message }, 429);
    if (err instanceof UserError || err instanceof RepoError) return json({ error: err.message }, 400);
    if (err instanceof SpendCapError) {
      console.error("OpenAI spend limit reached", err.message);
      return json({ error: VOICE_RESTING }, 503);
    }
    // Log the message on its own line: Workers logs can split a stack from its message.
    console.error(`${req.method} ${new URL(req.url).pathname} failed: ${err instanceof Error ? err.message : String(err)}`);
    if (err instanceof VoiceError) {
      console.error(err);
      return json({ error: "The voice connection didn't start. Try again, or type your answer below." }, 502);
    }
    if (err instanceof MindStudioError) {
      console.error(err);
      return json({ error: "The Interviewer didn't answer. Try again, or type your answer." }, 502);
    }
    console.error(err);
    return json({ error: "Something went wrong on our side. Try again." }, 502);
  }
}

// Public GitHub data, cached for an hour so flipping between questions doesn't
// spend GitHub's 60-an-hour limit for unauthenticated reads.
async function source(env: Env, repo: string, ref: NonNullable<Session["questions"]>[number]["ref"] & {}): Promise<Source> {
  if (ref.kind === "post") return { kind: "post", title: "Your latest Buffer post", body: ref.key, files: [] };
  const cacheKey = `src:${repo}:${ref.kind}:${ref.key}`;
  const cached = await env.SESSIONS.get<Source>(cacheKey, "json");
  if (cached) return cached;
  const fresh = await getSource(env, repo, ref.kind, ref.key);
  await env.SESSIONS.put(cacheKey, JSON.stringify(fresh), { expirationTtl: 3600 });
  return fresh;
}

// What the page needs to draw itself. Tags are re-read from Buffer when the page
// loads or setup changes, so a tag renamed in Buffer shows up; answering a
// question reuses them, which keeps each saved answer to one Buffer request.
async function view(env: Env, client: BufferClient, s: Session, refresh = false) {
  let orgs: Org[] = [];
  if (refresh && (!s.organizationId || !s.repo)) orgs = (await getStart(client)).orgs;
  if (!s.organizationId && orgs.length) s.organizationId = orgs[0].id;
  if (s.organizationId && (refresh || !s.tags)) s.tags = await getTags(client, s.organizationId);
  // Channels are re-read only while they're setting up, to spare Buffer calls.
  if (s.organizationId && (!s.channels || (refresh && !s.questions?.length))) {
    try {
      s.channels = await getChannels(client, s.organizationId);
    } catch (err) {
      console.error("channels unavailable", err);
      s.channels ??= [];
    }
  }
  const tags: Tag[] = s.tags ?? [];
  const channels = s.channels ?? [];
  return {
    orgs,
    organizationId: s.organizationId,
    repo: s.repo,
    noRepo: Boolean(s.noRepo),
    tags,
    weekNote: s.weekNote ?? "",
    keepLog: s.keepLog !== false,
    memory: memoryView(s.accountId ? await loadMemory(env, s.accountId) : null),
    channels: channels.map((c) => ({ service: c.service, name: c.name, label: channelLabel(c.service) })),
    targets: s.targets ?? mainServices(channels),
    harvestMode: s.harvestMode ?? "draft",
    longform: Boolean(s.longform),
    alsoShort: Boolean(s.alsoShort),
    longformOffered: longformOffered(env, s),
    questions: s.questions ?? [],
    turns: s.turns ?? [],
    drafts: s.drafts ?? [],
    saved: s.saved ?? [],
    savedAsIdeas: s.savedAsIdeas ?? [],
    live: Boolean(openaiKey(env)),
  };
}

// Long-form is the owner's to try first; LONGFORM=on offers it to everyone.
// The organization id is chosen from their own Buffer organizations at setup.
// Without a repo, a canned opener can only quote their note back. Let the
// interviewer open the way a friend would, from what they wrote.
// The first question, written by the model so it sounds like a person who
// read up, not a template around a PR title. Falls back to the rule-based one.
async function modelOpener(env: Env, s: Session): Promise<Turn> {
  const note = s.repo
    ? "\n\nThis is the very start of the conversation. Say hi in a few words like a friend catching up, show you've looked at their work by naming one specific thing they shipped lately in plain words (what it does for people; never a PR title, number, commit hash or file name, and skip housekeeping like docs syncs or version bumps), and ask one easy, open question about it."
    : "\n\nThis is the very start of the conversation. Say hi in a few words like a friend catching up, show you've read what they wrote by naming one specific thing from their note in your own words (never quote it back), and ask one easy, open question about it.";
  const { fallback, wrapUp: _w, ...first } = await reply(env, s.questions ?? [], [], (s.brief ?? "") + note, false);
  if (fallback && s.repo) return opening(s.questions ?? []);
  return { ...first, about: first.about ?? 0 };
}

// How deep to go on the build is their call, asked once. The interviewer
// asks about choices and tradeoffs, never how the code works: people who
// built with AI often can't (and shouldn't have to) explain implementation.
const TECH_DEPTH = `Technical depth is their choice. Within your first two or three questions, ask once, in your own words, whether they want to get into the technical decisions behind it or keep it big picture. If they say technical, use the build notes: ask why they chose one approach over another, what they tried first, what they dropped, a tradeoff they made, naming the specific thing in plain words. If they say big picture, leave the build notes alone unless they bring it up. Either way, never ask how the code works, how something is implemented or what a file does. Ask about decisions, not mechanics. If they change their mind later, follow them.`;

// What the build looks like under the hood: recent PR descriptions, the rest
// of the README and the repo's top level. Background for technical questions.
function buildNotes(shipped: Shipped): string {
  const clean = (t: string) => t.replace(/```[\s\S]*?```/g, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/^.*(Co-Authored-By|Generated with|claude\.ai\/code).*$/gim, "").replace(/[#*`>|]/g, "").replace(/\s+/g, " ").trim();
  const prs = shipped.pulls.filter((p) => clean(p.body).length > 40).slice(0, 6).map((p) => `- ${p.title}: ${clean(p.body).slice(0, 450)}`);
  const more = (shipped.readme ?? "").slice(1500, 4500).trim();
  const parts = [
    prs.length ? `Why they made recent changes, from their pull request descriptions:\n${prs.join("\n")}` : "",
    more ? `How it works, from further down the README: ${more}` : "",
    shipped.layout?.length ? `Top level of the repo: ${shipped.layout.join(", ")}` : "",
  ].filter(Boolean);
  return parts.length ? `Build notes (background for technical questions; never read file names or code aloud):\n${parts.join("\n")}` : "";
}

// A short list of recent work for the brief, beyond the few threads on the agenda.
function shippedSummary(shipped: Shipped): string {
  return [
    ...shipped.pulls.map((p) => `- PR: ${p.title}`),
    ...shipped.commits.map((c) => `- Commit: ${c.message.split("\n")[0]}`),
  ].slice(0, 15).map((l) => l.slice(0, 140)).join("\n");
}

function capFactor(env: Env, s: Session): number {
  return env.OWNER_ORG_ID && s.organizationId === env.OWNER_ORG_ID ? OWNER_CAP_FACTOR : 1;
}

function longformOffered(env: Env, s: Session): boolean {
  return env.LONGFORM === "on" || Boolean(env.OWNER_ORG_ID && s.organizationId === env.OWNER_ORG_ID);
}

// Where they actually publish: services with recent posts, busiest first. If
// they haven't posted lately, every connected channel.
function mainServices(channels: Channel[]): string[] {
  const counts = new Map<string, number>();
  for (const c of channels) counts.set(c.service, (counts.get(c.service) ?? 0) + c.posts);
  const used = [...counts].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return (used.length ? used : [...counts.keys()]).slice(0, 4);
}

const VOICE_RESTING = "Voice is resting for today. Type your answers instead; it works the same.";
