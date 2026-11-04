// Render the real app markup from src/pages.ts (dark, phone width) beside
// the demo's frozen screens, and write a side-by-side PNG for each beat.
import { chromium } from 'playwright-core'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'

const root = new URL('../../', import.meta.url)
const src = readFileSync(new URL('src/pages.ts', root), 'utf8')
const pull = (name) => {
  const start = src.indexOf('const ' + name + ' = `')
  const from = src.indexOf('`', start) + 1
  const end = src.indexOf('`;', from)
  return src.slice(from, end)
}
const dir = '/tmp/iv-real'
mkdirSync(dir, { recursive: true })
copyFileSync(new URL('demo/node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2', root), dir + '/font.woff2')

const ANSWER = 'I finally shipped the onboarding flow my users kept asking for.'
const css = `
@font-face { font-family: "Bricolage Grotesque"; src: url("font.woff2") format("woff2"); font-weight: 200 800; font-display: block; }
${pull('STYLE')}
${pull('APP_STYLE')}
:root { color-scheme: dark; }
body { margin: 0; }
.screen { display: none; }
body[data-s="setup"] #setup,
body[data-s="talk"] #talk,
body[data-s="wait"] #waiting,
body[data-s="done"] #done { display: block; }
#done .deck .card { animation: none; }
`
writeFileSync(dir + '/app.css', css)

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Real screens</title>
<link rel="stylesheet" href="app.css"></head>
<body>
<header class="top"><div class="wrap">
  <a class="wordmark" href="/app"><svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.4 3 15.1c0 3.6 1.7 6.8 4.4 9L6.2 29l5.6-2.8c1.3.4 2.7.6 4.2.6 7.2 0 13-5.4 13-12.1S23.2 3 16 3Z" fill="#f6e016"/><circle cx="16" cy="15" r="4.2" fill="#d7361f"/></svg><span>The Interviewer</span></a>
  <span class="scope" id="scope"></span>
  <form><button class="btn text" type="button">Disconnect</button></form>
</div></header>
<main class="app wrap">
<section id="setup" class="screen">
  <header><h1>What did you work on this week?</h1><ul class="steps"><li><b>No GitHub needed.</b> A sentence about your work is enough.</li><li>Have a public repo? Paste it and I'll read this week's work.</li><li>Talk for 5-10 minutes, then pick the stories to save to Buffer.</li></ul></header>
  <div class="panel">
    <label class="fieldset"><span class="lbl">A quick note or a repo link</span><span class="hint">Up to 500 characters.</span><textarea id="work">github.com/1beebe/build-in-public</textarea></label>
    <div class="fieldset"><span class="lbl">Write drafts for</span><div class="chips">
      <label class="chip"><input type="checkbox" checked><span>LinkedIn</span></label>
      <label class="chip"><input type="checkbox"><span>X</span></label>
      <label class="chip"><input type="checkbox"><span>Threads</span></label>
      <label class="chip"><input type="checkbox"><span>Bluesky</span></label>
    </div></div>
    <label class="keep"><input type="checkbox" checked><span>Keep this transcript 14 days to help Ligaya improve the app. Only she sees it. What's kept</span></label>
    <label class="keep"><input type="checkbox"><span>Remember open threads so next time picks up where this one stopped.</span></label>
    <div class="row"><button class="btn" type="button"><span class="rec"></span>Start the interview</button></div>
  </div>
</section>
<section id="talk" class="screen wide split solo">
<div class="panel convo">
  <div class="head"><div class="orb" data-s="listening" aria-hidden="true"><i></i><i></i><b></b></div><div><h1>Your interview</h1><p id="voiceState"></p></div></div>
  <ol class="log">
    <li class="them"><span class="who">The Interviewer</span><p>What did you ship this week that you're proud of?</p></li>
    <li class="you"><span class="who">You</span><p>${ANSWER}</p></li>
  </ol>
  <div class="live"><button id="liveBtn" class="btn on" type="button"><span class="rec"></span><span>Pause</span></button><span class="state">Listening</span></div>
  <div class="composer"><label class="saylbl">Type your answer</label><textarea placeholder="Enter sends. Shift+Enter for a new line. 1,500 characters maximum."></textarea><div class="row"><button class="btn small" type="button">Send</button><button class="btn small text" type="button">Next topic</button></div></div>
  <div class="done-row"><button class="btn quiet" type="button">I'm done. Find my stories</button></div>
</div>
</section>
<section id="waiting" class="screen">
  <header><h1>Finding your stories</h1></header>
  <div class="shimmer" id="shimmer"><canvas aria-hidden="true"></canvas><p class="shimmer-line"><span class="q">You said</span>“${ANSWER}”</p></div>
</section>
<section id="done" class="screen">
  <div class="panel">
    <div class="deck" aria-hidden="true">
      <div class="card" style="--x:-20%;--y:14px;--r:-5deg;--d:0"><div class="ch"><span>X</span><span>Draft</span></div><p>${ANSWER}</p></div>
      <div class="card" style="--x:20%;--y:14px;--r:5deg;--d:1"><div class="ch"><span>Threads</span><span>Draft</span></div><p>${ANSWER}</p></div>
      <div class="card front" style="--x:0%;--y:0px;--r:0deg;--d:2;z-index:10"><div class="ch"><span>LinkedIn</span><span>Draft</span></div><p>${ANSWER}</p></div>
    </div>
    <h1>Your drafts are in Buffer.</h1>
    <div class="tally"><div><b>128</b><span>words you said</span></div><div><b>3</b><span>drafts in Buffer</span></div></div>
    <div class="row open-drafts"><a class="btn" href="https://publish.buffer.com/schedule?tab=drafts">Open my drafts in Buffer</a></div>
    <p class="next-week">See you next week. <button class="btn text" type="button">Or start another now</button></p>
  </div>
</section>
</main>
<script>
const screen = new URLSearchParams(location.search).get('s') || 'setup'
document.body.dataset.s = screen
const box = document.querySelector('#shimmer'), canvas = box.querySelector('canvas'), ctx = canvas.getContext('2d')
const GLYPHS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', FONT = 12, LH = 16
const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]
const cool = [110,140,120], hot = [246,224,22], iris = [85,80]
let cw = 8, cols = 0, rows = 0, W = 0, H = 0, chars = []
function hsl(hh){ const S = iris[0]/100, L = iris[1]/100, a = S*Math.min(L,1-L), f = n => { const k = (n + hh/30)%12; return Math.round(255*(L - a*Math.max(-1, Math.min(k-3, 9-k, 1)))) }; return [f(0), f(8), f(4)] }
function size(){ const dpr = Math.min(devicePixelRatio||1,2); W = box.clientWidth; H = box.clientHeight; if(!W||!H) return; canvas.width = W*dpr; canvas.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.font = FONT+'px ui-monospace,Menlo,monospace'; ctx.textBaseline='top'; cw = Math.ceil(ctx.measureText('M').width)+1; cols = Math.ceil(W/cw)+1; rows = Math.ceil(H/LH)+1; chars = Array.from({length: cols*rows}, glyph) }
const curve = (x,t) => H*0.5 + H*0.22*Math.sin(x/W*5.2 + t*0.55) + H*0.09*Math.sin(x/W*11.3 - t*0.9)
const t0 = performance.now() - 4800
function draw(now){ if(!W){ requestAnimationFrame(draw); return } const t = (now-t0)/1000, head = ((t*0.12)%1.25)*W; ctx.clearRect(0,0,W,H)
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){ const x=c*cw, y=r*LH, behind=head-x; const tail = behind < -cw*2 ? 0 : behind < 0 ? 1+behind/(cw*2) : Math.exp(-behind/(W*1.1)); let v=0
    if (tail>0.02){ const off=(y-curve(x,t))/20, o2=off*off; v=(Math.exp(-o2*1.4)+0.22*Math.exp(-o2*0.18))*tail }
    v *= 0.7+0.22*Math.sin(c*0.23+t*0.9)*Math.sin(r*0.37-t*0.6); if (v<0.05) continue
    const near = behind>=0 && behind<W*0.12 ? 1-behind/(W*0.12) : 0
    const hm = Math.min(1, Math.max(near*v*1.4, (v-0.55)/0.4, 0))
    const pearl = hsl(150+90*(1+Math.sin(x/W*3.1+y/H*2.3+t*0.35))), pe = Math.min(1, 0.35+v*1.6)*(1-hm)
    const mix = k => (cool[k]+(pearl[k]-cool[k])*pe+(hot[k]-cool[k])*hm)|0
    ctx.fillStyle = 'rgba('+mix(0)+','+mix(1)+','+mix(2)+','+Math.min(0.75, v*0.85).toFixed(3)+')'; ctx.fillText(chars[r*cols+c], x, y) }
  requestAnimationFrame(draw) }
if (screen === 'wait') { size(); requestAnimationFrame(draw) }
</script>
</body></html>`
writeFileSync(dir + '/index.html', html)

const outDir = '/tmp/iv-compare'
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome' })
const real = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' })
const demo = await browser.newPage({ viewport: { width: 560, height: 720 }, deviceScaleFactor: 2 })
const beats = [
  ['setup', 'setup'],
  ['talk', 'talk'],
  ['wait', 'wait'],
  ['done', 'done'],
]
for (const [name, freeze] of beats) {
  await real.goto('file://' + dir + '/index.html?s=' + name, { waitUntil: 'load' })
  await real.evaluate(() => document.fonts.ready)
  await real.waitForTimeout(name === 'wait' ? 700 : 200)
  const realPath = outDir + '/real-' + name + '.png'
  await real.screenshot({ path: realPath, fullPage: true })
  await demo.goto('http://127.0.0.1:5179/?freeze=' + freeze, { waitUntil: 'networkidle' })
  await demo.evaluate(() => document.fonts.ready)
  await demo.waitForTimeout(name === 'wait' ? 600 : 250)
  const demoPath = outDir + '/demo-' + name + '.png'
  await demo.locator('.ss-stage').screenshot({ path: demoPath })
  const both = outDir + '/compare-' + name + '.png'
  await new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', '-i', realPath, '-i', demoPath, '-filter_complex',
      '[0:v]scale=-1:1000:force_original_aspect_ratio=decrease,pad=860:1000:(ow-iw)/2:0:color=0x07150e[a];[1:v]scale=-1:1000:force_original_aspect_ratio=decrease,pad=860:1000:(ow-iw)/2:0:color=0x07150e[b];[a][b]hstack=inputs=2',
      both], { stdio: 'inherit' })
    ff.on('exit', (code) => code === 0 ? resolve() : reject(new Error('ffmpeg ' + code)))
  })
  console.log(both)
}
await browser.close()
