import { useEffect, useRef, useState } from 'react'
import type { Act } from '../kit/act'
import { Stage } from '../kit/stage'
import { Phone } from '../kit/phone'
import { Count, Stream } from '../kit/motion'
import './interviewer.css'

// Phone walkthrough of The Interviewer, dark mode, at a phone width.
// Hero copy, controls, the orb, the waiting ripple, and the done deck are
// the ones appPage() renders in src/pages.ts. The square crop hides the
// longer setup lines so a sentence is never sliced by the frame.

const REPO = 'github.com/1beebe/build-in-public'
const QUESTION = "What did you ship this week that you're proud of?"
const ANSWER = 'I finally shipped the onboarding flow my users kept asking for.'
const WORDS = ANSWER.split(' ').length
const CHANNELS = ['LinkedIn', 'X', 'Threads', 'Bluesky'] as const

type Screen = 'setup' | 'talk' | 'wait' | 'done'
type Voice = 'idle' | 'speaking' | 'listening'

type S = {
  screen: Screen
  repo: string
  linkedin: boolean
  ask: boolean
  words: number
  voice: Voice
  quote: boolean
  dealt: boolean
  wordsN: number
  draftsN: number
}

const START: S = {
  screen: 'setup',
  repo: '',
  linkedin: false,
  ask: false,
  words: 0,
  voice: 'idle',
  quote: false,
  dealt: false,
  wordsN: 0,
  draftsN: 0,
}

const POSTER: S = {
  screen: 'done',
  repo: REPO,
  linkedin: true,
  ask: true,
  words: WORDS,
  voice: 'idle',
  quote: true,
  dealt: true,
  wordsN: 128,
  draftsN: 3,
}

const script = async (a: Act<S>) => {
  await a.wait(640)
  a.mark('paste')
  await a.click({ at: 'field', x: 0.94, y: 0.62 })
  a.put({ repo: REPO })
  await a.wait(620)
  a.mark('channel')
  await a.click({ at: 'linkedin', x: 0.78, y: 0.55 })
  a.put({ linkedin: true })
  await a.wait(380)
  a.mark('start')
  await a.click({ at: 'start', x: 0.86, y: 0.5 })
  a.mark('talk')
  a.put({ screen: 'talk', ask: true, voice: 'speaking' })
  await a.wait(980)
  a.mark('answer')
  a.put({ voice: 'listening' })
  for (let i = 1; i <= WORDS; i++) {
    a.put({ words: i })
    await a.wait(86)
  }
  await a.wait(420)
  a.mark('harvest')
  await a.click({ at: 'harvest', x: 0.7, y: 0.55 })
  await a.wait(480)
  a.mark('wait')
  a.put({ screen: 'wait', quote: false, voice: 'idle' })
  await a.wait(860)
  a.put({ quote: true })
  await a.wait(1500)
  a.mark('done')
  a.put({ screen: 'done', dealt: true })
  await a.wait(320)
  a.mark('tally')
  a.put({ wordsN: 128, draftsN: 3 })
  await a.wait(1900)
  a.mark('reset')
  await a.move('rest', { duration: 360 })
  a.put({ screen: 'setup', repo: '', linkedin: false, ask: false, words: 0, quote: false, dealt: false, wordsN: 0, draftsN: 0 })
  await a.wait(420)
  await a.snap({ ...START })
  await a.wait(200)
}

function frozen(which: string): S {
  const filled: S = { ...START, repo: REPO, linkedin: true }
  if (which === 'setup') return filled
  if (which === 'talk') return { ...filled, screen: 'talk', ask: true, words: WORDS, voice: 'listening' }
  if (which === 'wait') return { ...filled, screen: 'wait', ask: true, words: WORDS, quote: true }
  return { ...POSTER }
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3C8.8 3 3 8.4 3 15.1c0 3.6 1.7 6.8 4.4 9L6.2 29l5.6-2.8c1.3.4 2.7.6 4.2.6 7.2 0 13-5.4 13-12.1S23.2 3 16 3Z" fill="#f6e016" />
      <circle cx="16" cy="15" r="4.2" fill="#d7361f" />
    </svg>
  )
}

// The wait in src/pages.ts: one thread of code characters in the dark-mode
// pearl colors, behind a single line. Cool is --code-cool, hot is --code-hot,
// and the body of the thread walks mint, sky, lilac, and rose.
function Shimmer({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const box = canvas?.parentElement
    if (!canvas || !box || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const glyphs = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const font = 12
    const lh = 16
    const cool = [110, 140, 120]
    const hot = [246, 224, 22]
    const iris = [85, 80]
    const pick = () => glyphs[(Math.random() * glyphs.length) | 0]
    let cw = 8
    let cols = 0
    let rows = 0
    let w = 0
    let h = 0
    let chars: string[] = []
    let raf = 0
    // The thread travels slowly. Start it already partway across, the way the
// real wait looks a few seconds in, so a short beat still shows the wave.
const t0 = performance.now() - 4800
    const hsl = (hh: number) => {
      const sat = iris[0] / 100
      const lit = iris[1] / 100
      const a = sat * Math.min(lit, 1 - lit)
      const f = (n: number) => {
        const k = (n + hh / 30) % 12
        return Math.round(255 * (lit - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      }
      return [f(0), f(8), f(4)]
    }
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = box.clientWidth
      h = box.clientHeight
      if (!w || !h) return
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = font + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
      ctx.textBaseline = 'top'
      cw = Math.ceil(ctx.measureText('M').width) + 1
      cols = Math.ceil(w / cw) + 1
      rows = Math.ceil(h / lh) + 1
      chars = Array.from({ length: cols * rows }, pick)
    }
    const curve = (x: number, t: number) => h * 0.5 + h * 0.22 * Math.sin((x / w) * 5.2 + t * 0.55) + h * 0.09 * Math.sin((x / w) * 11.3 - t * 0.9)
    const patch = (c: number, r: number, t: number) => 0.7 + 0.22 * Math.sin(c * 0.23 + t * 0.9) * Math.sin(r * 0.37 - t * 0.6) + 0.15 * Math.sin((c + r) * 0.11 - t * 0.4)
    const draw = (now: number) => {
      if (!w || !h) {
        raf = requestAnimationFrame(draw)
        return
      }
      const t = (now - t0) / 1000
      const head = ((t * 0.12) % 1.25) * w
      ctx.clearRect(0, 0, w, h)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cw
          const y = r * lh
          const behind = head - x
          const tail = behind < -cw * 2 ? 0 : behind < 0 ? 1 + behind / (cw * 2) : Math.exp(-behind / (w * 1.1))
          let v = 0
          if (tail > 0.02) {
            const off = (y - curve(x, t)) / 20
            const off2 = off * off
            v = (Math.exp(-off2 * 1.4) + 0.22 * Math.exp(-off2 * 0.18)) * tail
          }
          v *= patch(c, r, t)
          if (v < 0.05) continue
          const i = r * cols + c
          if (Math.random() < 0.2 * v) chars[i] = pick()
          const near = behind >= 0 && behind < w * 0.12 ? 1 - behind / (w * 0.12) : 0
          const hotMix = Math.min(1, Math.max(near * v * 1.4, (v - 0.55) / 0.4, 0))
          const pearl = hsl(150 + 90 * (1 + Math.sin((x / w) * 3.1 + (y / h) * 2.3 + t * 0.35)))
          const pe = Math.min(1, 0.35 + v * 1.6) * (1 - hotMix)
          const mix = (k: number) => (cool[k] + (pearl[k] - cool[k]) * pe + (hot[k] - cool[k]) * hotMix) | 0
          ctx.fillStyle = 'rgba(' + mix(0) + ',' + mix(1) + ',' + mix(2) + ',' + Math.min(0.75, v * 0.85).toFixed(3) + ')'
          ctx.fillText(chars[i] || 'a', x, y)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    size()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(() => size())
    ro.observe(box)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [active])
  return <canvas ref={ref} aria-hidden />
}

const CARDS = [
  { id: 'x', ch: 'X', x: '-12px', y: '10px', r: '-5deg', d: 0, z: 8 },
  { id: 't', ch: 'Threads', x: '12px', y: '10px', r: '5deg', d: 1, z: 8 },
  { id: 'l', ch: 'LinkedIn', x: '0px', y: '0px', r: '0deg', d: 2, z: 10, front: true },
]

function DraftCard({ card, dealt, text }: { card: (typeof CARDS)[number]; dealt: boolean; text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!dealt) {
      setSettled(false)
      return
    }
    const el = ref.current
    if (!el) return
    const name = getComputedStyle(el).animationName
    if (!name || name === 'none') setSettled(true)
  }, [dealt])
  return (
    <div
      ref={ref}
      className={`card${card.front ? ' front' : ''}${settled ? ' dealt' : ''}${settled && card.front ? ' glint' : ''}`}
      data-deal={dealt || undefined}
      style={{ ['--x' as string]: card.x, ['--y' as string]: card.y, ['--r' as string]: card.r, ['--d' as string]: String(card.d), ['--gd' as string]: '1.1s', zIndex: card.z }}
      onAnimationEnd={(e) => {
        if (e.animationName === 'deal') setSettled(true)
      }}
    >
      <div className="ch">
        <span>{card.ch}</span>
        <span>Draft</span>
      </div>
      <p>{text}</p>
    </div>
  )
}

const VOICE: Record<Voice, string> = { idle: '', speaking: 'Speaking', listening: 'Listening' }

export default function Interviewer({ shape = 'portrait', freeze = null }: { shape?: 'portrait' | 'square'; freeze?: string | null }) {
  const portrait = shape !== 'square'
  const held = freeze === 'setup' || freeze === 'talk' || freeze === 'wait' || freeze === 'done' ? frozen(freeze) : null
  useEffect(() => {
    const root = document.querySelector('.iv')
    if (!root) return
    const arm = (el: Element) => {
      if (!(el instanceof HTMLElement)) return
      if (!el.classList.contains('btn') && !el.classList.contains('chip')) return
      el.classList.remove('sheen')
      void el.offsetWidth
      el.classList.add('sheen')
      el.addEventListener('animationend', () => el.classList.remove('sheen'), { once: true })
    }
    const obs = new MutationObserver((records) => {
      for (const rec of records) {
        const el = rec.target
        if (el instanceof HTMLElement && el.hasAttribute('data-pressed')) arm(el)
      }
    })
    obs.observe(root, { attributes: true, subtree: true, attributeFilter: ['data-pressed'] })
    return () => obs.disconnect()
  }, [])
  return (
    <Stage<S>
      width={540}
      height={portrait ? 675 : 540}
      compact={portrait ? { below: 520, width: 358, height: 448 } : { below: 520, width: 358, height: 358 }}
      initial={held ?? START}
      poster={held ?? POSTER}
      script={held ? undefined : script}
      play="loop"
      fill
      theme="dark"
      cursor={held ? undefined : { at: 'rest', style: 'touch', ripple: true }}
      className="iv"
    >
      {(s, _rect, layout) => (
        <Phone width={layout === 'compact' ? 302 : 452} dark wallpaper="#07150e" className="iv-phone">
          <div className="iv-app" data-shape={shape}>
            <header className="top">
              <span className="wordmark">
                <Mark />
                <span>The Interviewer</span>
              </span>
              <span className="rest" data-target="rest" />
              <button className="btn text" type="button">
                Disconnect
              </button>
            </header>
            <div className="screens">
              <section className="screen" data-on={s.screen === 'setup' || undefined}>
                <header className="screen-h">
                  <h1>What did you work on this week?</h1>
                  <p className="steps">
                    <b>No GitHub needed.</b> A sentence about your work is enough. Have a public repo? Paste it and I'll read this week's work.{' '}
                    <span className="roomy">Talk for 5-10 minutes, then pick the stories to save to Buffer.</span>
                  </p>
                </header>
                <div className="panel">
                  <label className="fieldset">
                    <span className="lbl">A quick note or a repo link</span>
                    <span className="hint roomy">Up to 500 characters.</span>
                    <div className="ta" data-target="field" data-filled={s.repo ? '' : undefined}>
                      {s.repo ? <span className="repo">{s.repo}</span> : <span className="ph">I rebuilt the onboarding for… or github.com/you/project</span>}
                    </div>
                  </label>
                  <div className="fieldset">
                    <span className="lbl">Write drafts for</span>
                    <div className="chips">
                      {CHANNELS.map((name) => (
                        <span key={name} className="chip" data-target={name === 'LinkedIn' ? 'linkedin' : undefined} data-on={name === 'LinkedIn' && s.linkedin ? '' : undefined}>
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="row">
                    <button className="btn" type="button" data-target="start">
                      <span className="rec" />
                      Start the interview
                    </button>
                  </div>
                </div>
              </section>

              <section className="screen" data-on={s.screen === 'talk' || undefined}>
                <div className="panel convo">
                  <div className="talk-body">
                  <div className="head">
                    <div className="orb" data-s={s.voice} aria-hidden>
                      <i />
                      <i />
                      <b />
                    </div>
                    <div>
                      <h1>Your interview</h1>
                      <p className="voice">{VOICE[s.voice]}</p>
                    </div>
                  </div>
                  <ol className="log">
                    <li className="them">
                      <span className="who">The Interviewer</span>
                      {s.ask ? <p>{QUESTION}</p> : <p className="ghost"> </p>}
                    </li>
                    <li className="you" data-show={s.words > 0 || undefined}>
                      <span className="who">You</span>
                      <p>
                        <Stream text={ANSWER} count={s.words} />
                      </p>
                    </li>
                  </ol>
                  </div>
                  <div className="live">
                    <span className={`btn live-btn${s.voice === 'idle' ? '' : ' on'}`}>
                      <span className="rec" />
                      {s.voice === 'idle' ? 'Start talking' : 'Pause'}
                    </span>
                  </div>
                  <div className="composer roomy">
                    <span className="saylbl">Type your answer</span>
                    <div className="ta short">
                      <span className="ph">Enter sends. Shift+Enter for a new line.</span>
                    </div>
                    <div className="row">
                      <span className="btn small">Send</span>
                      <span className="btn small text">Next topic</span>
                    </div>
                  </div>
                  <div className="done-row">
                    <button className="btn quiet" type="button" data-target="harvest">
                      I'm done. Find my stories
                    </button>
                  </div>
                </div>
              </section>

              <section className="screen" data-on={s.screen === 'wait' || undefined}>
                <header className="screen-h">
                  <h1>Finding your stories</h1>
                </header>
                <div className="shimmer">
                  <Shimmer active={s.screen === 'wait'} />
                  <p className="shimmer-line" key={s.quote ? 'q' : 'r'}>
                    {s.quote ? (
                      <>
                        <span className="q">You said</span>
                        <span className="said">{`“${ANSWER}”`}</span>
                      </>
                    ) : (
                      'Reading the conversation back. This takes about half a minute'
                    )}
                  </p>
                </div>
              </section>

              <section className="screen" data-on={s.screen === 'done' || undefined}>
                <div className="panel done">
                  <div className="deck" aria-hidden>
                    {CARDS.map((card) => (
                      <DraftCard key={card.id} card={card} dealt={s.dealt} text={ANSWER} />
                    ))}
                  </div>
                  <h1>Your drafts are in Buffer.</h1>
                  <div className="tally">
                    <div>
                      <b className="num words">
                        <Count value={s.wordsN} />
                      </b>
                      <span className="stat">words you said</span>
                    </div>
                    <div>
                      <b className="num drafts">
                        <Count value={s.draftsN} />
                      </b>
                      <span className="stat">drafts in Buffer</span>
                    </div>
                  </div>
                  <div className="row open">
                    <span className="btn">Open my drafts in Buffer</span>
                  </div>
                  <p className="next-week roomy">See you next week.</p>
                </div>
              </section>
            </div>
          </div>
        </Phone>
      )}
    </Stage>
  )
}
