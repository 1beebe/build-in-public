import { useEffect, useRef } from 'react'
import type { Act } from '../kit/act'
import { Stage } from '../kit/stage'
import { Phone } from '../kit/phone'
import { Bar } from '../kit/window'
import { Collapse, Count, Stream } from '../kit/motion'
import './interviewer.css'

// A phone walkthrough of The Interviewer, in the app's dark mode.
// Structure from examples/phone-touch (one phone, a flow that returns to
// its opening). The answer streams the way examples/ai-chat does, and the
// tally rolls the way a resolved figure does in examples/loading.
//
// Beats: paste a repo, select LinkedIn, start; the question and a spoken
// answer; the shimmer quotes that answer; draft cards deal in and the
// tally rolls. The poster is the done screen, cards landed.
//
// Real words: the question, the answer (also the quote and the hero draft),
// plus the screens the product actually titles.

const REPO = 'github.com/1beebe/build-in-public'
const QUESTION = "What did you ship this week that you're proud of?"
const ANSWER = 'I shipped the dark-mode chips, so a selected channel stays obvious.'
const WORDS = ANSWER.split(' ').length

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
  await a.wait(700)
  a.mark('paste')
  await a.click({ at: 'field', x: 0.97, y: 0.72 })
  a.put({ repo: REPO })
  await a.wait(700)
  a.mark('channel')
  await a.click({ at: 'linkedin', x: 0.9, y: 0.78 })
  a.put({ linkedin: true })
  await a.wait(420)
  a.mark('start')
  await a.click({ at: 'start', x: 0.86, y: 0.62 })
  a.mark('talk')
  a.put({ screen: 'talk', ask: true, voice: 'speaking' })
  await a.wait(1100)
  a.mark('answer')
  a.put({ voice: 'listening' })
  for (let i = 1; i <= WORDS; i++) {
    a.put({ words: i })
    await a.wait(90)
  }
  await a.wait(900)
  a.mark('wait')
  a.put({ screen: 'wait', quote: true })
  await a.wait(2800)
  a.mark('done')
  a.put({ screen: 'done', dealt: true })
  await a.wait(360)
  a.mark('tally')
  a.put({ wordsN: 128, draftsN: 3 })
  await a.wait(2800)
  a.mark('reset')
  await a.move('rest', { duration: 380 })
  a.put({ screen: 'setup', repo: '', linkedin: false, ask: false, words: 0, quote: false })
  await a.wait(460)
  await a.snap({ ...START })
  await a.wait(240)
}

const FILL = [74, 52, 66, 40, 78, 48, 58, 70, 44, 62]

function Filler() {
  return (
    <div className="iv-fill" aria-hidden>
      {FILL.map((w, i) => (
        <Bar key={i} w={`${w}%`} h={8} r={4} tone={i % 2 === 0 ? 3 : 2} />
      ))}
    </div>
  )
}

function Mark() {
  return (
    <svg className="iv-mark" viewBox="0 0 32 32" aria-hidden>
      <path
        d="M16 3C8.8 3 3 8.4 3 15.1c0 3.6 1.7 6.8 4.4 9L6.2 29l5.6-2.8c1.3.4 2.7.6 4.2.6 7.2 0 13-5.4 13-12.1S23.2 3 16 3Z"
        fill="#f6e016"
      />
      <circle cx="16" cy="15" r="4.2" fill="#d7361f" />
    </svg>
  )
}

function Check() {
  return (
    <svg className="iv-check" viewBox="0 0 16 16" aria-hidden>
      <path d="M3.2 8.2 6.3 11.3 12.8 4.7" fill="none" stroke="#0d2a1c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Shimmer({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const paint = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) {
        raf = requestAnimationFrame(paint)
        return
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.textBaseline = 'top'
      const cw = 9
      const lh = 15
      const t = now / 1000
      const head = ((t * 0.14) % 1.3) * w
      const cols = Math.ceil(w / cw)
      const rows = Math.ceil(h / lh)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cw
          const y = r * lh
          const curve = h * 0.52 + Math.sin(x / w * 5.1 + t * 0.6) * h * 0.2
          const behind = head - x
          const tail = behind < -cw * 2 ? 0 : behind < 0 ? 1 + behind / (cw * 2) : Math.exp(-behind / (w * 0.95))
          const off = (y - curve) / 16
          const v = Math.exp(-off * off * 1.5) * tail
          if (v < 0.07) continue
          const hot = behind >= 0 && behind < w * 0.12 ? (1 - behind / (w * 0.12)) * v : 0
          const cr = Math.round(110 + (246 - 110) * Math.min(1, hot * 1.6))
          const cg = Math.round(148 + (224 - 148) * Math.min(1, hot * 1.6))
          const cb = Math.round(122 + (22 - 122) * Math.min(1, hot * 1.6))
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${Math.min(0.92, v * 0.95).toFixed(3)})`
          ctx.fillText(glyphs[(c * 13 + r * 7 + ((t * 3) | 0)) % glyphs.length]!, x, y)
        }
      }
      raf = requestAnimationFrame(paint)
    }
    raf = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(raf)
  }, [active])
  return <canvas ref={ref} className="iv-shimmer-c" aria-hidden />
}

const CARDS = [
  { id: 'l', x: '-48px', y: '8px', r: '-7deg', d: 0, z: 1, front: false },
  { id: 'r', x: '48px', y: '8px', r: '7deg', d: 1, z: 2, front: false },
  { id: 'f', x: '0px', y: '20px', r: '0deg', d: 2, z: 3, front: true },
]

export default function Interviewer({ shape = 'portrait' }: { shape?: 'portrait' | 'square' }) {
  const portrait = shape !== 'square'
  return (
    <Stage<S>
      width={540}
      height={portrait ? 675 : 540}
      compact={portrait ? { below: 520, width: 358, height: 448 } : { below: 520, width: 358, height: 358 }}
      initial={START}
      poster={POSTER}
      script={script}
      play="loop"
      fill
      theme="dark"
      cursor={{ at: 'rest', style: 'touch', ripple: true }}
      className="iv"
    >
      {(s, _rect, layout) => (
        <Phone width={layout === 'compact' ? 302 : 452} dark wallpaper="#07150e" className="iv-phone">
          <div className="iv-app">
            <header className="iv-bar">
              <span className="iv-brand">
                <Mark />
                The Interviewer
              </span>
              <span className="iv-rest" data-target="rest" />
              <Bar w={54} h={8} r={4} tone={3} />
            </header>
            <div className="iv-screens">
              <section className="iv-screen" data-on={s.screen === 'setup' || undefined}>
                <div className="iv-title">What did you work on this week?</div>
                <div className="iv-steps" aria-hidden>
                  <Bar w="86%" h={8} r={4} tone={3} />
                  <Bar w="64%" h={8} r={4} tone={2} />
                </div>
                <div className="iv-panel">
                  <Bar w={148} h={8} r={4} tone={4} />
                  <div className="iv-field" data-target="field" data-filled={s.repo ? '' : undefined}>
                    <Bar w={168} h={8} r={4} tone={3} shrink={false} className="iv-ph" />
                    <span className="iv-repo" data-typing>
                      {s.repo}
                    </span>
                  </div>
                  <Bar w={112} h={8} r={4} tone={4} />
                  <span className="iv-chip" data-target="linkedin" data-on={s.linkedin || undefined}>
                    <Check />
                    <span className="iv-chip-label">LinkedIn</span>
                  </span>
                  <span className="iv-btn" data-target="start">
                    <span className="iv-rec" />
                    <span className="iv-btn-label">Start the interview</span>
                  </span>
                </div>
                <Filler />
              </section>

              <section className="iv-screen" data-on={s.screen === 'talk' || undefined}>
                <div className="iv-talk-head">
                  <div className="iv-orb" data-s={s.voice} aria-hidden>
                    <i />
                    <i />
                    <b />
                  </div>
                  <Collapse open={s.ask} reveal="drop">
                    <p className="iv-q">{QUESTION}</p>
                  </Collapse>
                </div>
                <Collapse open={s.words > 0} reveal="drop">
                  <div className="iv-you">
                    <Stream text={ANSWER} count={s.words} />
                  </div>
                </Collapse>
                <div className="iv-composer" aria-hidden>
                  <Bar w="70%" h={8} r={4} tone={3} />
                </div>
                <Filler />
              </section>

              <section className="iv-screen" data-on={s.screen === 'wait' || undefined}>
                <div className="iv-shimmer">
                  <Shimmer active={s.screen === 'wait'} />
                  <p className="iv-quote" data-on={s.quote || undefined}>
                    “{ANSWER}”
                  </p>
                </div>
                <Filler />
              </section>

              <section className="iv-screen" data-on={s.screen === 'done' || undefined}>
                <div className="iv-deck" aria-hidden>
                  {CARDS.map((card) => (
                    <div
                      key={card.id}
                      className="iv-card"
                      data-deal={s.dealt || undefined}
                      data-front={card.front || undefined}
                      style={{ ['--x' as string]: card.x, ['--y' as string]: card.y, ['--r' as string]: card.r, ['--d' as string]: card.d, zIndex: card.z }}
                    >
                      {card.front ? <p className="iv-draft">{ANSWER}</p> : null}
                    </div>
                  ))}
                </div>
                <div className="iv-payoff">Your drafts are in Buffer.</div>
                <div className="iv-tally">
                  <div className="iv-stat">
                    <span className="iv-num iv-num--words">
                      <Count value={s.wordsN} />
                    </span>
                    <span className="iv-stat-l">words</span>
                  </div>
                  <div className="iv-stat">
                    <span className="iv-num iv-num--drafts">
                      <Count value={s.draftsN} />
                    </span>
                    <span className="iv-stat-l">drafts</span>
                  </div>
                </div>
                <Filler />
              </section>
            </div>
          </div>
        </Phone>
      )}
    </Stage>
  )
}
