import type { Env } from "./env";
import { pkcePair, randomToken } from "./crypto";
import {
  BufferClient,
  NeedsReconnect,
  RateLimited,
  authorizeUrl,
  createIdea,
  exchangeCode,
  getRecent,
  getStart,
  getTags,
  type Org,
  type Tag,
} from "./buffer";
import { RepoError, getSource, parseRepo, whatShipped, type Source } from "./github";
import { planQuestions } from "./interview";
import { harvest, opening, reply } from "./conversation";
import { openaiKey, voiceSession } from "./realtime";
import { MindStudioError, speak, transcribe } from "./mindstudio";
import { appPage, landingPage, privacyPage } from "./pages";
import { cookie, createSession, destroySession, loadSession, readCookie, saveSession, type Session } from "./session";

const html = (body: string, init: ResponseInit = {}) =>
  new Response(body, { ...init, headers: { "Content-Type": "text/html; charset=utf-8", ...init.headers } });
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const redirect = (to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 302, headers: { Location: to, ...headers } });

class UserError extends Error {}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (req.method === "GET" && url.pathname === "/") {
        const error = url.searchParams.get("error");
        return html(
          landingPage(
            error === "reconnect"
              ? "Your Buffer connection expired. Connect again to keep going."
              : error === "denied"
                ? "No problem. Nothing was connected."
                : error
                  ? "The Buffer sign-in didn't finish. Try again."
                  : undefined,
          ),
        );
      }
      if (req.method === "GET" && url.pathname === "/privacy") return html(privacyPage());
      if (req.method === "GET" && url.pathname === "/connect") return connect(env);
      if (req.method === "GET" && url.pathname === "/callback") return callback(req, env, url);
      if (req.method === "POST" && url.pathname === "/logout") {
        return redirect("/", { "Set-Cookie": await destroySession(req, env) });
      }
      if (req.method === "GET" && url.pathname === "/app") {
        return (await loadSession(req, env)) ? html(appPage()) : redirect("/");
      }
      if (req.method === "GET" && url.pathname.startsWith("/audio/")) return audio(env, url.pathname.slice(7));
      if (url.pathname.startsWith("/api/")) return api(req, env, url.pathname);
      return new Response("Not found", { status: 404 });
    } catch (err) {
      console.error(err);
      return new Response("Something went wrong.", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

async function connect(env: Env): Promise<Response> {
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
  const session: Session = { tokens };
  const { orgs } = await getStart(new BufferClient(env, session));
  if (orgs.length === 1) Object.assign(session, { organizationId: orgs[0].id, organizationName: orgs[0].name });
  const { setCookie } = await createSession(env, session);
  const headers = new Headers({ Location: "/app" });
  headers.append("Set-Cookie", setCookie);
  headers.append("Set-Cookie", clear);
  return new Response(null, { status: 302, headers });
}

async function api(req: Request, env: Env, path: string): Promise<Response> {
  if (req.method === "POST" && req.headers.get("Origin") !== new URL(env.APP_URL).origin) {
    return json({ error: "Requests have to come from the app." }, 403);
  }
  const loaded = await loadSession(req, env);
  if (!loaded) return json({ error: "Not connected" }, 401);
  const { id, data: s } = loaded;
  const client = new BufferClient(env, s);
  const isAudio = path === "/api/transcribe";
  const body = req.method === "POST" && !isAudio ? ((await req.json().catch(() => ({}))) as Record<string, unknown>) : {};

  try {
    let result: unknown;
    switch (path) {
      case "/api/state":
        result = await view(env, client, s, true);
        break;
      case "/api/setup": {
        const repo = parseRepo(String(body.repo ?? ""));
        if (!repo) throw new UserError("Paste a GitHub repo link, like github.com/you/project.");
        const ids = Array.isArray(body.pillarTagIds) ? body.pillarTagIds.map(String).slice(0, 3) : [];
        if (!ids.length) throw new UserError("Pick at least one pillar.");
        if (body.organizationId) s.organizationId = String(body.organizationId);
        await whatShipped(env, repo, 1); // fails fast with a clear message if the repo isn't public
        Object.assign(s, { repo, pillarTagIds: ids, questions: [], turns: [], drafts: [], saved: [] });
        result = await view(env, client, s, true);
        break;
      }
      case "/api/start": {
        if (!s.repo || !s.organizationId) throw new UserError("Finish setup first.");
        s.weekNote = String(body.weekNote ?? "").slice(0, 500);
        const [shipped, recent] = await Promise.all([whatShipped(env, s.repo), getRecent(client, s.organizationId)]);
        s.questions = await planQuestions(env, shipped, recent, s.weekNote);
        s.brief = [
          `Repo: ${shipped.repo}${shipped.description ? ` — ${shipped.description}` : ""}`,
          `What they said they worked on this week: ${s.weekNote || "(nothing)"}`,
          `Their recent posts, newest first (don't steer back to these):`,
          ...recent.posts.slice(0, 5).map((p) => `- ${p.slice(0, 200)}`),
        ].join("\n");
        Object.assign(s, { turns: [opening(s.questions)], drafts: [], saved: [] });
        result = await view(env, client, s);
        break;
      }
      case "/api/say": {
        const text = String(body.text ?? "").trim().slice(0, 4000);
        if (!text) throw new UserError("Say something first.");
        if (!s.questions?.length || !s.turns) throw new UserError("Start an interview first.");
        if ((s.turns.length ?? 0) > MAX_TURNS) throw new UserError("That's a long interview. Pull your ideas together, then start a new one.");
        s.turns.push({ who: "you", text });
        s.turns.push(await reply(env, s.questions, s.turns, s.brief ?? ""));
        result = await view(env, client, s);
        break;
      }
      case "/api/voice": {
        if (!openaiKey(env)) throw new UserError("Live voice isn't turned on yet. Type instead.");
        if (!s.questions?.length) throw new UserError("Start an interview first.");
        // A few live sessions an hour per person keeps the voice bill sane.
        const now = Date.now();
        s.voiceStarts = (s.voiceStarts ?? []).filter((t) => now - t < 3600_000);
        if (s.voiceStarts.length >= 6) throw new UserError("That's a lot of talking for one hour. Type for now, or come back in a bit.");
        s.voiceStarts.push(now);
        result = await voiceSession(env, s);
        break;
      }
      case "/api/voice-turns": {
        // The live conversation's transcript, sent from the page as it goes.
        if (!s.turns) throw new UserError("Start an interview first.");
        const turns = Array.isArray(body.turns) ? (body.turns as Record<string, unknown>[]).slice(0, MAX_TURNS) : [];
        const agendaSize = s.questions?.length ?? 0;
        s.turns = turns
          .map((t) => ({
            who: t.who === "you" ? ("you" as const) : ("interviewer" as const),
            text: String(t.text ?? "").trim().slice(0, 4000),
            about: Number.isInteger(t.about) && (t.about as number) >= 0 && (t.about as number) < agendaSize ? (t.about as number) : undefined,
          }))
          .filter((t) => t.text);
        result = { ok: true };
        break;
      }
      case "/api/harvest": {
        if (!s.turns?.some((t) => t.who === "you")) throw new UserError("Answer at least one question first.");
        const pillars = (s.tags ?? []).filter((t) => (s.pillarTagIds ?? []).includes(t.id));
        s.drafts = await harvest(env, s.questions ?? [], s.turns, pillars);
        s.saved = [];
        result = await view(env, client, s);
        break;
      }
      case "/api/save": {
        // The reviewed drafts, as edited on the page. Saved one by one, so a
        // rate limit part way through keeps what's done and says so.
        const picked = Array.isArray(body.drafts) ? (body.drafts as Record<string, unknown>[]).slice(0, 12) : [];
        if (!picked.length) throw new UserError("Pick at least one idea to save.");
        for (const d of picked) {
          const draft = s.drafts?.find((x) => x.id === d.id);
          if (!draft || s.saved?.includes(draft.id)) continue; // a double click must not create a second Idea
          const title = String(d.title ?? draft.title).trim().slice(0, 200);
          const words = String(d.text ?? draft.text).trim();
          if (!words) continue;
          // Their words first, then the shaping questions, clearly set apart.
          const prompts = (Array.isArray(d.prompts) ? d.prompts : draft.prompts ?? []).map((q) => String(q).trim()).filter(Boolean).slice(0, 5);
          const text = prompts.length ? `${words}\n\n—\nTo shape this into a post:\n${prompts.map((q) => `• ${q}`).join("\n")}` : words;
          if (client.nearLimit) throw new RateLimited(60);
          await createIdea(client, s.organizationId!, {
            title,
            text,
            tags: (s.tags ?? []).filter((t) => t.id === d.tagId),
            aiAssisted: Boolean(draft.later), // their own words otherwise; the AI only named the angle
          });
          (s.saved ??= []).push(draft.id);
          await saveSession(env, id, s);
        }
        result = await view(env, client, s);
        break;
      }
      case "/api/speak": {
        if (!env.MINDSTUDIO_API_KEY) throw new UserError("Voice isn't turned on yet.");
        const last = [...(s.turns ?? [])].reverse().find((t) => t.who === "interviewer");
        if (!last) throw new UserError("Nothing to say yet.");
        result = { audioUrl: await speak(env, last.text) };
        break;
      }
      case "/api/transcribe": {
        if (!env.MINDSTUDIO_API_KEY) throw new UserError("Voice isn't turned on yet.");
        const bytes = await req.arrayBuffer();
        if (!bytes.byteLength) throw new UserError("That recording came through empty. Try again.");
        if (bytes.byteLength > 15_000_000) throw new UserError("That recording is too long. Try a shorter answer.");
        // The recording is held only long enough for MindStudio to fetch it,
        // behind a random link, then deleted.
        const key = randomToken(24);
        const type = (req.headers.get("Content-Type") ?? "audio/webm").split(";")[0];
        await env.SESSIONS.put(`audio:${key}`, bytes, { expirationTtl: 600, metadata: { type } });
        try {
          const terms = [...(s.repo ?? "").split(/[\/_.-]/), ...(s.questions ?? []).flatMap((q) => q.source.replace(/^[^:]+: /, "").split(/\s+/))];
          result = { text: await transcribe(env, `${env.APP_URL}/audio/${key}`, [...new Set(terms)].filter((t) => t.length > 3)) };
        } finally {
          await env.SESSIONS.delete(`audio:${key}`);
        }
        break;
      }
      case "/api/source": {
        const q = s.questions?.find((x) => x.id === new URL(req.url).searchParams.get("q"));
        if (!q?.ref || !s.repo) throw new UserError("Nothing to show for this question.");
        return json(await source(env, s.repo, q.ref)); // read-only: the session doesn't change
      }
      case "/api/models": {
        // Temporary: which chat models this MindStudio key can use.
        const res = await fetch("https://v1.mindstudio-api.com/developer/v2/helpers/models/llm_chat", { headers: { Authorization: `Bearer ${env.MINDSTUDIO_API_KEY}` } });
        const { models } = (await res.json()) as { models: { id: string; name: string }[] };
        result = models.filter((m) => /claude|gpt|gemini|deepseek|kimi|qwen/i.test(`${m.id} ${m.name}`)).map((m) => `${m.id} | ${m.name}`);
        break;
      }
      case "/api/reset":
        Object.assign(s, { questions: [], turns: [], drafts: [], saved: [], brief: undefined });
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
    if (err instanceof UserError || err instanceof RepoError) return json({ error: err.message }, 400);
    if (err instanceof MindStudioError) {
      console.error(err);
      return json({ error: "The voice service didn't answer. Try again, or type your answer." }, 502);
    }
    console.error(err);
    return json({ error: "Something went wrong talking to Buffer. Try again." }, 502);
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
  const tags: Tag[] = s.tags ?? [];
  return {
    orgs,
    organizationId: s.organizationId,
    repo: s.repo,
    tags,
    pillarTagIds: s.pillarTagIds ?? [],
    questions: s.questions ?? [],
    turns: s.turns ?? [],
    drafts: s.drafts ?? [],
    saved: s.saved ?? [],
    voice: Boolean(env.MINDSTUDIO_API_KEY),
    live: Boolean(openaiKey(env)),
  };
}

const MAX_TURNS = 60;

async function audio(env: Env, key: string): Promise<Response> {
  const { value, metadata } = await env.SESSIONS.getWithMetadata<{ type: string }>(`audio:${key}`, "arrayBuffer");
  if (!value) return new Response("Not found", { status: 404 });
  return new Response(value, { headers: { "Content-Type": metadata?.type ?? "audio/webm", "Cache-Control": "no-store" } });
}
