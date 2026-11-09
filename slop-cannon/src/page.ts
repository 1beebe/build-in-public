// The page shell. The look lives in public/app.css and the behavior in
// public/app.js, so a new UI concept can replace those files whole.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&family=Fraunces:opsz,wght@9..144,500&display=swap">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">`;

const CANNON = `<svg class="cannon" viewBox="0 0 160 100" aria-hidden="true">
  <g class="barrel"><rect x="40" y="22" width="108" height="30" rx="14" transform="rotate(-18 60 50)" fill="var(--ink)"/><rect x="132" y="2" width="16" height="38" rx="6" transform="rotate(-18 60 50)" fill="var(--acc)"/></g>
  <circle cx="56" cy="70" r="26" fill="none" stroke="var(--ink)" stroke-width="8"/><circle cx="56" cy="70" r="6" fill="var(--acc)"/>
  <path d="M56 44v52M30 70h52M38 52l36 36M74 52L38 88" stroke="var(--ink)" stroke-width="4"/>
</svg>`;

export function appPage(flavors: Record<string, string>): string {
  const tabs = Object.entries(flavors)
    .map(([k, v], i) => `<button class="flavor${i === 0 ? " on" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-flavor="${esc(k)}">${esc(v)}</button>`)
    .join("");
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
<div class="aurora" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
<div class="flash" aria-hidden="true"></div>
<div class="app">
  <aside class="side" aria-label="Chats">
    <div class="brand"><b>✦</b>Slop Cannon</div>
    <button class="sidebtn" id="newChat" type="button">＋ New slop</button>
    <h6>Today</h6>
    <a class="on" href="#" data-say="My coffee went cold during a meeting">Cold coffee → pipeline insight</a>
    <a href="#" data-say="I couldn't find a parking spot">Parking lot as a metaphor for churn</a>
    <h6>Previous 7 days</h6>
    <a href="#" data-say="My dog ignored me when I called him">What my dog taught me about PLG</a>
    <a href="#" data-say="The microwave beeped three times">Microwave beeps and founder mode</a>
    <a href="#" data-say="The elevator stopped on every floor">The elevator is a sales funnel</a>
    <a href="#" data-say="I tripped on the stairs">I tripped. Here's my GTM strategy.</a>
    <button class="upgrade" id="pro" type="button"><b>✨ Upgrade to Slop Max</b>Unlimited em dashes</button>
  </aside>
  <div class="mainc">
    <header class="top">
      <div class="picker" role="tablist" aria-label="Slop flavor">${tabs}</div>
      <div class="who"><button class="iconbtn" id="mute" type="button" aria-pressed="false" aria-label="Sound is on">🔊</button><span id="who"></span></div>
    </header>
    <main class="thread" id="thread">
      <section class="hello" id="hello">
        <div class="no-ai-badge">✨ AI-POWERED · NO AI INSIDE</div>
        <h1><span>How can I help you today?</span></h1>
        <p>Tell me one mundane thing. I'll turn it into thought leadership and fire it into every open slot in your Buffer queue.</p>
        <div class="chips">
          <button type="button" data-say="My coffee went cold during a meeting">☕ Cold coffee</button>
          <button type="button" data-say="The dishwasher finished while I was on a call">🍽️ Dishwasher</button>
          <button type="button" data-say="I parallel parked on the first try">🚗 Parallel parking</button>
        </div>
        <div class="loadout" aria-label="Slop cannon loadout">
          <label>Ammunition type
            <select id="ammunition">
              <option value="founder">Founder Mode</option>
              <option value="vulnerable">Vulnerable Leadership</option>
              <option value="framework">Unnecessary Framework</option>
              <option value="contrarian">Contrarian Take</option>
              <option value="epiphany">Airport Epiphany</option>
              <option value="notes">Screenshot This™</option>
            </select>
          </label>
          <label>Slop intensity: <strong id="intensityName">Peak LinkedIn</strong>
            <input id="intensity" type="range" min="1" max="5" value="3">
          </label>
        </div>
        <div class="crime-metrics" aria-label="Extremely legitimate product metrics">
          <div><strong>10x</strong><span>more slop</span></div>
          <div><strong>0</strong><span>AI models used</span></div>
          <div><strong>∞</strong><span>em-dashes</span></div>
        </div>
      </section>
      <div id="chat" aria-live="polite"></div>
    </main>
    <div class="composer">
      <form class="box" id="composer">
        <label class="sr" for="say">Something mundane</label>
        <textarea id="say" rows="1" maxlength="200" placeholder="What mundane thing happened?"></textarea>
        <button class="send" type="submit" aria-label="Make slop">↑</button>
      </form>
      <p class="disc">Slop Cannon can make mistakes. That's the point. No AI inside. Not affiliated with OpenAI, Anthropic, Google, xAI or Buffer. <a href="/privacy">Privacy</a></p>
    </div>
  </div>
</div>
<button class="crimes-badge" id="crimesBadge" type="button" aria-haspopup="dialog" aria-controls="crimeSheet">🚨 Design crimes: <strong id="crimeCount">12</strong></button>
<dialog class="crime-sheet" id="crimeSheet" aria-labelledby="crimeTitle">
  <div class="crime-head">
    <div><span>INTERNAL AFFAIRS</span><h2 id="crimeTitle">UI rap sheet</h2></div>
    <button id="closeCrimes" type="button" aria-label="Close design crimes">×</button>
  </div>
  <p id="crimeIntro"></p>
  <ol id="crimeList"></ol>
  <p class="crime-note">Aesthetic offenses only. Accessibility remains annoyingly lawful.</p>
</dialog>
<template id="cannonArt">${CANNON}</template>
<div class="toast" id="toast" role="status" hidden></div>
<script src="/app.js"></script>
</body>
</html>`;
}

export function privacyPage(): string {
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
