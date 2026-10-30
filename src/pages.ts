const STYLE = `
:root{
  --bg:#f5f6f2; --surface:#ffffff; --fg:#17191e; --muted:#5b616e; --line:#dfe1da; --accent:#0f6e66; --accent-fg:#ffffff; --soft:#e6f0ee; --warn:#9a4a12;
  --add:#e3f4e6; --add-fg:#1d6b2c; --del:#fbe7e6; --del-fg:#a1302b; --code:#f0f1ec;
  --display:"Bricolage Grotesque",system-ui,sans-serif; --body:"Atkinson Hyperlegible",system-ui,sans-serif;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#121417; --surface:#1b1e23; --fg:#eceef1; --muted:#a3a9b4; --line:#2e333b; --accent:#4fc1b4; --accent-fg:#0b1513; --soft:#1d2f2d; --warn:#f0a36b;
  --add:#16301d; --add-fg:#7fd492; --del:#3a1b1a; --del-fg:#f29b94; --code:#16191d; color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--body);font-size:17px;line-height:1.55;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:640px;margin:0 auto;padding-block:48px 64px;display:flex;flex-direction:column;gap:28px}
h1,h2{font-family:var(--display);letter-spacing:-.015em;text-wrap:balance;margin:0}
h1{font-size:clamp(2rem,6vw,2.8rem);line-height:1.08}
h2{font-size:1.35rem;line-height:1.25}
p{margin:0}
.muted{color:var(--muted)}
.small{font-size:.9rem}
a{color:var(--accent)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:600 1rem/1 var(--body);padding:14px 20px;border-radius:10px;
  border:1px solid var(--accent);background:var(--accent);color:var(--accent-fg);text-decoration:none;cursor:pointer}
.btn.quiet{background:transparent;color:var(--accent)}
.btn:disabled{opacity:.5;cursor:default}
.btn:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:16px}
label{font-weight:700;font-size:.95rem;display:flex;flex-direction:column;gap:6px}
input[type=text],textarea,select{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px 14px;width:100%}
textarea{min-height:150px;resize:vertical}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:99px;padding:6px 12px;font-weight:400;flex-direction:row;cursor:pointer}
.chip input{accent-color:var(--accent)}
.dot{width:10px;height:10px;border-radius:50%}
.source{font-size:.88rem;color:var(--muted);border-left:3px solid var(--accent);padding-left:10px}
.progress{font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.steps{display:grid;gap:14px;padding:0;margin:0;list-style:none;counter-reset:s}
.steps li{display:grid;grid-template-columns:32px 1fr;gap:12px;counter-increment:s}
.steps li::before{content:counter(s);font-family:var(--display);font-weight:700;width:32px;height:32px;border-radius:50%;background:var(--soft);color:var(--accent);display:grid;place-items:center}
.error{color:var(--warn);font-weight:700}
.sample{font-family:var(--display);font-size:1.25rem;line-height:1.35}
footer{font-size:.85rem;color:var(--muted)}
main.wide{max-width:1180px}
.split{display:grid;gap:20px}
.split .panel{order:-1}
@media (min-width:960px){
  .split{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start}
  .split .panel{order:0;position:sticky;top:20px}
}
.src{gap:14px;min-width:0}
.src h3{font-family:var(--display);font-size:1.2rem;line-height:1.3;margin:0}
.meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.88rem;color:var(--muted)}
.plus{color:var(--add-fg)} .minus{color:var(--del-fg)}
.body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.95rem;max-height:16em;overflow:auto}
.file{border:1px solid var(--line);border-radius:10px;overflow:hidden}
.file summary{cursor:pointer;padding:9px 12px;font:600 .86rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;display:flex;gap:10px;justify-content:space-between;overflow-wrap:anywhere}
.diff{margin:0;background:var(--code);font:.8rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-x:auto;padding:6px 0}
.diff span{display:block;padding:0 12px;white-space:pre}
.diff .a{background:var(--add);color:var(--add-fg)} .diff .d{background:var(--del);color:var(--del-fg)} .diff .h{color:var(--muted)}
.small-btn{padding:9px 14px;font-size:.92rem}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
button.chip{font:inherit;font-size:.88rem;background:transparent;color:var(--fg);padding:5px 11px}
.chip.on{border-color:var(--accent);background:var(--soft);color:var(--accent)}
.log{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;max-height:46vh;overflow:auto}
.log li{display:flex;flex-direction:column;gap:2px;max-width:92%}
.log li p{white-space:pre-wrap;overflow-wrap:anywhere}
.log .them p{font-family:var(--display);font-size:1.12rem;line-height:1.4}
.log .you{align-self:flex-end;background:var(--soft);border-radius:12px;padding:10px 14px}
.log .who{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.typing p{color:var(--muted)}
.drafts{display:grid;gap:16px}
@media (min-width:960px){.drafts{grid-template-columns:1fr 1fr}}
.draft .title{font:600 1.05rem/1.35 var(--display)}
.draft .text{min-height:120px}
.draft .prompts{min-height:84px;font-size:.92rem;color:var(--muted)}
.draft.later{opacity:.85;border-style:dashed}
.pick{align-self:flex-start}
.live{padding:12px;border-radius:12px;background:var(--soft)}
#liveBtn.on{background:var(--warn);border-color:var(--warn)}
#micBtn[aria-pressed=true]{background:var(--warn);border-color:var(--warn);color:var(--accent-fg)}
[hidden]{display:none!important}
`;

function shell(title: string, body: string, script = ""): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="A weekly interview about what you built on GitHub. Your answers land in Buffer as Ideas, in your own words.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&display=swap">
<style>${STYLE}</style></head><body><main>${body}</main>${script ? `<script>${script}</script>` : ""}</body></html>`;
}

export function landingPage(error?: string): string {
  return shell(
    "The Interviewer",
    `
<header style="display:flex;flex-direction:column;gap:14px">
  <p class="progress">For people building in public</p>
  <h1>You built something this week. Let's get it out of your head.</h1>
  <p class="muted">The Interviewer reads what you shipped on GitHub and what you've posted lately, then talks with you about your week, out loud or typed. When you're done, it finds the stories worth telling and saves them to Buffer as Ideas, in your exact words, with a few questions to help you shape each one. You write the posts. It only asks.</p>
</header>
${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
<div class="row"><a class="btn" href="/connect">Connect with Buffer</a><span class="small muted">The only sign-in. Takes about 10 seconds.</span></div>
<section class="card" aria-label="An example">
  <p class="progress">How it sounds</p>
  <p class="sample">"You rebuilt the interview this week so it's one conversation instead of a list of questions. What wasn't working before?"</p>
  <p class="small muted">Then it follows whatever you say: the reason, the surprise, the person it's for.</p>
</section>
<section style="display:flex;flex-direction:column;gap:14px">
  <h2>How it works</h2>
  <ol class="steps">
    <li><span>Connect your Buffer account and paste a link to a public GitHub repo.</span></li>
    <li><span>Pick up to three Buffer tags to use as your content pillars.</span></li>
    <li><span>Talk for ten minutes about your week. The change you're discussing shows up beside the conversation.</span></li>
    <li><span>Review the ideas it found, edit or untick any, and save them to Buffer. Then write from your own words.</span></li>
  </ol>
</section>
<footer>
  <p>What's stored: your Buffer sign-in (encrypted), your repo link and pillar choices, and your latest conversation until you start a new one, for up to 30 days. Saved ideas live in your own Buffer account. Built for Buffer Commit by Ligaya Beebe. Not made by or affiliated with Buffer. <a href="/privacy">Privacy</a></p>
</footer>`,
  );
}

export function privacyPage(): string {
  return shell(
    "Privacy · The Interviewer",
    `
<h1>Privacy</h1>
<p>The Interviewer stores as little as it can, for as short a time as it can.</p>
<h2>What's stored</h2>
<p>Your Buffer sign-in tokens, encrypted with AES-GCM, plus the public GitHub repo link, the Buffer tags you picked as pillars, and the current interview: its topics and the conversation, encrypted the same way. Starting a new interview clears the last one. All of it expires 30 days after your last visit. Disconnecting deletes it straight away.</p>
<h2>What isn't</h2>
<p>Anything after you're done with it. The Ideas you choose go to your own Buffer account. Nothing is sold, shared or used for ads, and there's no tracking or analytics.</p>
<h2>What's read</h2>
<p>From Buffer: your organization, tags, recent Ideas and up to 20 posts from the last 30 days, only to aim the questions, understand who you write for, and avoid repeats. From GitHub: public commits, pull requests and issues in the repo you name. That context is sent to MindStudio, which runs the AI model that writes the questions.</p>
<h2>Voice</h2>
<p>A live voice conversation runs directly between your browser and OpenAI's realtime model; this app only hands your browser a key that works for two minutes, and keeps the written transcript for the harvest. If you answer out loud, the recording is held here for at most 10 minutes behind a random link so MindStudio can transcribe it, then deleted. You see the text and can edit it before anything is saved. Questions read aloud are generated by MindStudio from the question text.</p>
<h2>Contact</h2>
<p>Ligaya Beebe, L. Beebe, LLC. Not made by or affiliated with Buffer.</p>
<p><a href="/">Back</a></p>`,
  );
}

export function appPage(): string {
  return shell(
    "The Interviewer",
    `
<header class="row" style="justify-content:space-between">
  <h2>The Interviewer</h2>
  <form method="post" action="/logout"><button class="btn quiet" type="submit">Disconnect</button></form>
</header>
<p id="msg" class="error" role="alert" hidden></p>

<section id="setup" class="card" hidden>
  <h2>Set up</h2>
  <label id="orgWrap" hidden>Buffer organization<select id="org"></select></label>
  <label>Your public GitHub repo<input id="repo" type="text" placeholder="github.com/you/project" autocomplete="off"></label>
  <div style="display:flex;flex-direction:column;gap:8px">
    <span style="font-weight:700;font-size:.95rem">Content pillars <span class="muted small">(pick up to 3 Buffer tags)</span></span>
    <div id="tags" class="chips"></div>
    <p id="noTags" class="small muted" hidden>You don't have any tags in Buffer yet. Create one to three in Buffer (for example: what I built, what I learned, who it's for), then reload this page.</p>
  </div>
  <div class="row"><button id="saveSetup" class="btn" type="button">Save</button></div>
</section>

<section id="start" class="card" hidden>
  <p class="progress" id="repoLine"></p>
  <label>What did you work on this week? <span class="muted small" style="font-weight:400">Optional, one or two sentences. It helps aim the conversation.</span>
    <textarea id="weekNote" style="min-height:90px"></textarea></label>
  <div class="row"><button id="startBtn" class="btn" type="button">Start the interview</button><button id="editSetup" class="btn quiet" type="button">Change repo or pillars</button></div>
</section>

<section id="talk" class="split" hidden>
<aside id="src" class="card src" aria-label="What we're talking about"></aside>
<div class="card panel">
  <div class="row" style="justify-content:space-between"><p class="progress" id="talkLine"></p><span id="voiceState" class="small muted"></span></div>
  <div id="topics" class="chips" aria-label="Topics from your week"></div>
  <ol id="log" class="log" aria-live="polite"></ol>
  <div class="row live" id="liveBox" hidden><button id="liveBtn" class="btn" type="button">● Start talking</button><span id="liveState" class="small muted" aria-live="polite"></span></div>
  <label for="say" class="sr">Your answer</label>
  <textarea id="say" placeholder="Type your answer. Enter sends, Shift+Enter for a new line." style="min-height:96px"></textarea>
  <div class="row">
    <button id="sendBtn" class="btn" type="button">Send</button>
    <button id="micBtn" class="btn quiet small-btn" type="button" aria-pressed="false" hidden>● Talk</button>
    <label class="chip" id="speakWrap" hidden style="font-weight:400"><input type="checkbox" id="speakOn"> Read questions aloud</label>
    <span id="micNote" class="small muted"></span>
  </div>
  <div class="row" style="border-top:1px solid var(--line);padding-top:14px"><button id="harvestBtn" class="btn quiet" type="button">I'm done. Find my ideas</button></div>
</div>
</section>

<section id="review" style="display:flex;flex-direction:column;gap:18px" hidden>
  <div style="display:flex;flex-direction:column;gap:8px">
    <h2>Ideas from your interview</h2>
    <p class="muted">Each title names an angle. Below it are your own words, exactly as you said them, under the question that drew them out, then questions to help you develop it into a post. Edit anything, untick what you don't want, then save.</p>
  </div>
  <div id="drafts" class="drafts"></div>
  <div class="row"><button id="saveAll" class="btn" type="button">Save to Buffer</button><button id="backTalk" class="btn quiet" type="button">Back to the conversation</button></div>
</section>

<section id="done" class="card" hidden>
  <h2>That's this week.</h2>
  <p id="doneLine"></p>
  <div class="row"><a class="btn" href="https://publish.buffer.com" target="_blank" rel="noopener">Open Buffer</a><button id="again" class="btn quiet" type="button">Start a new interview</button></div>
</section>`,
    APP_SCRIPT,
  );
}

const APP_SCRIPT = `
const $ = (id) => document.getElementById(id);
let state = null, shown = null, busy = false;
const SCREENS = ["setup","start","talk","review","done"];
function show(id){ for (const s of SCREENS) $(s).hidden = s !== id; document.querySelector("main").classList.toggle("wide", id === "talk" || id === "review"); }
function err(m){ $("msg").textContent = m || ""; $("msg").hidden = !m; }
function el(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
async function api(path, body){
  const res = await fetch(path, body ? {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)} : {});
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) { location.href = "/?error=reconnect"; throw new Error("reconnect"); }
  if (!res.ok) throw new Error(json.error || "Something went wrong. Try again.");
  return json;
}
function chip(tag, name, type, checked){
  const l = document.createElement("label"); l.className = "chip";
  l.innerHTML = '<input type="'+type+'" name="'+name+'"><span class="dot"></span><span></span>';
  l.querySelector("input").value = tag.id; l.querySelector("input").checked = checked;
  l.querySelector(".dot").style.background = tag.color; l.querySelector("span:last-child").textContent = tag.name;
  return l;
}
const pillars = () => (state.tags||[]).filter(t => (state.pillarTagIds||[]).includes(t.id));

// Setup
function renderSetup(){
  const orgs = state.orgs || [];
  $("orgWrap").hidden = orgs.length < 2;
  $("org").innerHTML = ""; for (const o of orgs){ const op = new Option(o.name, o.id); op.selected = o.id === state.organizationId; $("org").add(op); }
  $("repo").value = state.repo || "";
  $("tags").innerHTML = "";
  for (const t of state.tags || []) $("tags").append(chip(t, "pillar", "checkbox", (state.pillarTagIds||[]).includes(t.id)));
  $("noTags").hidden = (state.tags || []).length > 0;
  show("setup");
}

// The side panel: the piece of work the conversation is on.
const sources = new Map();
const KIND = {pull:"Merged pull request", commit:"Commit", issue:"Closed issue", post:"Your latest Buffer post"};
async function renderSource(about){
  const q = (state.questions||[])[about];
  if (shown === about && $("src").childNodes.length) return;
  shown = about;
  const box = $("src"); box.innerHTML = "";
  if (!q || !q.ref) { box.append(el("p", "progress", "Your week"), el("p", "muted", state.repo || "")); return; }
  box.append(el("p", "progress", KIND[q.ref.kind]), el("p", "muted small", "Reading it…"));
  let src = sources.get(q.id);
  if (!src) { try { src = await api("/api/source?q=" + encodeURIComponent(q.id)); sources.set(q.id, src); } catch(e) { box.lastChild.textContent = e.message; return; } }
  if (shown !== about) return;
  box.innerHTML = "";
  box.append(el("p", "progress", KIND[src.kind]));
  const h = el("h3"); if (src.url) { const a = el("a", "", src.title); a.href = src.url; a.target = "_blank"; a.rel = "noopener"; h.append(a); } else h.textContent = src.title; box.append(h);
  const meta = el("div", "meta");
  if (src.who) meta.append(el("span", "", src.who));
  if (src.when) meta.append(el("span", "", new Date(src.when).toLocaleDateString(undefined, {weekday:"short", month:"short", day:"numeric"})));
  if (src.stats) meta.append(el("span", "plus", "+" + src.stats.additions), el("span", "minus", "−" + src.stats.deletions), el("span", "", src.stats.files + (src.stats.files === 1 ? " file" : " files")));
  if (meta.childNodes.length) box.append(meta);
  if (src.body) box.append(el("div", "body", src.body));
  src.files.forEach((f, k) => {
    const d = el("details", "file"); if (k < 2 && f.patch) d.open = true;
    const sum = el("summary"); sum.append(el("span", "", f.name)); const n = el("span"); n.append(el("span", "plus", "+" + f.additions), " ", el("span", "minus", "−" + f.deletions)); sum.append(n); d.append(sum);
    if (f.patch) { const pre = el("pre", "diff"); for (const line of f.patch.split("\\\\n")) pre.append(el("span", line.startsWith("@@") ? "h" : line[0] === "+" ? "a" : line[0] === "-" ? "d" : "", line || " ")); d.append(pre); }
    else { const none = el("p", "small muted", f.status === "removed" ? "File removed." : "No preview for this file."); none.style.padding = "0 12px 10px"; d.append(none); }
    box.append(d);
  });
}

// The conversation
function currentAbout(){ const t = [...(state.turns||[])].reverse().find(t => t.about != null); return t ? t.about : null; }
function renderTalk(){
  $("talkLine").textContent = "Interview · " + (state.repo || "");
  const about = currentAbout();
  $("topics").innerHTML = "";
  (state.questions||[]).forEach((q, k) => {
    const b = el("button", "chip" + (k === shown ? " on" : ""), q.source.replace(/^(Merged PR|Closed issue|Commit): /, ""));
    b.type = "button"; b.title = q.source; b.onclick = () => { renderSource(k); markTopics(); };
    $("topics").append(b);
  });
  const log = $("log"); log.innerHTML = "";
  for (const t of state.turns || []) {
    const li = el("li", t.who === "you" ? "you" : "them");
    li.append(el("span", "who", t.who === "you" ? "You" : "Interviewer"), el("p", "", t.text));
    log.append(li);
  }
  if (busy) { const li = el("li", "them typing"); li.append(el("span", "who", "Interviewer"), el("p", "", "…")); log.append(li); }
  log.scrollTop = log.scrollHeight;
  $("liveBox").hidden = !state.live || !window.RTCPeerConnection;
  $("micBtn").hidden = $("speakWrap").hidden = !state.voice || !window.MediaRecorder || !$("liveBox").hidden;
  show("talk");
  if (about != null && about !== shown) renderSource(about).then(markTopics); else if (shown == null) renderSource(null);
  markTopics();
}
function markTopics(){ [...$("topics").children].forEach((b, k) => b.classList.toggle("on", k === shown)); }

async function say(){
  const text = $("say").value.trim(); if (!text || busy) return;
  if (liveOn() && dc && dc.readyState === "open") {
    dc.send(JSON.stringify({type:"conversation.item.create", item:{type:"message", role:"user", content:[{type:"input_text", text}]}}));
    dc.send(JSON.stringify({type:"response.create"})); $("say").value = ""; return;
  }
  err(""); busy = true; $("sendBtn").disabled = true;
  state.turns = [...(state.turns||[]), {who:"you", text}]; $("say").value = ""; renderTalk();
  try { state = await api("/api/say", {text}); busy = false; renderTalk(); speakLatest(); }
  catch(e){ busy = false; state.turns.pop(); $("say").value = text; renderTalk(); err(e.message); }
  finally { $("sendBtn").disabled = false; $("say").focus(); }
}
$("sendBtn").onclick = say;
$("say").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); say(); } });

// Voice: questions read aloud, answers spoken and written down.
let player = null;
async function speakLatest(){
  if (!$("speakOn").checked) return;
  try { $("voiceState").textContent = "…"; const { audioUrl } = await api("/api/speak", {}); if (player) player.pause(); player = new Audio(audioUrl); player.onended = () => { $("voiceState").textContent = ""; }; $("voiceState").textContent = "Speaking"; await player.play(); }
  catch(e){ $("voiceState").textContent = ""; }
}
$("speakOn").onchange = () => { if ($("speakOn").checked) speakLatest(); else if (player) player.pause(); };
let rec = null, chunks = [];
$("micBtn").onclick = async () => {
  err("");
  if (rec && rec.state === "recording") { rec.stop(); return; }
  if (player) player.pause();
  let stream; try { stream = await navigator.mediaDevices.getUserMedia({audio:true}); } catch { return err("The browser didn't allow the microphone. You can type instead."); }
  chunks = []; rec = new MediaRecorder(stream);
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = async () => {
    stream.getTracks().forEach(t => t.stop());
    $("micBtn").setAttribute("aria-pressed", "false"); $("micBtn").textContent = "● Talk"; $("micBtn").disabled = true; $("micNote").textContent = "Writing down what you said…";
    try {
      const blob = new Blob(chunks, {type: rec.mimeType || "audio/webm"});
      const res = await fetch("/api/transcribe", {method:"POST", headers:{"Content-Type": blob.type}, body: blob});
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't write that down. Try again or type it.");
      const a = $("say"); a.value = (a.value.trim() ? a.value.trim() + " " : "") + json.text; a.focus();
      $("micNote").textContent = "Check it, then send.";
    } catch(e){ err(e.message); $("micNote").textContent = ""; } finally { $("micBtn").disabled = false; }
  };
  rec.start(); $("micBtn").setAttribute("aria-pressed", "true"); $("micBtn").textContent = "■ Stop"; $("micNote").textContent = "Listening…";
};

// Live voice: the browser talks to OpenAI's realtime model directly over
// WebRTC, with a short-lived key from our server. The transcript is synced back
// so the harvest can read it.
let pc = null, dc = null, mic = null, liveTurns = null, liveAbout = null, liveTimer = null, syncTimer = null, items = {};
function setLive(s){ $("liveState").textContent = s || ""; }
function liveOn(){ return pc && pc.connectionState !== "closed"; }
function ensureItem(id, who){
  if (!items[id]) { const t = {who, text:"", about: who === "interviewer" ? liveAbout : undefined}; items[id] = t; liveTurns.push(t); }
  return items[id];
}
function drawLive(){ state.turns = liveTurns.filter(t => t.text.trim()).map(t => ({who:t.who, text:t.text, about:t.about})); renderTalk(); }
function syncLive(now){
  clearTimeout(syncTimer);
  const send = () => api("/api/voice-turns", {turns: state.turns}).catch(() => {});
  if (now) return send();
  syncTimer = setTimeout(send, 1500);
}
function onLiveEvent(ev){
  const it = ev.item;
  switch (ev.type) {
    case "conversation.item.added": case "conversation.item.created": case "response.output_item.added":
      if (it && it.type === "message" && (it.role === "user" || it.role === "assistant")) {
        const t = ensureItem(it.id, it.role === "user" ? "you" : "interviewer");
        const typed = (it.content || []).find(c => c.type === "input_text"); if (typed) { t.text = typed.text; drawLive(); syncLive(); }
      }
      break;
    case "conversation.item.input_audio_transcription.delta": ensureItem(ev.item_id, "you").text += ev.delta || ""; drawLive(); break;
    case "conversation.item.input_audio_transcription.completed": ensureItem(ev.item_id, "you").text = ev.transcript || ""; drawLive(); syncLive(); break;
    case "response.output_audio_transcript.delta": case "response.audio_transcript.delta": ensureItem(ev.item_id, "interviewer").text += ev.delta || ""; setLive("Speaking"); drawLive(); break;
    case "response.output_audio_transcript.done": case "response.audio_transcript.done": ensureItem(ev.item_id, "interviewer").text = ev.transcript || ""; drawLive(); syncLive(); break;
    case "input_audio_buffer.speech_started": setLive("Listening"); if (player) player.pause(); break;
    case "input_audio_buffer.speech_stopped": setLive("Thinking"); break;
    case "response.done": {
      // The panel switch rides along with speech. If the model called
      // show_work and hasn't asked its question yet, it needs a nudge to go on.
      const out = (ev.response && ev.response.output) || [];
      const said = out.filter(o => o.type === "message").flatMap(o => o.content || []).map(c => c.transcript || c.text || "").join(" ");
      if (out.some(o => o.type === "function_call") && !said.includes("?")) dc.send(JSON.stringify({type:"response.create"}));
      else setLive("Your turn");
      break;
    }
    case "response.function_call_arguments.done":
      if (ev.name === "show_work") {
        let a = {}; try { a = JSON.parse(ev.arguments || "{}"); } catch {}
        const k = (a.item | 0) - 1;
        if (k >= 0 && k < (state.questions || []).length) { liveAbout = k; renderSource(k).then(markTopics); }
        dc.send(JSON.stringify({type:"conversation.item.create", item:{type:"function_call_output", call_id: ev.call_id, output: JSON.stringify({shown: k >= 0})}}));
      }
      break;
    case "error": console.warn("realtime", ev.error || ev); break;
  }
}
async function startLive(){
  err(""); $("liveBtn").disabled = true; setLive("Connecting…");
  try {
    mic = await navigator.mediaDevices.getUserMedia({audio:true});
    const { key } = await api("/api/voice", {});
    items = {}; liveTurns = (state.turns || []).some(t => t.who === "you") ? state.turns.map(t => ({...t})) : []; liveAbout = currentAbout();
    pc = new RTCPeerConnection();
    const out = new Audio(); out.autoplay = true;
    pc.ontrack = (e) => { out.srcObject = e.streams[0]; };
    mic.getTracks().forEach(t => pc.addTrack(t, mic));
    dc = pc.createDataChannel("oai-events");
    dc.onmessage = (e) => { try { onLiveEvent(JSON.parse(e.data)); } catch (x) { console.warn(x); } };
    dc.onopen = () => { dc.send(JSON.stringify({type:"response.create"})); setLive("Connected"); };
    pc.onconnectionstatechange = () => { if (["failed","disconnected"].includes(pc.connectionState)) { stopLive(); err("The voice connection dropped. Your conversation so far is kept. Start talking again to pick up."); } };
    const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    const r = await fetch("https://api.openai.com/v1/realtime/calls", {method:"POST", body: offer.sdp, headers:{Authorization: "Bearer " + key, "Content-Type": "application/sdp"}});
    if (!r.ok) throw new Error("The voice service didn't connect (" + r.status + "). Try again, or type.");
    await pc.setRemoteDescription({type:"answer", sdp: await r.text()});
    $("liveBtn").textContent = "■ Pause"; $("liveBtn").classList.add("on");
    liveTimer = setTimeout(() => { stopLive(); err("Paused after 20 minutes. Start talking again to keep going, or find your ideas."); }, 20 * 60 * 1000);
  } catch (e) { stopLive(); err(e.message === "Permission denied" ? "The browser didn't allow the microphone. You can type instead." : e.message); }
  finally { $("liveBtn").disabled = false; }
}
async function stopLive(){
  clearTimeout(liveTimer);
  if (dc) try { dc.close(); } catch {}
  if (pc) try { pc.close(); } catch {}
  if (mic) mic.getTracks().forEach(t => t.stop());
  const was = !!liveTurns; pc = dc = mic = null; liveTurns = null;
  $("liveBtn").textContent = "● Start talking"; $("liveBtn").classList.remove("on"); setLive("");
  if (was) await syncLive(true);
}
$("liveBtn").onclick = () => liveOn() ? stopLive() : startLive();

// Harvest and review
$("harvestBtn").onclick = async () => {
  err(""); $("harvestBtn").disabled = true; $("harvestBtn").textContent = "Reading the conversation…";
  try { if (liveTurns) await stopLive(); state = await api("/api/harvest", {}); renderReview(); }
  catch(e){ err(e.message); } finally { $("harvestBtn").disabled = false; $("harvestBtn").textContent = "I'm done. Find my ideas"; }
};
function renderReview(){
  const box = $("drafts"); box.innerHTML = "";
  for (const d of state.drafts || []) {
    const card = el("div", "card draft" + (d.later ? " later" : "")); card.dataset.id = d.id;
    const top = el("label", "chip pick"); const cb = el("input"); cb.type = "checkbox"; cb.checked = !d.later; top.append(cb, el("span", "", d.later ? "Save to answer later" : "Save this idea")); card.append(top);
    if ((state.saved||[]).includes(d.id)) { cb.checked = false; cb.disabled = true; top.lastChild.textContent = "Saved"; }
    const t = el("input", "title"); t.type = "text"; t.value = d.title; t.setAttribute("aria-label", "Idea title"); card.append(t);
    const x = el("textarea", "text"); x.value = d.text; x.setAttribute("aria-label", "Idea text, in your words"); card.append(x);
    if ((d.prompts||[]).length) {
      card.append(el("p", "small muted", "Prompts to develop it (one per line):"));
      const pr = el("textarea", "prompts"); pr.value = d.prompts.join("\\n"); pr.setAttribute("aria-label", "Shaping questions, one per line"); card.append(pr);
    }
    const chips = el("div", "chips"); pillars().forEach((p, k) => chips.append(chip(p, "pl-" + d.id, "radio", d.tagId ? d.tagId === p.id : k === 0))); card.append(chips);
    box.append(card);
  }
  show("review");
}
$("backTalk").onclick = renderTalk;
$("saveAll").onclick = async () => {
  err("");
  const drafts = [...document.querySelectorAll(".draft")].filter(c => c.querySelector(".pick input").checked).map(c => ({
    id: c.dataset.id, title: c.querySelector(".title").value, text: c.querySelector(".text").value,
    prompts: c.querySelector(".prompts") ? c.querySelector(".prompts").value.split("\\n").map(x => x.trim()).filter(Boolean) : [],
    tagId: (c.querySelector('.chips input:checked') || {}).value,
  }));
  if (!drafts.length) return err("Tick at least one idea to save.");
  $("saveAll").disabled = true; $("saveAll").textContent = "Saving…";
  try { state = await api("/api/save", {drafts}); renderDone(); }
  catch(e){ err(e.message); try { state = await api("/api/state"); renderReview(); } catch {} }
  finally { $("saveAll").disabled = false; $("saveAll").textContent = "Save to Buffer"; }
};
function renderDone(){
  const n = (state.saved||[]).length;
  $("doneLine").textContent = n + (n === 1 ? " idea" : " ideas") + " saved to your Buffer Ideas, in your own words.";
  show("done");
}

function route(){
  if (!state.repo || !(state.pillarTagIds||[]).length) return renderSetup();
  if ((state.drafts||[]).length) return (state.saved||[]).length ? renderDone() : renderReview();
  if ((state.turns||[]).length) return renderTalk();
  $("repoLine").textContent = state.repo; show("start");
}
async function load(){ try { state = await api("/api/state"); route(); } catch(e){ err(e.message); } }
$("saveSetup").onclick = async () => {
  err(""); const ids = [...document.querySelectorAll('input[name=pillar]:checked')].map(x => x.value);
  if (ids.length > 3) return err("Pick up to three pillars.");
  try { $("saveSetup").disabled = true; state = await api("/api/setup", {organizationId:$("org").value, repo:$("repo").value, pillarTagIds:ids}); route(); }
  catch(e){ err(e.message); } finally { $("saveSetup").disabled = false; }
};
$("editSetup").onclick = renderSetup;
$("startBtn").onclick = async () => {
  err(""); $("startBtn").disabled = true; $("startBtn").textContent = "Reading your week…";
  try { state = await api("/api/start", {weekNote:$("weekNote").value}); shown = null; renderTalk(); speakLatest(); $("say").focus({preventScroll:true}); }
  catch(e){ err(e.message); } finally { $("startBtn").disabled = false; $("startBtn").textContent = "Start the interview"; }
};
$("again").onclick = async () => { try { state = await api("/api/reset", {}); shown = null; sources.clear(); route(); } catch(e){ err(e.message); } };
load();
`;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
