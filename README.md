# The Interviewer

An interview about what you built. Sign in with Buffer, paste a public GitHub repo or describe your week, and talk for up to 10-15 minutes with an interviewer who already knows what you shipped and what you've posted lately. When you're done it pulls out the stories worth telling, shapes each one into a lightly edited draft or an outline in only your words, adds a few questions to help you shape it, and saves the ones you choose to Buffer as drafts, one per channel. It won't make things up, and you finish the posts.

**Try it at [interviewer.lbeebe.com](https://interviewer.lbeebe.com).** There's nothing to install: sign in with your Buffer account and start talking.

Built by Ligaya Beebe for Buffer Commit 2026. Not made by or affiliated with Buffer.

**Or run it in your own agent.** The same interview is also a plugin that keeps a library of your own words on your computer and picks up where you left off each time. Nothing hosted: see [plugin/](plugin/README.md).

```
/plugin install interviewer --marketplace 1beebe/build-in-public
```

The plain list of what the app does lives in [docs/what-it-does.md](docs/what-it-does.md); this README and the landing page are checked against it before each deploy (`npm run docs:check`).

This README is for people reviewing how it works (the Buffer API use is below) and for builders who want to run their own copy. If you just want to use it, the link above is all you need.

## How it works

1. **Connect with Buffer.** OAuth 2.0 Authorization Code with PKCE. Buffer is the only sign-in. The PKCE verifier and the `state` value stay on the server, and the state is pinned to the browser by a short-lived cookie.
2. **Name the work.** One field accepts either a public GitHub repo or a sentence about what you're working on. GitHub needs no sign-in and private code stays out of reach. With a repo, the app reads its README and the week's commits, pull requests and issues, so the interviewer knows the project before the first question. Two optional choices sit below: what you're making (posts about your week, a longer piece, or both; long-form is owner-only for now, or for everyone with `LONGFORM=on`) and memory between interviews.
3. **Talk.** One live conversation, not a form. GPT-Live 1 handles spoken conversations; Claude Sonnet 5.5 (through MindStudio) handles typed turns. Every turn ends on one question. The voice model has no tools, so it answers from what it already knows instead of pretending to go look something up. In long-form, the interviewer stays on one piece and goes deeper: the backstory, a concrete example, the strongest objection, what you'd want a reader to take away. The app ranks a few useful threads from the week's work and recent posts. When a question points to a concrete pull request, commit, issue or post, an evidence panel appears with technical details tucked away; otherwise the conversation uses the full width.
4. **Harvest.** When you stop, you choose what comes back: story drafts from your words, an outline you'll write yourself, or just the transcript (built in the browser, no model call). For drafts and outlines, Claude Sonnet 5.5 finds the stories that have a tension and a turn, picks a channel and format for each from the channels you post on (text post, thread, carousel outline, image pairing, video script, infographic brief), and prepares every post the material supports. Outlines are built only from your sentences; drafts get a light editor's pass (transitions, tightening, grammar) but no new claims. A check confirms at least 80% (outlines) or 65% (drafts) of the words are yours, with structure and visual directions in [brackets], or it falls back to your cleaned-up words. Swear words are masked and flagged. The top three show first; the rest sit behind "Show more". A post that fails the own-words check is retried once before it falls back. With `CHALLENGER=on`, Claude reviews each post once and keeps, revises or drops it. In long-form, the harvest returns one article of up to about 1,200 words in sections, title options taken from your own lines, and a short post per channel that points to it; with both, the standalone short-post stories follow.
5. **Save.** You edit and untick, optionally choose a Buffer tag on each card, then save the ones you keep. Each becomes a draft on its channel in Buffer (Publish, then Drafts), never scheduled or published. X, Threads, Bluesky and Mastodon threads go in as real thread items. If Buffer won't take a draft (a plan limit, or a channel like Instagram that needs media), that story is saved as an Idea instead and the done screen says so. Buffer publishes Substack Notes but not newsletter issues or LinkedIn articles, so a long-form article is saved as an Idea ("INTERVIEW | Article | …") and offered as a copy and a Markdown download.

## Buffer API use

- Scopes: `account:read ideas:read ideas:write posts:read posts:write offline_access`. `posts:write` only saves drafts; nothing is ever scheduled or published.
- Every call goes through one client (`src/buffer.ts`) that reads the `RateLimit` headers on each response, stops starting new saves when the 15-minute window is nearly spent, and honors `Retry-After` on a 429 (a short wait is retried once; a long one is shown to the person as a plain message, and nothing is lost).
- Requests ask only for the fields they use, and related reads are combined into one GraphQL request. Tags and channels are cached in the session, so saving a story costs one Buffer request.
- Mutations used: `createPost` with `saveToDraft: true` (one per story, on the channel it was shaped for) and `createIdea` as the fallback.
- Refresh tokens are single-use, so a rotated token is saved before anything else happens, including when the request then fails.
- Tokens are encrypted with AES-GCM before they're stored in Workers KV, and sessions expire after 30 days.

## Run your own copy

Everything below is only for builders hosting their own instance. Cloudflare Workers, TypeScript, no framework. Swap in your own domain, Buffer app client and Buffer organization wherever the hosted values appear in `wrangler.toml` (`APP_URL`, `BUFFER_CLIENT_ID`, `OWNER_ORG_ID`, and the KV namespace id).

```sh
npm install
npm run check   # type-check, and confirm the signed-in page's script still parses
npm run dev     # local, needs a .dev.vars file with the secrets below
```

### One-time setup

1. **KV namespace.** In Cloudflare, go to Storage & Databases, then KV, and create a namespace called `interviewer-sessions`. Put its ID in `wrangler.toml` under `[[kv_namespaces]]`.
2. **Deploy from GitHub.** In Cloudflare, go to Workers & Pages, then Create, then Import a repository, and pick your fork. Builds run from the Worker's Deployments page (or on push, if you turn that on), or deploy from your machine with `npx wrangler deploy`.
3. **Domain.** In the Worker's Settings, go to Domains & Routes and add your own custom domain, then set `APP_URL` in `wrangler.toml` to it. The default `*.workers.dev` address works too.
4. **Buffer app client.** In Buffer, go to Settings, then API, then App Clients, then New Client. Enable the scopes above and set the redirect URI to `<your APP_URL>/callback`. Put the client ID in `wrangler.toml` as `BUFFER_CLIENT_ID`, and your Buffer organization id as `OWNER_ORG_ID` if you want the private `/stats` and `/runs` pages.
5. **Secrets.** In the Worker's Settings, under Variables and Secrets, add:
   - `BUFFER_CLIENT_SECRET`: from step 4.
   - `TOKEN_KEY`: 32 random bytes, base64 (`openssl rand -base64 32`).
   - `GITHUB_TOKEN` (optional): a fine-grained token with no permissions. It raises GitHub's limit for public reads from 60 to 5,000 an hour.
   - `MINDSTUDIO_API_KEY` (optional): turns on Claude Sonnet 5.5 for typed turns, harvesting, the own-words retry and the optional challenger, through MindStudio's step API. `TALK_MODEL` sets the typed-turn model (`deepseek` switches typed turns to DeepSeek Flash). `THINKING_MODEL` hard-pins the model id for the harvest, retry and challenger, and `INTERVIEW_MODEL` the Flash model id; otherwise the app selects an explicit Flash catalog entry rather than relying on catalog order.
   - `OPENAI_API_KEY` (optional): turns on GPT-Live, OpenAI's full-duplex spoken conversation. The page sends its WebRTC offer to `/api/live` and the Worker opens the session, so no key reaches the browser. `LIVE_MODEL` and `REALTIME_VOICE` override the defaults (`gpt-live-1`, `marin`). Each person can start four live sessions an hour, each capped at 20 minutes.
   - `ANTHROPIC_API_KEY` (optional): a fallback for typed follow-ups and harvesting when MindStudio isn't set.
   - Stats: the Worker keeps anonymous daily funnel counts and a rough estimate of OpenAI and MindStudio spend in KV. The owner (the Buffer organization in `OWNER_ORG_ID`) can see both, plus encrypted feedback reports, at `/stats`; everyone else gets a 404. App-wide brakes default to 120 voice minutes, 500 typed calls and 100 harvest calls per UTC day; override them with `DAILY_VOICE_MINUTES`, `DAILY_TYPED_CALLS` and `DAILY_HARVEST_CALLS`. Hard monthly caps still belong in the provider project settings.

## Feedback and telemetry

- Every page includes a small feedback/bug form. Messages and optional reply details are encrypted at rest, expire after 180 days, and appear only on the owner's private `/stats` page, with a rough device label like "iPhone · Safari".
- A daily, one-way IP hash limits feedback spam without storing the IP itself; it expires within two days.
- First-party funnel telemetry counts homepage visits, Buffer connection attempts and completions, interviews started (split by phone, tablet and desktop), stories saved and feedback sent. It contains no user or content identifiers and expires after 120 days. No third-party analytics script is loaded.

## Abuse and cost boundaries

- POST bodies are rejected above 64 KB before model work starts.
- Work notes are capped at 500 characters; typed answers at 1,500 characters.
- An interview holds at most 60 turns and 24,000 transcript characters. When there's room for about one more answer, the interviewer asks its last question and then points to "I'm done. Find my stories", in typed and voice alike. Live transcript sync is clamped to the same limits server-side.
- Each session gets at most 20 typed model calls and four voice starts per hour, and six harvests per day.
- Memory (opt-in): an unticked setup box keeps, under the Buffer account id rather than the browser session, up to 12 short "still working through" phrases and 30 story titles, sealed with `TOKEN_KEY`, for a year after last use. Never transcripts. Setup lists it with per-item Forget, a Markdown download and Forget everything (`/api/memory/forget`).
- Run log (opt-in): a setup checkbox, unticked by default, keeps that interview's transcript, harvest output, flags, timings, errors and a rough device label, sealed with `TOKEN_KEY`, for 14 days. Only the owner (`OWNER_ORG_ID`) can read them at `/runs`. Left unticked, nothing is kept.
- Harvest is idempotent: repeating the request returns the existing cards instead of paying for another model call.
- Model input is capped at 40,000 characters. Typed output is capped at 500 tokens and harvest output at 8,000 tokens.
- Repository text, recent posts, notes and transcripts are serialized as untrusted JSON and the system prompts explicitly forbid following instructions found inside them.
- Saving to Buffer caps draft (or fallback Idea) text at 10,000 characters and shaping prompts at 200 characters each.

## Also in this repo

- [`plugin/`](plugin/README.md): the same interview as an agent plugin, with a library of your own words kept on your computer.
- [`evals/`](evals/README.md): the scripted personas and scoring run against the live typed interviewer before a prompt change ships, plus a synthetic-voice test for GPT-Live.
- `demo/`: the source for the demo video and the looping clip on the landing page, built from the app's real screens.
- [`slop-cannon/`](slop-cannon/README.md): Slop Cannon, a separate joke app with its own Buffer app client, Worker and KV namespace. It shares no code, data or sessions with The Interviewer.

## Later

- A weekly check-in: an optional reminder to do an interview each week, picking up from what shipped since the last one.
- A come-back reminder: an optional calendar invite on the done screen (an .ics file linking back to the app), with email reminders as a later option.
- Search across past answers in the hosted app (the plugin already does this from your own files).
