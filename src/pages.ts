// Look: off-white ground, bottle-green ink, legal-pad yellow on the one action.
// One typeface (Bricolage Grotesque). No gradients, glows or glass, except the one moment of shimmer while it finds your stories.
const STYLE = `
:root{
  --ground:#f6f6f3; --surface:#ffffff; --raised:#ebece7; --active:#e2e4dd;
  --ink:#0d2a1c; --muted:#4c5a51; --faint:#5f6b64;
  --border:#e1e3dd; --control:#c3c9c2;
  --accent:#f6e016; --accent-ink:#0d2a1c; --accent-press:#e5cf06;
  --field:#0d2a1c; --field-ink:#f6f6f3; --field-muted:#b9c6bd; --ink-bg:#0d2a1c;
  --solid:#0d2a1c; --solid-ink:#f6f6f3;
  --text:clamp(1.0625rem,1rem + .2vw,1.1875rem);
  --live:#d7361f; --warn:#a33a12;
  --add:#e3f4e6; --add-fg:#1d6b2c; --del:#fbe7e6; --del-fg:#a1302b; --code:#f1f2ee;
  --code-cool:96,112,101; --code-hot:168,140,0; --code-iris:62,44;
  --font:"Bricolage Grotesque","Bricolage Fallback",ui-sans-serif,system-ui,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --r-card:20px; --r-ctl:999px; --r-in:12px;
  --gut:clamp(16px,3.2vw,40px);
  --ease:cubic-bezier(.2,.7,.2,1);
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root{
  --ground:#07150e; --surface:#0d2117; --raised:#14301f; --active:#1b3a27;
  --ink:#edf2eb; --muted:#adbcb1; --faint:#98a89c;
  --border:#1d3a28; --control:#557a62;
  --ink-bg:#14301f;
  --live:#ff6a4d; --warn:#f0a36b;
  --add:#16301d; --add-fg:#7fd492; --del:#3a1b1a; --del-fg:#f29b94; --code:#0a1b12;
  --code-cool:110,140,120; --code-hot:246,224,22; --code-iris:85,80;
  color-scheme:dark}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--font);font-size:var(--text);line-height:1.5;
  font-optical-sizing:auto;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-weight:600;letter-spacing:-.035em;line-height:.98;margin:0;text-wrap:balance}
p{margin:0;text-wrap:pretty}
li{text-wrap:pretty}
a{color:inherit;text-underline-offset:.18em;text-decoration-thickness:1px}
a:hover{text-decoration-thickness:2px}
::selection{background:var(--accent);color:var(--accent-ink)}
:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:6px}
.ink :focus-visible,.hood :focus-visible,.savebar :focus-visible{outline-color:var(--accent)}
.foot :focus-visible{outline-color:var(--field-ink)}
[hidden]{display:none!important}
.muted{color:var(--muted)}
.small{font-size:.875rem;line-height:1.45}
.num{font-variant-numeric:tabular-nums}

/* Controls */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 24px;border-radius:var(--r-ctl);
  font:500 1rem/1 var(--font);letter-spacing:-.01em;text-decoration:none;cursor:pointer;border:0;
  background:var(--accent);color:var(--accent-ink);transition:transform .18s var(--ease),background-color .18s}
.btn:hover{background:var(--accent-press)}
.btn:active{transform:scale(.97)}
/* Tap: no browser highlight box; a quick pearl sheen crosses the control instead, a hint of the shimmer to come. */
a,button,label,summary,.chip{-webkit-tap-highlight-color:transparent}
.btn,.tap{position:relative}
.btn,.chip,.tap{isolation:isolate}
.btn::after,.chip::after,.tap::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;z-index:-1;
  background:linear-gradient(105deg,transparent 22%,hsl(150 80% 78% / .6) 38%,hsl(205 85% 80% / .65) 50%,hsl(285 70% 84% / .6) 62%,transparent 78%) 120% 0 / 260% 100% no-repeat}
.btn.sheen::after,.chip.sheen::after,.tap.sheen::after{animation:sheen .65s cubic-bezier(.2,.7,.2,1)}
@keyframes sheen{0%{opacity:0;background-position:120% 0}25%{opacity:1}100%{opacity:0;background-position:-20% 0}}
.btn:disabled{opacity:.55;cursor:default;transform:none}
.btn.quiet{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--control)}
.btn.quiet:hover{background:var(--raised)}
.btn.text{background:transparent;padding:0 6px;min-height:40px;color:var(--muted)}
.btn.text:hover{color:var(--ink)}
.btn.small{min-height:38px;padding:0 16px;font-size:.875rem}
/* Iconoir glyphs, shared with the done-screen links: 18px, 1.5 stroke, currentColor. */
.ico{flex:none;width:18px;height:18px;margin-right:-2px;opacity:.85}
@media (pointer:coarse){.btn.small,.btn.text,.chip,button.chip,.file summary,input[type=text],input.title,.feedback-open,.foot-link{min-height:44px}.wordmark{min-height:44px}}
.btn .rec{width:10px;height:10px;border-radius:50%;background:var(--live);flex:none}
.wordmark{white-space:nowrap;display:inline-flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-.03em;font-size:1.15rem;text-decoration:none;color:var(--ink)}
.mark{width:30px;height:30px;flex:none}

/* Page frame */
.wrap{width:100%;max-width:1360px;margin:0 auto;padding-inline:max(var(--gut),env(safe-area-inset-left)) max(var(--gut),env(safe-area-inset-right))}
.nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-block:20px}
.nav ul{display:flex;gap:28px;list-style:none;margin:0;padding:0;font-size:1rem}
.nav ul a{text-decoration:none;color:var(--muted)}
.nav ul a:hover{color:var(--ink)}
@media (max-width:820px){.nav ul{display:none}}
.nav .btn{gap:0}
@media (max-width:480px){.nav .btn .long{display:none}}

/* Motion: entrances only when scripts run, travel only when allowed */
.js .rise{opacity:0;transform:translateY(22px);transition:opacity .7s var(--ease),transform .7s var(--ease);transition-delay:calc(var(--i,0) * 80ms)}
.js .rise.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .js .rise{transform:none;transition:opacity .4s}
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}
}
.feedback-open{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:20;display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px;border:1px solid var(--control);border-radius:var(--r-ctl);background:var(--surface);color:var(--ink);font:500 .875rem/1 var(--font);box-shadow:0 8px 24px rgba(13,42,28,.12);cursor:pointer}
.feedback-open:hover{background:var(--raised)}
.feedback-dialog{width:min(92vw,520px);border:0;border-radius:20px;padding:0;background:var(--surface);color:var(--ink);box-shadow:0 24px 80px rgba(0,0,0,.28)}
.feedback-dialog::backdrop{background:rgba(7,21,14,.56)}
.feedback-form{padding:clamp(22px,4vw,32px);display:grid;gap:16px}
.feedback-form h2{font-size:1.65rem}.feedback-form label{display:grid;gap:6px;font-size:.875rem;color:var(--muted)}
.feedback-form select,.feedback-form textarea,.feedback-form input{width:100%;border:1px solid var(--control);border-radius:12px;background:var(--ground);color:var(--ink);font:400 1rem/1.45 var(--font);padding:11px 13px}
.feedback-form textarea{min-height:140px;resize:vertical}.feedback-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}.feedback-status{font-size:.875rem;color:var(--muted)}
.feedback-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
`;

const PAGE_STYLE = `
.doc p,.doc li{max-width:62ch}
.doc ul{margin:0;padding-left:1.2em;display:grid;gap:10px}
`;

// The landing page: one motif, the speech-bubble mark. Light only, it is built on yellow and bottle green.
const LANDING_STYLE = `
:root{
  color-scheme:light;
  --ground:#f6f6f3; --raised:#ebece7; --step:#dfe2da; --ink:#0d2a1c; --muted:#45544b; --accent:#f6e016; --accent-press:#e5cf06; --live:#d7361f;
  --on-ink:#f2f5ef; --on-ink-muted:#c3cfc6; --ink-2:#163a28;
  --font:"Bricolage Grotesque","Bricolage Fallback",ui-sans-serif,system-ui,sans-serif;
  --m:clamp(16px,3vw,40px);
  --ease:cubic-bezier(.2,.7,.2,1);
  /* Five sizes: display, heading, lead, body, small */
  --t-display:clamp(48px,7.2vw,118px); --t-head:clamp(32px,3.6vw,56px); --t-lead:clamp(19px,1.5vw,22px); --t-body:17px; --t-small:15px;
  /* The motif: The Interviewer's own speech bubble, as a mask */
  --bubble:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='3 3 26 26.2' preserveAspectRatio='none'%3E%3Cpath d='M16 3C8.8 3 3 8.4 3 15.1c0 3.6 1.7 6.8 4.4 9L6.2 29l5.6-2.8c1.3.4 2.7.6 4.2.6 7.2 0 13-5.4 13-12.1S23.2 3 16 3Z'/%3E%3C/svg%3E");
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ground);color:var(--ink);font:400 var(--t-body)/1.55 var(--font);-webkit-font-smoothing:antialiased;overflow-x:clip}
img,video,svg{display:block;max-width:100%}
a{color:inherit}
h1,h2,h3{margin:0;font-weight:600;letter-spacing:-.035em;line-height:.98;text-wrap:balance}
p{margin:0}
:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:6px}
.ink :focus-visible,.foot :focus-visible{outline-color:var(--accent)}
.wrap{padding-inline:var(--m);max-width:1520px;margin-inline:auto}

/* Buttons: fully round, flat, one fill */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 26px;border-radius:999px;border:0;background:var(--accent);color:var(--ink);font:600 var(--t-small)/1 var(--font);letter-spacing:-.01em;text-decoration:none;cursor:pointer;transition:transform .18s var(--ease),background-color .18s}
.btn:hover{background:var(--accent-press)}
.btn:active{transform:scale(.97)}
.btn .dot{width:10px;height:10px;border-radius:50%;background:var(--live)}

/* Nav: wordmark, four links, one action */
.nav{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-block:24px}
.wordmark{display:inline-flex;align-items:center;gap:10px;font-weight:600;font-size:19px;letter-spacing:-.02em;text-decoration:none}
.wordmark svg{width:30px;height:30px}
.nav ul{display:flex;gap:28px;list-style:none;margin:0;padding:0}
.nav ul a{text-decoration:none;font-size:var(--t-small);color:var(--muted)}
.nav ul a:hover{color:var(--ink)}
.nav .btn{min-height:44px;padding:0 20px}
.nav .btn{gap:0}
@media (max-width:900px){.nav ul{display:none}}
@media (max-width:520px){.nav .long{display:none}}

/* Hero: the bubble, enormous, cropped by the viewport, as the stage for the demo */
.hero{position:relative;min-height:calc(4vh + min(60vw,940px) * 1.008 + 8px);overflow:hidden;display:grid;grid-template-columns:minmax(0,6fr) minmax(0,6fr);align-items:start}
.hero .copy{position:relative;z-index:1;padding:clamp(48px,9vh,120px) 0 64px var(--m);max-width:760px}
.hero h1{font-size:var(--t-display)}
.hero .lead{font-size:var(--t-lead);line-height:1.45;max-width:34ch;margin-top:36px}
.hero .act{margin-top:40px;display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px}
.hero .act .small{font-size:var(--t-small);color:var(--muted);max-width:30ch}
.stage{position:absolute;right:-6vw;top:4vh;width:min(60vw,940px);aspect-ratio:26/26.2;background:var(--accent);-webkit-mask:var(--bubble) center/100% 100% no-repeat;mask:var(--bubble) center/100% 100% no-repeat}
.stage .rec{position:absolute;left:47.5%;top:41%;width:6%;aspect-ratio:1;border-radius:50%;background:var(--live);opacity:.0}
.reel{position:absolute;z-index:1;right:calc(min(60vw,940px) * .3 - 6vw);top:calc(4vh + min(60vw,940px) * .14);width:min(26vw,400px);margin:0;border-radius:28px;overflow:hidden;background:#07150e}
.reel video{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover}
@media (max-width:860px){
  .hero{display:block;min-height:0}
  .hero .copy{padding:28px var(--m) 32px}
  .hero h1{font-size:13vw}
  .hero .lead{margin-top:24px}
  .hero-phone{position:relative;overflow:hidden;padding-bottom:4vw}
  .stage{position:relative;right:auto;top:auto;width:118vw;margin:0 0 0 -4vw}
  .reel{right:auto;left:50%;transform:translateX(-50%);top:12vw;width:min(66vw,360px)}
}

/* The full-width band between the two halves of the page */
.band{margin:0;height:clamp(240px,42vw,620px);overflow:hidden}
.band img{width:100%;height:100%;object-fit:cover;object-position:50% 60%}

/* How it works: four fields, the same card further along in each */
.strip{display:grid;grid-template-columns:repeat(4,1fr)}
.fld{position:relative;min-height:min(84svh,760px);padding:32px var(--m) 36px;display:flex;flex-direction:column}
.fld:nth-child(1){background:var(--raised)}
.fld:nth-child(2){background:var(--step)}
.fld:nth-child(3){background:var(--accent)}
.fld:nth-child(4){background:var(--ink);color:var(--on-ink)}
.fld h2{font-size:var(--t-head);font-weight:700}
.fld .card{margin:auto 0;width:100%;transition:transform .15s var(--ease)}
.fld:hover .card{transform:translateY(-6px)}
.fld .clause{font-size:var(--t-lead);line-height:1.12;letter-spacing:-.02em;font-weight:500;max-width:14ch}
.card{background:#fff;color:var(--ink);border-radius:22px 22px 22px 6px;padding:16px 16px 14px;font-size:14px;line-height:1.4;display:grid;gap:10px}
.card .who{font-size:13px;color:var(--muted)}
.card .in{background:var(--raised);border-radius:12px;padding:10px 12px;font-size:14px}
.card .q{font-size:16px;font-weight:600;letter-spacing:-.015em;line-height:1.25}
.card .a{background:var(--ink);color:var(--on-ink);border-radius:16px 16px 4px 16px;padding:10px 12px;justify-self:end;max-width:90%}
.card .draft{border-top:0;background:var(--accent);border-radius:12px;padding:10px 12px;display:grid;gap:4px}
.card .draft b{font-size:15px;letter-spacing:-.01em}
.card .sbtn{justify-self:start;background:var(--accent);border-radius:999px;padding:10px 16px;font-weight:600;font-size:14px}
.card .ch{font-size:13px;color:var(--muted)}
@media (max-width:1100px){
  .strip{grid-template-columns:1fr 1fr}
  .fld{min-height:520px}
}
@media (max-width:620px){
  .strip{grid-template-columns:1fr}
  .fld{min-height:0;padding:28px var(--m) 36px;gap:24px}
  .fld .card{margin:0;max-width:none}
  .fld .clause{order:-1;font-size:24px;max-width:18ch}
  .fld h2{order:-2}
}

/* Trust: an inset ink panel, the cafe photo masked in the bubble */
.panel-wrap{padding:clamp(80px,10vw,160px) 20px}
.ink{position:relative;background:var(--ink);color:var(--on-ink);border-radius:28px;min-height:min(110svh,980px);overflow:hidden;padding:56px;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:40px}
.ink h2{font-size:var(--t-display);max-width:9ch}
.ink .pic{position:absolute;left:56px;bottom:-9%;width:min(40vw,620px);aspect-ratio:26/26.2;margin:0;-webkit-mask:var(--bubble) center/100% 100% no-repeat;mask:var(--bubble) center/100% 100% no-repeat}
.ink .pic img{width:100%;height:100%;object-fit:cover}
.ink .blocks{display:grid;gap:56px;align-content:start;padding-top:8px}
.ink h3{font-size:var(--t-lead);letter-spacing:-.02em;line-height:1.15;margin-bottom:10px}
.ink .blocks p{color:var(--on-ink-muted);font-size:var(--t-body)}
.ink .btn{margin-top:20px}
@media (max-width:960px){
  .panel-wrap{padding:64px 10px}
  .ink{display:block;padding:32px 22px 0;border-radius:22px}
  .ink h2{font-size:13vw}
  .ink .blocks{margin-top:40px;gap:36px}
  .ink .pic{position:relative;left:auto;bottom:auto;width:86vw;margin:48px auto -22vw}
}

/* Connect: sticky heading with the couch photo, filled-tile accordion */
.faq{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(32px,5vw,80px);padding-bottom:clamp(120px,12vw,200px)}
.faq .side{position:sticky;top:96px;align-self:start}
.faq h2{font-size:var(--t-head)}
.faq .side p{margin-top:24px;font-size:var(--t-lead);max-width:26ch;line-height:1.4}
.faq .side .pic{margin:40px 0 0;width:min(100%,420px);aspect-ratio:26/26.2;-webkit-mask:var(--bubble) center/100% 100% no-repeat;mask:var(--bubble) center/100% 100% no-repeat}
.faq .side .pic img{width:100%;height:100%;object-fit:cover}
.tiles{display:grid;gap:8px;align-content:start}
.tiles details{background:var(--raised);border-radius:22px 22px 22px 6px;transition:background-color .2s}
.tiles summary{list-style:none;cursor:pointer;min-height:76px;padding:22px 64px 22px 26px;position:relative;font-size:var(--t-lead);font-weight:500;letter-spacing:-.015em;line-height:1.3}
.tiles summary::-webkit-details-marker{display:none}
.tiles summary::before,.tiles summary::after{content:"";position:absolute;right:26px;top:50%;width:16px;height:3px;border-radius:2px;background:var(--ink);transition:transform .2s var(--ease)}
.tiles summary::after{transform:rotate(90deg)}
.tiles details[open]{background:var(--accent)}
.tiles details[open] summary::after{transform:rotate(0)}
.tiles .ans{padding:0 26px 24px;max-width:56ch;font-size:var(--t-body)}
.tiles .ans a{font-weight:600}
@media (max-width:960px){.faq{display:block}.faq .side{position:static}.faq .side .pic{width:70vw;margin:32px 0 40px}.tiles summary{font-size:18px;min-height:64px}}

/* Close: a sentence with a blank */
.close{background:var(--accent);padding-block:clamp(96px,11vw,180px)}
.close form{font-size:clamp(40px,6.4vw,104px);font-weight:600;letter-spacing:-.035em;line-height:1.12}
.close .l1{display:block}
.close label{display:inline}
.close input{font:inherit;letter-spacing:inherit;width:7.6em;max-width:100%;height:1.08em;vertical-align:-.14em;border:0;border-radius:.42em .42em .42em .12em;background:var(--ground);color:var(--ink);padding:0 .3em;margin:0 .08em}
.close input::placeholder{color:#7b857f}
.close button{font:inherit;letter-spacing:inherit;height:1.08em;vertical-align:-.14em;border:0;border-radius:999px;background:var(--ink);color:var(--accent);padding:0 .45em;cursor:pointer;transition:transform .18s var(--ease)}
.close button:active{transform:scale(.97)}
.close .after{margin-top:32px;font-size:var(--t-body);max-width:48ch}
@media (max-width:700px){.close form{font-size:8.4vw}.close input{width:6em}}
@media (max-width:620px){.fld .clause,.ink h2,.faq h2,.hero h1,.hero .lead,.hero .act .small,.faq .side p,.close .after,.ink .blocks p{max-width:none}}


/* Footer: the mark, built large */
.foot{background:var(--ink);color:var(--on-ink);padding:clamp(56px,6vw,96px) 0 32px}
.mark-big{display:flex;align-items:flex-end;gap:clamp(16px,3vw,40px);height:34svh;min-height:200px}
.mark-big svg{height:100%;width:auto;flex:none}
.mark-big .nm{font-size:clamp(48px,10.6vw,176px);font-weight:600;letter-spacing:-.05em;line-height:.8}
.foot .links{display:flex;flex-wrap:wrap;gap:14px 32px;margin-top:56px;font-size:var(--t-small)}
.foot .links a,.foot .links button{color:var(--on-ink);text-decoration:none;font:inherit;background:none;border:0;padding:0;cursor:pointer}
.foot .links a:hover,.foot .links button:hover{text-decoration:underline}
.foot .last{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;margin-top:40px;font-size:var(--t-small);color:var(--on-ink-muted)}
.foot .last .btn{min-height:44px}
@media (max-width:700px){.mark-big{height:22svh;min-height:120px}.mark-big .nm{font-size:14vw}}

/* Motion: shutter on the demo, staggered entrances, nothing hidden without script */
.js .rise{opacity:0;transform:translateY(24px);transition:opacity .7s var(--ease),transform .7s var(--ease);transition-delay:calc(var(--i,0) * 80ms)}
.js .rise.in{opacity:1;transform:none}
.js .reel{clip-path:inset(100% 0 0 0 round 28px);transition:clip-path 1.1s var(--ease)}
.js .reel video{transform:scale(1.12);transition:transform 1.4s var(--ease)}
.js .reel.in{clip-path:inset(0 0 0 0 round 28px)}
.js .reel.in video{transform:none}
.js .stage{transform:translateX(6vw) rotate(-4deg);opacity:0;transition:transform 1.2s var(--ease),opacity .8s}
.js .stage.in{transform:none;opacity:1}
@media (prefers-reduced-motion:reduce){
  .js .rise,.js .stage{opacity:1;transform:none;transition:none}
  .js .reel{clip-path:none;transition:none}.js .reel video{transform:none;transition:none}
}
@media (max-width:620px){
  .close form{display:flex;flex-wrap:wrap;gap:.14em .12em;align-items:center}
  .close .l1{flex:1 0 100%}
  .close input{flex:1 1 0;width:auto;min-width:0;margin:0}
  .close button{flex:none}
  .foot .links{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}
  .foot .links a,.foot .links button{text-align:left}
  .foot .last .btn,.hero .act .btn,.ink .btn{width:100%;justify-content:center}
  .mark-big{height:auto;min-height:0}.mark-big svg{height:28vw}.mark-big .nm{font-size:12vw;min-width:0}
  .reel{width:min(76vw,360px)}
}
`;

const MARK = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.4 3 15.1c0 3.6 1.7 6.8 4.4 9L6.2 29l5.6-2.8c1.3.4 2.7.6 4.2.6 7.2 0 13-5.4 13-12.1S23.2 3 16 3Z" fill="#f6e016"/><circle cx="16" cy="15" r="4.2" fill="#d7361f"/></svg>`;

// Self-hosted so the face arrives with the page: preloaded, one origin, no third-party CSS hop.
// The fallback face is Arial resized to Bricolage's measure, so if the font is late the swap barely moves anything.
const FONTS = `<link rel="preload" href="/fonts/bricolage-latin.woff2" as="font" type="font/woff2" crossorigin>`;
const FONT_FACES = `
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:200 800;font-display:swap;
  src:url(/fonts/bricolage-latin.woff2) format("woff2");
  unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Bricolage Grotesque";font-style:normal;font-weight:200 800;font-display:swap;
  src:url(/fonts/bricolage-latin-ext.woff2) format("woff2");
  unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Bricolage Fallback";src:local("Arial"),local("Helvetica"),local("Liberation Sans");
  size-adjust:106.5%;ascent-override:87.3%;descent-override:25.4%;line-gap-override:0%}
`;

// Iconoir chat-bubble-empty, MIT License, copyright (c) 2021 Luca Burgio. Stroke-only, same as the done-screen icons.
const FEEDBACK_ICON = `<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="1.5" aria-hidden="true"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;


const PLUGIN_ICON = `<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="1.5" aria-hidden="true"><path d="M4 14V18.4C4 18.7314 4.26863 19 4.6 19H10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 14V18.4C19 18.7314 18.7314 19 18.4 19H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 5H18.4C18.7314 5 19 5.26863 19 5.6V10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 10V5.6C4 5.26863 4.26863 5 4.6 5H10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 19V20C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20V19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 10H5C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14H4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 10H20C21.1046 10 22 10.8954 22 12C22 13.1046 21.1046 14 20 14H19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 5V4C14 2.89543 13.1046 2 12 2C10.8954 2 10 2.89543 10 4V5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const STAR_ICON = `<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="1.5" aria-hidden="true"><path d="M16 22.0268V19.1568C16.0375 18.68 15.9731 18.2006 15.811 17.7506C15.6489 17.3006 15.3929 16.8902 15.06 16.5468C18.2 16.1968 21.5 15.0068 21.5 9.54679C21.4997 8.15062 20.9627 6.80799 20 5.79679C20.4558 4.5753 20.4236 3.22514 19.91 2.02679C19.91 2.02679 18.73 1.67679 16 3.50679C13.708 2.88561 11.292 2.88561 8.99999 3.50679C6.26999 1.67679 5.08999 2.02679 5.08999 2.02679C4.57636 3.22514 4.54413 4.5753 4.99999 5.79679C4.03011 6.81549 3.49251 8.17026 3.49999 9.57679C3.49999 14.9968 6.79998 16.1868 9.93998 16.5768C9.61098 16.9168 9.35725 17.3222 9.19529 17.7667C9.03334 18.2112 8.96679 18.6849 8.99999 19.1568V22.0268" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 20.0267C6 20.9999 3.5 20.0267 2 17.0267" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const FEEDBACK_LINK = `<button class="btn text" type="button" data-feedback-open>${FEEDBACK_ICON}Feedback or bug</button>`;

const FEEDBACK_WIDGET = `<dialog class="feedback-dialog" id="feedbackDialog">
  <form class="feedback-form" id="feedbackForm">
    <h2>Tell me what happened.</h2>
    <label>What is this?<select name="kind"><option value="feedback">Feedback</option><option value="bug">A bug</option></select></label>
    <label>What should I know?<textarea name="message" maxlength="2000" required placeholder="What were you trying to do? What happened?"></textarea></label>
    <label>Email or handle <span class="small">(optional, only if you want a reply)</span><input name="contact" maxlength="200" autocomplete="email"></label>
    <label class="feedback-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
    <div class="feedback-actions"><button class="btn quiet" type="button" data-feedback-close>Cancel</button><button class="btn" type="submit">Send</button></div>
    <p class="feedback-status" id="feedbackStatus" role="status"></p>
  </form>
</dialog>`;

const FEEDBACK_SCRIPT = `(() => {
  // A tap sends a pearl sheen across the button (skipped with reduced motion).
  document.addEventListener("pointerdown", (e) => {
    const b = e.target instanceof Element && e.target.closest(".btn,.chip,.tap");
    if (!b || b.disabled || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    b.classList.remove("sheen"); void b.offsetWidth; b.classList.add("sheen");
    b.addEventListener("animationend", () => b.classList.remove("sheen"), {once: true});
  }, {passive: true});
  const d=document.getElementById("feedbackDialog"), f=document.getElementById("feedbackForm"), status=document.getElementById("feedbackStatus");
  document.querySelectorAll("[data-feedback-open]").forEach(b=>b.addEventListener("click",()=>d.showModal()));
  document.querySelector("[data-feedback-close]")?.addEventListener("click",()=>d.close());
  d?.addEventListener("click",e=>{if(e.target===d)d.close()});
  f?.addEventListener("submit",async e=>{e.preventDefault();const send=f.querySelector('[type="submit"]');send.disabled=true;status.textContent="Sending…";const data=Object.fromEntries(new FormData(f));data.path=location.pathname;try{const r=await fetch("/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Could not send that.");f.reset();status.textContent="Thanks, it\u2019s sent.";setTimeout(()=>d.close(),900)}catch(x){status.textContent=x.message}finally{send.disabled=false}});
})();`;

function shell(title: string, body: string, opts: { style?: string; script?: string } = {}): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">
<title>${title}</title>
<meta name="description" content="Talk through what you built, find the stories worth telling, and save them to Buffer in your own words. A thinking scaffold for building in public, not an AI ghostwriter.">
<meta name="theme-color" content="#f6f6f3" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#07150e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="The Interviewer"><meta property="og:url" content="https://interviewer.lbeebe.com/">
<meta property="og:title" content="The Interviewer: unblock your stories"><meta property="og:description" content="Thoughtful questions about your actual work. Stories in your own words, saved to Buffer.">
<meta property="og:image" content="https://interviewer.lbeebe.com/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="The Interviewer. Unblock your stories. A shimmering thread of code characters on a dark green ground.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://interviewer.lbeebe.com/og.png">
${FONTS}
<script>document.documentElement.classList.add("js")</script>
<style>${FONT_FACES}${STYLE}${opts.style ?? ""}</style></head><body>${body}${FEEDBACK_WIDGET}<script>${FEEDBACK_SCRIPT}</script>${opts.script ? `<script>${opts.script}</script>` : ""}</body></html>`;
}

const NAV = `<header class="wrap nav">
  <a class="wordmark" href="/">${MARK}The Interviewer</a>
  <nav aria-label="Main"><ul><li><a href="/#how">How it works</a></li><li><a href="/#trust">Your words</a></li><li><a href="/#connect">Your data</a></li><li><a href="/privacy">Privacy</a></li></ul></nav>
  <a class="btn small" href="/connect">Connect<span class="long">&nbsp;with Buffer</span></a>
</header>`;

export function landingPage(error?: string): string {
  return shell(
    "The Interviewer · Talk about what you shipped",
    `
${NAV}
<main>
<section class="hero" aria-labelledby="heroH">
  <div class="copy">
    <h1 id="heroH" class="rise">Unblock your stories.</h1>
    <p class="lead rise" style="--i:1">Thoughtful questions about your actual work. Stories in your own words, ready to edit and schedule in Buffer.</p>
    ${error ? `<p class="alert" role="alert">${escapeHtml(error)}</p>` : ""}
    <div class="act rise" style="--i:2"><a class="btn" href="/connect"><span class="dot" aria-hidden="true"></span>Connect with Buffer</a><span class="small">Signs in with Buffer, the social media planner. <a href="https://buffer.com" target="_blank" rel="noopener">The free plan</a> works.</span></div>
  </div>
  <div class="hero-phone">
    <div class="stage" aria-hidden="true"></div>
    <figure class="reel"><video src="/demo/interviewer-4x5.mp4" poster="/demo/interviewer-poster.webp" width="1080" height="1350" autoplay muted loop playsinline preload="auto" aria-label="A 12-second demo on a phone: paste a repo, answer one question out loud, and three drafts land in Buffer."></video></figure>
  </div>
</section>

<figure class="band"><img src="/img/desk.webp" alt="A desk at night with a laptop, a microphone and a mug of coffee" width="1600" height="1067" loading="lazy" decoding="async"></figure>

<section id="how" class="strip" aria-labelledby="howH">
  <div class="fld">
    <h2 id="howH" class="rise">How it works</h2>
    <div class="card rise" data-ui style="--i:1"><span class="who">The Interviewer</span><span class="sbtn">Connect with Buffer</span></div>
    <p class="clause rise" style="--i:2">First, sign in with Buffer.</p>
  </div>
  <div class="fld">
    <div class="card rise" data-ui><span class="who">What did you work on this week?</span><div class="in">I changed the app so people can try it before they sign up.</div><span class="who">Or paste a public repo.</span></div>
    <p class="clause rise" style="--i:1">Tell it what you worked on.</p>
  </div>
  <div class="fld">
    <div class="card rise" data-ui><span class="who">The Interviewer</span><p class="q">What were you seeing before that?</p><p class="a">Like half the people who found it would hit the sign-up screen and just leave.</p></div>
    <p class="clause rise" style="--i:1">It asks what really happened. You answer out loud, or type.</p>
  </div>
  <div class="fld">
    <div class="card rise" data-ui><span class="ch">LinkedIn · Draft in Buffer</span><div class="draft"><b>Why I let people in before they sign up</b><span>Half the people who found it would hit the sign-up screen and leave. So now you try it first.</span></div></div>
    <p class="clause rise" style="--i:1">Drafts land in Buffer, in your words.</p>
  </div>
</section>

<div class="panel-wrap" id="trust">
  <section class="ink" aria-labelledby="whyH">
    <h2 id="whyH" class="rise">It won't make things up.</h2>
    <div class="blocks">
      <div class="rise"><h3>A scaffold, not a ghostwriter.</h3><p>Writing is thinking, and your words are powerful. Drafts keep your sentences and add only what a good editor would, never a new claim.</p></div>
      <div class="rise" style="--i:1"><h3>The last word stays with you.</h3><p>Take a lightly edited draft, an outline to write from yourself, or the whole transcript for your own tools.</p><a class="btn" href="/build-flow">See where AI is used</a></div>
    </div>
    <figure class="pic"><img src="/img/cafe.webp" alt="Two people talking across a small cafe table, one laughing mid-story" width="960" height="1190" loading="lazy" decoding="async"></figure>
  </section>
</div>

<section id="connect" class="wrap faq" aria-labelledby="keptH">
  <div class="side">
    <h2 id="keptH" class="rise">What happens when you connect.</h2>
    <p class="rise" style="--i:1">It reads just enough to ask good questions, and saves only what you approve.</p>
    <figure class="pic rise" style="--i:2"><img src="/img/couch.webp" alt="Someone on a couch at night with a laptop, talking and smiling" width="960" height="1190" loading="lazy" decoding="async"></figure>
  </div>
  <div class="tiles">
    <details name="faq" open><summary>What does it read in Buffer?</summary><p class="ans">Your tags and recent posts, so its questions fit. It only saves the drafts you approve, and never publishes or schedules anything.</p></details>
    <details name="faq"><summary>Do I need GitHub?</summary><p class="ans">No. A sentence about your week is enough. With a public repo, it reads the README and one week of public work. There's no GitHub sign-in.</p></details>
    <details name="faq"><summary>What happens to my interview?</summary><p class="ans">It's encrypted and deleted when you disconnect. If you leave the box ticked at setup, Ligaya can read the transcript for 14 days to improve the interviewer.</p></details>
    <details name="faq"><summary>Does it remember me?</summary><p class="ans">Only if you tick the box at setup. It remembers what you're still working through, never the transcript.</p></details>
    <details name="faq"><summary>Does it cost anything?</summary><p class="ans">No. It signs in with Buffer, and Buffer's free plan works.</p></details>
    <details name="faq"><summary>Can I run it in my own agent?</summary><p class="ans">Yes. It's a free plugin that keeps a library of your own words on your computer and picks up where you left off. <a href="https://github.com/1beebe/build-in-public/tree/main/plugin">Get the plugin</a>. If it helped you, a <a href="https://github.com/1beebe/build-in-public">star on GitHub</a> helps other builders find it.</p></details>
    <details name="faq"><summary>Where is AI used?</summary><p class="ans">Every step is laid out, model by model, on <a href="/build-flow">one page</a>. The full detail is in <a href="/privacy">the privacy note</a>.</p></details>
  </div>
</section>

<section class="close" aria-labelledby="closeH">
  <div class="wrap">
    <h2 id="closeH" class="rise" style="font-size:0;position:absolute;width:1px;height:1px;overflow:hidden">Start an interview</h2>
    <form class="rise" action="/connect" method="get"><span class="l1">This week I worked on</span><input name="work" aria-label="What you worked on: a repo link or a note" placeholder="a repo or a note" autocomplete="off"> <button class="tap" type="submit">Start</button></form>
    <p class="after rise" style="--i:1">You'll sign in with Buffer first, and land straight in the interview. Nothing is posted without you.</p>
  </div>
</section>
</main>

<footer class="foot">
  <div class="wrap">
    <div class="mark-big"><svg viewBox="3 3 26 26.2" aria-hidden="true"><path d="M16 3C8.8 3 3 8.4 3 15.1c0 3.6 1.7 6.8 4.4 9L6.2 29l5.6-2.8c1.3.4 2.7.6 4.2.6 7.2 0 13-5.4 13-12.1S23.2 3 16 3Z" fill="#f6e016"/><circle cx="16" cy="15" r="4.2" fill="#d7361f"/></svg><p class="nm" aria-hidden="true">The Interviewer</p></div>
    <div class="links"><a href="/privacy">Privacy</a><a href="/build-flow">Where AI is used</a><a href="https://github.com/1beebe/build-in-public/tree/main/plugin">The plugin</a><a href="https://github.com/1beebe/build-in-public">Star it on GitHub</a><button type="button" data-feedback-open>Feedback</button></div>
    <div class="last"><p>Built in public for Buffer Commit by Ligaya Beebe. Not made by or affiliated with Buffer.</p><a class="btn" href="/connect">Connect with Buffer</a></div>
  </div>
</footer>`,
    { style: LANDING_STYLE, script: LANDING_SCRIPT },
  );
}

// Entrances, and the demo reel holds still for people who prefer reduced motion.
const LANDING_SCRIPT = `
(() => {
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {rootMargin:"0px 0px -8% 0px"}) : null;
  document.querySelectorAll(".rise,.reel,.stage").forEach(n => io ? io.observe(n) : n.classList.add("in"));
  const reel = document.querySelector(".reel video");
  if (reel && matchMedia("(prefers-reduced-motion: reduce)").matches) { reel.removeAttribute("autoplay"); reel.pause(); reel.controls = true; }
  // The close sentence: what you type rides through Buffer sign-in and lands in setup.
  const f = document.querySelector(".close form");
  if (f) f.addEventListener("submit", (e) => { e.preventDefault(); const w = f.work.value.trim(); try { if (w) localStorage.setItem("iv.work", w.slice(0, 500)); } catch {} location.href = "/connect"; });
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
<p>Anything after you're done with it, unless you leave the transcript box ticked or ask it to remember your work (both below). The drafts you choose go to your own Buffer account. Nothing is sold, shared or used for ads.</p>
<h2 id="memory">What it remembers between interviews</h2>
<p>The setup screen has a second box, unticked by default: "Remember what I'm still working through." Tick it and, after each interview, the app keeps two short lists: up to twelve things you said you were still in the middle of (a decision, a problem, a bet), each as a short phrase, and the titles of up to thirty stories it found. It never keeps the transcript for this. The next interview can open on one of those open threads and steers away from stories you've already found. This is filed under your Buffer account rather than your browser, so it survives Disconnect and is there when you sign in again. It's encrypted at rest. Only you can see it, on the setup screen, where you can forget any item, download it all as Markdown, or forget everything at once. Untick the box and nothing new is added or read. If you don't use it for a year, it deletes itself.</p>
<h2 id="kept">Transcripts you let us keep</h2>
<p>The setup screen has a box, ticked by default, that says "Keep this transcript for 14 days so Ligaya can improve the interviewer." While it's ticked, the app keeps a copy of that interview: your repo link or note, the channels you picked, the conversation, the stories it found, the titles you saved, and timings and errors. It's encrypted at rest, only Ligaya can read it, and it deletes itself 14 days after your last activity in that interview. It never includes your Buffer sign-in or your Buffer posts. Untick the box before you start and nothing is kept. To have a kept transcript deleted sooner, send a note through the feedback button.</p>
<h2>Lightweight telemetry</h2>
<p>The app keeps anonymous daily counts of homepage visits, Buffer connection attempts and completions, interviews started, stories saved, and feedback sent. These counts contain no name, account, IP address, repo, interview text, or cross-site identifier, and expire after 120 days. There are no third-party analytics scripts.</p>
<h2>Feedback</h2>
<p>If you send feedback or a bug report, the message, optional contact detail, page path, and time are encrypted at rest and kept for up to 180 days. A one-way daily hash of your IP address is used only to limit spam and expires within two days; the IP itself is never stored.</p>
<h2>What's read</h2>
<p>From Buffer: your organization, tags, connected channels, recent Ideas and up to 20 posts from the last 30 days, only to understand who you write for, where you publish, and to avoid repeats. From GitHub: public commits, pull requests and issues in the repo you name. The example on the home page asks GitHub directly from your browser and sends nothing here.</p>
<h2>Which AI does what</h2>
<p>Each service gets only what its step needs: your week on GitHub, a summary of your recent posts, the questions and your answers. None of them ever sees your Buffer sign-in.</p>
<ul>
<li><b>Claude Sonnet 5.5</b>, by Anthropic, through MindStudio: at the end, finds the stories in the conversation and shapes each one for your channels from your words. Drafts get a light edit for flow and grammar, never a new claim; outlines use only your sentences. If you ask for the transcript instead, no model is called.</li>
<li><b>DeepSeek Flash</b>, through MindStudio: asks the next question when you type your answers.</li>
<li><b>OpenAI GPT-Live</b>: holds the live spoken conversation.</li>
</ul>
<h2>Voice</h2>
<p>A live voice conversation streams between your browser and OpenAI's voice model. This app passes your browser's connection request to OpenAI and keeps the written transcript for the harvest. The live audio isn't stored here.</p>
<h2>Contact</h2>
<p>Ligaya Beebe, L. Beebe, LLC. Not made by or affiliated with Buffer.</p>
<p><a href="/">Back to the start</a></p>
<p>${FEEDBACK_LINK}</p>
</article></main>`,
    { style: PAGE_STYLE },
  );
}

export function notFoundPage(): string {
  return shell(
    "Not found · The Interviewer",
    `
${NAV}
<main class="wrap"><article class="doc lost">
<p class="small muted">404</p>
<h1>Nothing to talk about here.</h1>
<p>This page doesn't exist, or it moved. Your interview, if you have one going, is still where you left it.</p>
<div class="lost-act"><a class="btn" href="/">Go to the start</a><a class="btn quiet" href="/app">Back to my interview</a></div>
<p>${FEEDBACK_LINK}</p>
</article></main>`,
    { style: PAGE_STYLE + `.lost{min-height:60vh;align-content:center}.lost-act{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}` },
  );
}

const APP_STYLE = `
.top{position:sticky;top:0;z-index:5;background:var(--ground);border-bottom:1px solid var(--border)}
.top .wrap{display:flex;align-items:center;gap:16px;min-height:64px}
.top .scope{color:var(--muted);font-size:.875rem;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.top form{margin:0 0 0 auto}
main.app{padding-block:clamp(24px,4vw,48px) 96px}
.screen{max-width:760px;margin:0 auto;display:grid;gap:28px}
.screen.wide{max-width:none}
.screen > header{display:grid;gap:10px}
.screen h1{font-size:clamp(1.75rem,1.4rem + 1.2vw,2.25rem);letter-spacing:-.03em;line-height:1.05}
.lede{color:var(--muted);max-width:56ch}
#msg{background:var(--raised);color:var(--warn);border-radius:14px;padding:12px 16px;font-weight:500;max-width:760px;margin:0 auto 20px}
.screen #msg{margin:0;max-width:none;animation:fadein .3s var(--ease)}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-card);padding:clamp(18px,2.4vw,28px);display:grid;gap:20px;min-width:0;align-content:start}

/* Fields */
.fieldset{display:grid;gap:8px}
.fieldset > .lbl{font-weight:500;font-size:1rem}
.fieldset > .hint{color:var(--muted);font-size:.875rem;max-width:60ch}
input[type=text],textarea,select{font:inherit;font-size:1rem;color:var(--ink);background:var(--ground);border:1px solid var(--control);border-radius:var(--r-in);padding:12px 14px;width:100%;transition:border-color .15s,background-color .15s}
input[type=text]:focus,textarea:focus,select:focus{border-color:var(--ink);background:var(--surface);outline:none;box-shadow:0 0 0 2px var(--ink)}
textarea{resize:vertical;min-height:120px;line-height:1.5}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{position:relative;display:inline-flex;align-items:center;gap:8px;border-radius:var(--r-ctl);padding:8px 14px;cursor:pointer;background:var(--ground);box-shadow:inset 0 0 0 1px var(--control);font-size:.875rem;transition:background-color .15s,box-shadow .15s,transform .15s;user-select:none}
.chip:hover{background:var(--raised)}
.chip:active{transform:scale(.97)}
.chip input{position:absolute;opacity:0;pointer-events:none}
.chip:has(input:checked){background:var(--solid);color:var(--solid-ink);box-shadow:none}
.chip:has(input:focus-visible){outline:3px solid var(--ink);outline-offset:2px}
.chip:has(input:disabled){cursor:default;opacity:.7}
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
.orb[data-s=connecting] i:first-child{animation:breathe 3.2s ease-in-out infinite,pearl 9.6s linear infinite}
.orb[data-s=thinking] b{animation:think 1s ease-in-out infinite}
.orb[data-s=listening] b{background:var(--live)}
.orb[data-s=speaking] b{transform:scale(.7)}
@keyframes pearl{0%,100%{background:var(--accent)}25%{background:color-mix(in oklab,var(--accent) 55%,hsl(150 70% 72%))}50%{background:color-mix(in oklab,var(--accent) 50%,hsl(205 75% 76%))}75%{background:color-mix(in oklab,var(--accent) 55%,hsl(285 60% 80%))}}
@keyframes breathe{0%,100%{transform:scale(.74)}50%{transform:scale(.86)}}
@keyframes think{0%,100%{transform:scale(.6)}50%{transform:scale(1)}}
.busyline{min-height:1.5em;color:var(--muted)}
/* The wait: a thread of code characters (the ripple from lbeebe.com) behind one quiet line. */
.shimmer{position:relative;height:clamp(280px,46vh,420px);border-radius:var(--r-card);background:var(--surface);overflow:hidden;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;border:1px solid var(--border)}
.shimmer canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.shimmer-line{position:relative;z-index:1;margin:0 22px;max-width:30ch;text-align:center;font-size:1.1rem;line-height:1.35;letter-spacing:-.01em;font-weight:500;
  background:color-mix(in srgb,var(--surface) 72%,transparent);border-radius:14px;padding:10px 14px;transition:opacity .6s var(--ease),transform .6s var(--ease),filter .6s var(--ease)}
.shimmer-line.out{opacity:0;transform:translateY(6px);filter:blur(3px)}
.shimmer-line .q{display:block;font-size:.8rem;color:var(--muted);margin-bottom:2px}
@media (prefers-reduced-motion:reduce){.shimmer-line{transition:none}}
.busyline span,#voiceState span{display:inline-block;animation:fadein .5s var(--ease)}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
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
.convo .head p{color:var(--muted);font-size:.875rem;min-height:1.4em}
.log{list-style:none;margin:0;padding:4px 2px;display:flex;flex-direction:column;gap:18px;max-height:min(52vh,560px);overflow:auto}
.log:empty{display:none}
.log li{display:grid;gap:4px;max-width:92%}
.log li p{white-space:pre-wrap;overflow-wrap:anywhere}
.log .who{font-size:.875rem;color:var(--muted)}
.log .them p{font-size:clamp(1.15rem,1.05rem + .4vw,1.4rem);line-height:1.36;letter-spacing:-.015em;font-weight:500}
.log .you{align-self:flex-end;background:var(--raised);border-radius:20px 20px 6px 20px;padding:12px 16px}
.log .new{animation:fadein .45s var(--ease)}
.log .typing p{color:var(--muted);font-weight:400}
/* Thinking: one faint line of code characters in the shimmer's pearl colors, where the question will land. */
.log .ghost-line{font:400 1rem/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;white-space:nowrap;overflow:hidden;max-width:100%;user-select:none;-webkit-mask-image:linear-gradient(90deg,#000 75%,transparent);mask-image:linear-gradient(90deg,#000 75%,transparent)}
.saylbl{display:block;font-size:.875rem;color:var(--muted);margin-bottom:6px}
.live{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:var(--raised);border-radius:var(--r-card);padding:12px 12px 12px 12px}
.live .state{color:var(--muted);font-size:.875rem;flex:1;min-width:10em}
#liveBtn{min-width:11em}
#liveBtn.on{background:var(--ink);color:var(--ground)}
#liveBtn.on .rec{background:var(--accent);border-radius:2px}
.composer{display:grid;gap:10px}
.composer textarea{min-height:88px;overflow-y:auto}
.done-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding-top:18px;border-top:1px solid var(--border)}
.topics{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
.topics:empty{display:none}
button.chip{font:inherit;font-size:.875rem;border:0;color:var(--ink);white-space:nowrap;max-width:22em;overflow:hidden;text-overflow:ellipsis;flex:none}
button.chip.on{background:var(--solid);color:var(--solid-ink);box-shadow:none}
/* Dark scheme: the ink fill is nearly the page, so a checked chip looks quieter than the outlined one. */
@media (prefers-color-scheme:dark){
  .chip:has(input:checked),button.chip.on{background:#5f9b79;color:#0d2a1c;box-shadow:inset 0 0 0 2px #f6f6f3}
  .chip:has(input:checked)::before,button.chip.on::before{content:"";width:14px;height:14px;flex:none;background:center/14px 14px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M3.2 8.2 6.3 11.3 12.8 4.7' stroke='%230d2a1c' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}
}

/* The work panel */
.src{gap:14px}
.src .kind{color:var(--muted);font-size:.875rem}
.src h3{font-size:1.3rem;line-height:1.2;letter-spacing:-.02em;margin:0;overflow-wrap:anywhere}
.src h3 a{text-decoration:none}
.src h3 a:hover{text-decoration:underline}
.meta{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.875rem;color:var(--muted)}
.plus{color:var(--add-fg)} .minus{color:var(--del-fg)}
.src .body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:1rem;max-height:14em;overflow:auto;color:var(--muted)}
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
.draft .prompts{min-height:84px;font-size:1rem}
.draft textarea{resize:vertical}
.pick{justify-self:start;display:inline-flex;align-items:center;gap:10px;font-weight:600;cursor:pointer;min-height:44px}
.pick input{width:22px;height:22px;margin:0;accent-color:var(--ink);cursor:pointer}
.draft .same{font-size:.875rem;color:var(--muted);margin:0}
.draft .fold > summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;min-height:44px;margin:0}
.draft .fold > summary::-webkit-details-marker{display:none}
.draft .fold > summary::after{content:"";width:7px;height:7px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);margin-left:4px}
.draft .fold[open] > summary::after{transform:rotate(225deg) translateY(-1px)}
.draft .fold[open] > summary{margin-bottom:6px}
.app-foot{display:flex;justify-content:center;margin-top:28px}
/* Until the first screen renders, show nothing below the header (the footer link used to flash alone). */
main.app:not(:has(.screen:not([hidden]))) .app-foot{display:none}
/* Sign-in failure: one card, centered in the space under the header, not a few lines stuck at the top. */
main.app:has(#boot:not([hidden])){display:flex;flex-direction:column;padding-block:0;min-height:calc(100vh - 64px);min-height:calc(100dvh - 64px)}
main.app:has(#boot:not([hidden])) .app-foot{display:none}
#boot{flex:1;width:100%;max-width:440px;align-content:center;padding-block:28px}
#boot .panel{gap:14px;padding:clamp(22px,4vw,28px)}
#boot h1{font-size:clamp(1.65rem,1.35rem + .8vw,2rem)}
#boot .lede{max-width:none}
#boot .boot-actions{display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;margin-top:6px}
#boot .boot-actions .btn.text{min-height:48px}
.steps{margin:12px 0 0;padding-left:1.2em;color:var(--muted);display:grid;gap:4px;max-width:56ch}
.steps b{color:var(--ink);font-weight:600}
.take-done{border-top:1px solid var(--border);padding-top:18px;display:grid;gap:8px;width:100%}.take-done p{max-width:62ch;margin:0}
.draft .alts{font-size:.875rem;color:var(--muted);margin:0}
.draft .art-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.few{display:grid;gap:14px}
.few p{margin:0;max-width:62ch;font-size:1.05rem}
.log .wrap-go{margin-top:10px}
#harvestBtn.nudge{background:var(--accent);color:var(--accent-ink);box-shadow:none;animation:nudge 1.6s ease-in-out 3}
@keyframes nudge{50%{transform:scale(1.04)}}
@media (prefers-reduced-motion:reduce){#harvestBtn.nudge{animation:none}}
body:has(main.app) .feedback-open{display:none}
.draft .shape{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}
.draft .fmt{font-weight:600;font-size:1rem}
.draft .why{color:var(--muted);font-size:.875rem;margin:0;max-width:62ch}
.draft .flag{font-size:.875rem;color:var(--muted);margin:0;padding-left:10px;box-shadow:inset 2px 0 0 var(--control)}
.savebar #showMore{flex:1 0 100%;order:-1}
.handback{display:grid;gap:8px}
.handback .lbl{font-size:.875rem;font-weight:600;color:var(--muted)}
.note-more summary{cursor:pointer;margin-top:6px}
.keep{display:flex;gap:10px;align-items:flex-start;font-size:.875rem;color:var(--muted);max-width:60ch;cursor:pointer}
.keep input{margin-top:4px;width:18px;height:18px;flex:none;accent-color:var(--ink)}
.memory{font-size:.875rem;color:var(--muted);max-width:60ch}
.memory summary{cursor:pointer;min-height:32px}
.memory ul{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.memory li{display:flex;gap:8px;align-items:baseline;justify-content:space-between}
.memory li span{color:var(--ink)}
.transcript{min-height:320px;font-size:1rem}
.savebar{position:sticky;bottom:16px;z-index:4;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;background:var(--solid);color:var(--solid-ink);border-radius:var(--r-ctl);padding:8px 8px 8px 22px;box-shadow:0 18px 36px -18px rgba(0,0,0,.5)}
.savebar .btn.quiet{color:var(--solid-ink);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--solid-ink) 40%,transparent)}
.savebar .btn.quiet:hover{background:color-mix(in srgb,var(--solid-ink) 12%,transparent)}
.savebar .count{font-size:1rem}

/* Done */
/* Done: the drafts themselves, dealt into view like finished cards, with one pass of the shimmer's pearl light across them. */
#done .panel{justify-items:center;text-align:center;gap:22px;padding-block:36px}
.deck{position:relative;width:100%;height:240px;margin-bottom:4px}
.deck .card{position:absolute;left:50%;top:14px;width:min(290px,64%);height:196px;box-sizing:border-box;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-card);padding:16px 18px;display:grid;grid-template-rows:auto 1fr;gap:8px;overflow:hidden;
  box-shadow:0 24px 40px -26px rgba(0,0,0,.45);transform:translate(calc(-50% + var(--x) + var(--dx,0px)),var(--y)) rotate(var(--r));animation:deal .7s var(--ease) both;animation-delay:calc(var(--d) * 130ms)}
.deck{touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}
.deck .card.dealt{animation:none;transition:transform .45s var(--ease),opacity .3s}
.deck .card.dealt.drag{transition:none}
.deck-count{margin:-14px 0 0;font-size:.8rem;color:var(--muted);min-height:1em;font-variant-numeric:tabular-nums}
.deck .card .ch{display:flex;justify-content:space-between;font-size:.8rem;font-weight:600;letter-spacing:.01em}
.deck .card .ch span:last-child{color:var(--muted);font-weight:400}
.deck .card p{margin:0;font-size:.92rem;line-height:1.4;color:var(--ink);overflow:hidden;-webkit-mask-image:linear-gradient(#000 60%,transparent);mask-image:linear-gradient(#000 60%,transparent)}
/* The shimmer, understated: a short arc of pearl light runs once around the edge of the card that comes to the front. */
@property --arc{syntax:"<angle>";inherits:false;initial-value:0deg}
.deck .card::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;border-radius:inherit;padding:2px;background:conic-gradient(from var(--arc),transparent 0deg,hsl(150 70% 62%) 40deg,hsl(205 80% 66%) 75deg,hsl(285 65% 72%) 105deg,transparent 140deg,transparent 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.deck .card.glint::after{animation:edgerun 1.8s cubic-bezier(.45,.05,.35,1) both;animation-delay:var(--gd,0s)}
/* The front card keeps a faint pearl rim that drifts slowly through the shimmer's colors. */
.deck .card.front.dealt{animation:rim 10s linear infinite}
@keyframes rim{0%,100%{box-shadow:0 24px 40px -26px rgba(0,0,0,.45),0 0 0 1.5px hsl(150 60% 70% / .45)}33%{box-shadow:0 24px 40px -26px rgba(0,0,0,.45),0 0 0 1.5px hsl(205 65% 72% / .45)}66%{box-shadow:0 24px 40px -26px rgba(0,0,0,.45),0 0 0 1.5px hsl(285 50% 76% / .45)}}
@keyframes deal{from{opacity:0;transform:translate(-50%,70px) rotate(0) scale(.92)}}
@keyframes edgerun{0%{opacity:0;--arc:-40deg}12%{opacity:1}80%{opacity:1}100%{opacity:0;--arc:360deg}}
.tally{display:flex;gap:clamp(28px,8vw,64px);justify-content:center;margin:0}
.tally div{display:grid;gap:2px}
.tally b{font-size:clamp(2.4rem,7vw,3.4rem);font-weight:600;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.tally span{font-size:.875rem;color:var(--muted)}
#done h1{font-size:clamp(1.9rem,5vw,2.6rem)}
.open-drafts .btn{min-height:56px;padding-inline:32px;font-size:1.05rem}
.next-week{margin:0;color:var(--muted)}
.next-week .btn{padding-inline:6px;min-height:40px}
.done-foot{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 8px;font-size:.875rem;color:var(--muted);border-top:1px solid var(--border);padding-top:14px;width:100%}
.done-foot .btn{min-height:40px;padding-inline:8px;font-size:.875rem}
.done-foot details{width:100%;max-width:52ch;margin-inline:auto}
.done-foot summary{cursor:pointer;min-height:32px;list-style:none}
.done-foot summary::-webkit-details-marker{display:none}
.done-foot details p{margin:4px 0 8px;text-align:center}
#done h1,#done .tally{animation:rise .6s var(--ease) .55s both}
#done .open-drafts{animation:fadein .5s var(--ease) .8s both}
#done .next-week,#done .done-foot,#done #ideaNote,#done #articleDone{animation:fadein .6s var(--ease) 1.2s both}
@media (prefers-reduced-motion:reduce){#done *,.deck .card,.deck .card::after{animation:none!important}}
@media (max-width:640px){
  .top .wrap{min-height:56px;gap:8px}
  .top .scope{display:none}
  .top .wordmark{font-size:1rem;gap:7px}
  .top .mark{width:26px;height:26px}
  .top .btn.text{min-height:44px;padding-inline:8px;font-size:.875rem}
  main.app{padding-block:16px calc(72px + env(safe-area-inset-bottom))}
  main.app:has(#boot:not([hidden])){min-height:calc(100vh - 56px);min-height:calc(100dvh - 56px - env(safe-area-inset-bottom))}
  #boot{padding-block:20px}
  #boot .boot-actions{display:grid;justify-items:stretch;gap:2px}
  #boot .boot-actions .btn{width:100%}
  #boot .boot-actions .btn.text{width:auto;justify-self:center}
  .screen{gap:16px}
  .panel{padding:16px;border-radius:var(--r-card);gap:16px}
  .convo .head{gap:12px}
  .convo .head .orb{width:52px;height:52px}
  .log{max-height:none;overflow:visible;gap:16px}
  .log li{max-width:96%}
  .log .you{padding:10px 14px}
  .topics{margin-inline:-2px;padding-bottom:8px}
  .live{display:grid;grid-template-columns:1fr;padding:10px}
  #liveBtn{width:100%;min-width:0}
  .live .state{min-width:0;text-align:center}
  .composer textarea{min-height:96px;resize:none}
  .composer .row{display:grid;grid-template-columns:auto 1fr}
  .composer .row .btn.text{justify-self:start}
  .done-row{display:grid;gap:10px}
  .done-row .btn{width:100%}
  .draft .title{font-size:1.15rem}
  .draft .text{min-height:132px}
  .savebar{bottom:calc(8px + env(safe-area-inset-bottom));border-radius:var(--r-card);padding:12px 14px}
  .savebar{padding:10px;gap:8px}
  .savebar .count{width:100%;font-size:.875rem;padding-left:6px}
  .savebar .row{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .savebar .row .btn{width:100%;padding-inline:10px}
  .savebar #saveAll{grid-column:1/-1;order:-1}
  .savebar .btn.quiet{min-height:38px;font-size:.875rem;box-shadow:none;text-decoration:underline;text-underline-offset:.15em}
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
<section id="boot" class="screen" hidden>
  <div class="panel">
    <h1>The interview didn't open</h1>
    <p class="lede" id="bootText" role="alert">Something went wrong on our side. Try again in a moment.</p>
    <div class="boot-actions">
      <button id="retryBoot" class="btn" type="button">Try again</button>
      <button class="btn text" type="button" data-feedback-open>${FEEDBACK_ICON}Feedback or bug</button>
    </div>
  </div>
</section>
<noscript>
<section class="screen"><div class="panel"><header><h1>JavaScript is off</h1><p class="lede">The interview needs JavaScript to open. Turn it on and reload this page.</p></header></div></section>
</noscript>

<section id="setup" class="screen" hidden>
  <header><h1>What did you work on this week?</h1><p class="lede" id="welcomeBack" hidden></p><ul class="steps"><li><b>No GitHub needed.</b> A sentence about your work is enough.</li><li>Have a public repo? Paste it and I'll read this week's work.</li><li id="howLine">Talk for 5-10 minutes, then pick the stories to save to Buffer.</li></ul></header>
  <div class="panel">
    <label class="fieldset" id="orgWrap" hidden><span class="lbl">Buffer organization</span><select id="org"></select></label>
    <label class="fieldset"><span class="lbl">A quick note or a repo link</span><span class="hint">Up to 500 characters.</span><textarea id="work" maxlength="500" placeholder="I rebuilt the onboarding for… or github.com/you/project"></textarea></label>
    <div class="fieldset" id="kindWrap" hidden><span class="lbl">What are you making?</span><span class="hint" id="kindHint"></span><div class="chips" role="radiogroup" aria-label="What are you making?"><label class="chip"><input type="radio" name="kind" value="posts" checked><span>Posts about my week</span></label><label class="chip"><input type="radio" name="kind" value="long"><span>A longer piece, like a newsletter or article</span></label><label class="chip"><input type="radio" name="kind" value="both"><span>Both: a longer piece plus a few short posts</span></label></div></div>
    <div class="fieldset" id="chanWrap" hidden><span class="lbl" id="chanLbl">Write drafts for</span><span class="hint" id="chanHint"></span><div class="chips" id="chans" aria-label="Channels to shape stories for"></div></div>
    <label class="keep"><input type="checkbox" id="keepLog" checked><span>Keep this transcript 14 days to help Ligaya improve the app. Only she sees it. <a href="/privacy#kept" target="_blank" rel="noopener">What's kept</a></span></label>
    <label class="keep"><input type="checkbox" id="keepMemory"><span>Remember open threads so next time picks up where this one stopped. <a href="/privacy#memory" target="_blank" rel="noopener">What's remembered</a></span></label>
    <details class="memory" id="memWrap" hidden><summary>What I remember about your work (<span id="memCount"></span>)</summary><ul id="memList"></ul><div class="row"><button class="btn text" type="button" id="memExport">Download as Markdown</button><button class="btn text" type="button" id="memForgetAll">Forget everything</button></div></details>
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
  <div class="done-row">
    <div class="handback"><span class="lbl">When you're done, hand me back</span><div class="chips" id="modes" role="radiogroup" aria-label="What to hand back">
      <label class="chip"><input type="radio" name="mode" value="draft"><span>Drafts from my words, lightly edited</span></label>
      <label class="chip"><input type="radio" name="mode" value="outline"><span>An outline. I'll write it</span></label>
      <label class="chip"><input type="radio" name="mode" value="transcript"><span>Just the transcript</span></label>
    </div></div>
    <button id="harvestBtn" class="btn quiet" type="button">I'm done. Find my stories</button>
    <p class="busyline" id="harvestBusy" aria-live="polite"></p>
  </div>
</div>
</section>

<section id="waiting" class="screen" hidden aria-labelledby="waitH">
  <header><h1 id="waitH">Finding your stories</h1></header>
  <div class="shimmer" id="shimmer"><canvas aria-hidden="true"></canvas><p class="shimmer-line" id="shimmerLine" aria-live="polite"></p></div>
</section>
<section id="review" class="screen wide" hidden>
  <header><h1 id="reviewHead">Stories from your interview</h1><p class="lede" id="reviewLede"></p></header>
  <div class="panel few" id="fewNote" hidden><p id="fewText"></p><div class="row"><button id="moreBtn" class="btn quiet" type="button">Keep talking to find more</button></div></div>
  <div id="drafts" class="drafts"></div>
  <div class="savebar"><button id="showMore" class="btn quiet small" type="button" hidden></button><span class="count" id="saveCount"></span><div class="row"><button id="backTalk" class="btn quiet small" type="button">Keep talking</button><button id="getTranscript" class="btn quiet small" type="button">Transcript</button><button id="saveAll" class="btn" type="button">Save to Buffer</button></div></div>
</section>

<section id="transcript" class="screen" hidden>
  <header><h1>Your transcript</h1><p class="lede">The whole conversation, word for word. Copy it or download it and take it wherever you write.</p></header>
  <div class="panel">
    <textarea id="transcriptText" class="transcript" readonly aria-label="Interview transcript"></textarea>
    <div class="row"><button id="copyTranscript" class="btn" type="button">Copy</button><button id="downloadTranscript" class="btn quiet" type="button">Download .md</button><button id="transcriptBack" class="btn quiet" type="button">Back to the conversation</button></div>
  </div>
</section>

<section id="done" class="screen" hidden>
  <div class="panel">
    <div class="deck" id="deck" aria-hidden="true"></div><p class="deck-count" id="deckCount" aria-hidden="true"></p>
    <h1>Your drafts are in Buffer.</h1>
    <div class="tally" id="tally"></div>
    <div class="row open-drafts"><a class="btn" href="https://publish.buffer.com/schedule?tab=drafts" target="_blank" rel="noopener">Open my drafts in Buffer</a></div>
    <p class="muted" id="ideaNote" style="max-width:52ch" hidden></p>
    <div id="articleDone" hidden><p class="muted" style="max-width:52ch">Your article is kept in Buffer under Create, then Ideas. Copy it into Substack or LinkedIn when you're ready.</p><div class="row" style="justify-content:center"><button class="btn quiet" type="button" id="copyArticle">Copy the article</button><button class="btn text" type="button" id="downloadArticle">Download it</button></div></div>
    <p class="next-week">See you next week. <button id="again" class="btn text" type="button">Or start another now</button></p>
    <div class="done-foot"><a class="btn text" href="https://github.com/1beebe/build-in-public/tree/main/plugin" target="_blank" rel="noopener">${PLUGIN_ICON}Get the plugin for your own agent</a><a class="btn text" href="https://github.com/1beebe/build-in-public" target="_blank" rel="noopener">${STAR_ICON}Star it on GitHub</a>
      <details><summary class="btn text"><svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="1.5" aria-hidden="true"><path d="M12 16.01L12.01 15.9989" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 19.4V4.6C7 4.26863 7.26863 4 7.6 4H16.4C16.7314 4 17 4.26863 17 4.6V19.4C17 19.7314 16.7314 20 16.4 20H7.6C7.26863 20 7 19.7314 7 19.4Z" stroke="currentColor"/></svg>Finding them on your phone</summary><p>In Buffer's app, tap the menu at the top left, then <b>Channels</b>, <b>All Channels</b>, and <b>Drafts</b> at the bottom.</p></details></div>
  </div>
</section>
<div class="app-foot"><button class="btn text" type="button" data-feedback-open>${FEEDBACK_ICON}Feedback or bug</button></div>
</main>
<script>
(function () {
  function shown() { return document.querySelector("main.app .screen:not(#boot):not([hidden])"); }
  function showBoot(message) {
    if (shown()) return;
    var boot = document.getElementById("boot"), text = document.getElementById("bootText");
    if (boot) boot.hidden = false;
    if (text) text.textContent = message || "The page couldn't open your interview. Reload to try again.";
  }
  window.addEventListener("error", function (e) {
    var msg = (e && e.message) || "";
    if (msg.indexOf("ResizeObserver") === 0) return;
    if (e && e.filename && e.filename.indexOf(location.origin) !== 0) return;
    showBoot("The page ran into a problem. Try again.");
  });
  var retry = document.getElementById("retryBoot");
  if (retry) retry.addEventListener("click", function () {
    if (typeof window.__interviewRetry === "function") window.__interviewRetry();
    else location.reload();
  });
})();
</script>`,
    { style: APP_STYLE, script: APP_SCRIPT },
  );
}

const APP_SCRIPT = `
const $ = (id) => document.getElementById(id);
let state = null, shown = null, busy = false;
const SCREENS = ["setup","talk","waiting","review","transcript","done"];
// /app?as=guest: the owner previews setup the way everyone else sees it (no long-form choice).
const AS_GUEST = new URLSearchParams(location.search).get("as") === "guest";
function show(id){
  $("boot").hidden = true;
  for (const s of SCREENS) $(s).hidden = s !== id;
  $("scope").textContent = state && state.repo ? state.repo : "";
}
// Errors show next to the control that was just used, so on a phone they land where the person is looking.
let lastAction = null;
document.addEventListener("click", (e) => { const b = e.target instanceof Element && e.target.closest("button"); if (b) lastAction = b; }, true);
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target instanceof Element && e.target.matches("textarea,input")) lastAction = e.target; }, true);
function err(m){
  const box = $("msg"); box.textContent = m || ""; box.hidden = !m; if (!m) return;
  const spot = lastAction && lastAction.isConnected && lastAction.closest(".screen:not([hidden])") && lastAction.closest(".savebar,.live,.composer .row,.done-row,.row,.panel");
  if (spot) spot.before(box); else document.querySelector("main.app").prepend(box);
  box.scrollIntoView({block:"nearest", behavior:"smooth"});
}
function showFault(m){
  for (const s of SCREENS) $(s).hidden = true;
  $("boot").hidden = false;
  $("bootText").textContent = m || "Something went wrong. Try again.";
  err(""); window.scrollTo({top:0});
}
function el(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
async function api(path, body){
  let res;
  try { res = await fetch(path, body ? {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)} : {}); }
  catch { throw new Error(navigator.onLine === false ? "You're offline. Reconnect and try again. Nothing you've said is lost." : "Couldn't reach The Interviewer. Check your connection and try again."); }
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
  try { const w = localStorage.getItem("iv.work"); if (w) { if (!$("work").value) $("work").value = w; localStorage.removeItem("iv.work"); } } catch {}
  const chans = state.channels || [], picked = new Set(state.targets || []);
  const seen = new Set(); $("chans").innerHTML = "";
  for (const c of chans) {
    if (seen.has(c.service)) continue; seen.add(c.service);
    const l = el("label", "chip"), i = el("input"); i.type = "checkbox"; i.value = c.service; i.checked = picked.has(c.service);
    l.append(i, el("span", "", c.label)); l.title = c.name; $("chans").append(l);
  }
  $("chanWrap").hidden = !seen.size;
  $("keepLog").checked = state.keepLog !== false;
  const back = (state.memory || {}).welcome || "";
  $("welcomeBack").textContent = back; $("welcomeBack").hidden = !back;
  drawMemory();
  $("kindWrap").hidden = !state.longformOffered || AS_GUEST;
  document.querySelector('input[name=kind][value=' + (state.longform ? (state.alsoShort ? "both" : "long") : "posts") + ']').checked = true;
  $("kindHint").textContent = seen.has("substack") ? "You post on Substack, so a longer piece might fit." : "";
  kindChanged();
  // One channel: nothing to choose, so just say where the drafts go. Several: plain instruction, most-used ones pre-ticked.
  const only = seen.size === 1 ? chans.find(c => seen.has(c.service)) : null;
  if (only) $("chans").querySelector("input").checked = true;
  $("chans").hidden = !!only;
  $("chanLbl").textContent = only ? "Drafts will be written for " + only.label : "Write drafts for";
  $("chanHint").textContent = only ? "That's the channel you have connected in Buffer." : (state.targets || []).length ? "Tap each channel you want drafts for. The ones you post on most are already picked." : "Tap each channel you want drafts for.";
  show("setup");
}

function kindChosen(){ return $("kindWrap").hidden ? "short" : ({posts:"short", long:"long", both:"both"})[document.querySelector("input[name=kind]:checked").value] || "short"; }
function kindChanged(){
  const k = kindChosen();
  $("howLine").textContent = k === "long"
    ? "Talk for 5-10 minutes. You get the piece to copy out, plus short posts saved to Buffer."
    : k === "both"
      ? "Talk for 5-10 minutes. You get the piece, plus short posts for the side stories, saved to Buffer."
      : "Talk for 5-10 minutes, then pick the stories to save to Buffer.";
}
document.querySelectorAll("input[name=kind]").forEach(i => i.addEventListener("change", kindChanged));

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
// Keep the newest line in view while they talk, unless they've scrolled up to reread.
let followAt = 0;
function viewH(){ return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
function isFollowing(log){
  if (log.hidden || !log.lastElementChild) return true;
  if (log.scrollHeight > log.clientHeight + 2) return log.scrollHeight - log.scrollTop - log.clientHeight < 120;
  return log.getBoundingClientRect().bottom < viewH() + 160;
}
function follow(log){
  if (log.scrollHeight > log.clientHeight + 2) { log.scrollTop = log.scrollHeight; return; }
  const last = log.lastElementChild; if (!last) return;
  const over = last.getBoundingClientRect().bottom - (viewH() - 24);
  if (over > 0) { const now = Date.now(); window.scrollBy({top: over, behavior: now - followAt < 400 ? "auto" : "smooth"}); followAt = now; }
}
// The typing box grows with what they write, up to about 40% of what's visible, so the top of the answer stays readable.
function fitSay(){
  const t = $("say"); t.style.height = "auto";
  const max = Math.max(120, Math.round(viewH() * 0.4));
  t.style.height = Math.min(t.scrollHeight + 2, max) + "px";
}
// The interviewer thinking: a sentence-wide line of glyphs drifting through the pearl colors.
const GLYPHS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const ghost = (() => {
  const li = el("li", "them typing ghost"), p = el("p", "ghost-line"), N = 30, spans = [];
  p.setAttribute("role", "status"); p.setAttribute("aria-label", "The Interviewer is thinking");
  for (let i = 0; i < N; i++) { const sp = el("span", "", glyph()); sp.setAttribute("aria-hidden", "true"); spans.push(sp); }
  p.append(...spans); li.append(el("span", "who", "The Interviewer"), p);
  let timer = 0, t0 = 0, miss = 0;
  function paint(){
    const iris = getComputedStyle(document.documentElement).getPropertyValue("--code-iris").split(",").map(Number), t = (performance.now() - t0) / 1000;
    spans.forEach((sp, i) => {
      if (!still && Math.random() < 0.3) sp.textContent = glyph();
      const hue = 150 + 90 * (1 + Math.sin(i * 0.16 + t * 0.7)), a = still ? 0.35 : 0.14 + 0.42 * (0.5 + 0.5 * Math.sin(i * 0.32 - t * 2.4));
      sp.style.color = "hsl(" + hue.toFixed(0) + " " + (iris[0] || 62) + "% " + (iris[1] || 44) + "% / " + a.toFixed(2) + ")";
    });
  }
  function tick(){ if (!li.isConnected) { if (++miss > 3) { clearInterval(timer); timer = 0; } return; } miss = 0; paint(); }
  return () => { if (!timer) { t0 = performance.now(); miss = 0; paint(); if (!still) timer = setInterval(tick, 90); } return li; };
})();
// When the question lands, the glyphs resolve into its words, left to right.
function decode(p, text){
  if (still) return;
  const n = text.length, dur = Math.min(800, 260 + n * 5), t0 = performance.now();
  const step = (now) => {
    if (!p.isConnected) return;
    const k = Math.min(n, Math.floor((now - t0) / dur * n)); let out = text.slice(0, k);
    for (let i = k; i < Math.min(n, k + 8); i++) out += /\s/.test(text[i]) ? text[i] : glyph();
    p.textContent = out; if (k < n) requestAnimationFrame(step); else p.textContent = text;
  };
  requestAnimationFrame(step);
}
let ghostShown = false;
function renderTalk(){
  const about = currentAbout();
  $("topics").innerHTML = "";
  (state.questions||[]).forEach((q, k) => {
    const b = el("button", "chip" + (k === shown ? " on" : ""), q.source.replace(/^(Merged PR|Closed issue|Commit): /, ""));
    b.type = "button"; b.title = q.source; b.onclick = () => { renderSource(k); markTopics(); };
    $("topics").append(b);
  });
  const log = $("log"), following = isFollowing(log); log.innerHTML = "";
  const turns = state.turns || [];
  turns.forEach((t, k) => {
    const li = el("li", (t.who === "you" ? "you" : "them") + (k >= drawn ? " new" : ""));
    const tp = el("p", "", t.text);
    li.append(el("span", "who", t.who === "you" ? "You" : "The Interviewer"), tp);
    if (ghostShown && !busy && t.who !== "you" && k >= drawn && k === turns.length - 1) decode(tp, t.text);
    // The opening quotes a short piece of their note; let them read it all.
    if (k === 0 && state.noRepo && state.weekNote && t.text.includes("…")) {
      const more = el("details", "note-more"), sum = el("summary", "small muted", "See more");
      more.append(sum, el("p", "small", state.weekNote)); li.append(more);
    }
    log.append(li);
  });
  drawn = turns.length;
  // The interviewer wrapped up (or they asked for a draft): put the next step right there.
  const wrap = !busy && turns.length && turns[turns.length - 1].wrapUp;
  $("harvestBtn").classList.toggle("nudge", !!wrap);
  if (wrap) {
    const go = el("button", "btn small wrap-go", HARVEST_LABEL); go.type = "button";
    go.onclick = () => { go.disabled = true; $("harvestBtn").click(); };
    log.lastChild.append(go);
  }
  if (busy) log.append(ghost());
  ghostShown = busy;
  $("liveBox").hidden = !state.live || !window.RTCPeerConnection;
  if (!liveOn()) { orbState(busy ? "thinking" : "idle"); if (!$("liveBox").hidden && !$("liveState").textContent) setLive(""); }
  show("talk"); if (following) follow(log);
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
  state.turns = [...(state.turns||[]), {who:"you", text}]; $("say").value = ""; fitSay(); renderTalk();
  try { state = await api("/api/say", {text}); busy = false; renderTalk(); }
  catch(e){ busy = false; state.turns.pop(); drawn = state.turns.length; $("say").value = text; fitSay(); renderTalk(); err(e.message); }
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
$("say").addEventListener("input", fitSay);
$("say").addEventListener("focus", () => { if (matchMedia("(max-width:640px)").matches) setTimeout(() => $("say").closest(".composer").scrollIntoView({block:"end", behavior:"smooth"}), 300); });
if (window.visualViewport) window.visualViewport.addEventListener("resize", () => { if (document.activeElement === $("say")) fitSay(); });
$("say").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); say(); } });

// GPT-Live voice. The transcript is synced back so the harvest can read it.
let pc = null, dc = null, mic = null, liveTurns = null, liveAbout = null, liveTimer = null, syncTimer = null;
const LIVE_LOOK = {"Connecting…":"connecting", "Connected":"connecting", "Listening":"listening", "Thinking":"thinking", "Speaking":"speaking", "Your turn":"listening"};
const LIVE_SAY = {"Connected":"Connected. It's about to ask.", "Your turn":"Your turn. Just talk."};
function setLive(s){
  $("liveState").textContent = s ? (LIVE_SAY[s] || s) : "Talk it through out loud. You can type below too.";
  orbState(s ? (LIVE_LOOK[s] || "idle") : "idle");
}
function liveOn(){ return pc && pc.connectionState !== "closed"; }
function drawLive(){ state.turns = liveTurns.filter(t => t.text.trim()).map(t => ({who:t.who, text:t.text, about:t.about})); renderTalk(); }
function syncLive(now){
  clearTimeout(syncTimer);
  const send = () => api("/api/voice-turns", {turns: state.turns}).then(nearlyFull).catch(() => {});
  if (now) return send();
  syncTimer = setTimeout(send, 1500);
}
// When the transcript is nearly full, ask the voice to wrap up once, so nothing said after is lost.
// The backslashes are doubled on purpose: this script is inside a template literal, and a single \" becomes a raw quote that makes the whole page script invalid.
const WRAP_UP = "The interview is almost full. Ask one last short question, say it's the last one, and after their answer thank them and tell them to tap \\"I'm done. Find my stories\\".";
function nearlyFull(r){
  if (!r || typeof r.answersLeft !== "number" || r.answersLeft > 2 || !gl || gl.wrapSent || !dc || dc.readyState !== "open") return;
  gl.wrapSent = true;
  dc.send(JSON.stringify({type:"session.instructions.append", event_id:"wrap_" + Date.now(), delegation_id:null, content:WRAP_UP}));
}
// Keep the phone awake while voice is live: a sleeping screen cuts the mic and loses the answer.
let wake = null;
async function holdWake(){ try { if ("wakeLock" in navigator && !wake && document.visibilityState === "visible") { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } } catch {} }
function dropWake(){ if (wake) { wake.release().catch(() => {}); wake = null; } }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && liveOn()) holdWake(); });
function liveLabel(on){ $("liveBtn").querySelector(".lt").textContent = on ? "Pause" : "Start talking"; $("liveBtn").classList.toggle("on", on); }
async function stopLive(){
  clearTimeout(liveTimer); dropWake();
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
    // The model sometimes hands off a "let me think" task to the app and waits for an answer.
    // There's nothing to look up, so answer at once and tell it to carry on, or it goes silent.
    case "session.delegation.created":
      if (ev.delegation && ev.delegation.target === "client" && dc && dc.readyState === "open") dc.send(JSON.stringify({type:"session.commentary.append", event_id:"deleg_" + Date.now(), delegation_id:ev.delegation.id, content:"Nothing to look up. Don't mention thinking or checking. Respond to what they just said and ask one short question now."}));
      break;
    case "session.closed": if (liveOn()) stopLive(); break;
    case "error": console.warn("gpt-live", ev.error || ev); break;
  }
}
async function startGptLive(){
  err(""); $("liveBtn").disabled = true; setLive("Connecting…");
  try {
    mic = await navigator.mediaDevices.getUserMedia({audio:true});
    holdWake();
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
    liveTimer = setTimeout(() => { stopLive(); err("Paused after 20 minutes. Start talking again to keep going, or find your stories."); }, 20 * 60 * 1000);
  } catch (e) {
    stopLive();
    const name = e && e.name, noMic = !navigator.mediaDevices || name === "NotFoundError" || name === "OverconstrainedError";
    err(name === "NotAllowedError" || name === "SecurityError" || e.message === "Permission denied"
      ? "The browser didn't allow the microphone. Allow it in your browser settings, or type your answers below."
      : noMic ? "I couldn't find a microphone on this device. You can type your answers below." : e.message);
  }
  finally { $("liveBtn").disabled = false; }
}

// Harvest and review
// What they want back: drafts from their words, an outline, or the raw transcript.
function handBack(){ const c = document.querySelector('#modes input:checked'); return c ? c.value : "draft"; }
(function(){ let m = "draft"; try { m = localStorage.getItem("handBack") || "draft"; } catch {} const i = document.querySelector('#modes input[value="' + m + '"]') || document.querySelector('#modes input'); i.checked = true; })();
$("modes").onchange = () => { try { localStorage.setItem("handBack", handBack()); } catch {} };
const HARVEST_LABEL = "I'm done. Find my stories";
$("harvestBtn").onclick = async () => {
  err(""); $("harvestBtn").disabled = true; $("harvestBtn").textContent = "Reading the conversation…";
  try {
    if (liveTurns) await stopLive();
    // Words still in the box count. Save them before reading the conversation.
    const pending = $("say").value.trim();
    if (pending && !busy) { state = await api("/api/say", {text:pending, final:true}); $("say").value = ""; renderTalk(); }
    const mode = handBack();
    if (mode === "transcript") return renderTranscript();
    orbState("thinking");
    const heard = heardLines(), steps = state.longform
      ? ["Reading the conversation back. This takes about a minute", "Finding the shape of your piece", "Building it from your words", "Writing short posts to share it"]
      : ["Reading the conversation back. This takes about half a minute", "Finding the stories with a turn in them", "Shaping each one for where you post", "Writing a few questions for each one"];
    const lines = [steps[0]]; for (let i = 1; i < steps.length; i++) { if (heard[i - 1]) lines.push(heard[i - 1]); lines.push(steps[i]); }
    $("waitH").textContent = state.longform ? "Finding your piece" : "Finding your stories";
    show("waiting"); window.scrollTo({top:0}); shimmer.start(lines);
    try { state = await api("/api/harvest", {mode}); }
    catch(e){ shimmer.stop(); renderTalk(); throw e; }
    const n = (state.drafts || []).filter(d => !d.later && !d.extra && !d.article).length, art = (state.drafts || []).some(d => d.article);
    if (art || n) await shimmer.finish(art ? "Your piece is ready" : n === 1 ? "One story, ready for you" : (n === 2 ? "Two" : n === 3 ? "Three" : n) + " stories, ready for you");
    shimmer.stop(); renderReview(); window.scrollTo({top:0});
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) [...$("drafts").children].slice(0, 4).forEach((c, i) => { c.style.animation = "rise .6s cubic-bezier(.2,.7,.2,1) " + (i * 0.12) + "s both"; c.addEventListener("animationend", () => { c.style.animation = ""; }, {once: true}); });
  }
  catch(e){ err(e.message); } finally { busyDone("harvestBusy"); orbState("idle"); $("harvestBtn").disabled = false; $("harvestBtn").textContent = HARVEST_LABEL; }
};
// The wait, made to look at: a thread of code characters weaves across the panel (the ripple from lbeebe.com),
// bright where it's moving and cooling behind, behind one quiet line. A tap sends a ring out. Reduced motion: a still thread.
const shimmer = (() => {
  const box = $("shimmer"), canvas = box.querySelector("canvas"), ctx = canvas.getContext("2d"), line = $("shimmerLine");
  const GLYPHS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", FONT = 12, LH = 16;
  const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cw = 8, cols = 0, rows = 0, W = 0, H = 0, chars = [], rings = [], cool = [96,112,101], hot = [168,140,0], iris = [62,44];
  let t0 = 0, glowAt = 0, raf = 0, on = false, lineTimer = 0;
  const rgb = n => getComputedStyle(document.documentElement).getPropertyValue(n).split(",").map(Number);
  function size(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2); W = box.clientWidth; H = box.clientHeight; if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT + "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"; ctx.textBaseline = "top";
    cw = Math.ceil(ctx.measureText("M").width) + 1; cols = Math.ceil(W / cw) + 1; rows = Math.ceil(H / LH) + 1;
    chars = Array.from({length: cols * rows}, glyph); cool = rgb("--code-cool"); hot = rgb("--code-hot"); iris = rgb("--code-iris");
  }
  // Hue in degrees to rgb at the theme's saturation and lightness, for the iridescent body of the thread.
  function hsl(hh){ const S = iris[0] / 100, L = iris[1] / 100, a = S * Math.min(L, 1 - L), f = n => { const k = (n + hh / 30) % 12; return Math.round(255 * (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return [f(0), f(8), f(4)]; }
  const curve = (x, t) => H * 0.5 + H * 0.22 * Math.sin(x / W * 5.2 + t * 0.55) + H * 0.09 * Math.sin(x / W * 11.3 - t * 0.9);
  const patch = (c, r, t) => 0.7 + 0.22 * Math.sin(c * 0.23 + t * 0.9) * Math.sin(r * 0.37 - t * 0.6) + 0.15 * Math.sin((c + r) * 0.11 - t * 0.4);
  function draw(now){
    const t = (now - t0) / 1000, head = ((t * 0.12) % 1.25) * W, dt = glowAt && now >= glowAt ? (now - glowAt) / 1000 : -1;
    const SW = 0.9, sweepX = dt >= 0 ? dt / SW * W * 1.3 - W * 0.15 : -1e9;
    rings = rings.filter(p => t - p.t < 2.2); ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw, y = r * LH, behind = head - x;
      // The ending: a hot front sweeps along the thread, and everything it has passed stays lit and wider, then eases off.
      let lit = 0, front = 0;
      if (dt >= 0) { const d = (x - sweepX) / (W * 0.07); front = Math.exp(-d * d); const since = dt - (x + W * 0.15) / (W * 1.3 / SW); lit = Math.max(front, since > 0 ? Math.exp(-since / 1.1) * 0.85 : 0); }
      const tail = Math.max(behind < -cw * 2 ? 0 : behind < 0 ? 1 + behind / (cw * 2) : Math.exp(-behind / (W * 1.1)), lit);
      let v = 0;
      if (tail > 0.02) { const off = (y - curve(x, t)) / (20 * (1 + lit * 0.9)); v = (Math.exp(-off * off * 1.4) + 0.22 * Math.exp(-off * off * 0.18)) * tail; }
      for (const p of rings) {
        const age = t - p.t, rad = age * 200, band = 22 + age * 24, fade = Math.pow(1 - age / 2.2, 1.6);
        const off = (Math.hypot(x - p.x, y - p.y) - rad) / band; v += Math.exp(-off * off * 2.2) * fade * p.s;
      }
      v *= patch(c, r, t) * (1 + lit * 0.5); if (v < 0.05) continue;
      const i = r * cols + c; if (Math.random() < 0.2 * v) chars[i] = glyph();
      const near = behind >= 0 && behind < W * 0.12 ? 1 - behind / (W * 0.12) : 0;
      const h = Math.min(1, Math.max(near * v * 1.4, front * 1.2, lit * v * 1.1, (v - 0.55) / 0.4, 0));
      // Behind the yellow head the thread shifts slowly through mint, sky, lilac and rose, like light on a soap film.
      const pearl = hsl(150 + 90 * (1 + Math.sin(x / W * 3.1 + y / H * 2.3 + t * 0.35))), pe = Math.min(1, 0.35 + v * 1.6) * (1 - h);
      const mix = k => (cool[k] + (pearl[k] - cool[k]) * pe + (hot[k] - cool[k]) * h) | 0;
      ctx.fillStyle = "rgba(" + mix(0) + "," + mix(1) + "," + mix(2) + "," + Math.min(0.75 + front * 0.25, v * (0.85 + lit * 0.4)).toFixed(3) + ")";
      ctx.fillText(chars[i], x, y);
    }
    if (on && !still()) raf = requestAnimationFrame(draw);
  }
  function ring(x, y, s){ if (still()) return; rings.push({x, y, s: s || 0.8, t: (performance.now() - t0) / 1000}); if (rings.length > 6) rings.shift(); }
  function put(text, first){
    const m = /^You said “(.*)”$/.exec(text);
    const set = () => {
      line.replaceChildren(); if (m) line.append(el("span", "q", "You said"), document.createTextNode("“" + m[1] + "”")); else line.textContent = text;
      line.classList.remove("out");
      const b = line.getBoundingClientRect(), f = box.getBoundingClientRect(); ring(b.left - f.left + b.width / 2, b.top - f.top + b.height / 2, 0.4);
    };
    if (first || still()) return set();
    line.classList.add("out"); setTimeout(set, 450);
  }
  box.addEventListener("pointerdown", (e) => { const f = box.getBoundingClientRect(); ring(e.clientX - f.left, e.clientY - f.top); });
  if ("ResizeObserver" in window) new ResizeObserver(() => { if (on) { size(); if (still()) draw(performance.now()); } }).observe(box);
  return {
    start(lines){
      on = true; glowAt = 0; rings = []; size(); t0 = performance.now() - (still() ? 4000 : 0);
      let k = 0; put(lines[k++], true); clearInterval(lineTimer);
      lineTimer = setInterval(() => { if (k < lines.length) put(lines[k++]); }, 3600);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
    },
    // A bright sweep along the thread, then the stories rise into place.
    finish(text){
      clearInterval(lineTimer); if (!on) return Promise.resolve();
      put(text); if (still()) return new Promise(r => setTimeout(r, 700));
      glowAt = performance.now() + 450; return new Promise(r => setTimeout(r, 2300));
    },
    stop(){ on = false; clearInterval(lineTimer); cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
  };
})();
// Delight, kept honest: while it reads back, show a few things they really said.
// Only whole, clean sentences: leading fillers trimmed, anything with filler inside or a dangling end dropped.
function heardLines(){
  const lead = /^(?:(?:so|and|but|um+|uh+|erm|like|yeah|yes|okay|ok|well|right|oh|i mean|you know|basically|honestly|actually)[,\\s]+)+/i;
  const filler = /\\b(?:um+|uh+|erm|you know|i mean|kind of like|sort of like|like,)\\b/i;
  const dangling = /\\b(?:and|but|or|so|the|a|an|to|of|for|with|that|because|which|like|is|was|my|our|it's|i)$/i;
  const said = (state.turns||[]).filter(t => t.who === "you")
    .flatMap(t => (t.text.match(/[^.!?]+[.!?]+/g) || []))
    .map(x => x.trim().replace(lead, "").replace(/[.!?,;:]+$/, "").trim())
    .filter(x => { const n = x.split(/\\s+/).length; return n >= 6 && n <= 14 && x.length <= 80 && !filler.test(x) && !dangling.test(x) && !/\\*/.test(x) && !/\\b(?:shit|fuck|damn|crap|hell|ass)/i.test(x); })
    .map(x => x.charAt(0).toUpperCase() + x.slice(1));
  if (!said.length) return [];
  const pick = [], k = Math.min(3, said.length);
  for (let i = 0; i < k; i++) pick.push(said[Math.floor((i + 0.5) * said.length / k)]);
  return [...new Set(pick)].map(x => "You said “" + x + "”");
}
function wordsSaid(){ return (state.turns||[]).filter(t => t.who === "you").reduce((n, t) => n + (t.text.trim() ? t.text.trim().split(/\\s+/).length : 0), 0); }
function transcriptMd(){
  const day = new Date().toLocaleDateString(undefined, {month:"long", day:"numeric", year:"numeric"});
  const lines = ["# Interview, " + day, ""];
  for (const t of state.turns || []) lines.push("**" + (t.who === "you" ? "You" : "The Interviewer") + ":** " + t.text, "");
  return lines.join("\\n");
}
function renderTranscript(){ $("transcriptText").value = transcriptMd(); show("transcript"); window.scrollTo({top:0}); }
$("getTranscript").onclick = renderTranscript;
$("transcriptBack").onclick = () => (state.drafts||[]).length ? renderReview() : renderTalk();
$("copyTranscript").onclick = async () => {
  try { await navigator.clipboard.writeText($("transcriptText").value); $("copyTranscript").textContent = "Copied"; }
  catch { $("transcriptText").select(); $("copyTranscript").textContent = "Press Cmd+C or Ctrl+C"; }
  setTimeout(() => { $("copyTranscript").textContent = "Copy"; }, 2000);
};
$("downloadTranscript").onclick = () => {
  const a = el("a"); a.href = URL.createObjectURL(new Blob([$("transcriptText").value], {type:"text/markdown"}));
  a.download = "interview-" + new Date().toISOString().slice(0, 10) + ".md"; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
function countPicked(){
  const cards = [...document.querySelectorAll(".draft")];
  cards.forEach(c => c.classList.toggle("off", !c.querySelector(".pick input").checked));
  const n = cards.filter(c => c.querySelector(".pick input").checked).length;
  $("saveCount").textContent = n ? n + (n === 1 ? " story" : " stories") + " ticked" : "Nothing ticked yet. Tick a story to save it.";
  $("saveAll").disabled = !n;
  $("saveAll").textContent = n ? "Save " + n + (n === 1 ? " draft" : " drafts") + " to Buffer" : "Save drafts to Buffer";
}
function renderReview(){
  const box = $("drafts"); box.innerHTML = "";
  const outline = state.harvestMode === "outline";
  $("reviewHead").textContent = state.longform ? (state.alsoShort ? "Your piece and your stories" : "Your piece, from your interview") : "Stories from your interview";
  $("reviewLede").textContent = state.longform
    ? "Your piece, built from what you said, plus short posts to share it" + (state.alsoShort ? " and short posts for the other stories you told" : "") + ". Edit anything and untick what you don't want. The article is kept in Buffer as an Idea; the short posts go to Drafts when you press Save."
    : outline
    ? "Each card is one post for one channel, outlined in your words. Write it your way and untick what you don't want. Nothing goes to Buffer until you press Save at the bottom."
    : "Each card is one post for one channel, built from what you said and tidied by an editor. Edit anything and untick what you don't want. Nothing goes to Buffer until you press Save at the bottom.";
  const extra = (state.drafts || []).filter(d => d.extra && !(state.saved||[]).includes(d.id));
  const real = (state.drafts || []).filter(d => !d.later).length;
  $("fewNote").hidden = real >= 2 || state.longform; $("backTalk").hidden = real < 2 && !state.longform;
  $("fewText").textContent = real === 0
    ? "I didn't find a full story in this one yet. Talk a bit more and I'll look again."
    : "I found one story so far. Talk a bit more and I'll look again.";
  const seen = {};
  for (const d of state.drafts || []) {
    const card = el("article", "panel draft" + (d.later ? " later" : "")); card.dataset.id = d.id;
    if (d.extra) { card.hidden = true; card.classList.add("extra"); }
    const top = el("label", "pick"); const cb = el("input"); cb.type = "checkbox"; cb.checked = !d.later && !d.extra; top.append(cb, el("span", "", d.later ? "Include this question" : d.article ? "Keep in Buffer as an Idea" : "Include in Buffer")); card.append(top);
    if ((state.saved||[]).includes(d.id)) { cb.checked = false; cb.disabled = true; top.lastChild.textContent = "Saved"; }
    cb.onchange = countPicked;
    if (d.format) {
      const sh = el("div", "shape"); sh.append(el("span", "fmt", d.article ? "Article · for your newsletter or a LinkedIn article" : "For " + channelName(d.channel) + " · " + d.format)); card.append(sh);
      const key = (d.title || "").trim().toLowerCase(), share = /^sharing: /i.test(d.title || "");
      if (share) card.append(el("p", "same", "A post to share your piece."));
      else if (key && seen[key]) card.append(el("p", "same", "Same story as the " + seen[key] + " card."));
      else if (key) seen[key] = channelName(d.channel);
      if (d.why && !d.article && !share && !seen[key + "#"]) card.append(el("p", "why", d.why));
      if (share || (key && seen[key + "#"])) card.classList.add("repeat"); else if (key) seen[key + "#"] = 1;
    }
    const t = el("input", "title"); t.type = "text"; t.maxLength = 200; t.value = d.title; t.setAttribute("aria-label", "Story title"); card.append(t);
    if (card.classList.contains("repeat")) t.hidden = true;
    if (d.article && (d.titles||[]).length > 1) card.append(el("p", "alts", "Other titles from your words: " + d.titles.slice(1).join(" · ")));
    const words = el("div"); words.append(el("span", "lbl", d.later ? "A question for later" : outline ? "Outline, in your words" : "Draft, from your words, lightly edited"));
    const x = el("textarea", "text"); x.maxLength = 10000; x.value = d.text; x.setAttribute("aria-label", d.article ? "Article text" : "Post text"); words.append(x); card.append(words);
    if (d.article) {
      const acts = el("div", "art-actions"), cp = el("button", "btn quiet", "Copy the article"), dl = el("button", "btn text", "Download it");
      cp.type = dl.type = "button";
      cp.onclick = () => copyText(t.value + "\\n\\n" + x.value, cp, "Copy the article");
      dl.onclick = () => downloadMd(t.value, x.value);
      acts.append(cp, dl); card.append(acts);
    }
    for (const f of d.flags || []) card.append(el("p", "flag", f));
    if ((d.prompts||[]).length) {
      const pw = el("details", "fold"); pw.append(el("summary", "lbl", (outline ? "Questions to help you write it, added under your outline" : "Questions to help you finish it, added under your draft") + " (" + d.prompts.length + ")"));
      pw.addEventListener("toggle", () => pw.querySelectorAll("textarea").forEach(grow));
      const pr = el("textarea", "prompts"); pr.maxLength = 1000; pr.value = d.prompts.join("\\n"); pr.setAttribute("aria-label", "Questions, one per line"); pw.append(pr); card.append(pw);
    }
    if (tags().length) {
      const tagWrap = el("details", "fold"), cur = tags().find(p => p.id === d.tagId), sum = el("summary", "lbl", "Buffer tag: " + (cur ? cur.name : "none"));
      tagWrap.append(sum);
      const chips = el("div", "chips"); chips.setAttribute("aria-label", "Buffer tag"); tags().forEach((p) => chips.append(chip(p, "pl-" + d.id, "radio", d.tagId === p.id))); tagWrap.append(chips); card.append(tagWrap);
      chips.addEventListener("change", () => { const on = tags().find(p => chips.querySelector("input:checked")?.value === p.id); sum.textContent = "Buffer tag: " + (on ? on.name : "none"); });
    }
    box.append(card);
  }
  $("showMore").hidden = !extra.length;
  $("showMore").textContent = "Show " + extra.length + " more " + (extra.length === 1 ? "story" : "stories");
  show("review"); countPicked();
  box.querySelectorAll("textarea").forEach(t => { t.addEventListener("input", () => grow(t)); grow(t); });
}
function grow(t){ if (!t.offsetParent) return; t.style.height = "auto"; t.style.height = (t.scrollHeight + 4) + "px"; }
function channelName(service){ const c = (state.channels||[]).find(c => c.service === service); return c ? c.label : service ? service : "Any channel"; }
$("showMore").onclick = () => { document.querySelectorAll(".draft.extra").forEach(c => { c.hidden = false; c.querySelectorAll("textarea").forEach(grow); }); $("showMore").hidden = true; };
$("backTalk").onclick = renderTalk;
$("moreBtn").onclick = async () => {
  err(""); const b = $("moreBtn"); b.disabled = true; b.textContent = "Finding a new question…";
  try { state = await api("/api/more", {}); drawn = Math.max(0, (state.turns||[]).length - 1); renderTalk(); window.scrollTo({top:0}); $("say").focus({preventScroll:true}); }
  catch(e){ err(e.message); }
  finally { b.disabled = false; b.textContent = "Keep talking to find more"; }
};
$("saveAll").onclick = async () => {
  err("");
  const drafts = [...document.querySelectorAll(".draft")].filter(c => c.querySelector(".pick input").checked).map(c => ({
    id: c.dataset.id, title: c.querySelector(".title").value, text: c.querySelector(".text").value,
    prompts: c.querySelector(".prompts") ? c.querySelector(".prompts").value.split("\\n").map(x => x.trim()).filter(Boolean) : [],
    tagId: (c.querySelector('.chips input:checked') || {}).value,
  }));
  if (!drafts.length) return err("Tick at least one story to save.");
  const art = [...document.querySelectorAll(".draft")].find(c => (state.drafts||[]).some(d => d.id === c.dataset.id && d.article));
  lastArticle = art ? {title: art.querySelector(".title").value, text: art.querySelector(".text").value} : null;
  $("saveAll").disabled = true; $("saveAll").textContent = "Saving to Buffer…";
  try { state = await api("/api/save", {drafts}); renderDone(); }
  catch(e){ err(e.message); try { state = await api("/api/state"); renderReview(); } catch {} }
  finally { $("saveAll").disabled = false; if (!$("review").hidden) countPicked(); }
};
let lastArticle = null;
async function copyText(text, btn, label){
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; }
  catch { btn.textContent = "Couldn't copy. Use Download instead"; }
  setTimeout(() => { btn.textContent = label; }, 2000);
}
// What memory holds between interviews, shown so they can see and cut it.
function drawMemory(){
  const mem = state.memory || {on:false, entries:[]}, list = $("memList");
  $("keepMemory").checked = !!mem.on;
  $("memWrap").hidden = !mem.entries.length; $("memCount").textContent = mem.entries.length;
  list.innerHTML = "";
  for (const e of mem.entries) {
    const li = el("li"), b = el("button", "btn text", "Forget");
    b.type = "button"; b.setAttribute("aria-label", "Forget: " + e.text);
    b.onclick = async () => { try { state = await api("/api/memory/forget", {id: e.id}); drawMemory(); } catch(x){ err(x.message); } };
    li.append(el("span", "", (e.kind === "open" ? "Still working through: " : "Story found: ") + e.text + " (" + e.at + ")"), b); list.append(li);
  }
}
$("memExport").onclick = () => {
  const es = (state.memory || {}).entries || [];
  const part = (k, h) => { const xs = es.filter(e => e.kind === k); return xs.length ? "## " + h + "\\n\\n" + xs.map(e => "- " + e.at + ": " + e.text).join("\\n") + "\\n\\n" : ""; };
  const a = el("a"); a.href = URL.createObjectURL(new Blob(["# What The Interviewer remembers\\n\\n" + part("open", "Still working through") + part("story", "Stories found")], {type:"text/markdown"}));
  a.download = "interviewer-memory.md"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$("memForgetAll").onclick = async () => {
  if (!confirm("Forget everything The Interviewer remembers about your work? This can't be undone.")) return;
  try { state = await api("/api/memory/forget", {all: true}); drawMemory(); } catch(x){ err(x.message); }
};
function downloadMd(title, text){
  const md = "# " + title + "\\n\\n" + text.replace(/^\\[Section: ([^\\]]*)\\]\\s*$/gm, "## $1");
  const a = el("a"); a.href = URL.createObjectURL(new Blob([md], {type:"text/markdown"}));
  a.download = (title || "article").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + ".md"; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("copyArticle").onclick = () => { const a = articleForDone(); if (a) copyText(a.title + "\\n\\n" + a.text, $("copyArticle"), "Copy the article"); };
$("downloadArticle").onclick = () => { const a = articleForDone(); if (a) downloadMd(a.title, a.text); };
function articleForDone(){ if (lastArticle) return lastArticle; const d = (state.drafts||[]).find(d => d.article && (state.saved||[]).includes(d.id)); return d ? {title: d.title, text: d.text} : null; }
function renderDone(){
  const n = (state.saved||[]).length, asIdeas = state.savedAsIdeas || [], w = wordsSaid();
  const saved = (state.drafts||[]).filter(d => (state.saved||[]).includes(d.id));
  // The deck: their own drafts fanned like a finished hand. Swipe or tap to bring the next one to the front.
  const deck = $("deck"), cards = saved.map(d => {
    const c = el("div", "card"), head = el("div", "ch");
    head.append(el("span", "", d.article ? "Article" : channelName(d.channel)), el("span", "", asIdeas.includes(d.id) || d.article ? "Idea" : "Draft"));
    c.append(head, el("p", "", (d.text || d.title || "").replace(/\\[[^\\]]*\\]/g, "").slice(0, 320)));
    c.addEventListener("animationend", (e) => { if (e.animationName === "deal") c.classList.add("dealt"); });
    return c;
  });
  deck.replaceChildren(...cards); deckFront = 0; layDeck(true);
  const tally = $("tally"); tally.replaceChildren();
  const stat = (num, label) => { const d = el("div"), b = el("b", "", "0"); d.append(b, el("span", "", label)); tally.append(d); countUp(b, num); };
  if (w >= 40) stat(w, "words you said");
  stat(n, n === 1 ? "draft in Buffer" : "drafts in Buffer");
  const m = asIdeas.length; $("ideaNote").hidden = !m;
  if (m) $("ideaNote").textContent = (m === 1 ? "One went to Ideas instead of Drafts" : m + " went to Ideas instead of Drafts") + ", because that channel needs an image or your plan hit its draft limit.";
  $("articleDone").hidden = !articleForDone();
  show("done"); window.scrollTo({top:0});
}
let deckFront = 0;
// Front card in the middle, the next one to the right, the previous one to the left, the rest tucked behind.
function layDeck(first){
  const cards = [...$("deck").children], n = cards.length;
  cards.forEach((c, i) => {
    const p = (i - deckFront + n) % n, o = p === 0 ? 0 : p === 1 ? 1 : p === n - 1 ? -1 : null;
    c.style.setProperty("--x", (o === null ? 0 : o * 20) + "%"); c.style.setProperty("--y", (o === null ? 24 : Math.abs(o) * 14) + "px");
    c.style.setProperty("--r", (o === null ? 0 : o * 5) + "deg"); c.style.opacity = o === null ? "0" : "";
    c.style.zIndex = o === null ? 1 : 10 - Math.abs(o) * 2;
    c.classList.toggle("front", o === 0);
    if (o === 0) { c.classList.remove("glint"); void c.offsetWidth; c.style.setProperty("--gd", first ? "1.1s" : ".2s"); c.classList.add("glint"); }
    if (first) c.style.setProperty("--d", o === null ? 0 : o === 0 ? 2 : o > 0 ? 1 : 0); // back cards dealt first, the front one last
  });
  $("deckCount").textContent = n > 1 ? (deckFront + 1) + " of " + n : "";
}
(() => {
  const deck = $("deck"); let x0 = null, dx = 0;
  const front = () => [...deck.children].find(c => c.style.zIndex === "10");
  deck.addEventListener("pointerdown", (e) => { if (deck.children.length < 2) return; x0 = e.clientX; dx = 0; deck.setPointerCapture(e.pointerId); const f = front(); if (f) f.classList.add("drag"); });
  deck.addEventListener("pointermove", (e) => { if (x0 === null) return; dx = e.clientX - x0; const f = front(); if (f) f.style.setProperty("--dx", dx + "px"); });
  const end = () => {
    if (x0 === null) return; x0 = null; const f = front(), n = deck.children.length;
    if (f) { f.classList.remove("drag"); f.style.setProperty("--dx", "0px"); }
    if (Math.abs(dx) > 40 || Math.abs(dx) < 6) { deckFront = (deckFront + (dx > 40 ? n - 1 : 1)) % n; layDeck(); }
  };
  deck.addEventListener("pointerup", end); deck.addEventListener("pointercancel", end);
})();
function countUp(b, to){
  if (still || to < 10) { b.textContent = to.toLocaleString(); return; }
  const t0 = performance.now() + 550, dur = 900;
  const step = (now) => { const t = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - t, 3); b.textContent = Math.round(to * e).toLocaleString(); if (t < 1 && b.isConnected) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

function route(){
  if (!state.repo && !state.noRepo) return renderSetup();
  if ((state.drafts||[]).length) return (state.saved||[]).length ? renderDone() : renderReview();
  if ((state.turns||[]).length) return renderTalk();
  renderSetup();
}
let opening = false;
function withTimeout(promise, ms, message){
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
async function load(){
  if (opening) return;
  opening = true;
  try {
    state = await withTimeout(api("/api/state"), 30000, "This is taking longer than it should. Check your connection, then try again.");
    route();
  } catch(e){
    if (e && e.message === "reconnect") return;
    showFault(e && e.message);
  } finally { opening = false; }
}
window.__interviewRetry = () => { $("boot").hidden = true; err(""); load(); };
$("saveSetup").onclick = async () => {
  err(""); $("saveSetup").disabled = true; orbState("thinking");
  busyLines("setupBusy", ["Reading this week's public work", "Looking at what you've posted lately", "Choosing a few threads to pull on", "Getting your first question ready"]);
  try {
    const targets = [...document.querySelectorAll("#chans input:checked")].map(i => i.value);
    state = await api("/api/setup", {organizationId:$("org").value, work:$("work").value, targets: $("chanWrap").hidden ? undefined : targets, keepLog: $("keepLog").checked, keepMemory: $("keepMemory").checked, format: kindChosen()});
    busyDone("setupBusy"); shown = null; drawn = 0; busy = true; $("sendBtn").disabled = true; $("liveBtn").disabled = true; renderTalk(); window.scrollTo({top:0});
    try { state = await api("/api/start", {}); } finally { busy = false; $("sendBtn").disabled = false; $("liveBtn").disabled = false; }
    renderTalk(); $("say").focus({preventScroll:true});
  }
  catch(e){ if (!(state.turns||[]).length) renderSetup(); err(e.message); }
  finally { busyDone("setupBusy"); if ($("talk").hidden) orbState("idle"); $("saveSetup").disabled = false; }
};
$("again").onclick = async () => { try { state = await api("/api/reset", {}); shown = null; drawn = 0; sources.clear(); route(); } catch(e){ err(e.message); } };
load();
`;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
