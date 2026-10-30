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
import { RepoError, parseRepo, whatShipped } from "./github";
import { planQuestions } from "./interview";
import { appPage, landingPage } from "./pages";
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
      if (req.method === "GET" && url.pathname === "/connect") return connect(env);
      if (req.method === "GET" && url.pathname === "/callback") return callback(req, env, url);
      if (req.method === "POST" && url.pathname === "/logout") {
        return redirect("/", { "Set-Cookie": await destroySession(req, env) });
      }
      if (req.method === "GET" && url.pathname === "/app") {
        return (await loadSession(req, env)) ? html(appPage()) : redirect("/");
      }
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
  const body = req.method === "POST" ? ((await req.json().catch(() => ({}))) as Record<string, unknown>) : {};

  try {
    let result: unknown;
    switch (path) {
      case "/api/state":
        result = await view(client, s, true);
        break;
      case "/api/setup": {
        const repo = parseRepo(String(body.repo ?? ""));
        if (!repo) throw new UserError("Paste a GitHub repo link, like github.com/you/project.");
        const ids = Array.isArray(body.pillarTagIds) ? body.pillarTagIds.map(String).slice(0, 3) : [];
        if (!ids.length) throw new UserError("Pick at least one pillar.");
        if (body.organizationId) s.organizationId = String(body.organizationId);
        await whatShipped(env, repo, 1); // fails fast with a clear message if the repo isn't public
        Object.assign(s, { repo, pillarTagIds: ids, questions: [], answered: [], skipped: [] });
        result = await view(client, s, true);
        break;
      }
      case "/api/start": {
        if (!s.repo || !s.organizationId) throw new UserError("Finish setup first.");
        s.weekNote = String(body.weekNote ?? "").slice(0, 500);
        const [shipped, recent] = await Promise.all([whatShipped(env, s.repo), getRecent(client, s.organizationId)]);
        s.questions = await planQuestions(env, shipped, recent, s.weekNote);
        s.answered = [];
        s.skipped = [];
        result = await view(client, s);
        break;
      }
      case "/api/answer":
      case "/api/skip": {
        const q = s.questions?.find((x) => x.id === body.questionId);
        if (!q) throw new UserError("That question is no longer open. Reload the page.");
        if ([...(s.answered ?? []), ...(s.skipped ?? [])].includes(q.id)) {
          result = await view(client, s); // already saved: a double click must not create a second Idea
          break;
        }
        const answer = path === "/api/answer" ? String(body.answer ?? "").trim() : "";
        if (path === "/api/answer" && !answer) throw new UserError("Write an answer first, or save the question for later.");
        if (client.nearLimit) throw new RateLimited(60);
        const tags = (s.tags ?? []).filter((t) => t.id === body.tagId);
        await createIdea(client, s.organizationId!, {
          title: q.text,
          // Answers are saved exactly as written. A skipped question is saved with
          // where it came from, so it still makes sense when they find it later.
          text: answer || `Saved by The Interviewer to answer later. About: ${q.source}${q.sourceUrl ? ` (${q.sourceUrl})` : ""}`,
          tags,
          aiAssisted: !answer,
        });
        (answer ? (s.answered ??= []) : (s.skipped ??= [])).push(q.id);
        result = await view(client, s);
        break;
      }
      case "/api/reset":
        Object.assign(s, { questions: [], answered: [], skipped: [] });
        result = await view(client, s);
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
    console.error(err);
    return json({ error: "Something went wrong talking to Buffer. Try again." }, 502);
  }
}

// What the page needs to draw itself. Tags are re-read from Buffer when the page
// loads or setup changes, so a tag renamed in Buffer shows up; answering a
// question reuses them, which keeps each saved answer to one Buffer request.
async function view(client: BufferClient, s: Session, refresh = false) {
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
    answered: s.answered ?? [],
    skipped: s.skipped ?? [],
  };
}
