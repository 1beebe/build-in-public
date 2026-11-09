import type { Env } from "./env";
import { pkcePair, randomToken } from "./crypto";
import {
  BufferClient, NeedsReconnect, RateLimited, authorizeUrl, createPost, deletePost, exchangeCode, getChannels, getOrgs, getTaken,
} from "./buffer";
import { FLAVORS, SHORT_SERVICES, generate, type Ammunition, type Flavor } from "./slop";
import { openSlots } from "./slots";
import { cookie, createSession, destroySession, loadSession, readCookie, saveSession, type Session, type Shell } from "./session";
import { appPage, privacyPage } from "./page";
import { STATIC } from "./static";

// How hard the cannon may hit. Buffer's quota is shared by everyone signed in,
// so one person can't empty it, and nobody's queue gets more than a week of slop.
const HORIZON_DAYS = 7;
const DEFAULT_QUEUE = 10; // Buffer's Free plan queue per channel, when the plan limit can't be read
const PER_SHOT = 30;
const SHOTS_PER_HOUR = 6;
const COOL_DOWN_BELOW = 45; // requests left in Buffer's 15-minute window
// Services that take a text-only post. The rest need an image or video.
const TEXT_SERVICES = new Set(["twitter", "linkedin", "threads", "bluesky", "mastodon", "facebook", "googlebusiness"]);
const TAG = "#SlopCannon";

class UserError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const SECURITY: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://auth.buffer.com",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
};

function headers(extra: Record<string, string> = {}): Headers {
  return new Headers({ ...SECURITY, ...extra });
}
const html = (body: string, status = 200) => new Response(body, { status, headers: headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }) });
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: headers({ "Content-Type": "application/json", "Cache-Control": "no-store", ...extra }) });
const redirect = (to: string, extra: Record<string, string> = {}) => new Response(null, { status: 302, headers: headers({ Location: to, ...extra }) });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      const file = STATIC[url.pathname];
      // These assets are embedded in the Worker without content-hashed filenames.
      // Revalidate them so a fresh page never runs an older app.js after a deploy.
      if (req.method === "GET" && file) return new Response(file.body, { headers: headers({ "Content-Type": file.type, "Cache-Control": "no-cache, must-revalidate" }) });
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
  },
} satisfies ExportedHandler<Env>;

async function connect(env: Env): Promise<Response> {
  const { verifier, challenge } = await pkcePair();
  const state = randomToken(16);
  await env.SESSIONS.put(`auth:${state}`, verifier, { expirationTtl: 600 });
  return redirect(authorizeUrl(env, state, challenge), { "Set-Cookie": cookie("oauth_state", state, 600) });
}

async function callback(req: Request, env: Env, url: URL): Promise<Response> {
  const state = url.searchParams.get("state") ?? "";
  const clear = cookie("oauth_state", "", 0);
  if (!state || state !== readCookie(req, "oauth_state")) return redirect("/?error=state", { "Set-Cookie": clear });
  const verifier = await env.SESSIONS.get(`auth:${state}`);
  await env.SESSIONS.delete(`auth:${state}`);
  if (url.searchParams.get("error")) return redirect("/?error=denied", { "Set-Cookie": clear });
  const code = url.searchParams.get("code");
  if (!code || !verifier) return redirect("/?error=expired", { "Set-Cookie": clear });

  let tokens;
  try {
    tokens = await exchangeCode(env, code, verifier);
  } catch (err) {
    console.error(err);
    return redirect("/?error=signin", { "Set-Cookie": clear });
  }
  const existing = await loadSession(req, env);
  const session: Session = existing ? { ...existing.data, tokens } : { tokens };
  const { orgs } = await getOrgs(new BufferClient(env, session));
  session.orgs = orgs.map(({ id, name }) => ({ id, name }));
  if (!orgs.some((o) => o.id === session.organizationId)) {
    session.organizationId = orgs[0]?.id;
    session.organizationName = orgs[0]?.name;
    session.loaded = undefined;
    session.lastVolley = undefined;
  }
  session.queueLimit = orgs.find((o) => o.id === session.organizationId)?.limits?.scheduledPosts;
  const h = headers({ Location: "/?loaded=1", "Cache-Control": "no-store" });
  if (existing) await saveSession(env, existing.id, session);
  else h.append("Set-Cookie", await createSession(env, session));
  h.append("Set-Cookie", clear);
  return new Response(null, { status: 302, headers: h });
}

function flavorOf(v: unknown): Flavor {
  return typeof v === "string" && v in FLAVORS ? (v as Flavor) : "chatgpt";
}
function observationOf(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length < 3) throw new UserError("Give the cannon something mundane to work with first.");
  if (s.length > 200) throw new UserError("Keep it under 200 characters. Mundane is short.");
  return s;
}
// Up to five mundane things; rounds rotate across them.
function observationsOf(b: Record<string, unknown>): string[] {
  const raw = Array.isArray(b.observations) ? b.observations : [b.observation];
  const list = [...new Set(raw.slice(0, 5).map(observationOf))];
  return list.length ? list : [observationOf(undefined)];
}
function seedOf(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.floor(v) >>> 0 : (Math.random() * 2 ** 32) >>> 0;
}
function intensityOf(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(1, Math.min(5, Math.round(v))) : 3;
}
function ammunitionsOf(v: unknown, legacy?: unknown): Ammunition[] {
  const raw = Array.isArray(v) ? v : legacy === undefined ? [] : [legacy];
  const valid = [...new Set(raw.filter((item): item is Ammunition =>
    (["founder", "vulnerable", "framework", "contrarian", "epiphany", "notes"] as const).includes(item as Ammunition),
  ))];
  return valid.length ? valid : ["founder"];
}

async function body(req: Request): Promise<Record<string, unknown>> {
  const raw = await req.text();
  if (raw.length > 4_000) throw new UserError("That request is too large.", 413);
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new UserError("That request wasn't valid JSON.");
  }
}

async function api(req: Request, env: Env, path: string): Promise<Response> {
  if (req.method === "POST" && req.headers.get("Origin") !== new URL(env.APP_URL).origin) {
    return json({ error: "Requests have to come from the app." }, 403);
  }
  try {
    // Anyone can make slop. No sign-in, no model, no cost.
    if (req.method === "POST" && path === "/api/slop") {
      const b = await body(req);
      const flavor = flavorOf(b.flavor);
      const seed = seedOf(b.seed);
      const ammunitions = ammunitionsOf(b.ammunitions, b.ammunition);
      const ammunition = ammunitions[seed % ammunitions.length];
      return json({ flavor, ammunition, ...generate(observationOf(b.observation), flavor, seed, { ammunition, intensity: intensityOf(b.intensity) }) });
    }

    const loaded = await loadSession(req, env);
    if (path === "/api/me") {
      if (!loaded) return json({ signedIn: false });
      const s = loaded.data;
      return json({
        signedIn: true,
        org: s.organizationName,
        orgs: s.orgs ?? [],
        organizationId: s.organizationId,
        lastVolley: s.lastVolley ? { count: s.lastVolley.ids.length, live: s.lastVolley.live, at: s.lastVolley.at } : null,
      });
    }
    if (!loaded) return json({ error: "Connect Buffer to load the cannon." }, 401);
    const s = loaded.data;
    const client = new BufferClient(env, s);
    const save = () => saveSession(env, loaded.id, s);
    // Aimed-but-unfired posts only matter for 30 minutes; drop stale ones.
    if (s.loaded && Date.now() - s.loaded.at > 30 * 60_000) { s.loaded = undefined; await save(); }

    try {
      if (req.method === "POST" && path === "/api/org") {
        const b = await body(req);
        const org = (s.orgs ?? []).find((o) => o.id === b.id);
        if (!org) throw new UserError("That organization isn't on this Buffer account.");
        const fresh = await getOrgs(client);
        const limit = fresh.orgs.find((o) => o.id === org.id)?.limits?.scheduledPosts;
        Object.assign(s, { organizationId: org.id, organizationName: org.name, queueLimit: limit, loaded: undefined, lastVolley: undefined });
        await save();
        return json({ ok: true });
      }

      if (req.method === "POST" && path === "/api/aim") {
        const b = await body(req);
        if (!s.organizationId) throw new UserError("This Buffer account has no organization to fire at.");
        const flavor = flavorOf(b.flavor);
        const ammunitions = ammunitionsOf(b.ammunitions, b.ammunition);
        const intensity = intensityOf(b.intensity);
        const observations = observationsOf(b);
        const tagIt = b.tag !== false;
        const channels = await getChannels(client, s.organizationId);
        const usable = channels.filter((c) => TEXT_SERVICES.has(c.service));
        const skipped = channels.filter((c) => !TEXT_SERVICES.has(c.service)).map((c) => ({ name: c.name, service: c.service, why: "needs an image or video" }));
        const taken = usable.length ? await getTaken(client, s.organizationId, usable.map((c) => c.id)) : [];
        const now = Date.now();
        let shells: Shell[] = [];
        let seed = seedOf(b.seed);
        // Each plan caps how many posts a channel's queue can hold; only fill what's left.
        const queueLimit = s.queueLimit ?? DEFAULT_QUEUE;
        let shot = 0;
        for (const ch of usable) {
          const mine = taken.filter((t) => t.channelId === ch.id);
          const room = Math.max(0, queueLimit - mine.length);
          const slots = room ? openSlots(ch, mine.map((t) => t.at), now, HORIZON_DAYS, room) : [];
          if (!slots.length) {
            skipped.push({ name: ch.name, service: ch.service, why: ch.queuePaused ? "its queue is paused" : !room ? `its queue is full (${queueLimit} on your plan)` : "no open slots this week" });
          }
          for (const slot of slots) {
            const slop = generate(observations[shot % observations.length], flavor, seed++, { ammunition: ammunitions[shot++ % ammunitions.length], intensity });
            let text = SHORT_SERVICES.has(ch.service) ? slop.short : slop.long;
            if (tagIt && !text.includes(TAG)) text = SHORT_SERVICES.has(ch.service) && text.length + TAG.length + 1 > 280 ? text : `${text} ${TAG}`;
            shells.push({ channelId: ch.id, service: ch.service, channelName: ch.name, dueAt: new Date(slot.at).toISOString(), text });
          }
        }
        shells.sort((a, b2) => a.dueAt.localeCompare(b2.dueAt));
        shells = shells.slice(0, PER_SHOT);
        s.loaded = { observation: observations.join(" | "), flavor, shells, at: now };
        await save();
        return json({ shells, skipped, horizonDays: HORIZON_DAYS, queueLimit });
      }

      if (req.method === "POST" && path === "/api/fire") {
        const b = await body(req);
        const live = b.live === true;
        if (live && b.confirm !== "FIRE") throw new UserError("Live rounds need the confirm.");
        const plan = s.loaded;
        if (!plan?.shells.length) throw new UserError("Aim first: the cannon is empty.");
        if (Date.now() - plan.at > 30 * 60_000) throw new UserError("That aim is stale. Aim again so the slots are fresh.");
        const recent = (s.shots ?? []).filter((t) => Date.now() - t < 3_600_000);
        if (recent.length >= SHOTS_PER_HOUR) throw new UserError("The cannon is overheating. Six shots an hour, tops.", 429);
        if (client.remaining !== undefined && client.remaining < COOL_DOWN_BELOW) throw new UserError("Buffer's API needs a breather. Try again in a few minutes.", 429);
        s.shots = [...recent, Date.now()];
        const ids: string[] = [];
        const misses: { channel: string; message: string }[] = [];
        const dead = new Set<string>(); // channels that refused once: don't keep hitting them
        for (const shell of plan.shells) {
          if (dead.has(shell.channelId)) continue;
          if (client.remaining !== undefined && client.remaining < 15) {
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
        s.loaded = undefined;
        await save();
        return json({ landed: ids.length, live, misses });
      }

      if (req.method === "POST" && path === "/api/undo") {
        const v = s.lastVolley;
        if (!v?.ids.length) throw new UserError("Nothing to undo.");
        const left: string[] = [];
        for (const id of v.ids) {
          try {
            await deletePost(client, id);
          } catch (err) {
            if (err instanceof NeedsReconnect) throw err;
            // Already sent or deleted in Buffer: nothing more we can do for it.
            if (!(err instanceof Error && /not found|sent/i.test(err.message))) left.push(id);
          }
        }
        s.lastVolley = left.length ? { ...v, ids: left } : undefined;
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
