// Slop Cannon, the page. Plain JS, no build step.
(() => {
  const $ = (id) => document.getElementById(id);
  const chat = $("chat"), empty = $("empty"), say = $("say"), flavor = $("flavor");
  let me = { signedIn: false };
  let last = null; // { observation, flavor }
  let muted = false;
  try { muted = localStorage.getItem("muted") === "1"; flavor.value = localStorage.getItem("flavor") || flavor.value; } catch {}

  // The "thinking" spinner: gerunds that are a little too much, then one
  // flavor-specific step so you know which slop you ordered.
  const VERBS = [
    "Writhing", "Hiccupping", "Staring", "Squinting", "Lurking", "Gurgling", "Molting", "Simmering",
    "Fermenting", "Spiraling", "Brooding", "Loitering", "Wheezing", "Sulking", "Salivating", "Mumbling",
    "Twitching", "Perspiring", "Smoldering", "Unclenching", "Dissociating", "Burping", "Pacing", "Marinating",
    "Clenching", "Oozing", "Sniffing", "Scuttling", "Festering", "Wobbling", "Lingering", "Sighing loudly",
  ];
  const FLAVOR_STEP = {
    chatgpt: "Inserting em-dashes", claude: "Holding this loosely", gemini: "Bolding everything", grok: "Checking if it's based",
  };
  const pickVerbs = (n) => [...VERBS].sort(() => Math.random() - 0.5).slice(0, n);

  // ---- small helpers ----
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function toast(msg, err) {
    const t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (err ? " err" : "");
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.hidden = true), 4200);
  }
  async function call(path, body) {
    const res = await fetch(path, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = new Error(data.error || "Something went wrong.");
      e.reconnect = data.reconnect;
      throw e;
    }
    return data;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const scrollDown = () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  // ---- the header: who's connected ----
  function renderWho() {
    const w = $("who");
    w.textContent = "";
    if (!me.signedIn) {
      const a = el("a", "btn", "Connect Buffer");
      a.href = "/connect";
      a.style.textDecoration = "none";
      w.append(a);
      return;
    }
    if (me.orgs && me.orgs.length > 1) {
      const sel = el("select");
      sel.setAttribute("aria-label", "Buffer organization");
      for (const o of me.orgs) {
        const opt = el("option", null, o.name);
        opt.value = o.id;
        if (o.id === me.organizationId) opt.selected = true;
        sel.append(opt);
      }
      sel.onchange = async () => {
        try { await call("/api/org", { id: sel.value }); await loadMe(); toast("Cannon re-aimed at " + sel.selectedOptions[0].textContent); }
        catch (e) { toast(e.message, true); }
      };
      w.append(sel);
    } else {
      w.append(el("span", null, "🎯 " + (me.org || "Buffer connected")));
    }
    const f = el("form");
    f.method = "post";
    f.action = "/logout";
    const b = el("button", "link", "Log out");
    b.type = "submit";
    f.append(b);
    w.append(f);
  }
  async function loadMe() {
    try { me = await call("/api/me"); } catch { me = { signedIn: false }; }
    renderWho();
  }

  // ---- making slop ----
  function addYou(text) {
    empty.hidden = true;
    const m = el("div", "msg you");
    m.append(el("div", "bubble", text));
    chat.append(m);
  }
  function addBot() {
    const m = el("div", "msg bot");
    m.append(el("div", "avatar", "✦"));
    const body = el("div", "body");
    m.append(body);
    chat.append(m);
    return body;
  }

  async function makeSlop(text) {
    const fl = flavor.value;
    last = { observation: text, flavor: fl };
    addYou(text);
    const body = addBot();
    const think = el("div", "thinking", "✻ Thinking…");
    body.append(think);
    scrollDown();
    const req = call("/api/slop", { observation: text, flavor: fl }).catch((e) => ({ error: e.message }));
    // The pause is theatre: the script is done in a millisecond. Real models take longer.
    const started = Date.now();
    for (const step of [...pickVerbs(3), FLAVOR_STEP[fl] || FLAVOR_STEP.chatgpt]) {
      think.textContent = `✻ ${step}… (${Math.max(1, Math.round((Date.now() - started) / 1000))}s)`;
      await wait(520);
    }
    const out = await req;
    think.remove();
    if (out.error) { body.append(el("p", null, out.error)); return; }
    await renderPost(body, out);
    renderActions(body, out);
    scrollDown();
  }

  async function renderPost(body, out) {
    const post = el("div", "post glass");
    body.append(post);
    // Stream it in a word at a time, like a model would.
    const words = out.long.split(/(\s+)/);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) post.textContent = out.long;
    else {
      for (let i = 0; i < words.length; i += 3) {
        post.textContent += words.slice(i, i + 3).join("");
        if (i % 12 === 0) { await wait(18); }
      }
    }
    const h = el("p", null);
    h.style.margin = "12px 0 0";
    h.style.fontWeight = "700";
    h.textContent = `AI tells used: ${out.tells.length}`;
    body.append(h);
    const ul = el("ul", "tells");
    for (const t of out.tells) ul.append(el("li", null, t));
    body.append(ul);
  }

  function renderActions(body, out) {
    const row = el("div", "row");
    const again = el("button", "ghost", "↻ Regenerate");
    again.type = "button";
    again.onclick = () => makeSlop(last.observation);
    const copy = el("button", "ghost", "Copy");
    copy.type = "button";
    copy.onclick = async () => { try { await navigator.clipboard.writeText(out.long); toast("Copied. Use responsibly."); } catch { toast("Copy didn't work in this browser.", true); } };
    const load = el("button", "btn", "💣 Load the cannon");
    load.type = "button";
    load.onclick = () => aim(body, load);
    row.append(load, again, copy);
    body.append(row);
  }

  // ---- the cannon ----
  async function aim(body, button) {
    const old = body.querySelector(".cannon");
    if (old) old.remove();
    const card = el("div", "cannon glass");
    body.append(card);
    if (!me.signedIn) {
      card.append(el("h2", null, "Connect Buffer to load the cannon"));
      card.append(el("p", null, "Slop Cannon finds every open slot in your Buffer queue for the next week and writes a different post for each one. It fires drafts unless you switch on live rounds."));
      const a = el("a", "btn", "Connect Buffer");
      a.href = "/connect";
      a.style.display = "inline-block";
      a.style.textDecoration = "none";
      a.style.marginTop = "8px";
      card.append(a);
      try { sessionStorage.setItem("pending", JSON.stringify(last)); } catch {}
      scrollDown();
      return;
    }
    button.disabled = true;
    const status = el("p", "thinking", "Scanning your queue for open slots…");
    card.append(status);
    scrollDown();
    let plan;
    try {
      plan = await call("/api/aim", { observation: last.observation, flavor: last.flavor, tag: tagOn() });
    } catch (e) {
      status.remove();
      card.append(el("p", null, e.message));
      if (e.reconnect) { const a = el("a", "btn", "Connect again"); a.href = "/connect"; card.append(a); }
      button.disabled = false;
      return;
    }
    button.disabled = false;
    status.remove();
    renderPlan(card, plan, body, button);
  }

  function tagOn() {
    try { return localStorage.getItem("tag") !== "0"; } catch { return true; }
  }

  function renderPlan(card, plan, body, button) {
    const n = plan.shells.length;
    if (!n) {
      card.append(el("h2", null, "No open slots to hit"));
      card.append(el("p", null, "Every channel's queue is full, paused, or has no posting times this week. That's either great discipline or a full cannon."));
      skippedNote(card, plan.skipped);
      return;
    }
    const counts = {};
    for (const s of plan.shells) counts[s.channelName + " (" + label(s.service) + ")"] = (counts[s.channelName + " (" + label(s.service) + ")"] || 0) + 1;
    card.append(el("h2", null, `🎯 ${n} open slot${n === 1 ? "" : "s"} locked on`));
    card.append(el("p", null, "Across " + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ") + `, in the next ${plan.horizonDays} days. Each slot gets its own slop.`));
    skippedNote(card, plan.skipped);
    const ul = el("ul", "shells");
    for (const s of plan.shells) {
      const li = el("li");
      const t = el("time", null, new Date(s.dueAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
      li.append(t, el("span", "ch", label(s.service)), el("span", "first", s.text.split("\n").find((x) => x.trim() && x !== "---") || s.text));
      li.title = s.text;
      ul.append(li);
    }
    card.append(ul);

    const toggles = el("div", "toggles");
    const liveLbl = el("label", "switch");
    const live = el("input");
    live.type = "checkbox";
    live.id = "live";
    liveLbl.append(live, el("span", null, "Live rounds "), el("small", null, "Off: fires drafts onto your calendar. Nothing publishes."));
    const tagLbl = el("label", "switch");
    const tag = el("input");
    tag.type = "checkbox";
    tag.checked = tagOn();
    tagLbl.append(tag, el("span", null, "Add #SlopCannon "), el("small", null, "So everyone's in on the joke."));
    tag.onchange = () => { try { localStorage.setItem("tag", tag.checked ? "1" : "0"); } catch {} aim(body, button); };
    toggles.append(liveLbl, tagLbl);
    card.append(toggles);

    const fire = el("button", "fire", `🔥 FIRE ${n} DRAFT${n === 1 ? "" : "S"}`);
    fire.type = "button";
    live.onchange = () => {
      fire.textContent = live.checked ? `💥 FIRE ${n} LIVE ROUND${n === 1 ? "" : "S"}` : `🔥 FIRE ${n} DRAFT${n === 1 ? "" : "S"}`;
      fire.classList.toggle("live", live.checked);
    };
    fire.onclick = async () => {
      if (live.checked && !confirm(`Live rounds: this schedules ${n} real post${n === 1 ? "" : "s"} into your Buffer queue. They will publish at their slot times unless you undo them.\n\nFire?`)) return;
      fire.disabled = true;
      boom(n);
      launch(plan.shells, fire);
      try {
        const r = await call("/api/fire", { live: live.checked, confirm: live.checked ? "FIRE" : undefined });
        fired(card, r);
      } catch (e) {
        card.append(el("p", null, e.message));
        fire.disabled = false;
      }
    };
    card.append(fire);
  }

  function skippedNote(card, skipped) {
    if (!skipped || !skipped.length) return;
    card.append(el("p", null, "Skipped: " + skipped.map((s) => `${s.name} (${label(s.service)}), ${s.why}`).join("; ") + "."));
  }

  const LABELS = { twitter: "X", linkedin: "LinkedIn", threads: "Threads", bluesky: "Bluesky", mastodon: "Mastodon", facebook: "Facebook", googlebusiness: "Google", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", pinterest: "Pinterest", substack: "Substack", startPage: "Start Page" };
  const label = (s) => LABELS[s] || s;

  function fired(card, r) {
    const fire = card.querySelector(".fire");
    if (fire) fire.remove();
    card.querySelectorAll(".toggles").forEach((n) => n.remove());
    const what = r.live ? (r.landed === 1 ? "live round" : "live rounds") : (r.landed === 1 ? "draft" : "drafts");
    card.append(el("p", "result", r.landed ? `💥 Direct hit. ${r.landed} ${what} landed on your Buffer calendar.` : "The cannon misfired. Nothing landed."));
    for (const m of r.misses || []) card.append(el("p", null, `${m.channel}: ${m.message}`));
    const row = el("div", "row");
    const open = el("a", "btn", "See the damage in Buffer");
    open.href = "https://publish.buffer.com/calendar";
    open.target = "_blank";
    open.rel = "noopener";
    open.style.textDecoration = "none";
    row.append(open);
    if (r.landed) {
      const undo = el("button", "ghost", "↩ Undo barrage");
      undo.type = "button";
      undo.onclick = async () => {
        undo.disabled = true;
        try {
          const u = await call("/api/undo", {});
          undo.textContent = u.left ? `Deleted ${u.deleted}, ${u.left} left` : `Deleted all ${u.deleted}. Like it never happened.`;
        } catch (e) { toast(e.message, true); undo.disabled = false; }
      };
      row.append(undo);
    }
    card.append(row);
    scrollDown();
  }

  // ---- sound: a cannon synthesized on the spot, no audio files ----
  let ctx;
  function boom(n) {
    if (muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const shots = Math.min(n, 8);
      for (let i = 0; i < shots; i++) one(ctx.currentTime + i * 0.14, i === 0 ? 1 : 0.55);
    } catch {}
  }
  function one(t, gainScale) {
    // A thump: a sine falling fast, plus a burst of filtered noise.
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(32, t + 0.5);
    og.gain.setValueAtTime(0.9 * gainScale, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(og).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.75);
    const len = Math.floor(ctx.sampleRate * 0.9);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), ng = ctx.createGain();
    src.buffer = buf;
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.6);
    ng.gain.setValueAtTime(0.8 * gainScale, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    src.connect(lp).connect(ng).connect(ctx.destination);
    src.start(t);
  }

  // ---- the visuals: flash, shake, posts flying out of the button ----
  function launch(shells, from) {
    const flash = el("div", "flash");
    document.body.append(flash);
    setTimeout(() => flash.remove(), 700);
    document.body.classList.remove("shake");
    void document.body.offsetWidth;
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 600);
    const r = from.getBoundingClientRect();
    shells.slice(0, 18).forEach((s, i) => {
      setTimeout(() => {
        const c = el("div", "shot", label(s.service) + ": " + (s.text.split("\n").find((x) => x.trim() && x !== "---") || ""));
        c.style.left = r.left + r.width / 2 - 80 + "px";
        c.style.top = r.top + "px";
        c.style.setProperty("--dx", (Math.random() * 2 - 1) * innerWidth * 0.5 + "px");
        c.style.setProperty("--dy", -(200 + Math.random() * innerHeight * 0.6) + "px");
        c.style.setProperty("--rot", (Math.random() * 60 - 30) + "deg");
        document.body.append(c);
        setTimeout(() => c.remove(), 1300);
      }, i * 70);
    });
  }

  // ---- wiring ----
  $("composer").onsubmit = (e) => {
    e.preventDefault();
    const text = say.value.trim();
    if (text.length < 3) { toast("Give it something mundane first."); return; }
    say.value = "";
    say.style.height = "";
    makeSlop(text);
  };
  say.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("composer").requestSubmit(); }
  });
  say.addEventListener("input", () => { say.style.height = "auto"; say.style.height = Math.min(say.scrollHeight, 140) + "px"; });
  document.querySelectorAll("[data-say]").forEach((b) => (b.onclick = () => makeSlop(b.dataset.say)));
  flavor.onchange = () => { try { localStorage.setItem("flavor", flavor.value); } catch {} };
  $("newChat").onclick = () => { chat.textContent = ""; empty.hidden = false; last = null; say.focus(); };
  $("pro").onclick = () => toast("There is no Pro. There is only more.");
  const mute = $("mute");
  const paintMute = () => { mute.textContent = muted ? "🔇" : "🔊"; mute.setAttribute("aria-pressed", String(muted)); mute.setAttribute("aria-label", muted ? "Sound is off" : "Sound is on"); };
  mute.onclick = () => { muted = !muted; try { localStorage.setItem("muted", muted ? "1" : "0"); } catch {} paintMute(); };
  paintMute();
  const crimes = $("crimes"), list = $("crimeList");
  crimes.onclick = () => { list.hidden = !list.hidden; crimes.setAttribute("aria-expanded", String(!list.hidden)); };

  const params = new URLSearchParams(location.search);
  const err = params.get("error");
  if (err) toast(err === "denied" ? "Buffer connection cancelled. The cannon stays unloaded." : "That sign-in didn't finish. Try again.", true);
  loadMe().then(() => {
    // Back from Buffer: pick up the slop they were about to fire.
    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem("pending") || "null"); sessionStorage.removeItem("pending"); } catch {}
    if (params.get("loaded") && me.signedIn) toast("Cannon loaded. 🎯");
    if (pending && me.signedIn && pending.observation) {
      flavor.value = pending.flavor || flavor.value;
      makeSlop(pending.observation);
    }
    if (params.toString()) history.replaceState(null, "", "/");
  });
})();
