# What The Interviewer does

The single source of truth for user-facing behavior. When a change alters what a person sees, what the interviewer does, what comes back, or where it's saved, update this file in the same commit. Every other surface (landing page, README, build-flow diagram, plugin references) is checked against it before each deploy.

Checked through: `43203ba`

## The flow

1. **Sign in with Buffer.** OAuth with PKCE is the only sign-in. Users never paste an API key.
2. **Name the work.** A single field takes either a public GitHub repo or a sentence about what you're working on. With a repo, the interviewer reads the README and that week's commits, pull requests and issues before it asks the first question. It also reads up to 20 Buffer posts from the last 30 days, so it knows who you write for.
3. **Choose what you're making.** The options are posts about my week, a longer piece, or both. Long and both are owner-only unless `LONGFORM=on`.
4. **Talk.**
   - Voice runs on GPT-Live, which speaks first. Typed answers go to DeepSeek Flash.
   - Every turn ends on one question.
   - The voice model has no tools and never says "let me take a look".
   - Short mode moves on once a point lands.
   - Long mode stays on one piece and goes deeper. It wraps up when you say "that's the piece".
   - Both goes deep on the piece and takes one easy follow-up on any side story that could stand alone.
   - There's a "Next topic" button.
5. **Hand back.** You choose what comes back: story drafts, an outline, or the transcript. The transcript is built in the browser with no model call. Drafts and outlines come from Claude Sonnet.
   - Draft mode works as a light editor: it adds transitions, tightens and fixes grammar, but adds no new claims.
   - Outlines use only your sentences.
   - An own-words check requires 65% of the words to be yours for drafts and 80% for outlines. A post that fails is retried once, then falls back to your cleaned-up words.
   - Swear words are masked and flagged.
   - The top three stories show first, and the rest sit behind "Show more".
6. **What comes back, by mode.**
   - **Short:** stories with a tension and a turn, each shaped for one of your channels and formats.
   - **Long:** one article of up to about 1,200 words in sections, plus title options from your own lines and a short share post per channel.
   - **Both:** the article and its share posts first, then standalone short-post stories from the same talk.
7. **Save.**
   - Posts go to Buffer Drafts, one per channel, and are never scheduled or published.
   - If Buffer refuses a draft, that story is saved as an Idea instead.
   - A long-form article is saved as an Idea titled "INTERVIEW | Article | …", and can also be copied or downloaded as Markdown.

## Privacy and memory

- Run log: opt-out. Ticked by default, it keeps the transcript, harvest output and timings, sealed, for 14 days. Only the owner can read it, at `/runs`.
- Memory: opt-in. It keeps up to 12 open threads and 30 story titles, never transcripts, for one year after last use. Each item can be forgotten individually.
  - The next interview opens on the newest open thread it hasn't asked about yet, and steers away from stories already found.
  - It's filed under the Buffer account, not the browser, so Disconnect doesn't erase it. Setup lists it with Forget per item, Download as Markdown, and Forget everything, which deletes it at once.

## Plugin

- Installs from this repo (`/plugin install interviewer --marketplace 1beebe/build-in-public`) and mirrors the interviewer and editor above, typed only.
- Keeps a `voice-library` folder of Markdown on the person's own computer: transcripts, stories, positions, open loops, phrases, people, and what's been used. Nothing is hosted.
- Saves to Buffer Drafts only through the person's own Buffer connection; otherwise drafts are shown to copy.
- Not mirrored: voice, usage limits, the run log, and the hosted memory screen. The own-words check is an instruction the agent follows, not code.

## Numbers the checker verifies

`npm run docs:check` compares each row with the code and fails on any mismatch.

| Constant | Value | File |
|---|---|---|
| TYPED_CALLS_PER_HOUR | 20 | src/index.ts |
| VOICE_STARTS_PER_HOUR | 4 | src/index.ts |
| HARVESTS_PER_DAY | 6 | src/index.ts |
| MAX_TURNS | 32 | src/index.ts |
| MAX_TRANSCRIPT_CHARS | 24_000 | src/index.ts |
| MAX_TURN_CHARS | 1_500 | src/index.ts |
| MAX_POSTS | 20 | src/buffer.ts |
| POST_DAYS | 30 | src/buffer.ts |
| MAX_OPEN | 12 | src/memory.ts |
| MAX_STORIES | 30 | src/memory.ts |
| SESSION_TTL | 60 * 60 * 24 * 30 | src/session.ts |
| MIN_OWN | { draft: 0.65, outline: 0.8 } | src/conversation.ts |

## Surfaces to check before each deploy

| Surface | File | Owner |
|---|---|---|
| Landing page, setup and done screens | `src/pages.ts` | front-end thread |
| README | `README.md` | front-end thread |
| Build-flow diagram | `public/build-flow.html` | front-end thread |
| Plugin interview and drafting rules | `plugin/skills/interviewer/references/*.md` | plugin thread |
| Eval personas and rubric | `evals/` | backend thread |

## Deploy checklist

1. Run `npm run docs:check`. It lists every behavior file changed since the "Checked through" commit and verifies the numbers above.
2. For each change on that list that a person would notice, confirm this file says it, then confirm each surface above agrees.
3. Set "Checked through" to the commit you're deploying, commit, then trigger the build.
