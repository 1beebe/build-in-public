// Slop Cannon, the page. Plain JS, no build step.
(() => {
  const $ = (id) => document.getElementById(id);
  const chat = $("chat"), hello = $("hello"), say = $("say");
  let me = { signedIn: false };
  let last = null; // { observation, flavor }
  let ammo = []; // up to five mundane things; the cannon rotates through them
  const MAX_AMMO = 5;
  let flavor = "chatgpt";
  let muted = false;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  muted = store.get("muted") === "1";

  // The "thinking" spinner: gerunds that are a little too much, then one
  // flavor-specific step so you know which slop you ordered.
  const VERBS = [
    "Writhing", "Hiccupping", "Staring", "Squinting", "Lurking", "Gurgling", "Molting", "Simmering",
    "Fermenting", "Spiraling", "Brooding", "Loitering", "Wheezing", "Sulking", "Salivating", "Mumbling",
    "Twitching", "Perspiring", "Smoldering", "Unclenching", "Dissociating", "Burping", "Pacing", "Marinating",
    "Clenching", "Oozing", "Sniffing", "Scuttling", "Festering", "Wobbling", "Lingering", "Sighing loudly",
  ];
  const FLAVOR_STEP = { chatgpt: "Inserting em dashes", claude: "Holding this loosely", gemini: "Bolding everything", grok: "Checking if it's based" };
  const pickVerbs = (n) => [...VERBS].sort(() => Math.random() - 0.5).slice(0, n);

  // Phrases to wavy-underline in the post: the tells, where you can see them.
  const TELL_MARKS = [
    /—/g, /\bdelve\w*/gi, /\btapestry\b/gi, /\btestament\b/gi, /\bunderscor\w+/gi, /\bhighlighting\b/gi, /\bpivotal\b/gi,
    /\bgenuinely\b/gi, /\bnuanc\w+/gi, /\babsolutely right\b/gi, /\bLet that sink in\b/gi, /\bgame-changer\b/gi,
    /\bfast-paced\b/gi, /\bever-evolving\b/gi, /\blandscape\b/gi, /\bunlock\w*\b/gi, /\bleverag\w+/gi, /\bsynerg\w+/gi,
    /\bbased\b/gi, /\bunhinged\b/gi, /\bnot gonna lie\b/gi, /\bmaximally truth-seeking\b/gi, /\bIt's not (just )?(about )?(the )?[^.—]{1,40}[.—] ?It's\b[^.]*\./gi,
    /\*\*[^*\n]+\*\*/g, /\[[^\]\n]{2,40}\]/g, /【[^】]+】/g, /:contentReference\[[^\]]+\]\{[^}]+\}/g, /<\|endoftext\|>/g,
    /\(Source: [^)]+\)/g, /\b\d+% of\b/g, /\bExperts agree\b/gi, /\bstands as\b/gi, /\bDespite its challenges\b/gi,
    /\bIt's important to (remember|note)\b/gi, /\bAs of my last knowledge update\b/gi, /\bAs an AI language model\b/gi,
    /^(Certainly|Sure|Absolutely|Okay|Alright)![^\n]*/gim, /\bFeel free to tweak[^\n]*/gi, /\bWould you like me to[^\n]*/gi,
    /#[A-Za-z]+/g, /🚀|💡|🔥|💀|👀|👇/gu,
  ];

  // ---- small helpers ----
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function button(cls, text, onclick, label) {
    const b = el("button", cls, text);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    if (onclick) b.onclick = onclick;
    return b;
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
  const LABELS = { twitter: "X", linkedin: "LinkedIn", threads: "Threads", bluesky: "Bluesky", mastodon: "Mastodon", facebook: "Facebook", googlebusiness: "Google", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", pinterest: "Pinterest", substack: "Substack", startPage: "Start Page" };
  const label = (s) => LABELS[s] || s;
  const firstLine = (t) => t.split("\n").find((x) => x.trim() && x.trim() !== "---") || t;

  // Wraps every tell match in <u>, building nodes so nothing is parsed as HTML.
  function markTells(node, text) {
    const spans = [];
    for (const re of TELL_MARKS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        if (!m[0]) { re.lastIndex++; continue; }
        spans.push([m.index, m.index + m[0].length]);
      }
    }
    spans.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    let at = 0;
    for (const [s, e] of spans) {
      if (s < at) continue;
      if (s > at) node.append(document.createTextNode(text.slice(at, s)));
      node.append(el("u", null, text.slice(s, e)));
      at = e;
    }
    if (at < text.length) node.append(document.createTextNode(text.slice(at)));
  }

  // ---- flavor: the whole app reskins ----
  function setFlavor(f) {
    flavor = f;
    document.body.dataset.flavor = f;
    document.querySelectorAll(".flavor").forEach((b) => {
      const on = b.dataset.flavor === f;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    store.set("flavor", f);
  }
  document.querySelectorAll(".flavor").forEach((b) => (b.onclick = () => setFlavor(b.dataset.flavor)));
  setFlavor(store.get("flavor") || "chatgpt");

  // ---- the header: who's connected ----
  function renderWho() {
    const w = $("who");
    w.textContent = "";
    if (!me.signedIn) {
      const a = el("a", "signin", "Sign in with Buffer");
      a.href = "/connect";
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
  async function makeSlop(text) {
    const fl = flavor;
    if (!ammo.includes(text)) { ammo.push(text); if (ammo.length > MAX_AMMO) ammo.shift(); if (ammo.length > 1) reload(); }
    last = { observation: text, flavor: fl, ammo: [...ammo] };
    hello.hidden = true;
    chat.append(el("div", "me", text));
    const ai = el("div", "ai");
    ai.append(el("div", "spark", "✦"));
    const body = el("div");
    ai.append(body);
    chat.append(ai);
    const think = el("div", "live-think");
    body.append(think);
    scrollDown();
    const req = call("/api/slop", { observation: text, flavor: fl }).catch((e) => ({ error: e.message }));
    // The pause is theatre: the script is done in a millisecond.
    const steps = [...pickVerbs(3), FLAVOR_STEP[fl] || FLAVOR_STEP.chatgpt];
    const started = Date.now();
    for (const step of steps) {
      think.textContent = "";
      think.append(el("i", null, "✻"), document.createTextNode(` ${step}… (${Math.max(1, Math.round((Date.now() - started) / 1000))}s)`));
      await wait(1050);
    }
    const out = await req;
    think.remove();
    if (out.error) { body.append(el("p", null, out.error)); return; }
    // "Thought for" the real time it took the script, which is basically nothing.
    const det = el("details", "thinking");
    det.append(el("summary", null, `Thought for 0.${Math.floor(Math.random() * 6) + 2} seconds ▾`));
    det.append(el("p", null, steps.join(" · ")));
    body.append(det);
    await renderPost(body, out);
    renderVerdict(body, out);
    renderActions(body, out);
    scrollDown();
  }

  async function renderPost(body, out) {
    const post = el("div", "post");
    body.append(post);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const words = out.long.split(/(\s+)/);
      for (let i = 0; i < words.length; i += 4) {
        post.textContent += words.slice(i, i + 4).join("");
        if (i % 16 === 0) await wait(16);
      }
      post.textContent = "";
    }
    markTells(post, out.long);
  }

  function renderVerdict(body, out) {
    const score = Math.min(99, 58 + out.tells.length * 3);
    const word = score >= 90 ? "Unmistakably AI" : score >= 80 ? "Extremely AI" : "Suspiciously confident";
    const v = el("div", "verdict");
    const ring = el("div", "ring");
    ring.style.setProperty("--pct", score + "%");
    ring.setAttribute("role", "img");
    ring.setAttribute("aria-label", `Slop score ${score} out of 100: ${word}`);
    const inner = el("div");
    inner.append(el("strong", null, String(score)), el("span", null, word));
    ring.append(inner);
    const ul = el("ul", "tells");
    ul.setAttribute("aria-label", "AI tells used");
    ul.append(el("li", null, `${out.tells.length} AI tells`));
    for (const t of out.tells) ul.append(el("li", null, t));
    v.append(ring, ul);
    body.append(v);
  }

  function renderActions(body, out) {
    const row = el("div", "acts");
    row.append(
      button(null, "⧉", async () => { try { await navigator.clipboard.writeText(out.long); toast("Copied. Use responsibly."); } catch { toast("Copy didn't work in this browser.", true); } }, "Copy"),
      button(null, "👍", () => toast("Thanks! Your feedback will be ignored at scale."), "Good response"),
      button(null, "👎", () => toast("Noted. Adding more em dashes."), "Bad response"),
      button(null, "↻", () => makeSlop(last.observation), "Regenerate"),
    );
    body.append(row);
    aim();
  }

  // ---- the cannon ----
  // Click the cannon for a dry fire: the sound and recoil, no posts.
  function cannonArt() {
    const art = $("cannonArt").content.firstElementChild.cloneNode(true);
    art.setAttribute("role", "button");
    art.setAttribute("tabindex", "0");
    art.setAttribute("aria-label", "Dry fire (sound only)");
    const dry = () => {
      const wasMuted = muted;
      muted = false;
      boom(1);
      muted = wasMuted;
      document.body.classList.remove("shake");
      void document.body.offsetWidth;
      document.body.classList.add("shake");
      setTimeout(() => document.body.classList.remove("shake"), 650);
    };
    art.addEventListener("click", dry);
    art.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dry(); } });
    return art;
  }

  // The ammo belt: what's loaded, and room to stack more before firing.
  function ammoBelt() {
    const belt = el("div", "ammo");
    belt.append(el("span", "ammo-n", `Ammo ${ammo.length}/${MAX_AMMO}`));
    ammo.forEach((t, i) => {
      const chip = el("span", "shell", t.length > 34 ? t.slice(0, 34).replace(/\s+\S*$/, "") + "…" : t);
      chip.title = t;
      if (ammo.length > 1) {
        const x = button("x", "×", () => { ammo.splice(i, 1); aim(); }, "Unload this one");
        chip.append(x);
      }
      belt.append(chip);
    });
    if (ammo.length < MAX_AMMO) {
      belt.append(button("load", "＋ Load another", () => {
        say.placeholder = "Another mundane thing for the cannon…";
        say.focus();
        toast(`Type another mundane thing. Room for ${MAX_AMMO - ammo.length} more.`);
      }));
    }
    return belt;
  }

  async function aim() {
    chat.querySelectorAll(".battery").forEach((n) => n.remove());
    const card = el("section", "battery");
    card.setAttribute("aria-label", "Slop Cannon");
    card.append(cannonArt());
    const info = el("div");
    card.append(info);
    chat.append(card);
    if (!me.signedIn) {
      info.append(el("h3", null, "More rounds loaded"));
      info.append(el("p", null, `One for every open slot in your Buffer queue this week, each a different take on ${ammo.length > 1 ? "your mundane things" : "the same mundane thing"}. Sign in to fire them. Drafts by default, so nothing publishes.`));
      info.append(ammoBelt());
      const stack = el("div", "stack");
      info.append(stack);
      const kinds = [["LinkedIn", "long"], ["X", "short"], ["Threads", "short"]];
      Promise.all(kinds.map((_, i) => call("/api/slop", { observation: ammo[i % ammo.length], flavor: last.flavor }).catch(() => null))).then((outs) => {
        outs.forEach((o, i) => {
          if (!o) return;
          const c = el("article", "round");
          // Skip a leaked chatbot preamble so the peek starts on the post.
          const raw = o[kinds[i][1]];
          const text = raw.includes("\n\n---\n\n") && raw.indexOf("\n\n---\n\n") < 220 ? raw.slice(raw.indexOf("\n\n---\n\n") + 7) : raw;
          c.append(el("b", null, kinds[i][0]), el("p", null, text.length > 220 ? text.slice(0, 220).replace(/\s+\S*$/, "") + "…" : text));
          stack.append(c);
        });
        stack.append(el("p", "more", "+ more loaded"));
        scrollDown();
      });
      const a = el("a", "signin", "Sign in with Buffer");
      a.href = "/connect";
      a.style.display = "inline-block";
      a.style.marginTop = "12px";
      a.onclick = () => { try { sessionStorage.setItem("pending", JSON.stringify(last)); } catch {} };
      info.append(a);
      scrollDown();
      return;
    }
    info.append(el("p", "live-think", "Scanning your queue for open slots…"));
    let plan;
    try {
      plan = await call("/api/aim", { observations: ammo, flavor: last.flavor, tag: store.get("tag") !== "0" });
    } catch (e) {
      info.textContent = "";
      info.append(el("h3", null, "The cannon jammed"), el("p", null, e.message));
      if (e.reconnect) { const a = el("a", "signin", "Sign in with Buffer"); a.href = "/connect"; info.append(a); }
      return;
    }
    info.textContent = "";
    renderPlan(card, info, plan);
    info.insertBefore(ammoBelt(), info.children[2] || null);
    scrollDown();
  }

  function renderPlan(card, info, plan) {
    const n = plan.shells.length;
    const channels = [...new Set(plan.shells.map((s) => s.channelId))];
    const skipped = plan.skipped && plan.skipped.length ? "Skipped " + plan.skipped.map((s) => `${s.name} (${label(s.service)}): ${s.why}`).join("; ") + "." : "";
    if (!n) {
      info.append(el("h3", null, "No open slots to hit"));
      info.append(el("p", null, "Every queue is full, paused, or has no posting times this week. " + skipped));
      return;
    }
    const names = [...new Set(plan.shells.map((s) => label(s.service)))];
    info.append(el("h3", null, `Found ${n} open slot${n === 1 ? "" : "s"} across ${channels.length} channel${channels.length === 1 ? "" : "s"}`));
    info.append(el("p", null, `${names.join(", ")}, next ${plan.horizonDays} days. Each slot gets its own slop.${skipped ? " " + skipped : ""}`));
    const dots = el("div", "dots");
    dots.setAttribute("aria-hidden", "true");
    for (const s of plan.shells) dots.append(el("i", "c" + (channels.indexOf(s.channelId) % 3)));
    info.append(dots);

    const det = el("details", "list");
    det.append(el("summary", null, "See every round"));
    const ul = el("ul", "shells");
    for (const s of plan.shells) {
      const li = el("li");
      li.title = s.text;
      li.append(
        el("time", null, new Date(s.dueAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })),
        el("span", "ch", label(s.service)),
        el("span", "first", firstLine(s.text)),
      );
      ul.append(li);
    }
    det.append(ul);
    info.append(det);

    const controls = el("div", "controls");
    const mode = el("div", "mode");
    mode.setAttribute("role", "group");
    mode.setAttribute("aria-label", "Ammunition");
    const drafts = button("on", "Drafts");
    const live = button("", "Live rounds");
    mode.append(drafts, live);
    const tagLbl = el("label", "tag");
    const tag = el("input");
    tag.type = "checkbox";
    tag.checked = store.get("tag") !== "0";
    tagLbl.append(tag, document.createTextNode("Add #SlopCannon so people are in on the joke"));
    tag.onchange = () => { store.set("tag", tag.checked ? "1" : "0"); aim(); };
    controls.append(mode, tagLbl);
    info.append(controls);

    const liveWarning = el("p", "live-warning");
    liveWarning.setAttribute("role", "alert");
    liveWarning.hidden = true;
    liveWarning.textContent = "Live Rounds creates scheduled posts in your Buffer queue. They will publish at their slot times unless you undo them first.";
    info.append(liveWarning);

    const fire = button("fire full", "");
    const paint = () => {
      const isLive = document.body.dataset.mode === "live";
      drafts.classList.toggle("on", !isLive);
      live.classList.toggle("on", isLive);
      liveWarning.hidden = !isLive;
      fire.textContent = isLive ? `💥 FIRE ${n} LIVE ROUND${n === 1 ? "" : "S"}` : `💥 FIRE ${n} DRAFT${n === 1 ? "" : "S"}`;
    };
    document.body.dataset.mode = "drafts";
    drafts.onclick = () => { document.body.dataset.mode = "drafts"; paint(); };
    live.onclick = () => { document.body.dataset.mode = "live"; paint(); };
    paint();
    fire.onclick = async () => {
      const isLive = document.body.dataset.mode === "live";
      if (isLive && !confirm(`Live rounds: this schedules ${n} real post${n === 1 ? "" : "s"} into your Buffer queue. They publish at their slot times unless you undo them.\n\nFire?`)) return;
      fire.disabled = true;
      boom(n);
      launch(plan.shells, fire);
      try {
        const r = await call("/api/fire", { live: isLive, confirm: isLive ? "FIRE" : undefined });
        card.remove();
        fired(r);
      } catch (e) {
        toast(e.message, true);
        fire.disabled = false;
      }
    };
    card.append(fire);
  }

  function fired(r) {
    const res = el("section", "result" + (r.live ? " live" : ""));
    const left = el("div");
    const what = r.live ? "round" : "draft";
    left.append(el("strong", null, r.landed ? `${r.landed} ${what}${r.landed === 1 ? "" : "s"} landed` : "Misfire"));
    left.append(document.createTextNode(
      !r.landed ? "Nothing landed." : r.live ? "in your Buffer queue. They publish on schedule." : "in your Buffer drafts. Nothing posted.",
    ));
    if (r.misses && r.misses.length) left.append(el("p", "misses", r.misses.map((m) => `${m.channel}: ${m.message}`).join(" · ")));
    const btns = el("div", "btns");
    const open = el("a", null, "See it in Buffer");
    open.href = "https://publish.buffer.com/calendar";
    open.target = "_blank";
    open.rel = "noopener";
    btns.append(open);
    if (r.landed) {
      const undo = button(null, "↩ Undo barrage", async () => {
        undo.disabled = true;
        try {
          const u = await call("/api/undo", {});
          undo.textContent = u.left ? `Deleted ${u.deleted}, ${u.left} left` : `Deleted all ${u.deleted}`;
        } catch (e) { toast(e.message, true); undo.disabled = false; }
      });
      btns.append(undo);
    }
    res.append(left, btns);
    chat.append(res);
    scrollDown();
  }

  // ---- sound: a cannon synthesized on the spot, no audio files ----
  let ctx;
  // Browsers only let audio start from a click, so the context is made and
  // resumed on the first press anywhere, then reused after awaits.
  function audio() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    if (!ctx.master) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 6;
      const g = ctx.createGain();
      g.gain.value = 1.6;
      g.connect(comp).connect(ctx.destination);
      ctx.master = g;
    }
    return ctx;
  }
  document.addEventListener("pointerdown", () => { try { audio(); } catch {} }, { once: true });
  document.addEventListener("keydown", () => { try { audio(); } catch {} }, { once: true });

  function boom(n) {
    if (muted) return;
    try {
      audio();
      const shots = Math.min(n, 8);
      const t0 = ctx.currentTime + 0.03;
      for (let i = 0; i < shots; i++) one(t0 + i * 0.16, i === 0 ? 1 : 0.6);
    } catch {}
  }
  // Chk-chk: two short metallic clicks, like racking a shell.
  function reload() {
    if (muted) return;
    try {
      audio();
      const t0 = ctx.currentTime + 0.02;
      [[t0, 2600, 1], [t0 + 0.13, 1900, 0.9]].forEach(([t, f, k]) => {
        const c = noise(0.06), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 6;
        g.gain.setValueAtTime(1.6 * k, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        c.connect(bp).connect(g).connect(ctx.master);
        c.start(t);
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = "square"; o.frequency.setValueAtTime(f / 4, t);
        og.gain.setValueAtTime(0.12 * k, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        o.connect(og).connect(ctx.master);
        o.start(t); o.stop(t + 0.05);
      });
    } catch {}
  }
  function noise(len) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }
  // One shot = a sharp crack (audible on laptop and phone speakers), a mid
  // thump, and a low rumble for anyone with real speakers.
  function one(t, k) {
    const out = ctx.master;
    // crack
    const c = noise(0.18), bp = ctx.createBiquadFilter(), cg = ctx.createGain();
    bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7;
    cg.gain.setValueAtTime(1.4 * k, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    c.connect(bp).connect(cg).connect(out);
    c.start(t);
    // thump
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.35);
    og.gain.setValueAtTime(1.2 * k, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(og).connect(out);
    o.start(t); o.stop(t + 0.55);
    // rumble
    const r = noise(1.1), lp = ctx.createBiquadFilter(), rg = ctx.createGain();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(200, t + 0.8);
    rg.gain.setValueAtTime(1.0 * k, t);
    rg.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    r.connect(lp).connect(rg).connect(out);
    r.start(t);
  }

  // ---- the visuals: flash, shake, posts flying out of the button ----
  function launch(shells, from) {
    document.body.classList.remove("shake");
    void document.body.offsetWidth;
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 650);
    const r = from.getBoundingClientRect();
    shells.slice(0, 18).forEach((s, i) => {
      setTimeout(() => {
        const c = el("div", "shot", label(s.service) + ": " + firstLine(s.text));
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
  document.querySelectorAll("[data-say]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); makeSlop(b.dataset.say); }));
  $("newChat").onclick = () => { chat.textContent = ""; hello.hidden = false; last = null; ammo = []; say.placeholder = "What mundane thing happened?"; say.focus(); };
  $("pro").onclick = () => toast("There is no Max. There is only more.");
  const mute = $("mute");
  const paintMute = () => { mute.textContent = muted ? "🔇" : "🔊"; mute.setAttribute("aria-pressed", String(muted)); mute.setAttribute("aria-label", muted ? "Sound is off" : "Sound is on"); };
  mute.onclick = () => { muted = !muted; store.set("muted", muted ? "1" : "0"); paintMute(); if (!muted) boom(1); };
  paintMute();

  const params = new URLSearchParams(location.search);
  const err = params.get("error");
  if (err) toast(err === "denied" ? "Buffer sign-in cancelled. The cannon stays unloaded." : err === "signin" ? "Buffer didn't accept the sign-in. Try again in a minute." : "That sign-in didn't finish. Try again.", true);
  loadMe().then(() => {
    // Back from Buffer: pick up the slop they were about to fire.
    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem("pending") || "null"); sessionStorage.removeItem("pending"); } catch {}
    if (params.get("loaded") && me.signedIn) toast("Cannon loaded. 🎯");
    if (pending && me.signedIn && pending.observation) {
      setFlavor(pending.flavor || flavor);
      ammo = Array.isArray(pending.ammo) ? pending.ammo.filter((t) => t !== pending.observation).slice(0, MAX_AMMO - 1) : [];
      makeSlop(pending.observation);
    }
    if (params.toString()) history.replaceState(null, "", "/");
  });
})();
