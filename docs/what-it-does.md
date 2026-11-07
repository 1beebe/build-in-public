# What The Interviewer does

The single source of truth for user-facing behavior. When a change alters what a person sees, what the interviewer does, what comes back, or where it's saved, update this file in the same commit. Every other surface (landing page, README, build-flow diagram, plugin references) is checked against it before each deploy.

Checked through: `78083f5`

## The flow

1. **Sign in with Buffer.** OAuth with PKCE is the only sign-in. Users never paste an API key. The signed-in page goes straight to the interview, with no loading screen in between. If the load fails, or the page script can't run, a centered card says what happened and what to do, with Try again and a feedback link, instead of an empty page.
2. **Name the work.** A single field takes either a public GitHub repo or a sentence about what you're working on. A repo link followed by a few words counts as the repo, with the words kept as your note. Whatever work you point it to (a repo, or any other link in your note) is what the interview stays anchored in; your note and posts are context. Setup is three short bullets that say up front that no GitHub is needed. With one channel connected, setup just says which one the drafts are for; with several, you tap the ones you want. Starting goes straight to the talk screen, where a faint line of shimmering characters stands in for the first question and resolves into it when it arrives (the same line shows while it thinks about a typed answer). With a repo, the interviewer reads the README, the repo's top level, and that week's commits, pull requests (with their descriptions) and issues before it asks the first question. Its first question names something you shipped in plain words, never a PR title or commit hash, and skips housekeeping like version bumps, syncs and docs bookkeeping. At a natural break early on it asks once whether you want to get into the technical decisions or keep it big picture. Technical questions are about choices and tradeoffs (why this over that, what you dropped), never how the code works. It also reads up to 20 Buffer posts from the last 30 days, so it knows who you write for.
3. **Choose what you're making.** The options are posts about my week, a longer piece, or both. Long and both are owner-only unless `LONGFORM=on`. The owner can preview setup as everyone else sees it at `/app?as=guest`.
4. **Talk.**
   - Voice runs on GPT-Live, which speaks first and never hands its turn off to "think". Typed answers go to Claude Sonnet (`TALK_MODEL=deepseek` switches back to DeepSeek Flash).
   - An interview runs up to 10-15 minutes.
   - Every turn ends on one question.
   - The voice model has no tools and never says "let me take a look".
   - Short mode goes deep on one thread, then one more, in three beats: the moment (a specific thing from their week), what it meant in that moment, then the lesson (zoom out, or what they'd tell someone else facing it, anchored with one concrete example). Every question builds on the last answer in their words, with a few warm words that pick up their point or exact word (no generic praise). It asks one honest evidence question, leaves room after short or negative answers, and ends on something concrete. Asked why it's asking, it says what the question is for in the post.
   - Long mode stays on one piece and goes deeper. It wraps up when you say "that's the piece".
   - Both goes deep on the piece and takes one easy follow-up on any side story that could stand alone.
   - There's a "Next topic" button.
   - An interview holds about 30 answers (60 turns, 24,000 characters). Near the end the interviewer asks its last question, then wraps up and points to "I'm done. Find my stories", so nothing said is silently dropped.
5. **Hand back.** You choose what comes back: story drafts, an outline, or the transcript. The transcript is built in the browser with no model call. Drafts and outlines come from Claude Sonnet.
   - Draft mode works as a light editor: it adds transitions, tightens and fixes grammar, but adds no new claims.
   - Outlines use only your sentences.
   - An own-words check requires 65% of the words to be yours for drafts and 80% for outlines. A post that fails is retried once (on Claude Sonnet), then falls back to your cleaned-up words.
   - Swear words are masked and flagged.
   - The top three stories show first, and the rest sit behind "Show more".
   - While it works, a waiting screen shows a shimmering thread of code characters and one line at a time: what it's doing, and now and then a clean sentence you said (no fillers, fragments or swearing). When the stories are ready, a yellow sweep runs along the thread and the cards rise into place. Reduced motion shows a still thread.
6. **What comes back, by mode.**
   - **Short:** stories with a tension and a turn, each shaped for one of your channels and formats.
   - **Long:** one article of up to about 1,200 words in sections, plus title options from your own lines and a short share post per channel.
   - **Both:** the article and its share posts first, then standalone short-post stories from the same talk.
7. **Save.**
   - Posts go to Buffer Drafts, one per channel, and are never scheduled or published.
   - Under each draft come up to five questions to keep developing it, as bullets under a rule, marked to delete before posting. On X, Bluesky, Threads and Mastodon they go in as extra thread items, one question each, so the post never runs over the character limit. Posts for those networks are written to each one's limit (X 280, Bluesky 300, Threads and Mastodon 500), and any part still over it is split at sentence breaks into the thread.
   - If a draft can't be saved, that story is saved as an Idea instead.
   - A long-form article is saved as an Idea titled "INTERVIEW | Article | …", and can also be copied or downloaded as Markdown.

## Privacy and memory

- Run log: opt-out. Ticked by default, it keeps the transcript, harvest output and timings, sealed, for 14 days. Only the owner can read it, at `/runs`.
- Memory: opt-in. It keeps up to 12 open threads and 30 story titles, never transcripts, for one year after last use. Each item can be forgotten individually.
  - Setup greets a returning person with one line ("Welcome back. Last time, you were in the middle of …"). The next interview opens on the newest open thread it hasn't asked about yet, and steers away from stories already found.
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
| MAX_TURNS | 60 | src/index.ts |
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
