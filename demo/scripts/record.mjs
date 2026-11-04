// Record one real-time pass of the stage and write an h264 mp4.
// Chrome's screencast supplies the frames; system ffmpeg encodes them.
// Viewport is the stage's design size. deviceScaleFactor 2 makes a 1080-wide picture.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { chromium } from 'playwright-core'

const chrome = process.env.CHROME_PATH || '/usr/local/bin/google-chrome'
const [, , url, w, h, out, ms = '15500'] = process.argv
if (!url || !out) {
  console.error('usage: record.mjs <url> <cssWidth> <cssHeight> <out.mp4> [ms]')
  process.exit(2)
}
const width = Number(w)
const height = Number(h)
const dir = '/tmp/iv-cast'
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir)

const browser = await chromium.launch({ executablePath: chrome })
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
})
const page = await context.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForSelector('.ss-stage')

const client = await context.newCDPSession(page)
const shots = []
client.on('Page.screencastFrame', async (evt) => {
  shots.push({ data: evt.data, ts: evt.metadata.timestamp })
  await client.send('Page.screencastFrameAck', { sessionId: evt.sessionId }).catch(() => {})
})
await client.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 92,
  maxWidth: width,
  maxHeight: height,
  everyNthFrame: 1,
})
await page.waitForTimeout(Number(ms))
await client.send('Page.stopScreencast').catch(() => {})
await browser.close()

if (shots.length < 8) {
  console.error('only', shots.length, 'frames')
  process.exit(1)
}
const t0 = shots[0].ts
const lines = ['ffconcat version 1.0']
shots.forEach((shot, i) => {
  const name = `f${String(i).padStart(4, '0')}.jpg`
  writeFileSync(`${dir}/${name}`, Buffer.from(shot.data, 'base64'))
  const next = shots[i + 1]?.ts ?? shot.ts + 1 / 30
  const dur = Math.max(0.001, next - shot.ts)
  lines.push(`file ${name}`, `duration ${dur.toFixed(4)}`)
})
lines.push(`file f${String(shots.length - 1).padStart(4, '0')}.jpg`)
writeFileSync(`${dir}/list.txt`, lines.join('\n'))
const span = shots[shots.length - 1].ts - t0
console.log(`${shots.length} frames over ${span.toFixed(2)}s`)

await new Promise((resolve, reject) => {
  const ff = spawn('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`,
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    '-movflags', '+faststart',
    out,
  ], { stdio: 'inherit' })
  ff.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('ffmpeg ' + code))))
})
console.log('wrote', out)
