# The Interviewer

A weekly interview about what you built. Sign in with Buffer, paste a public GitHub repo or describe your week, and talk for ten minutes with an interviewer who already knows what you shipped and what you've posted lately. When you're done it pulls out the stories worth telling, shapes each one into a lightly edited draft or an outline in only your words, adds a few questions to help you shape it, and saves the ones you choose to Buffer as drafts, one per channel. It won't make things up, and you finish the posts.

Built by Ligaya Beebe for Buffer Commit 2026. Not made by or affiliated with Buffer.

## How it works

1. **Connect with Buffer.** OAuth 2.0 Authorization Code with PKCE. Buffer is the only sign-in. The PKCE verifier and the `state` value stay on the server, and the state is pinned to the browser by a short-lived cookie.
2. **Name the work.** One field accepts either a public GitHub repo or a sentence about what you're working on. GitHub needs no sign-in and private code stays out of reach.
3. **Talk.** One live conversation, not a form. GPT-Live 1 handles spoken conversations; DeepSeek Flash (through MindStudio) handles typed turns. The app ranks a few useful threads from the week's work and recent posts. When a question points to a concrete pull request, commit, issue or post, an evidence panel appears with technical details tucked away; otherwise the conversation uses the full width.
4. **Harvest.** When you stop, you choose what comes back: story drafts from your words, an outline you'll write yourself, or just the transcript (built in the browser, no model call). For drafts and outlines, Claude Sonnet 5.5 finds the stories that have a tension and a turn, picks a channel and format for each from the channels you post on (text post, thread, carousel outline, image pairing, video script, infographic brief), and prepares every post the material supports. Outlines are built only from your sentences; drafts get a light editor's pass (transitions, tightening, grammar) but no new claims. A check confirms at least 80% (outlines) or 65% (drafts) of the words are yours, with structure and visual directions in [brackets], or it falls back to your cleaned-up words. Swear words are masked and flagged. The top three show first; the rest sit behind "Show more". With `CHALLENGER=on`, DeepSeek reviews each post once and keeps, revises or drops it.
5. **Save.** You edit and untick, optionally choose a Buffer tag on each card, then save the ones you keep (`aiAssisted: true`, since the AI chose and arranged the words).

## Buffer API use

- Scopes: `account:read ideas:read ideas:write posts:read offline_access`.
- Every call goes through one client (`src/buffer.ts`) that reads the `RateLimit` headers on each response, stops starting new saves when the 15-minute window is nearly spent, and honors `Retry-After` on a 429 (a short wait is retried once; a long one is shown to the person as a plain message, and nothing is lost).
- Requests ask only for the fields they use, and related reads are combined into one GraphQL request. Tags are cached in the session, so saving an answer costs one Buffer request.
- Refresh tokens are single-use, so a rotated token is saved before anything else happens, including when the request then fails.
- Tokens are encrypted with AES-GCM before they're stored in Workers KV, and sessions expire after 30 days.

## Run it

Cloudflare Workers, TypeScript, no framework.

```sh
npm install
npm run check   # type-check
npm run dev     # local, needs a .dev.vars file with the secrets below
```

### One-time setup

1. **KV namespace.** In Cloudflare, go to Storage & Databases, then KV, and create a namespace called `interviewer-sessions`. Put its ID in `wrangler.toml` under `[[kv_namespaces]]`.
2. **Deploy from GitHub.** In Cloudflare, go to Workers & Pages, then Create, then Import a repository, and pick this repo. Every push to `main` deploys.
3. **Domain.** In the Worker's Settings, go to Domains & Routes and add `interviewer.lbeebe.com` as a custom domain.
4. **Buffer app client.** In Buffer, go to Settings, then API, then App Clients, then New Client. Choose a private client, enable the scopes above, and set the redirect URI to `https://interviewer.lbeebe.com/callback`. Put the client ID in `wrangler.toml` as `BUFFER_CLIENT_ID`.
5. **Secrets.** In the Worker's Settings, under Variables and Secrets, add:
   - `BUFFER_CLIENT_SECRET`: from step 4.
   - `TOKEN_KEY`: 32 random bytes, base64 (`openssl rand -base64 32`).
   - `GITHUB_TOKEN` (optional): a fine-grained token with no permissions. It raises GitHub's limit for public reads from 60 to 5,000 an hour.
   - `MINDSTUDIO_API_KEY` (optional): turns on DeepSeek Flash typed follow-ups and Claude Sonnet 5.5 harvesting through MindStudio's step API. The app selects an explicit Flash catalog entry rather than relying on catalog order. `INTERVIEW_MODEL` and `THINKING_MODEL` hard-pin provider model ids.
   - `OPENAI_API_KEY` (optional): turns on GPT-Live, OpenAI's full-duplex spoken conversation. The page sends its WebRTC offer to `/api/live` and the Worker opens the session, so no key reaches the browser. `LIVE_MODEL` and `REALTIME_VOICE` override the defaults (`gpt-live-1`, `marin`). Each person can start four live sessions an hour, each capped at 20 minutes.
   - `ANTHROPIC_API_KEY` (optional): a fallback for typed follow-ups and harvesting when MindStudio isn't set.
   - Stats: the Worker keeps anonymous daily funnel counts and a rough estimate of OpenAI and MindStudio spend in KV. The owner (the Buffer organization in `OWNER_ORG_ID`) can see both, plus encrypted feedback reports, at `/stats`; everyone else gets a 404. App-wide brakes default to 120 voice minutes, 500 typed calls and 100 harvest calls per UTC day; override them with `DAILY_VOICE_MINUTES`, `DAILY_TYPED_CALLS` and `DAILY_HARVEST_CALLS`. Hard monthly caps still belong in the provider project settings.

## Feedback and telemetry

- Every page includes a small feedback/bug form. Messages and optional reply details are encrypted at rest, expire after 180 days, and appear only on the owner's private `/stats` page.
- A daily, one-way IP hash limits feedback spam without storing the IP itself; it expires within two days.
- First-party funnel telemetry counts homepage visits, Buffer connection attempts and completions, interviews started, Ideas saved and feedback sent. It contains no user or content identifiers and expires after 120 days. No third-party analytics script is loaded.

## Abuse and cost boundaries

- POST bodies are rejected above 64 KB before model work starts.
- Work notes are capped at 500 characters; typed answers at 1,500 characters.
- An interview holds at most 32 turns and 24,000 transcript characters. Live transcript sync is clamped to the same limits server-side.
- Each session gets at most 20 typed model calls and four voice starts per hour, and six harvests per day.
- Run log (opt-out): a setup checkbox, ticked by default, keeps that interview's transcript, harvest output, flags, timings and errors, sealed with `TOKEN_KEY`, for 14 days. Only the owner (`OWNER_ORG_ID`) can read them at `/runs`. Unticked, nothing is kept.
- Harvest is idempotent: repeating the request returns the existing cards instead of paying for another model call.
- Model input is capped at 40,000 characters. Typed output is capped at 500 tokens and harvest output at 8,000 tokens.
- Repository text, recent posts, notes and transcripts are serialized as untrusted JSON and the system prompts explicitly forbid following instructions found inside them.
- Saving to Buffer caps Idea text at 10,000 characters and shaping prompts at 200 characters each.

## Later

- A "Start a draft" button that turns a saved answer into a Buffer draft linked to its Idea.
- Search across past answers.
- A skill so a personal agent can run the interview with more context.
