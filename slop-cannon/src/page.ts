// The page shell. The look lives in public/app.css and the behavior in
// public/app.js, so a new UI concept can replace those two files whole.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">`;

export function appPage(flavors: Record<string, string>): string {
  const options = Object.entries(flavors)
    .map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`)
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
<body>
<div class="blobs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
<div class="shell">
  <aside class="side glass" aria-label="Chats">
    <button class="new" id="newChat" type="button">＋ New slop</button>
    <p class="side-h">Today</p>
    <ul class="history">
      <li>Q3 synergy roadmap ✨</li>
      <li>Rewrite my bio but more visionary</li>
      <li>Is churn a feeling?</li>
      <li>10 ways my dog is a CRO</li>
      <li>Make this email sound like a TED talk</li>
    </ul>
    <p class="side-h">Previous 7 days</p>
    <ul class="history">
      <li>Leadership lessons from a parking ticket</li>
      <li>Thought leadership but for toddlers</li>
    </ul>
    <button class="pro" id="pro" type="button">✨ Upgrade to Slop Pro</button>
  </aside>

  <main class="main">
    <header class="top">
      <label class="model">
        <span class="sr">Slop flavor</span>
        <select id="flavor">${options}</select>
      </label>
      <div class="who"><button class="mute" id="mute" type="button" aria-pressed="false" aria-label="Sound is on">🔊</button><span id="who"></span></div>
    </header>

    <section class="empty" id="empty">
      <p class="eyebrow">✨ AI-powered · No AI inside</p>
      <h1 class="grad">How can I help you synergize today?</h1>
      <p class="sub">Tell me something mundane that happened. I'll turn it into a B2B SaaS insight, then fire it into every open slot in your Buffer queue.</p>
      <div class="cards">
        <button class="card glass" type="button" data-say="My coffee went cold during standup"><span>☕</span><b>Coffee</b><em>My coffee went cold during standup</em></button>
        <button class="card glass" type="button" data-say="The dishwasher finished while I was on a call"><span>🍽️</span><b>Dishes</b><em>The dishwasher finished while I was on a call</em></button>
        <button class="card glass" type="button" data-say="I parallel parked on the first try"><span>🚗</span><b>Parking</b><em>I parallel parked on the first try</em></button>
      </div>
      <div class="metrics">
        <div><strong class="grad">10x</strong><span>more slop</span></div>
        <div><strong class="grad">0</strong><span>AI models used</span></div>
        <div><strong class="grad">∞</strong><span>em-dashes</span></div>
      </div>
    </section>

    <section class="chat" id="chat" aria-live="polite"></section>

    <form class="composer glass" id="composer">
      <label class="sr" for="say">Something mundane</label>
      <textarea id="say" rows="1" maxlength="200" placeholder="Tell me something mundane…"></textarea>
      <button class="send" id="send" type="submit" aria-label="Make slop">↑</button>
    </form>
    <p class="fine">Slop Cannon can make mistakes. It is, in fact, made of them. No AI was used. Not affiliated with OpenAI, Anthropic, Google or xAI. <a href="/privacy">Privacy</a> · <button class="crimes" id="crimes" type="button" aria-expanded="false">🚨 Design crimes: <b>12</b></button></p>
  </main>
</div>

<div class="crime-list glass" id="crimeList" hidden>
  <p><b>This page breaks every rule on purpose.</b> Impeccable's AI-slop list, as a checklist:</p>
  <ul>
    <li>Eyebrow kicker above the heading</li>
    <li>Gradient text</li>
    <li>Glassmorphism everywhere</li>
    <li>Three same-size icon cards</li>
    <li>Hero metrics: big number, small label</li>
    <li>Emoji standing in for icons</li>
    <li>Glowing halo shadows</li>
    <li>Floating gradient blobs</li>
    <li>Purple-to-pink, obviously</li>
    <li>Inter, the font of the singularity</li>
    <li>Sparkles ✨ on things that aren't magic</li>
    <li>A modal you didn't need (the Pro one)</li>
  </ul>
</div>
<div class="toast" id="toast" role="status" hidden></div>
<script src="/app.js"></script>
</body>
</html>`;
}

export function privacyPage(): string {
  return `<!doctype html>
<html lang="en"><head>${HEAD}<title>Slop Cannon privacy</title></head>
<body class="doc"><main class="prose glass">
<h1>Privacy</h1>
<p>Slop Cannon is a joke with a real Buffer connection, made by L. Beebe, LLC for Buffer Commit.</p>
<p><b>No AI.</b> Every post comes from hand-written templates and a random number. Nothing you type is sent to any AI service, or anywhere but this app.</p>
<p><b>Buffer.</b> When you connect, Buffer gives this app a token to read your organization, channels, posting schedule and scheduled posts, and to create and delete posts. The token is encrypted and kept for 30 days in Cloudflare's storage so you stay connected. Log out to delete it, or revoke the app in Buffer at any time.</p>
<p><b>What it stores.</b> Your session: the token, your organization's name and id, the posts you aimed but haven't fired (for 30 minutes), and the ids of the last posts you fired so Undo works. No analytics, no tracking cookies, no logs of what you typed.</p>
<p><b>What it posts.</b> Only what you fire. By default the cannon fires drafts, which publish nothing. Live rounds go into your real queue and publish at their slot times, unless you undo them first.</p>
<p>Questions: <a href="mailto:me@lbeebe.com">me@lbeebe.com</a>. <a href="/">Back to the cannon</a></p>
</main></body></html>`;
}
