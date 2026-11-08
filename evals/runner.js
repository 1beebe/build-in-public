// Eval runner. Runs in the owner's signed-in tab on the live app (same origin),
// so every call goes through the real API with the real prompts.
//
//   window.__evalStart({ personas, fixtures })   // starts in the background
//   window.__eval                                // progress and results
//
// It sets up each persona with "keep transcript" and memory off, plays the
// script, harvests, and never saves anything to Buffer. When it's done (or
// fails) it restores the setup it found and clears the session.
(() => {
  const api = async (path, body) => {
    const began = Date.now();
    const res = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${path} ${res.status}: ${data.error ?? "no message"}`);
    return { data, ms: Date.now() - began };
  };
  const last = (turns) => turns[turns.length - 1];
  const log = (msg) => window.__eval.log.push(`${new Date().toISOString().slice(11, 19)} ${msg}`);
  const live = (drafts) => drafts.filter((d) => !d.later);

  let promptV; // set per run: 1 tries the older v1 interviewer (owner-only); v2 is the default
  async function setup(s) {
    await api("/api/reset", {});
    await api("/api/setup", { work: s.work, targets: s.targets, keepLog: false, keepMemory: false, agreeTerms: true, longform: Boolean(s.longform), promptV });
    return (await api("/api/start", {})).data;
  }

  async function persona(p) {
    log(`persona ${p.id}`);
    const started = await setup(p.setup);
    const out = { id: p.id, opener: started.turns[0]?.text ?? "", exchanges: [], harvests: [], errors: [] };
    const say = async (text, kind = "say") => {
      const { data, ms } = await api("/api/say", { text });
      const turn = last(data.turns);
      out.exchanges.push({ kind, said: text, reply: turn.text, ms: data.replyMs ?? ms, fallback: Boolean(data.replyFallback), wrapUp: Boolean(turn.wrapUp) });
      return turn;
    };
    if (p.backstory) {
      // Simulated persona: a model answers from a hidden backstory, so a better interviewer
      // can actually draw out more. Stops on wrapUp, "done", or maxAnswers.
      for (let i = 0; i < (p.maxAnswers ?? 12); i++) {
        const { data } = await api("/api/eval/answer", { backstory: p.backstory });
        const turn = await say(data.answer, "sim");
        if (turn.wrapUp || /\b(done for now|that's (it|all) for now|gotta go|i'm done)\b/i.test(data.answer)) break;
      }
    } else {
      for (const answer of p.answers) {
        const turn = await say(answer);
        if (p.stopOnWrapUp && turn.wrapUp) break;
      }
    }
    let h = await api("/api/harvest", { mode: p.harvest ?? "draft" });
    out.harvests.push({ ms: h.ms, drafts: h.data.drafts });
    if (p.keepTalkingIfUnder && live(h.data.drafts).length < p.keepTalkingIfUnder) {
      const more = await api("/api/more", {});
      out.exchanges.push({ kind: "keep talking", said: "", reply: last(more.data.turns).text, ms: more.ms, fallback: Boolean(more.data.replyFallback), wrapUp: false });
      for (const answer of p.afterMore ?? []) await say(answer, "after keep talking");
      h = await api("/api/harvest", { mode: p.harvest ?? "draft" });
      out.harvests.push({ ms: h.ms, drafts: h.data.drafts });
    }
    out.turns = h.data.turns;
    out.theirWords = out.turns.filter((t) => t.who === "you").reduce((n, t) => n + t.text.trim().split(/\s+/).length, 0);
    return out;
  }

  async function replay(f) {
    log(`replay ${f.name}`);
    await setup(f.setup);
    await api("/api/voice-turns", { turns: f.turns });
    const h = await api("/api/harvest", { mode: "draft" });
    return { name: f.name, ms: h.ms, drafts: h.data.drafts };
  }

  window.__evalStart = async ({ personas = [], fixtures = [], only, prompt } = {}) => {
    promptV = prompt === 1 ? 1 : 2;
    window.__eval = { status: "running", prompt: promptV, log: [], personas: [], replays: [], errors: [] };
    const before = (await api("/api/state")).data;
    const restore = {
      work: before.repo || before.weekNote,
      targets: before.targets,
      keepLog: before.keepLog,
      agreeTerms: true,
      keepMemory: Boolean(before.memory?.on),
      longform: before.longform,
    };
    window.__eval.restore = restore;
    try {
      for (const p of personas) {
        if (only && !only.includes(p.id)) continue;
        try { window.__eval.personas.push(await persona(p)); }
        catch (err) { window.__eval.errors.push(`${p.id}: ${err.message}`); log(`ERROR ${p.id}: ${err.message}`); }
      }
      for (const f of fixtures) {
        if (only && !only.includes(f.name)) continue;
        try { window.__eval.replays.push(await replay(f)); }
        catch (err) { window.__eval.errors.push(`${f.name}: ${err.message}`); log(`ERROR ${f.name}: ${err.message}`); }
      }
    } finally {
      try {
        await api("/api/reset", {});
        await api("/api/setup", restore);
        log("restored setup");
      } catch (err) {
        window.__eval.errors.push(`restore: ${err.message}`);
      }
      window.__eval.status = "done";
    }
  };
})();
