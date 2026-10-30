// Look: off-white ground, bottle-green ink, legal-pad yellow on the one action.
// One typeface (Bricolage Grotesque). No gradients, glows or glass.
const STYLE = `
:root{
  --ground:#f6f6f3; --surface:#ffffff; --raised:#ebece7; --active:#e2e4dd;
  --ink:#0d2a1c; --muted:#4c5a51; --faint:#5f6b64;
  --border:#e1e3dd; --control:#c3c9c2;
  --accent:#f6e016; --accent-ink:#0d2a1c; --accent-press:#e5cf06;
  --field:#0d2a1c; --field-ink:#f6f6f3; --field-muted:#b9c6bd; --ink-bg:#0d2a1c;
  --live:#d7361f; --warn:#a33a12;
  --add:#e3f4e6; --add-fg:#1d6b2c; --del:#fbe7e6; --del-fg:#a1302b; --code:#f1f2ee;
  --font:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --r-card:20px; --r-ctl:999px; --r-in:12px;
  --gut:clamp(16px,3.2vw,40px);
  --ease:cubic-bezier(.2,.7,.2,1);
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root{
  --ground:#07150e; --surface:#0d2117; --raised:#14301f; --active:#1b3a27;
  --ink:#edf2eb; --muted:#adbcb1; --faint:#98a89c;
  --border:#1d3a28; --control:#3c5a47;
  --field:#f6e016; --field-ink:#0d2a1c; --field-muted:#3e4a1a; --ink-bg:#14301f;
  --live:#ff6a4d; --warn:#f0a36b;
  --add:#16301d; --add-fg:#7fd492; --del:#3a1b1a; --del-fg:#f29b94; --code:#0a1b12;
  color-scheme:dark}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--font);font-size:clamp(1.0625rem,1rem + .2vw,1.1875rem);line-height:1.5;
  font-optical-sizing:auto;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-weight:600;letter-spacing:-.035em;line-height:.98;margin:0;text-wrap:balance}
p{margin:0;text-wrap:pretty}
li{text-wrap:pretty}
a{color:inherit;text-underline-offset:.18em;text-decoration-thickness:1px}
a:hover{text-decoration-thickness:2px}
::selection{background:var(--accent);color:var(--accent-ink)}
:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:6px}
[hidden]{display:none!important}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.muted{color:var(--muted)}
.small{font-size:.875rem;line-height:1.45}
.num{font-variant-numeric:tabular-nums}

/* Controls */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 24px;border-radius:var(--r-ctl);
  font:500 1rem/1 var(--font);letter-spacing:-.01em;text-decoration:none;cursor:pointer;border:0;
  background:var(--accent);color:var(--accent-ink);transition:transform .18s var(--ease),background-color .18s}
.btn:hover{background:var(--accent-press)}
.btn:active{transform:scale(.97)}
.btn:disabled{opacity:.55;cursor:default;transform:none}
.btn.quiet{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--control)}
.btn.quiet:hover{background:var(--raised)}
.btn.text{background:transparent;padding:0 6px;min-height:40px;color:var(--muted)}
.btn.text:hover{color:var(--ink)}
.btn.small{min-height:38px;padding:0 16px;font-size:.92rem}
@media (pointer:coarse){.btn.small,.btn.text,.chip,button.chip,.file summary,input[type=text],input.title{min-height:44px}.wordmark{min-height:44px}}
.btn .rec{width:10px;height:10px;border-radius:50%;background:var(--live);flex:none}
.wordmark{white-space:nowrap;display:inline-flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-.03em;font-size:1.15rem;text-decoration:none;color:var(--ink)}
.mark{width:30px;height:30px;flex:none}

/* Page frame */
.wrap{width:100%;max-width:1360px;margin:0 auto;padding-inline:var(--gut)}
.nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-block:20px}
.nav ul{display:flex;gap:28px;list-style:none;margin:0;padding:0;font-size:.95rem}
.nav ul a{text-decoration:none;color:var(--muted)}
.nav ul a:hover{color:var(--ink)}
@media (max-width:820px){.nav ul{display:none}}
@media (max-width:480px){.nav .btn .long{display:none}}

/* Motion: entrances only when scripts run, travel only when allowed */
.js .rise{opacity:0;transform:translateY(22px);transition:opacity .7s var(--ease),transform .7s var(--ease);transition-delay:calc(var(--i,0) * 80ms)}
.js .rise.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .js .rise{transform:none;transition:opacity .4s}
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}
}
`;

const PAGE_STYLE = `
/* Landing */
.hero{display:grid;gap:clamp(36px,5vw,72px);padding-block:clamp(28px,6vw,88px) clamp(80px,9vw,140px);align-items:center}
@media (min-width:1000px){.hero{grid-template-columns:minmax(0,5fr) minmax(0,7fr)}}
.hero h1{font-size:clamp(2.6rem,1.4rem + 4.4vw,4.75rem)}
.hero .lead{margin-top:32px;font-size:clamp(1.15rem,1.05rem + .45vw,1.4rem);line-height:1.45;max-width:34ch}
.hero .act{margin-top:36px;display:flex;flex-wrap:wrap;align-items:center;gap:14px 20px}
.alert{margin-top:24px;padding:14px 18px;border-radius:14px;background:var(--raised);color:var(--warn);font-weight:500}

/* The live fragment: a working piece of the interview */
.demo{background:var(--surface);border-radius:28px;padding:clamp(18px,2.4vw,32px);display:grid;gap:22px;border:1px solid var(--border)}
.demo form{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.demo label{font-size:.875rem;color:var(--muted);flex-basis:100%}
.demo input{flex:1 1 220px;min-width:0;height:44px;border-radius:var(--r-ctl);border:1px solid var(--control);background:var(--ground);color:var(--ink);font:400 .98rem var(--font);padding:0 18px}
.demo .stage{display:grid;gap:18px}
@media (min-width:640px){.demo .stage{grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)}}
.work{background:var(--ground);border-radius:16px;padding:16px;display:grid;gap:10px;align-content:start;font-size:.875rem;min-width:0}
.work .kind{color:var(--muted)}
.work .ttl{font-weight:500;font-size:1rem;line-height:1.3;overflow-wrap:anywhere}
.work .meta{display:flex;flex-wrap:wrap;gap:4px 12px;color:var(--muted)}
.work pre{margin:0;background:var(--code);border-radius:10px;font:.8125rem/1.55 var(--mono);padding:8px 0;overflow:hidden}
.work pre span{display:block;padding:0 10px;white-space:pre;overflow:hidden;text-overflow:ellipsis}
.work pre .a{background:var(--add);color:var(--add-fg)} .work pre .d{background:var(--del);color:var(--del-fg)}
.asks{display:grid;gap:16px;align-content:start}
.asks .who{font-size:.875rem;color:var(--muted);display:flex;align-items:center;gap:8px}
.asks .q{font-size:clamp(1.35rem,1.1rem + .8vw,1.75rem);line-height:1.28;letter-spacing:-.02em;font-weight:500;min-height:3.84em}
.caret{display:inline-block;width:.08em;height:1em;background:var(--ink);vertical-align:-.12em;margin-left:2px}
.reply{display:flex;align-items:center;gap:12px;background:var(--ground);border-radius:var(--r-ctl);padding:10px 16px;color:var(--muted);font-size:.95rem}
.dot{width:10px;height:10px;border-radius:50%;background:var(--live);flex:none}
.demo .note{font-size:.95rem;color:var(--muted);max-width:62ch}

/* Sections */
.sec{padding-block:clamp(72px,10vw,180px)}
.sec h2{font-size:clamp(2.1rem,1.3rem + 3vw,3.75rem)}
.sec .say{margin-top:28px;max-width:40ch;font-size:clamp(1.1rem,1rem + .35vw,1.3rem);line-height:1.5}
.two{display:grid;gap:clamp(40px,6vw,96px);align-items:start}
@media (min-width:1000px){.two{grid-template-columns:minmax(0,5fr) minmax(0,7fr)}.two.flip{grid-template-columns:minmax(0,7fr) minmax(0,5fr)}.two.flip>:first-child{order:2}}

/* Transcript */
.talk{list-style:none;margin:0;padding:0;display:grid;gap:22px}
.talk li{display:grid;gap:6px;max-width:44ch}
.talk .who{font-size:.875rem;color:var(--muted)}
.talk .them p{font-size:clamp(1.35rem,1.1rem + .9vw,1.9rem);line-height:1.22;letter-spacing:-.02em;font-weight:500}
.talk .you{justify-self:end;background:var(--surface);border-radius:22px 22px 6px 22px;padding:16px 20px;border:1px solid var(--border)}
.talk .flag{display:inline-flex;align-items:center;gap:8px;font-size:.875rem;color:var(--muted);background:var(--raised);border-radius:var(--r-ctl);padding:6px 14px;justify-self:start}

/* The yellow field */
.field{background:var(--accent);color:var(--accent-ink)}
.ink{background:var(--ink-bg);color:#f6f6f3}
.ink .say{color:#f6f6f3}
.ink .say+.say{color:#b9c6bd}
.field .say{color:var(--accent-ink)}
.idea{background:#fffef5;color:#0d2a1c;border-radius:18px;padding:clamp(20px,2.4vw,32px);display:grid;gap:18px;font-size:.98rem;line-height:1.5;box-shadow:0 18px 40px -24px rgba(13,42,28,.45);transform:rotate(-1deg)}
.idea .t{font-size:1.4rem;font-weight:600;letter-spacing:-.025em;line-height:1.15}
.idea .lbl{font-size:.875rem;font-weight:600;color:#3d5446}
.idea .tag{display:inline-flex;align-items:center;gap:8px;font-size:.875rem;background:#eef0e8;border-radius:var(--r-ctl);padding:5px 12px;justify-self:start}
.idea .tag i{width:9px;height:9px;border-radius:50%;background:#2e8b57}
.idea ul{margin:0;padding-left:1.1em;display:grid;gap:4px}

/* Steps */
.steps{list-style:none;margin:56px 0 0;padding:0;display:grid;gap:36px 28px}
@media (min-width:720px){.steps{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1100px){.steps{grid-template-columns:repeat(4,minmax(0,1fr))}}
.steps li{display:grid;gap:12px;align-content:start}
.steps .min{font-size:clamp(2.6rem,1.8rem + 2.6vw,4.25rem);font-weight:600;letter-spacing:-.045em;line-height:.9}
.steps .min small{font-size:.38em;letter-spacing:-.01em;font-weight:500;margin-left:6px;color:var(--muted)}
.steps p{max-width:28ch}

/* Under the hood */
.hood{background:var(--ink-bg);color:#f6f6f3}
.hood .say{color:#b9c6bd}
.flow-mini{list-style:none;margin:48px 0 0;padding:0;display:grid;gap:12px}
@media (min-width:900px){.flow-mini{grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch}.flow-mini li+li::before{content:"→";position:absolute;left:-18px;top:50%;transform:translateY(-50%);color:#789184}}
.flow-mini li{position:relative;border:1px solid #31513d;border-radius:16px;padding:18px;display:grid;gap:9px;align-content:start;background:#10271a}
.flow-mini .k{font:500 .72rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#91aa99}
.flow-mini b{font-size:1.05rem;line-height:1.2}
.flow-mini p{font-size:.9rem;color:#b9c6bd}
.flow-mini .ai{border-color:#ec8a5f;box-shadow:inset 0 0 0 1px #ec8a5f}
.flow-mini .ai .k{color:#ffad88}
.hood-links{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-top:32px}
.hood-links .btn.quiet{color:#f6f6f3;box-shadow:inset 0 0 0 1.5px #789184}
.hood-links .btn.quiet:hover{background:#183522}

/* Kept */
.pic{margin:0;border-radius:var(--r-card);overflow:hidden;background:var(--raised)}
.pic img{display:block;width:100%;height:100%;object-fit:cover}
.band{margin:0;height:clamp(240px,40vw,600px);overflow:hidden;background:var(--raised)}
.band img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 58%}
#sounds .pic{margin-top:48px;aspect-ratio:4/5;max-width:440px}
.stephead{display:grid;gap:32px;align-items:end}
@media (min-width:900px){.stephead{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.stephead .pic{aspect-ratio:16/10}
.keptwrap{display:grid;gap:clamp(36px,5vw,80px);margin-top:48px;align-items:start}
@media (min-width:900px){.keptwrap{grid-template-columns:minmax(0,4fr) minmax(0,8fr)}}
.keptwrap .pic{aspect-ratio:4/5}
.keptwrap .kept{margin-top:0}
.where{list-style:none;margin:36px 0 0;padding:0;display:grid;gap:20px;counter-reset:w;max-width:40ch}
.where li{display:grid;grid-template-columns:2.2rem 1fr;gap:12px;align-items:baseline;counter-increment:w;font-size:clamp(1.1rem,1rem + .35vw,1.3rem);line-height:1.45}
.where li::before{content:counter(w);font-weight:600;font-size:1.6em;line-height:1;letter-spacing:-.04em}
.where b{font-weight:600}
.buffer-shot{margin:0;background:#f3a08f;border-radius:var(--r-card);overflow:hidden;border:1px solid var(--border)}
.buffer-shot a{display:block;padding:clamp(14px,2.2vw,28px);background:#f3a08f}
.buffer-shot img{display:block;width:100%;height:auto;border-radius:10px;box-shadow:0 16px 36px -20px rgba(0,0,0,.45)}
.buffer-shot figcaption{padding:12px 18px 16px;background:var(--surface);color:var(--muted);font-size:.875rem}
.buffer-shot figcaption a{display:inline;padding:0;background:none;text-decoration:underline}
@media (min-width:900px){.keptwrap .kept{grid-template-columns:1fr}}
.kept{display:grid;gap:28px;margin-top:48px}
@media (min-width:900px){.kept{grid-template-columns:repeat(3,minmax(0,1fr))}}
.kept div{display:grid;gap:10px;align-content:start}
.kept p{max-width:62ch}
.kept h3{font-size:1.3rem;letter-spacing:-.02em;line-height:1.15}

/* Close */
.foot{background:var(--field);color:var(--field-ink);padding-block:clamp(64px,8vw,120px) 32px}
.foot .big{font-size:clamp(3rem,14.2vw,13.5rem);white-space:nowrap;font-weight:600;letter-spacing:-.045em;line-height:.88;margin:0}
.foot .row{display:flex;flex-wrap:wrap;gap:16px 32px;justify-content:space-between;align-items:end;margin-top:48px;font-size:1rem;color:var(--field-muted)}
.foot .row a:not(.btn){color:var(--field-ink)}
.foot .btn{background:var(--accent);color:var(--accent-ink)}
@media (prefers-color-scheme:dark){.foot .btn{background:var(--field-ink);color:var(--field)}}

/* Privacy */
.doc{max-width:720px;padding-block:clamp(40px,7vw,96px) 96px;display:grid;gap:22px}
.doc h1{font-size:clamp(2.6rem,1.6rem + 4vw,4.5rem);margin-bottom:12px}
.doc h2{font-size:1.6rem;letter-spacing:-.025em;margin-top:28px}
.doc p,.doc li{max-width:62ch}
.doc ul{margin:0;padding-left:1.2em;display:grid;gap:10px}
`;

const MARK = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.4 3 15.1c0 3.6 1.7 6.8 4.4 9L6.2 29l5.6-2.8c1.3.4 2.7.6 4.2.6 7.2 0 13-5.4 13-12.1S23.2 3 16 3Z" fill="#f6e016"/><circle cx="16" cy="15" r="4.2" fill="#d7361f"/></svg>`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600&display=swap">`;

function shell(title: string, body: string, opts: { style?: string; script?: string } = {}): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="A weekly interview about what you built on GitHub. Your answers land in Buffer as Ideas, in your own words.">
<meta name="theme-color" content="#f6f6f3" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#07150e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(MARK.replace('class="mark" ', 'xmlns="http://www.w3.org/2000/svg" '))}">
${FONTS}
<script>document.documentElement.classList.add("js")</script>
<style>${STYLE}${opts.style ?? ""}</style></head><body>${body}${opts.script ? `<script>${opts.script}</script>` : ""}</body></html>`;
}

const NAV = `<header class="wrap nav">
  <a class="wordmark" href="/">${MARK}The Interviewer</a>
  <nav aria-label="Main"><ul><li><a href="/#sounds">How it sounds</a></li><li><a href="/#keep">What you keep</a></li><li><a href="/#hood">Under the hood</a></li><li><a href="/#data">Your data</a></li><li><a href="/privacy">Privacy</a></li></ul></nav>
  <a class="btn small" href="/connect">Connect<span class="long">&nbsp;with Buffer</span></a>
</header>`;

export function landingPage(error?: string): string {
  return shell(
    "The Interviewer · Talk about what you shipped",
    `
${NAV}
<main>
<section class="wrap hero">
  <div>
    <h1 class="rise">Talk about what you shipped.</h1>
    <p class="lead rise" style="--i:1">Everyone says build in public. Hardly anyone tells you where to start. The Interviewer looks at what you worked on this week, asks you about it (out loud or typed), and saves the stories worth telling to your Buffer as Ideas, in your own words.</p>
    ${error ? `<p class="alert" role="alert">${escapeHtml(error)}</p>` : ""}
    <div class="act rise" style="--i:2"><a class="btn" href="/connect">Connect with Buffer</a><span class="small muted">Signs in with Buffer, the social media planner. New to it? <a href="https://buffer.com" target="_blank" rel="noopener">The free plan</a> works.</span></div>
  </div>
  <div class="demo rise" style="--i:3" data-ui>
    <form id="try">
      <label for="tryRepo">Try it on any public GitHub repo</label>
      <input id="tryRepo" name="repo" placeholder="owner/repo" autocomplete="off" spellcheck="false" maxlength="200">
      <button class="btn small" type="submit">Ask me</button>
    </form>
    <div class="stage">
      <div class="work" id="tryWork">
        <span class="kind">Merged pull request</span>
        <span class="ttl">Let people try it before they sign up</span>
        <span class="meta"><span>example</span><span>this week</span></span>
        <pre aria-hidden="true"><span class="d">- requireAccount()</span><span class="a">+ letGuestsTryIt()</span><span>  askToSignUpAfter()</span></pre>
      </div>
      <div class="asks">
        <span class="who">${MARK.replace('class="mark"', 'class="mark" style="width:20px;height:20px"')}The Interviewer</span>
        <p class="q" id="tryQ" aria-live="polite">You let people try it before signing up. What were you seeing that made you change it?</p>
        <div class="reply"><span class="dot"></span><span>Your answer, out loud or typed</span></div>
      </div>
    </div>
    <p class="note" id="tryNote">An example opening question. Paste a public repo above to see one about your own latest work.</p>
  </div>
</section>

<figure class="band" aria-hidden="true"><img src="/img/desk.webp" alt="" width="1600" height="1067" loading="lazy" decoding="async"></figure>

<section class="sec" aria-labelledby="startH">
  <div class="wrap two">
    <h2 class="rise" id="startH">You know you should share it. You just don't know what to say.</h2>
    <div>
      <p class="say rise" style="--i:1">Build in public is everywhere as advice and almost nowhere as instructions. Friday comes, you open a blank post, the week's work feels too small or too technical to talk about, and nothing gets written.</p>
      <p class="say rise" style="--i:2">The stories are already there, in what you decided, what broke, and who you built it for. They just need someone to ask. Ten minutes of good questions about your real commits, and you walk away with a few stories you can start telling.</p>
    </div>
  </div>
</section>

<section class="sec" id="sounds" style="background:var(--raised)">
  <div class="wrap two">
    <div>
      <h2 class="rise" id="soundsH">It follows what you say.</h2>
      <p class="say rise" style="--i:1">It reads your week before you start, so it can skip the obvious and ask what led you there. When you get to a change, the change itself opens beside the conversation. When something you say is more interesting than its plan, it follows you.</p>
      <figure class="pic rise" style="--i:2"><img src="/img/cafe.webp" alt="Two people talking across a small cafe table, one laughing mid-story" width="960" height="1190" loading="lazy" decoding="async"></figure>
    </div>
    <ol class="talk" aria-label="An example conversation">
      <li class="them rise"><span class="who">The Interviewer</span><p>You let people try it before signing up. What were you seeing before that?</p></li>
      <li class="you rise" style="--i:1"><span class="who">You</span><p>Like half the people who found it would hit the sign-up screen and just leave.</p></li>
      <li class="flag rise" style="--i:2">Opened beside you: the change you made</li>
      <li class="them rise" style="--i:3"><span class="who">The Interviewer</span><p>Half is a lot. How did you figure out that's where they were going?</p></li>
    </ol>
  </div>
</section>

<section class="sec field" id="keep" aria-labelledby="keepH">
  <div class="wrap two flip">
    <div>
      <h2 class="rise" id="keepH">Your stories, saved in your own words.</h2>
      <p class="say rise" style="--i:1">When you're done, it reads the conversation back and finds the few stories worth telling. For each one, it gathers what you meant into a short paragraph in your voice, dropping the ums, false starts, and repetition. It also suggests a few specific questions you can answer if you want to flesh the idea out further. You check every card before anything is saved. Edit it, drop it, or add a Buffer tag, then send the ones you like.</p>
    </div>
    <article class="idea rise" style="--i:1" aria-label="An Idea as it lands in Buffer">
      <p class="t">Why I let people in before they sign up</p>
      <div><p class="lbl">The story, in your words</p><p>Half the people who found it would hit the sign-up screen and leave. Why would they give their email to something they hadn't seen work? I wouldn't. So now you try it first and sign up after.</p></div>
      <div><p class="lbl">Questions to help you write it</p><ul><li>What did you worry you'd lose by letting people in free?</li><li>Who was the first person to try it this way?</li></ul></div>
      <span class="tag"><i></i>Building</span>
    </article>
  </div>
</section>

<section class="sec ink" aria-labelledby="whyH">
  <div class="wrap two">
    <h2 class="rise" id="whyH">It won't write your posts. On purpose.</h2>
    <div>
      <p class="say rise" style="--i:1">Writing is thinking. When you put your week into your own sentences, you find out what you actually learned, what you'd do again, and what you believe about the thing you're building. Hand that to a model and you skip the part that makes it yours.</p>
      <p class="say rise" style="--i:2">So The Interviewer does the part that's hard to do alone. It asks, it listens, and it keeps your thinking in your own words. The writing stays with you, and so does your voice.</p>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="stephead">
      <h2 class="rise">Ten minutes, start to Buffer.</h2>
      <figure class="pic rise" style="--i:1"><img src="/img/pad.webp" alt="A yellow legal pad of handwritten notes and a pen beside a keyboard" width="1200" height="897" loading="lazy" decoding="async"></figure>
    </div>
    <ol class="steps">
      <li class="rise"><span class="min num">10<small>sec</small></span><p>Connect your Buffer account. Nothing else to sign up for.</p></li>
      <li class="rise" style="--i:1"><span class="min num">1<small>min</small></span><p>Paste a public GitHub repo, or describe what you're working on in a sentence or two.</p></li>
      <li class="rise" style="--i:2"><span class="min num">8<small>min</small></span><p>Talk about your week, out loud or typed. Stop whenever you like.</p></li>
      <li class="rise" style="--i:3"><span class="min num">1<small>min</small></span><p>Keep the ideas you want. They land in Buffer, ready for you to write.</p></li>
    </ol>
  </div>
</section>

<section class="sec hood" id="hood" aria-labelledby="hoodH">
  <div class="wrap">
    <div class="two">
      <h2 class="rise" id="hoodH">A peek under the hood.</h2>
      <p class="say rise" style="--i:1">The project is built in public, including where AI is—and is not—called. Reading GitHub and Buffer context is ordinary API work. The models enter only for the conversation and the final organization pass.</p>
    </div>
    <ol class="flow-mini" aria-label="A simplified technical workflow">
      <li class="rise"><span class="k">No AI</span><b>Read context</b><p>Public GitHub work and recent Buffer posts.</p></li>
      <li class="rise" style="--i:1"><span class="k">App logic</span><b>Rank threads</b><p>Deterministic rules choose useful starting points.</p></li>
      <li class="rise ai" style="--i:2"><span class="k">AI call</span><b>Hold the interview</b><p>GPT-Live 1 for voice; DeepSeek Flash for typed follow-ups.</p></li>
      <li class="rise ai" style="--i:3"><span class="k">AI call</span><b>Find the Ideas</b><p>Claude Sonnet 5.5 organizes meaning and drops speech debris.</p></li>
      <li class="rise" style="--i:4"><span class="k">Human decision</span><b>Review and save</b><p>You edit, choose, optionally tag, and write the eventual post.</p></li>
    </ol>
    <div class="hood-links rise" style="--i:5"><a class="btn" href="/build-flow">Explore the full workflow</a><a class="btn quiet" href="https://github.com/1beebe/build-in-public" target="_blank" rel="noopener">Browse the source on GitHub</a></div>
  </div>
</section>

<section class="sec land" aria-labelledby="landH">
  <div class="wrap two">
    <div>
      <h2 class="rise" id="landH">Where your ideas land.</h2>
      <ol class="where rise" style="--i:1">
        <li><p>Open Buffer and click <b>Create</b> in the left sidebar.</p></li>
        <li><p>You land on <b>Ideas</b>. Your stories are in the <b>Unassigned</b> column, each titled <b>INTERVIEW</b> and carrying the tag you chose.</p></li>
        <li><p>When you're ready to write, open a card and click <b>Create Post</b>.</p></li>
      </ol>
    </div>
    <figure class="buffer-shot rise" style="--i:2">
      <a href="https://publish.buffer.com/create" target="_blank" rel="noopener"><img src="https://buffer.com/cdn-cgi/image/width=1920,quality=75,format=auto/img/feature-pages/create/create-hero.webp" alt="Buffer's Create board showing Ideas organized into Unassigned, Review, and Done columns" width="832" height="612" loading="lazy" decoding="async"></a>
      <figcaption>Buffer’s actual Create board. Ideas first appear in Unassigned, ready to organize or turn into a post. <a href="https://support.buffer.com/articles/creating-ideas-in-buffer-7gu7n0Hyyq" target="_blank" rel="noopener">See Buffer’s guide</a>.</figcaption>
    </figure>
  </div>
</section>

<section class="sec" id="data" style="background:var(--raised)" aria-labelledby="keptH">
  <div class="wrap">
    <h2 class="rise" id="keptH">What happens when you connect.</h2>
    <div class="keptwrap">
    <figure class="pic rise"><img src="/img/couch.webp" alt="Someone on a couch at night with a laptop, talking and smiling" width="960" height="1190" loading="lazy" decoding="async"></figure>
    <div class="kept">
      <div class="rise"><h3>You sign in with Buffer</h3><p>Buffer asks you to approve access. The Interviewer reads your account, your tags, recent Ideas and up to 20 posts from the last 30 days, so its questions fit who you write for. The only thing it ever writes is the Ideas you choose to save. It never creates, edits or deletes posts.</p></div>
      <div class="rise" style="--i:1"><h3>You share a public repo</h3><p>If you point it at a public GitHub repo, it reads only what anyone can see: the last week of commits, pull requests and issues. There's no GitHub sign-in, so private code stays out of reach.</p></div>
      <div class="rise" style="--i:2"><h3>You talk it through</h3><p>The app ranks a few useful threads from your public work. Talk out loud and GPT-Live 1 holds the conversation. Type and DeepSeek Flash asks the follow-ups. When you're done, Claude Sonnet 5.5 organizes what you meant and drops speech debris. None of them ever sees your Buffer sign-in.</p></div>
      <div class="rise" style="--i:3"><h3>What it keeps</h3><p>Your Buffer sign-in, repo or week note, and latest conversation, all encrypted. It expires 30 days after your last visit, and Disconnect deletes it right away. No tracking, no analytics, nothing sold. <a href="/privacy">The full privacy note</a> names every service.</p></div>
</div>
    </div>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap">
    <p class="big" aria-hidden="true">The Interviewer</p>
    <div class="row"><a class="btn" href="/connect">Connect with Buffer</a><p>Built in public for Buffer Commit by Ligaya Beebe. <a href="https://github.com/1beebe/build-in-public" target="_blank" rel="noopener">Source on GitHub</a>. Not made by or affiliated with Buffer. <a href="/privacy">Privacy</a></p></div>
  </div>
</footer>`,
    { style: PAGE_STYLE, script: LANDING_SCRIPT },
  );
}

// Entrances, and the live fragment: fetch the repo's latest public work from
// GitHub (unauthenticated, from the visitor's browser) and ask about it.
const LANDING_SCRIPT = `
(() => {
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {rootMargin:"0px 0px -8% 0px"}) : null;
  document.querySelectorAll(".rise").forEach(n => io ? io.observe(n) : n.classList.add("in"));
  const form = document.getElementById("try"); if (!form) return;
  const $ = (id) => document.getElementById(id);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let typing = 0;
  function type(text){
    const q = $("tryQ"), run = ++typing;
    if (still) { q.textContent = text; return; }
    q.textContent = ""; const c = document.createElement("span"); c.className = "caret"; q.append(c);
    let i = 0; const step = () => { if (run !== typing) return; if (i >= text.length) { setTimeout(() => c.remove(), 1600); return; } c.before(text[i++]); setTimeout(step, 18 + Math.random() * 30); };
    step();
  }
  const day = (d) => { const t = new Date(d), n = (Date.now() - t) / 864e5; return n < 1 ? "today" : n < 2 ? "yesterday" : n < 7 ? "on " + t.toLocaleDateString(undefined, {weekday:"long"}) : "on " + t.toLocaleDateString(undefined, {month:"short", day:"numeric"}); };
  const clean = (s) => s.split("\\n")[0].replace(/^(feat|fix|chore|docs|refactor|style|test)(\\(.+?\\))?:\\s*/i, "").replace(/\\.$/, "").trim();
  const ASK = {
    pull: ["You merged {t} {d}. What made it worth doing now?", "{t} went in {d}. Who was it for?", "You merged {t} {d}. What almost stopped you?"],
    commit: ["{d} you committed {t}. What were you trying to fix?", "{d} you pushed {t}. What did you learn doing it?", "You pushed {t} {d}. What would you do differently?"],
  };
  function ask(kind, title, when, seed){
    const set = ASK[kind]; const tpl = set[[...seed].reduce((a, ch) => a + ch.charCodeAt(0), 0) % set.length];
    const s = tpl.replace("{t}", "\\u201C" + title + "\\u201D").replace("{d}", when);
    return s[0].toUpperCase() + s.slice(1);
  }
  function work(kind, title, meta){
    const w = $("tryWork"); w.innerHTML = "";
    const add = (cls, text) => { const s = document.createElement("span"); s.className = cls; s.textContent = text; w.append(s); return s; };
    add("kind", kind === "pull" ? "Merged pull request" : "Commit"); add("ttl", title);
    const m = add("meta", ""); meta.forEach(x => { const s = document.createElement("span"); s.textContent = x; m.append(s); });
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = $("tryRepo").value.trim().replace(/^https?:\\/\\//, "").replace(/^(www\\.)?github\\.com\\//, "").replace(/\\.git$/, "").replace(/\\/$/, "");
    const m = raw.match(/^([\\w.-]+)\\/([\\w.-]+)/);
    if (!m) { $("tryNote").textContent = "Paste a public repo like owner/name."; return; }
    const repo = m[1] + "/" + m[2]; const btn = form.querySelector("button"); btn.disabled = true; $("tryNote").textContent = "Reading " + repo + "…";
    try {
      const gh = (p) => fetch("https://api.github.com/repos/" + repo + p, {headers:{Accept:"application/vnd.github+json"}}).then(r => { if (r.status === 404) throw new Error("That repo isn't public, or doesn't exist."); if (!r.ok) throw new Error("GitHub is busy right now. Try again in a minute."); return r.json(); });
      const pulls = await gh("/pulls?state=closed&sort=updated&direction=desc&per_page=15");
      const pr = pulls.filter(p => p.merged_at).sort((a, b) => b.merged_at.localeCompare(a.merged_at))[0];
      let kind, title, when, seed, meta;
      if (pr) { kind = "pull"; title = clean(pr.title); when = day(pr.merged_at); seed = String(pr.number); meta = ["#" + pr.number, pr.user ? pr.user.login : "", "merged " + when]; }
      else {
        const commits = await gh("/commits?per_page=10");
        const c = commits.find(c => c.parents && c.parents.length < 2) || commits[0];
        if (!c) throw new Error("No public commits there yet.");
        kind = "commit"; title = clean(c.commit.message); when = day(c.commit.author.date); seed = c.sha; meta = [c.sha.slice(0, 7), c.author ? c.author.login : c.commit.author.name, when];
      }
      work(kind, title, meta.filter(Boolean)); type(ask(kind, title, when, seed));
      $("tryNote").textContent = "An opening question from " + repo + "'s latest public work. The real interview reads your whole week and your recent posts first.";
    } catch (x) { $("tryNote").textContent = x.message; }
    finally { btn.disabled = false; }
  });
})();
`;

export function privacyPage(): string {
  return shell(
    "Privacy · The Interviewer",
    `
${NAV}
<main class="wrap"><article class="doc">
<h1>Privacy</h1>
<p>The Interviewer stores as little as it can, for as short a time as it can.</p>
<h2>What's stored</h2>
<p>Your Buffer sign-in tokens, encrypted with AES-GCM, plus the public GitHub repo link or week note and the current interview: its topics and the conversation, encrypted the same way. Starting a new interview clears the last one. All of it expires 30 days after your last visit. Disconnecting deletes it straight away.</p>
<h2>What isn't</h2>
<p>Anything after you're done with it. The Ideas you choose go to your own Buffer account. Nothing is sold, shared or used for ads, and there's no tracking or analytics.</p>
<h2>What's read</h2>
<p>From Buffer: your organization, tags, recent Ideas and up to 20 posts from the last 30 days, only to understand who you write for and avoid repeats. From GitHub: public commits, pull requests and issues in the repo you name. The example on the home page asks GitHub directly from your browser and sends nothing here.</p>
<h2>Which AI does what</h2>
<p>Each service gets only what its step needs: your week on GitHub, a summary of your recent posts, the questions and your answers. None of them ever sees your Buffer sign-in.</p>
<ul>
<li><b>Claude Sonnet 5.5</b>, by Anthropic, through MindStudio: at the end, organizes the conversation into ideas while preserving meaning and voice.</li>
<li><b>DeepSeek Flash</b>, through MindStudio: asks the next question when you type your answers.</li>
<li><b>OpenAI GPT-Live</b>: holds the live spoken conversation.</li>
</ul>
<h2>Voice</h2>
<p>A live voice conversation streams between your browser and OpenAI's voice model. This app passes your browser's connection request to OpenAI and keeps the written transcript for the harvest. The live audio isn't stored here.</p>
<h2>Contact</h2>
<p>Ligaya Beebe, L. Beebe, LLC. Not made by or affiliated with Buffer.</p>
<p><a href="/">Back to the start</a></p>
</article></main>`,
    { style: PAGE_STYLE },
  );
}

const APP_STYLE = `
body{font-size:1rem}
.top{position:sticky;top:0;z-index:5;background:var(--ground);border-bottom:1px solid var(--border)}
.top .wrap{display:flex;align-items:center;gap:16px;min-height:64px}
.top .scope{color:var(--muted);font-size:.92rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.top form{margin:0 0 0 auto}
main.app{padding-block:clamp(24px,4vw,48px) 96px}
.screen{max-width:760px;margin:0 auto;display:grid;gap:28px}
.screen.wide{max-width:none}
.screen > header{display:grid;gap:10px}
.screen h1{font-size:clamp(1.75rem,1.4rem + 1.2vw,2.25rem);letter-spacing:-.03em;line-height:1.05}
.lede{color:var(--muted);max-width:56ch}
#msg{background:var(--raised);color:var(--warn);border-radius:14px;padding:12px 16px;font-weight:500;max-width:760px;margin:0 auto 20px}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-card);padding:clamp(18px,2.4vw,28px);display:grid;gap:20px;min-width:0;align-content:start}

/* Fields */
.fieldset{display:grid;gap:8px}
.fieldset > .lbl{font-weight:500;font-size:.95rem}
.fieldset > .hint{color:var(--muted);font-size:.875rem;max-width:60ch}
input[type=text],textarea,select{font:inherit;font-size:1rem;color:var(--ink);background:var(--ground);border:1px solid var(--control);border-radius:var(--r-in);padding:12px 14px;width:100%;transition:border-color .15s,background-color .15s}
input[type=text]:focus,textarea:focus,select:focus{border-color:var(--ink);background:var(--surface);outline:none;box-shadow:0 0 0 2px var(--ink)}
textarea{resize:vertical;min-height:120px;line-height:1.5}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{position:relative;display:inline-flex;align-items:center;gap:8px;border-radius:var(--r-ctl);padding:8px 14px;cursor:pointer;background:var(--ground);box-shadow:inset 0 0 0 1px var(--control);font-size:.92rem;transition:background-color .15s,box-shadow .15s,transform .15s;user-select:none}
.chip:hover{background:var(--raised)}
.chip:active{transform:scale(.97)}
.chip input{position:absolute;opacity:0;pointer-events:none}
.chip:has(input:checked){background:var(--ink);color:var(--ground);box-shadow:none}
.chip:has(input:focus-visible){outline:3px solid var(--ink);outline-offset:2px}
.chip:has(input:disabled){cursor:default;opacity:.7}
.check{display:flex;gap:12px;align-items:center;color:var(--muted);cursor:pointer;min-height:44px}.check input{width:20px;height:20px;margin:0;flex:none;accent-color:var(--ink)}
#repo:disabled{opacity:.45}
.chip .swatch{width:10px;height:10px;border-radius:50%;flex:none;box-shadow:0 0 0 1.5px var(--surface)}
.row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}

/* The orb: the interviewer's presence */
.studio{justify-items:start}
.studio .orb{width:104px;height:104px}
.orb{--lvl:0;position:relative;width:88px;height:88px;flex:none}
.orb i{position:absolute;inset:0;border-radius:50%;background:var(--accent);transform:scale(calc(.78 + var(--lvl) * .5));transition:transform .09s linear}
.orb i + i{background:transparent;box-shadow:inset 0 0 0 2px var(--accent);transform:scale(calc(.9 + var(--lvl) * .9));opacity:calc(.25 + var(--lvl));transition:transform .14s linear,opacity .14s linear}
.orb b{position:absolute;inset:34%;border-radius:50%;background:var(--ink);transition:transform .3s var(--ease),background-color .3s}
.orb[data-s=connecting] i:first-child{animation:breathe 3.2s ease-in-out infinite}
.orb[data-s=thinking] b{animation:think 1s ease-in-out infinite}
.orb[data-s=listening] b{background:var(--live)}
.orb[data-s=speaking] b{transform:scale(.7)}
@keyframes breathe{0%,100%{transform:scale(.74)}50%{transform:scale(.86)}}
@keyframes think{0%,100%{transform:scale(.6)}50%{transform:scale(1)}}
.busyline{min-height:1.5em;color:var(--muted)}
.busyline span,#voiceState span{display:inline-block;animation:fadein .5s var(--ease)}
@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* Talk */
.split{display:grid;gap:20px;align-items:start}
.split .convo{order:-1}
@media (min-width:1000px){
  .split{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}
  .split .convo{grid-column:1;grid-row:1}
  .split .src{grid-column:2;grid-row:1;position:sticky;top:84px;max-height:calc(100vh - 104px);overflow:auto}
  .split.solo{grid-template-columns:minmax(0,760px);justify-content:center}
  .split.solo .convo{grid-column:1}
}
.convo{gap:18px}
.convo .head{display:flex;align-items:center;gap:18px}
.convo .head .orb{width:64px;height:64px}
.convo .head h1{font-size:1.25rem;letter-spacing:-.02em}
.convo .head p{color:var(--muted);font-size:.92rem;min-height:1.4em}
.log{list-style:none;margin:0;padding:4px 2px;display:flex;flex-direction:column;gap:18px;max-height:min(52vh,560px);overflow:auto}
.log:empty{display:none}
.log li{display:grid;gap:4px;max-width:92%}
.log li p{white-space:pre-wrap;overflow-wrap:anywhere}
.log .who{font-size:.875rem;color:var(--muted)}
.log .them p{font-size:clamp(1.15rem,1.05rem + .4vw,1.4rem);line-height:1.36;letter-spacing:-.015em;font-weight:500}
.log .you{align-self:flex-end;background:var(--raised);border-radius:20px 20px 6px 20px;padding:12px 16px}
.log .new{animation:fadein .45s var(--ease)}
.log .typing p{color:var(--muted);font-weight:400}
.saylbl{display:block;font-size:.875rem;color:var(--muted);margin-bottom:6px}
.live{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:var(--raised);border-radius:var(--r-card);padding:12px 12px 12px 12px}
.live .state{color:var(--muted);font-size:.92rem;flex:1;min-width:10em}
#liveBtn{min-width:11em}
#liveBtn.on{background:var(--ink);color:var(--ground)}
#liveBtn.on .rec{background:var(--accent);border-radius:2px}
.composer{display:grid;gap:10px}
.composer textarea{min-height:88px}
.done-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding-top:18px;border-top:1px solid var(--border)}
.topics{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
.topics:empty{display:none}
button.chip{font:inherit;font-size:.86rem;border:0;color:var(--ink);white-space:nowrap;max-width:22em;overflow:hidden;text-overflow:ellipsis;flex:none}
button.chip.on{background:var(--ink);color:var(--ground);box-shadow:none}

/* The work panel */
.src{gap:14px}
.src .kind{color:var(--muted);font-size:.875rem;display:flex;align-items:center;gap:8px}
.src .kind::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 1px var(--control)}
.src h3{font-size:1.3rem;line-height:1.2;letter-spacing:-.02em;margin:0;overflow-wrap:anywhere}
.src h3 a{text-decoration:none}
.src h3 a:hover{text-decoration:underline}
.meta{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.875rem;color:var(--muted)}
.plus{color:var(--add-fg)} .minus{color:var(--del-fg)}
.src .body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.92rem;max-height:14em;overflow:auto;color:var(--muted)}
.file{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)}
.file summary{cursor:pointer;padding:10px 12px;font:500 .875rem/1.4 var(--mono);display:flex;gap:10px;justify-content:space-between;overflow-wrap:anywhere;list-style:none}
.file summary::-webkit-details-marker{display:none}
.file summary:hover{background:var(--raised)}
.diff{margin:0;background:var(--code);font:.8125rem/1.55 var(--mono);overflow-x:auto;padding:6px 0}
.diff span{display:block;padding:0 12px;white-space:pre;width:max-content;min-width:100%}
.diff .a{background:var(--add);color:var(--add-fg)} .diff .d{background:var(--del);color:var(--del-fg)} .diff .h{color:var(--muted)}
.src.swap > *{animation:fadein .4s var(--ease) both}
.skel{display:grid;gap:10px}.skel i{display:block;height:14px;border-radius:7px;background:var(--raised)}.skel i:nth-child(1){height:24px;width:80%}.skel i:nth-child(2){width:55%}.skel i:nth-child(3){height:120px}

/* Review */
.drafts{display:grid;gap:18px}
@media (min-width:1000px){.drafts{grid-template-columns:1fr 1fr}}
.draft{transition:opacity .2s}
.draft.off{opacity:.55}
.draft.later{background:var(--ground);border-style:dashed}
.draft .title{font:600 1.3rem/1.2 var(--font);letter-spacing:-.02em;border-color:transparent;background:transparent;padding:6px 8px;margin-left:-8px;width:calc(100% + 8px)}
.draft .title:hover{border-color:var(--border)}
.draft .lbl{font-size:.875rem;font-weight:600;color:var(--muted);display:block;margin-bottom:6px}
.draft .text{min-height:150px}
.draft .prompts{min-height:84px;font-size:.92rem}
.pick{justify-self:start}
.savebar{position:sticky;bottom:16px;z-index:4;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;background:var(--ink);color:var(--ground);border-radius:var(--r-ctl);padding:8px 8px 8px 22px;box-shadow:0 18px 36px -18px rgba(0,0,0,.5)}
.savebar .btn.quiet{color:var(--ground);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--ground) 40%,transparent)}
.savebar .btn.quiet:hover{background:color-mix(in srgb,var(--ground) 12%,transparent)}
.savebar .count{font-size:.95rem}

/* Done */
.done-list{list-style:none;margin:0;padding:0;display:grid;gap:10px;width:100%}
.done-list li{display:flex;gap:12px;align-items:baseline;background:var(--ground);border-radius:16px;padding:14px 18px;animation:fadein .5s var(--ease) both;animation-delay:calc(var(--i,0) * 110ms)}
.done-list li::before{content:"";flex:none;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 1px var(--control);transform:translateY(-1px)}
@media (max-width:640px){
  .top .wrap{min-height:56px;gap:8px}
  .top .scope{display:none}
  .top .wordmark{font-size:1rem;gap:7px}
  .top .mark{width:26px;height:26px}
  .top .btn.text{min-height:44px;padding-inline:8px;font-size:.92rem}
  main.app{padding-block:16px calc(72px + env(safe-area-inset-bottom))}
  .screen{gap:16px}
  .panel{padding:16px;border-radius:16px;gap:16px}
  .convo .head{gap:12px}
  .convo .head .orb{width:52px;height:52px}
  .log{max-height:none;overflow:visible;gap:16px}
  .log li{max-width:96%}
  .log .you{padding:10px 14px}
  .topics{margin-inline:-2px;padding-bottom:8px}
  .live{display:grid;grid-template-columns:1fr;padding:10px}
  #liveBtn{width:100%;min-width:0}
  .live .state{min-width:0;text-align:center}
  .composer textarea{min-height:112px}
  .composer .row{display:grid;grid-template-columns:auto 1fr}
  .composer .row .btn.text{justify-self:start}
  .done-row{display:grid;gap:10px}
  .done-row .btn{width:100%}
  .draft .title{font-size:1.15rem}
  .draft .text{min-height:132px}
  .savebar{bottom:calc(8px + env(safe-area-inset-bottom));border-radius:18px;padding:12px 14px}
  .savebar .count{width:100%}
  .savebar .row{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .savebar .row .btn{width:100%;padding-inline:12px}
  .studio > .row{display:grid;width:100%}
  .studio > .row .btn{width:100%}
}
`;

export function appPage(): string {
  return shell(
    "The Interviewer",
    `
<header class="top"><div class="wrap">
  <a class="wordmark" href="/app">${MARK}<span>The Interviewer</span></a>
  <span class="scope" id="scope"></span>
  <form method="post" action="/logout"><button class="btn text" type="submit">Disconnect</button></form>
</div></header>
<main class="app wrap">
<p id="msg" role="alert" hidden></p>

<section id="setup" class="screen" hidden>
  <header><h1>What did you work on this week?</h1><p class="lede">Paste a public GitHub repo, or describe the work in a sentence or two.</p></header>
  <div class="panel">
    <label class="fieldset" id="orgWrap" hidden><span class="lbl">Buffer organization</span><select id="org"></select></label>
    <label class="fieldset"><span class="lbl">A repo or a quick note</span><span class="hint">With a repo, it reads this week's public commits, pull requests and issues. Otherwise it starts from what you write here. 500 characters maximum.</span><textarea id="work" maxlength="500" placeholder="github.com/you/project — or — I rebuilt the onboarding for…"></textarea></label>
    <div class="row"><button id="saveSetup" class="btn" type="button"><span class="rec"></span>Start the interview</button></div>
    <p class="busyline" id="setupBusy" aria-live="polite"></p>
  </div>
</section>

<section id="talk" class="screen wide split solo" hidden>
<aside id="src" class="panel src" aria-label="What this question is about" hidden></aside>
<div class="panel convo">
  <div class="head">
    <div class="orb" id="orb" data-s="idle" aria-hidden="true"><i></i><i></i><b></b></div>
    <div><h1>Your interview</h1><p id="voiceState" aria-live="polite"></p></div>
  </div>
  <div id="topics" class="topics" aria-label="Topics from your week"></div>
  <ol id="log" class="log" aria-live="polite"></ol>
  <div class="live" id="liveBox" hidden><button id="liveBtn" class="btn" type="button"><span class="rec"></span><span class="lt">Start talking</span></button><span id="liveState" class="state" aria-live="polite"></span></div>
  <div class="composer">
    <label for="say" class="saylbl">Type your answer</label>
    <textarea id="say" maxlength="1500" placeholder="Enter sends. Shift+Enter for a new line. 1,500 characters maximum."></textarea>
    <div class="row">
      <button id="sendBtn" class="btn small" type="button">Send</button><button id="nextBtn" class="btn small text" type="button" title="Enough on this one. Ask about something else.">Next topic</button>
    </div>
  </div>
  <div class="done-row"><span class="small muted">Stop whenever you like. It finds the stories in what you said.</span><button id="harvestBtn" class="btn quiet" type="button">I'm done. Find my ideas</button></div>
</div>
</section>

<section id="review" class="screen wide" hidden>
  <header><h1>Ideas from your interview</h1><p class="lede">One card per story. Edit anything, untick what you don't want, and choose an optional Buffer tag before saving.</p></header>
  <div id="drafts" class="drafts"></div>
  <div class="savebar"><span class="count" id="saveCount"></span><div class="row"><button id="backTalk" class="btn quiet small" type="button">Back to the conversation</button><button id="saveAll" class="btn" type="button">Save to Buffer</button></div></div>
</section>

<section id="done" class="screen" hidden>
  <div class="panel studio">
    <div class="orb" data-s="idle" aria-hidden="true"><i></i><i></i><b></b></div>
    <header style="display:grid;gap:10px"><h1>That's this week.</h1><p class="lede" id="doneLine"></p></header>
    <ul class="done-list" id="doneList"></ul>
    <p class="muted" style="max-width:62ch">In Buffer, click <b>Create</b> in the left sidebar. They're under <b>Ideas</b>, in the <b>Unassigned</b> column, each titled INTERVIEW. Open one and click <b>Create Post</b> when you're ready to write.</p>
    <div class="row"><a class="btn" href="https://publish.buffer.com/create" target="_blank" rel="noopener">Open my Ideas in Buffer</a><button id="again" class="btn quiet" type="button">Start a new interview</button></div>
  </div>
</section>
</main>`,
    { style: APP_STYLE, script: APP_SCRIPT },
  );
}

const APP_SCRIPT = `
const $ = (id) => document.getElementById(id);
let state = null, shown = null, busy = false;
const SCREENS = ["setup","talk","review","done"];
function show(id){ for (const s of SCREENS) $(s).hidden = s !== id; $("scope").textContent = state && state.repo ? state.repo : ""; }
function err(m){ $("msg").textContent = m || ""; $("msg").hidden = !m; if (m) $("msg").scrollIntoView({block:"nearest", behavior:"smooth"}); }
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
  l.innerHTML = '<input type="'+type+'" name="'+name+'"><span class="swatch"></span><span></span>';
  l.querySelector("input").value = tag.id; l.querySelector("input").checked = checked;
  l.querySelector(".swatch").style.background = tag.color; l.querySelector("span:last-child").textContent = tag.name;
  return l;
}
const tags = () => state.tags || [];

// The orb: breathes when idle, pulses while thinking, and follows the real
// level of whichever voice is speaking.
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
function orbState(s){ for (const o of document.querySelectorAll(".orb")) o.dataset.s = s; }
let actx = null, meters = [], rafId = 0;
function meter(stream){
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    const an = actx.createAnalyser(); an.fftSize = 512; actx.createMediaStreamSource(stream).connect(an);
    meters.push({an, buf: new Uint8Array(an.fftSize)});
    if (!rafId && !still) loop();
  } catch {}
}
function loop(){
  let lvl = 0;
  for (const m of meters) { m.an.getByteTimeDomainData(m.buf); let s = 0; for (const v of m.buf) { const x = (v - 128) / 128; s += x * x; } lvl = Math.max(lvl, Math.sqrt(s / m.buf.length)); }
  $("orb").style.setProperty("--lvl", Math.min(1, lvl * 4).toFixed(3));
  rafId = meters.length ? requestAnimationFrame(loop) : 0;
}
function stopMeters(){ meters = []; cancelAnimationFrame(rafId); rafId = 0; $("orb").style.setProperty("--lvl", 0); }

// Waiting lines: what the server is really doing while a slow call runs.
let busyTimer = null;
function busyLines(target, lines){
  clearInterval(busyTimer); let k = 0;
  const put = () => $(target).replaceChildren(el("span", "", lines[k++]));
  put(); busyTimer = setInterval(() => { if (k < lines.length) put(); }, 2800);
}
function busyDone(target){ clearInterval(busyTimer); $(target).replaceChildren(); }

// Setup
function renderSetup(){
  const orgs = state.orgs || [];
  $("orgWrap").hidden = orgs.length < 2;
  $("org").innerHTML = ""; for (const o of orgs){ const op = new Option(o.name, o.id); op.selected = o.id === state.organizationId; $("org").add(op); }
  $("work").value = state.repo || state.weekNote || "";
  show("setup");
}

// The side panel: the piece of work the conversation is on.
const sources = new Map();
const KIND = {pull:"Merged pull request", commit:"Commit", issue:"Closed issue", post:"Your latest Buffer post"};
async function renderSource(about){
  const q = (state.questions||[])[about];
  const available = Boolean(q && q.ref);
  $("src").hidden = !available;
  $("talk").classList.toggle("solo", !available);
  if (!available) { shown = about; $("src").innerHTML = ""; markTopics(); return; }
  if (shown === about && $("src").childNodes.length) return;
  shown = about;
  const box = $("src"); box.innerHTML = ""; box.classList.remove("swap"); void box.offsetWidth; box.classList.add("swap");
  const sk = el("div", "skel"); sk.append(el("i"), el("i"), el("i"));
  box.append(el("p", "kind", KIND[q.ref.kind]), sk);
  let src = sources.get(q.id);
  if (!src) { try { src = await api("/api/source?q=" + encodeURIComponent(q.id)); sources.set(q.id, src); } catch(e) { sk.replaceWith(el("p", "small muted", e.message)); return; } }
  if (shown !== about) return;
  box.innerHTML = "";
  box.append(el("p", "kind", KIND[src.kind]));
  const h = el("h3"); if (src.url) { const a = el("a", "", src.title); a.href = src.url; a.target = "_blank"; a.rel = "noopener"; h.append(a); } else h.textContent = src.title; box.append(h);
  const meta = el("div", "meta");
  if (src.who) meta.append(el("span", "", src.who));
  if (src.when) meta.append(el("span", "", new Date(src.when).toLocaleDateString(undefined, {weekday:"short", month:"short", day:"numeric"})));
  if (src.stats) meta.append(el("span", "plus num", "+" + src.stats.additions), el("span", "minus num", "−" + src.stats.deletions), el("span", "num", src.stats.files + (src.stats.files === 1 ? " file" : " files")));
  if (meta.childNodes.length) box.append(meta);
  if (src.body || src.files.length) {
    const more = el("details", "file"), sum = el("summary"); sum.append(el("span", "", "See the change")); more.append(sum);
    if (src.body) { const body = el("div", "body", src.body); body.style.padding = "0 12px 12px"; more.append(body); }
    src.files.forEach((f) => {
      const d = el("details", "file");
      const fs = el("summary"); fs.append(el("span", "", f.name)); const n = el("span", "num"); n.append(el("span", "plus", "+" + f.additions), " ", el("span", "minus", "−" + f.deletions)); fs.append(n); d.append(fs);
      if (f.patch) { const pre = el("pre", "diff"); for (const line of f.patch.split("\\n")) pre.append(el("span", line.startsWith("@@") ? "h" : line[0] === "+" ? "a" : line[0] === "-" ? "d" : "", line || " ")); d.append(pre); }
      more.append(d);
    });
    box.append(more);
  }
}

// The conversation
let drawn = 0;
function currentAbout(){ const t = [...(state.turns||[])].reverse().find(t => t.about != null); return t ? t.about : null; }
function renderTalk(){
  const about = currentAbout();
  $("topics").innerHTML = "";
  (state.questions||[]).forEach((q, k) => {
    const b = el("button", "chip" + (k === shown ? " on" : ""), q.source.replace(/^(Merged PR|Closed issue|Commit): /, ""));
    b.type = "button"; b.title = q.source; b.onclick = () => { renderSource(k); markTopics(); };
    $("topics").append(b);
  });
  const log = $("log"); log.innerHTML = "";
  const turns = state.turns || [];
  turns.forEach((t, k) => {
    const li = el("li", (t.who === "you" ? "you" : "them") + (k >= drawn ? " new" : ""));
    li.append(el("span", "who", t.who === "you" ? "You" : "The Interviewer"), el("p", "", t.text));
    log.append(li);
  });
  drawn = turns.length;
  if (busy) { const li = el("li", "them typing new"), p = el("p"); p.textContent = "Thinking about what you said"; li.append(el("span", "who", "The Interviewer"), p); log.append(li); }
  $("liveBox").hidden = !state.live || !window.RTCPeerConnection;
  if (!liveOn()) { orbState(busy ? "thinking" : "idle"); if (!$("liveBox").hidden && !$("liveState").textContent) setLive(""); }
  show("talk"); log.scrollTop = log.scrollHeight;
  if (about != null && about !== shown) renderSource(about).then(markTopics); else if (shown == null) renderSource(null);
  markTopics();
}
function markTopics(){ [...$("topics").children].forEach((b, k) => b.classList.toggle("on", k === shown)); }

async function say(){
  const text = $("say").value.trim(); if (!text || busy) return;
  // Typing is the fallback path. Pause voice first so there is one transcript
  // writer and one interviewer response at a time.
  if (liveOn()) await stopLive();
  err(""); busy = true; $("sendBtn").disabled = true;
  state.turns = [...(state.turns||[]), {who:"you", text}]; $("say").value = ""; renderTalk();
  try { state = await api("/api/say", {text}); busy = false; renderTalk(); }
  catch(e){ busy = false; state.turns.pop(); drawn = state.turns.length; $("say").value = text; renderTalk(); err(e.message); }
  finally { $("sendBtn").disabled = false; $("say").focus(); }
}
$("sendBtn").onclick = say;
// "That's enough on this one": the interviewer moves to a different thread.
// Saying "next" out loud works too.
const MOVE_ON = "They've said enough on this thread and want to move on. No follow-up: give a short bridge and ask about a different thread now.";
$("nextBtn").onclick = () => {
  if (liveOn() && dc && dc.readyState === "open") {
    dc.send(JSON.stringify({type:"session.instructions.append", event_id:"next_" + Date.now(), delegation_id:null, content:MOVE_ON}));
    return;
  }
  if (busy) return;
  $("say").value = "That's enough on that one. Let's move on to something else."; say();
};
$("say").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); say(); } });

// GPT-Live voice. The transcript is synced back so the harvest can read it.
let pc = null, dc = null, mic = null, liveTurns = null, liveAbout = null, liveTimer = null, syncTimer = null;
const LIVE_LOOK = {"Connecting…":"connecting", "Connected":"thinking", "Listening":"listening", "Thinking":"thinking", "Speaking":"speaking", "Your turn":"listening"};
const LIVE_SAY = {"Connected":"Connected. It's about to ask.", "Your turn":"Your turn. Just talk."};
function setLive(s){
  $("liveState").textContent = s ? (LIVE_SAY[s] || s) : "Talk it through out loud. You can type below too.";
  orbState(s ? (LIVE_LOOK[s] || "idle") : "idle");
}
function liveOn(){ return pc && pc.connectionState !== "closed"; }
function drawLive(){ state.turns = liveTurns.filter(t => t.text.trim()).map(t => ({who:t.who, text:t.text, about:t.about})); renderTalk(); }
function syncLive(now){
  clearTimeout(syncTimer);
  const send = () => api("/api/voice-turns", {turns: state.turns}).catch(() => {});
  if (now) return send();
  syncTimer = setTimeout(send, 1500);
}
function liveLabel(on){ $("liveBtn").querySelector(".lt").textContent = on ? "Pause" : "Start talking"; $("liveBtn").classList.toggle("on", on); }
async function stopLive(){
  clearTimeout(liveTimer);
  if (gl) { clearTimeout(gl.quiet); if (dc && dc.readyState === "open") try { dc.send(JSON.stringify({type:"session.close"})); } catch {} gl = null; }
  if (dc) try { dc.close(); } catch {}
  if (pc) try { pc.close(); } catch {}
  if (mic) mic.getTracks().forEach(t => t.stop());
  stopMeters();
  const was = !!liveTurns; pc = dc = mic = null; liveTurns = null;
  liveLabel(false); setLive("");
  if (was) await syncLive(true);
}
$("liveBtn").onclick = () => liveOn() ? stopLive() : startGptLive();

// The page sends its WebRTC offer to the server; no OpenAI key reaches the browser.
let gl = null;
function glFragment(who, delta){
  if (!delta) return;
  const last = liveTurns[liveTurns.length - 1];
  // A few words with no question from the interviewer while they were talking
  // is a backchannel ("mm", "yeah"): drop it and keep their turn going.
  if (who === "you" && last && last === gl.cur.interviewer && last.text.trim().split(/ +/).length <= 3 && last.text.indexOf("?") < 0 && liveTurns[liveTurns.length - 2] === gl.cur.you) {
    liveTurns.pop(); gl.cur.interviewer = null;
  }
  let t = liveTurns[liveTurns.length - 1];
  if (!t || t !== gl.cur[who]) { t = {who, text:"", about: who === "interviewer" ? liveAbout : undefined}; liveTurns.push(t); gl.cur[who] = t; }
  t.text += delta;
  drawLive(); syncLive();
}
function onGptLiveEvent(ev){
  switch (ev.type) {
    case "session.started":
      setLive("Connected");
      if (gl && gl.opening && dc && dc.readyState === "open") dc.send(JSON.stringify({type:"session.commentary.append", event_id:"open_" + Date.now(), delegation_id:null, content:gl.opening}));
      break;
    case "session.input_transcript.delta": glFragment("you", ev.delta); setLive("Listening"); break;
    case "session.output_transcript.delta":
      glFragment("interviewer", ev.delta); setLive("Speaking");
      clearTimeout(gl.quiet); gl.quiet = setTimeout(() => { if (liveOn()) setLive("Your turn"); }, 900);
      break;
    case "session.closed": if (liveOn()) stopLive(); break;
    case "error": console.warn("gpt-live", ev.error || ev); break;
  }
}
async function startGptLive(){
  err(""); $("liveBtn").disabled = true; setLive("Connecting…");
  try {
    mic = await navigator.mediaDevices.getUserMedia({audio:true});
    meter(mic);
    liveTurns = (state.turns || []).some(t => t.who === "you") ? state.turns.map(t => ({...t})) : []; liveAbout = currentAbout();
    gl = {cur:{}, quiet:null};
    pc = new RTCPeerConnection();
    const out = new Audio(); out.autoplay = true;
    pc.ontrack = (e) => { out.srcObject = e.streams[0]; meter(e.streams[0]); };
    mic.getTracks().forEach(t => pc.addTrack(t, mic));
    dc = pc.createDataChannel("oai-events");
    dc.onmessage = (e) => { try { onGptLiveEvent(JSON.parse(e.data)); } catch (x) { console.warn(x); } };
    pc.onconnectionstatechange = () => { if (["failed","disconnected"].includes(pc.connectionState)) { stopLive(); err("The voice connection dropped. Your conversation so far is kept. Start talking again to pick up."); } };
    await pc.setLocalDescription(await pc.createOffer());
    // The server needs the full offer, so wait for ICE gathering (briefly).
    await new Promise(res => { if (pc.iceGatheringState === "complete") return res(); const t = setTimeout(res, 2000); pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); } }); });
    const { sdp, opening } = await api("/api/live", {sdp: pc.localDescription.sdp});
    gl.opening = opening;
    await pc.setRemoteDescription({type:"answer", sdp});
    liveLabel(true);
    liveTimer = setTimeout(() => { stopLive(); err("Paused after 20 minutes. Start talking again to keep going, or find your ideas."); }, 20 * 60 * 1000);
  } catch (e) { stopLive(); err(e.message === "Permission denied" ? "The browser didn't allow the microphone. You can type instead." : e.message); }
  finally { $("liveBtn").disabled = false; }
}

// Harvest and review
$("harvestBtn").onclick = async () => {
  err(""); $("harvestBtn").disabled = true; $("harvestBtn").textContent = "Reading the conversation…";
  try {
    if (liveTurns) await stopLive();
    orbState("thinking"); busyLines("voiceState", ["Reading the conversation back", "Finding the stories worth telling", "Pulling your words together", "Writing a few questions for each one"]);
    state = await api("/api/harvest", {}); renderReview(); window.scrollTo({top:0});
  }
  catch(e){ err(e.message); } finally { busyDone("voiceState"); orbState("idle"); $("harvestBtn").disabled = false; $("harvestBtn").textContent = "I'm done. Find my ideas"; }
};
function countPicked(){
  const cards = [...document.querySelectorAll(".draft")];
  cards.forEach(c => c.classList.toggle("off", !c.querySelector(".pick input").checked));
  const n = cards.filter(c => c.querySelector(".pick input").checked).length;
  $("saveCount").textContent = n ? n + (n === 1 ? " idea" : " ideas") + " ticked" : "Nothing ticked yet";
  $("saveAll").textContent = n ? "Save " + n + " to Buffer" : "Save to Buffer";
}
function renderReview(){
  const box = $("drafts"); box.innerHTML = "";
  for (const d of state.drafts || []) {
    const card = el("article", "panel draft" + (d.later ? " later" : "")); card.dataset.id = d.id;
    const top = el("label", "chip pick"); const cb = el("input"); cb.type = "checkbox"; cb.checked = !d.later; top.append(cb, el("span", "", d.later ? "Save to answer later" : "Save this idea")); card.append(top);
    if ((state.saved||[]).includes(d.id)) { cb.checked = false; cb.disabled = true; top.lastChild.textContent = "Saved"; }
    cb.onchange = countPicked;
    const t = el("input", "title"); t.type = "text"; t.maxLength = 200; t.value = d.title; t.setAttribute("aria-label", "Idea title"); card.append(t);
    const words = el("div"); words.append(el("span", "lbl", d.later ? "A question for later" : "Your idea, cleaned up")); const x = el("textarea", "text"); x.maxLength = 10000; x.value = d.text; x.setAttribute("aria-label", "Idea text, lightly cleaned up"); words.append(x); card.append(words);
    if ((d.prompts||[]).length) {
      const pw = el("div"); pw.append(el("span", "lbl", "Questions to help you write it, one per line"));
      const pr = el("textarea", "prompts"); pr.maxLength = 1000; pr.value = d.prompts.join("\\n"); pr.setAttribute("aria-label", "Shaping questions, one per line"); pw.append(pr); card.append(pw);
    }
    if (tags().length) {
      const tagWrap = el("div"); tagWrap.append(el("span", "lbl", "Buffer tag (optional)"));
      const chips = el("div", "chips"); chips.setAttribute("aria-label", "Buffer tag"); tags().forEach((p) => chips.append(chip(p, "pl-" + d.id, "radio", d.tagId === p.id))); tagWrap.append(chips); card.append(tagWrap);
    }
    box.append(card);
  }
  show("review"); countPicked();
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
  $("saveAll").disabled = true; $("saveAll").textContent = "Saving to Buffer…";
  try { state = await api("/api/save", {drafts}); renderDone(); }
  catch(e){ err(e.message); try { state = await api("/api/state"); renderReview(); } catch {} }
  finally { $("saveAll").disabled = false; if (!$("review").hidden) countPicked(); }
};
function renderDone(){
  const n = (state.saved||[]).length;
  $("doneLine").textContent = n + (n === 1 ? " idea is" : " ideas are") + " in your Buffer Ideas, in your own words. Write from them whenever you're ready.";
  const list = $("doneList"); list.innerHTML = "";
  (state.drafts||[]).filter(d => (state.saved||[]).includes(d.id)).forEach((d, k) => { const li = el("li", "", d.title); li.style.setProperty("--i", k); list.append(li); });
  show("done"); window.scrollTo({top:0});
}

function route(){
  if (!state.repo && !state.noRepo) return renderSetup();
  if ((state.drafts||[]).length) return (state.saved||[]).length ? renderDone() : renderReview();
  if ((state.turns||[]).length) return renderTalk();
  renderSetup();
}
async function load(){ try { state = await api("/api/state"); route(); } catch(e){ err(e.message); } }
$("saveSetup").onclick = async () => {
  err(""); $("saveSetup").disabled = true; orbState("thinking");
  busyLines("setupBusy", ["Reading this week's public work", "Looking at what you've posted lately", "Choosing a few threads to pull on", "Almost ready"]);
  try {
    state = await api("/api/setup", {organizationId:$("org").value, work:$("work").value});
    state = await api("/api/start", {}); shown = null; drawn = 0; renderTalk(); $("say").focus({preventScroll:true});
  }
  catch(e){ err(e.message); }
  finally { busyDone("setupBusy"); if ($("talk").hidden) orbState("idle"); $("saveSetup").disabled = false; }
};
$("again").onclick = async () => { try { state = await api("/api/reset", {}); shown = null; drawn = 0; sources.clear(); route(); } catch(e){ err(e.message); } };
load();
`;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
