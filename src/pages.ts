const STYLE = `
:root{
  --bg:#f5f6f2; --surface:#ffffff; --fg:#17191e; --muted:#5b616e; --line:#dfe1da; --accent:#0f6e66; --accent-fg:#ffffff; --soft:#e6f0ee; --warn:#9a4a12;
  --display:"Bricolage Grotesque",system-ui,sans-serif; --body:"Atkinson Hyperlegible",system-ui,sans-serif;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#121417; --surface:#1b1e23; --fg:#eceef1; --muted:#a3a9b4; --line:#2e333b; --accent:#4fc1b4; --accent-fg:#0b1513; --soft:#1d2f2d; --warn:#f0a36b; color-scheme:dark}}
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
  <p class="muted">The Interviewer reads what you shipped on GitHub and asks you a few specific questions about it. Your answers go into Buffer as Ideas, word for word, tagged by your content pillars. You write the posts. It only asks.</p>
</header>
${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ""}
<div class="row"><a class="btn" href="/connect">Connect with Buffer</a><span class="small muted">The only sign-in. Takes about 10 seconds.</span></div>
<section class="card" aria-label="An example question">
  <p class="progress">An example question</p>
  <p class="sample">You merged "Add PKCE to the Buffer sign-in" on Tuesday. What broke first, and how did you find it?</p>
  <p class="source">Merged PR: Add PKCE to the Buffer sign-in</p>
</section>
<section style="display:flex;flex-direction:column;gap:14px">
  <h2>How it works</h2>
  <ol class="steps">
    <li><span>Connect your Buffer account and paste a link to a public GitHub repo.</span></li>
    <li><span>Pick up to three Buffer tags to use as your content pillars.</span></li>
    <li><span>Answer three to five questions about this week's commits and pull requests. Skip any you like. Skipped questions are saved too, so you can come back to them.</span></li>
    <li><span>Open your Buffer Ideas and write from your own words.</span></li>
  </ol>
</section>
<footer>
  <p>What's stored: your Buffer sign-in (encrypted) and your repo link and pillar choices, for 30 days. Your answers live in your own Buffer account, not here. Built for Buffer Commit by Ligaya Beebe. Not made by or affiliated with Buffer. <a href="/privacy">Privacy</a></p>
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
<p>Your Buffer sign-in tokens, encrypted with AES-GCM, plus the public GitHub repo link and the Buffer tags you picked as pillars, and the current week's questions. All of it expires 30 days after your last visit. Disconnecting deletes it straight away.</p>
<h2>What isn't</h2>
<p>Your answers. They're sent to your own Buffer account as Ideas and aren't kept here. Nothing is sold, shared or used for ads, and there's no tracking or analytics.</p>
<h2>What's read</h2>
<p>From Buffer: your organization, tags, recent Ideas and recent posts, only to aim the questions and avoid repeats. From GitHub: public commits, pull requests and issues in the repo you name. If AI-written questions are turned on, that same context is sent to Anthropic's API to write the questions, and isn't used to train models.</p>
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
  <label>What did you work on this week? <span class="muted small" style="font-weight:400">Optional, one or two sentences. It helps aim the questions.</span>
    <textarea id="weekNote" style="min-height:90px"></textarea></label>
  <div class="row"><button id="startBtn" class="btn" type="button">Interview me</button><button id="editSetup" class="btn quiet" type="button">Change repo or pillars</button></div>
</section>

<section id="ask" class="card" hidden aria-live="polite">
  <p class="progress" id="count"></p>
  <p class="sample" id="question"></p>
  <p class="source" id="source"></p>
  <label>Your answer<textarea id="answer" placeholder="Talk it through. It's saved exactly as you write it."></textarea></label>
  <div><span style="font-weight:700;font-size:.95rem">Pillar</span><div id="pillars" class="chips" style="margin-top:8px"></div></div>
  <div class="row"><button id="saveBtn" class="btn" type="button">Save to Buffer</button><button id="skipBtn" class="btn quiet" type="button">Save question for later</button></div>
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
let state = null, i = 0;
function show(id){ for (const s of ["setup","start","ask","done"]) $(s).hidden = s !== id; }
function err(m){ $("msg").textContent = m || ""; $("msg").hidden = !m; }
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
function renderQuestion(){
  const qs = state.questions || [];
  const done = new Set([...(state.answered||[]), ...(state.skipped||[])]);
  while (i < qs.length && done.has(qs[i].id)) i++;
  if (i >= qs.length) return renderDone();
  const q = qs[i];
  $("count").textContent = "Question " + (i+1) + " of " + qs.length;
  $("question").textContent = q.text;
  $("source").innerHTML = ""; const s = q.sourceUrl ? Object.assign(document.createElement("a"), {href:q.sourceUrl, target:"_blank", rel:"noopener"}) : document.createElement("span");
  s.textContent = q.source; $("source").append(s);
  $("answer").value = "";
  $("pillars").innerHTML = "";
  const pillars = (state.tags||[]).filter(t => (state.pillarTagIds||[]).includes(t.id));
  pillars.forEach((t, k) => $("pillars").append(chip(t, "p", "radio", k === 0)));
  show("ask"); $("answer").focus();
}
function renderDone(){
  const a = (state.answered||[]).length, s = (state.skipped||[]).length;
  $("doneLine").textContent = a + (a === 1 ? " answer" : " answers") + " saved to your Buffer Ideas" + (s ? ", and " + s + (s === 1 ? " question" : " questions") + " saved for later." : ".");
  show("done");
}
function route(){
  if (!state.repo || !(state.pillarTagIds||[]).length) return renderSetup();
  if ((state.questions||[]).length) { i = 0; return renderQuestion(); }
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
  try { state = await api("/api/start", {weekNote:$("weekNote").value}); i = 0; renderQuestion(); }
  catch(e){ err(e.message); } finally { $("startBtn").disabled = false; $("startBtn").textContent = "Interview me"; }
};
function pickedPillar(){ const p = document.querySelector('input[name=p]:checked'); return p ? p.value : null; }
$("saveBtn").onclick = async () => {
  err(""); if (!$("answer").value.trim()) return err("Write an answer first, or save the question for later.");
  $("saveBtn").disabled = true;
  try { state = await api("/api/answer", {questionId: state.questions[i].id, answer: $("answer").value, tagId: pickedPillar()}); i++; renderQuestion(); }
  catch(e){ err(e.message); } finally { $("saveBtn").disabled = false; }
};
$("skipBtn").onclick = async () => {
  err(""); $("skipBtn").disabled = true;
  try { state = await api("/api/skip", {questionId: state.questions[i].id, tagId: pickedPillar()}); i++; renderQuestion(); }
  catch(e){ err(e.message); } finally { $("skipBtn").disabled = false; }
};
$("again").onclick = async () => { try { state = await api("/api/reset", {}); route(); } catch(e){ err(e.message); } };
load();
`;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
