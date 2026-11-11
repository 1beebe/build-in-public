# Handoff brief: The Interviewer (Buffer Commit 2026)

This is for a coding agent taking over The Interviewer and its Buffer Commit submission. Read it whole before touching anything. It's current as of **Nov 11 2026, 15:10 UTC**, with production running `main` at `29c0e2f`.

**Deadline:** the submission form closes **Nov 13 2026 at 11:59pm PT** (2:59am ET Saturday; the owner, Ligaya, is in Florida, so ET). Judging runs about **Nov 16–20**, and the app has to stay live and working the whole time.

## 1. The owner's standing rules (do not break these)

1. **Never write her post wording, voiceover lines, text-card wording, or summary prose as final copy.** You can lay out a structure or draft for her to rework, and mark it clearly as a placeholder or as hers to edit. Post wording is always hers.
2. **Buffer OAuth is the only sign-in.** Users never paste an API key. Don't add GitHub sign-in or any other login. Public GitHub repos are read through the public API with no auth.
3. **Deploy only with her explicit OK.** Pushing to `main` doesn't deploy (see §4). Never trigger a production build until she has said "deploy" (or equivalent) about that specific change. Merging a PR needs her OK too.
4. **Write to her in prose and be direct.** Lead with the answer or the decision she needs to make. Keep it short, skip the hedging, and don't hand her bullet walls. Ask one thing at a time, and own the QA yourself. She dislikes ping-pong, where she ends up as your tester.
5. **Minimal setup friction for users.** Every extra field or step needs a reason.
6. **Prefer loose persona prompts over rule lists** for the conversational model. Rule lists made the interviewer formulaic.
7. **The repo is public.** Never commit real user transcripts, eval fixtures, names of testers, or anything from `/runs`. Never commit secret values.
8. **Slop Cannon (`slop-cannon/`)** is her second, separate entry. She edits it herself. Don't change or deploy it unless she asks, and always pull first.

## 2. What it is

Hosted at **https://interviewer.lbeebe.com**. A builder signs in with Buffer, pastes a public GitHub repo or writes one sentence about their week, and does a 10–15 minute live interview (voice or typed) with an interviewer that has already read their week's commits, PRs and issues, plus their recent Buffer posts. When they're done, it finds the stories that have a tension and a turn, shapes each one for a channel they post on, in their own words (an own-words guard enforces this), and saves the ones they keep to Buffer as **drafts**. Nothing is ever scheduled or published.

`docs/what-it-does.md` is the **single source of truth** for user-facing behavior. `README.md` covers the Buffer API use, limits and self-hosting. `/build-flow` (in `public/build-flow.html`) is a diagram of the flow.

## 3. Architecture and stack

- **One Cloudflare Worker** (`name = "interviewer"`, `wrangler.toml`), TypeScript, no framework, about 5,100 lines in `src/`. Static assets come from `public/` through `[assets]`.
- **Workers KV**, binding `SESSIONS`: sessions (30-day expiry; Buffer tokens AES-GCM encrypted with `TOKEN_KEY`), counters for `/stats`, spend estimates, the opt-in memory, the opt-in run log (`run:*`, 14 days), and feedback (encrypted, 180 days).
- **Buffer**: OAuth 2.0 Authorization Code with PKCE. Scopes are `account:read ideas:read ideas:write posts:read posts:write offline_access`. The redirect is `/callback`. Refresh tokens are single-use, so the rotated token is saved first. It uses the GraphQL API through one client, `src/buffer.ts`, which reads the RateLimit headers and honors `Retry-After` on a 429. Writes: `createPost` with `saveToDraft: true` (thread items for X, Threads, Bluesky and Mastodon), and `createIdea` as the fallback and for long-form articles. The Buffer app client is "The Interviewer", and its public client ID is in `wrangler.toml`.
- **Voice**: OpenAI **GPT-Live** (`gpt-live-1`, voice `marin`), full-duplex over WebRTC. The page posts its SDP offer to `/api/live`, and the Worker opens the session at OpenAI (`src/realtime.ts`), so no key reaches the browser. The page script for voice is `startGptLive` in `src/pages.ts`. Since PR #94 (deployed today), the voice speaks the on-screen opening question almost verbatim.
- **Text models through MindStudio** (`src/mindstudio.ts`, step API, start then poll): **Claude Sonnet** (`claude-5-5-sonnet`) handles typed turns, the harvest, the own-words retry and the optional challenger. `TALK_MODEL=deepseek` switches typed turns to DeepSeek Flash. `ANTHROPIC_API_KEY` is a fallback only when there's no MindStudio key. The prompts live in `src/conversation.ts` (CONVERSE_V2, LIVE_RULES, HARVEST, ARTICLE, FORMATS) and `src/interview.ts`.
- **GitHub**: public REST reads only (`src/github.ts`): README, top level, commits, PRs with their bodies, and issues. It looks back 7 days, or up to 90 if the week was quiet.
- **Other files**: `src/index.ts` (routes, caps, owner checks), `src/session.ts`, `src/runs.ts` (opt-in run log), `src/memory.ts` (opt-in memory), `src/spend.ts` (spend meter and daily brakes), `src/feedback.ts`, `src/crypto.ts`.
- **Routes**: `/`, `/app` (`/app?as=guest` gives the owner the non-owner view), `/connect`, `/callback`, `/logout`, `/privacy`, `/terms`, `/feedback`, `/build-flow`, owner-only `/stats` and `/runs` (404 for everyone else; owner = the Buffer org in `OWNER_ORG_ID`), and `/api/{setup,start,say,voice-turns,live,more,harvest,save,state,source,reset,memory/forget,eval/answer}`.
- **Consent**: setup requires an "I agree to the Terms and Privacy note" box (the server refuses `/api/setup` without `agreeTerms: true`). The run log and memory are both **opt-in** (unticked).
- **Limits**: per session per hour, 20 typed calls and 4 voice starts (each capped at 20 minutes), plus 6 harvests a day. App-wide per UTC day: 120 voice minutes, 500 typed calls, 100 harvests. The owner gets a multiplier through `capFactor`.
- **Also in the repo**: `plugin/` (a Claude Code plugin, v0.4.0, that mirrors the interview and drafting prompts in plain language; keep it in sync when CONVERSE, HARVEST, ARTICLE or the guard change), `demo/` (a Vite/React "stageshow" loop for the landing page; exports in `demo/exports/`), and `slop-cannon/` (a separate Worker; see rule 8).

## 4. How to deploy

The Worker is connected to this repo through **Cloudflare Workers Builds**, but **push-to-main auto-build does not fire**. A build has to be triggered by hand, and only after she says to deploy (rule 3).

Before every deploy:
1. `npm install`, then `npm run check`. That's the type-check plus `scripts/app-script-check.mjs`, which parses the signed-in page's inline script. A stray `\"` inside the `APP_SCRIPT` template literal once blanked the whole app, so never skip it after editing `src/pages.ts`.
2. `npm run docs:check`. If behavior changed, update `docs/what-it-does.md`, make sure the README, landing copy in `pages.ts`, `public/build-flow.html` and the plugin references agree with it, then bump its "Checked through" sha.
3. Merge to `main` (with her OK).

Ways to trigger:
- **Dashboard**: Workers & Pages, then `interviewer`, then Deployments/Builds, then run a build of `main`.
- **API from her signed-in dashboard tab** (how earlier agents did it): `POST /api/v4/accounts/<account id>/builds/triggers/<interviewer trigger uuid>/builds` with body `{"branch":"main"}` and header `x-cross-site-security: dash`, then poll `/builds/builds/<build uuid>`. The account ID is in her dashboard URL, and the trigger UUID is in the Worker's build settings. A build can sit queued for 5–10 minutes. A failure with CF API 10500 after upload is transient, so just re-trigger.
- **CLI**: `npx wrangler deploy`, which needs her Cloudflare login on the machine.

After deploying, verify on the live site through her browser, since sandboxed agents often can't reach `interviewer.lbeebe.com` directly. Then read Worker errors through Workers Observability: in the dashboard, or `POST .../workers/observability/telemetry/query` with view `events` and filters `$metadata.service = interviewer`, `$metadata.level = error`.

## 5. Secrets and config (names only)

These are set in the Cloudflare dashboard (Worker, Settings, Variables and Secrets). They're never in the repo, and `.dev.vars` is gitignored.

| Name | Required | Purpose |
|---|---|---|
| `BUFFER_CLIENT_SECRET` | yes | Buffer app client secret |
| `TOKEN_KEY` | yes | 32 random bytes, base64; encrypts tokens, memory, run log and feedback |
| `OPENAI_API_KEY` (legacy name `OPEN_AI_KEY` also read) | for voice | GPT-Live |
| `MINDSTUDIO_API_KEY` | for typed and harvest | Claude Sonnet / DeepSeek through MindStudio |
| `GITHUB_TOKEN` | optional | No-permission token; raises the public GitHub limit |
| `ANTHROPIC_API_KEY` | optional | Fallback when MindStudio isn't set |

Plain vars (`wrangler.toml` or the dashboard): `APP_URL`, `BUFFER_CLIENT_ID`, `OWNER_ORG_ID`, and the optional `TALK_MODEL`, `THINKING_MODEL`, `INTERVIEW_MODEL`, `LIVE_MODEL`, `REALTIME_VOICE`, `CHALLENGER` (`on` turns on the review pass), `LONGFORM` (`on` opens long-form to everyone; otherwise owner-only), `DAILY_VOICE_MINUTES`, `DAILY_TYPED_CALLS`, `DAILY_HARVEST_CALLS`. Check the dashboard for which overrides are actually set.

Spend: OpenAI and MindStudio are the only paid APIs. A voice interview costs about $1, a typed one pennies. She has a dedicated OpenAI project with a hard limit and a MindStudio workspace budget. `/stats` shows a rough spend meter. An OpenAI 429 for the spend cap shows users a "Voice is resting" message.

## 6. How to test

Production is the only environment. There's no staging, and `npm run dev` works locally with a `.dev.vars` file. All live testing happens in **her signed-in browser tab** on the app.

- **Static checks**: `npm run check` and `npm run docs:check`.
- **Conversation and harvest evals** (`evals/`, see `evals/README.md` and `RUBRIC.md`): paste `evals/runner.js` into her `/app` tab (the page's CSP blocks loading it from GitHub), then call `window.__evalStart({ personas, fixtures })` and poll `window.__eval`. It runs 8 typed personas (6 scripted in `personas.json` plus 2 model-simulated through the owner-only `/api/eval/answer`) and re-harvests fixed transcripts. It never saves to Buffer, and it restores her setup and clears the session at the end. Score with `node evals/score.mjs results.json fixtures/ <commit>`. **The fixtures are real transcripts and live only in her private project folder**, not in the repo, so ask her for them. The bar she set: drafts score 4+ on "I'd post this after light edits", with zero invented claims. Last full run, Nov 8 (v2 prompt), was all green. Interview tuning has been **frozen since Nov 5**, so don't retune prompts before judging unless a real user hits a bug.
- **Voice harness** (`evals/voice/harness.js`): inject it into her `/app` page after setup and `/api/start`. It swaps the mic for synthetic speech clips (`deadend-clips.json`), runs the page's own GPT-Live session, and records the transcript to `localStorage.voiceTest`. A lighter check of the opening only: open your own `RTCPeerConnection` in her tab with a silent oscillator track, `POST /api/live`, and send `session.commentary.append` after `session.started`. That doesn't touch session turns. Each voice start counts against the hourly cap.
- **After any test, call `/api/reset`** so she never sees fake answers. Don't save test drafts to her Buffer unless she asks.
- **Real usage**: owner-only `/stats` (anonymous funnel counts and spend; these include her testing and evals, so don't present the totals as outside users) and `/runs` (opt-in transcripts, private, never to be quoted or committed).

## 7. What's open, in priority order

1. **Keep production stable through Nov 20.** The code freeze started Nov 11. Fix only what a judge or real user would hit, with her OK on each deploy. Don't push risky refactors.
2. **Demo video (≤2:00, live product against the live Buffer API, no slides).** It's being cut now from her first iPhone screen-recording take, which is in `~/Downloads` on her Mac. Her decision: use that take and cut around the opening, where the on-screen question didn't match the spoken one (fixed since in PR #94). No re-shoot. The beat sheet is in her private submission plan doc (she has the link; it's a Claude Doc titled "Buffer Commit submission plan"): a ~1:50 cut in the style of Anthropic's launch videos. That means story first, the real product throughout, both voices captioned, music low, a few text cards, and no narrator. The text-card wording is **hers** (leave placeholders), and the music is her pick of a licensed track. Opening shots: her real commit list and an empty Buffer composer. End card: interviewer.lbeebe.com, "Built on the Buffer API". Never show `/stats` rows or anyone else's transcript. Deliver as 16:9 with burned-in captions, then she uploads it unlisted.
3. **Written summary (~300 words).** A first-person draft is in the plan doc for her to rework. Before she pastes it, she needs to check three things: the real-user count, whether all her Commit posts started in the Interviewer (the dogfooding line), and whether to name the models.
4. **Submission form.** It takes the video, the hosted link, the summary, her legal name, email and handles (hers to fill), the Buffer app client ID (in `wrangler.toml`; confirm it in Buffer settings), and up to 5 build-in-public posts made Oct 15–Nov 13 (she has 3). The plan was to submit Thu Nov 12 and keep Fri Nov 13 as slack. Tell her to screenshot the confirmation.
5. **Spend caps for judging.** Confirm the OpenAI project limit and MindStudio budget can carry judges' runs from Nov 16 to 20, so voice can't go dark mid-judging.
6. **Judge-path test** from a fresh, non-owner Buffer account (no channels, free plan, no repo). This is still unchecked in the plan. You script it, and she signs in. `/app?as=guest` previews the non-owner setup but isn't a full substitute.
7. **Brag stats** (blocked, low priority): five logged runs from Nov 7–8 still need sorting into hers or real users'. That needs her signed-in `/runs` tab. The anonymous `/stats` totals can't be split.

**Known quirks, not bugs to fix now**:
- Some Android sign-ins show Buffer's own "Your connection request has expired" page. That's on Buffer's side, before our `/callback`. The workaround is to open the link in Chrome and log into buffer.com first.
- The interviewer sometimes asks two-part "X, and Y?" questions. She's OK with that.
- The voice model has no tools by design.

## 8. Where the history lives

`git log` is detailed (each PR body explains its why). The decision history and running notes are in her private project workspace, which isn't in this repo. Ask her for anything about a past decision instead of guessing, and don't relitigate decisions already in the code: GPT-Live only, no pillars at setup, saves go to drafts, opt-in logs, prompt v2 for everyone.
