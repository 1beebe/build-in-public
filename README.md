# The Interviewer

A weekly interview about what you built. Sign in with Buffer, paste a public GitHub repo, and talk for ten minutes with an interviewer who already knows what you shipped and what you've posted lately. When you're done it pulls out the stories worth telling, in your exact words, each with a few questions to help you shape it, and saves them to Buffer as Ideas tagged by your content pillars. You write the posts. The AI only asks.

Built by Ligaya Beebe for Buffer Commit 2026. Not made by or affiliated with Buffer.

## How it works

1. **Connect with Buffer.** OAuth 2.0 Authorization Code with PKCE. Buffer is the only sign-in. The PKCE verifier and the `state` value stay on the server, and the state is pinned to the browser by a short-lived cookie.
2. **Paste a public repo.** Read through GitHub's public REST API, so there's no GitHub sign-in.
3. **Pick pillars.** Up to three of your existing Buffer tags.
4. **Talk.** One live conversation, not a form. By voice it runs on OpenAI's realtime model over WebRTC; typed, DeepSeek (through MindStudio) answers each turn. Before it starts, Claude Sonnet (through MindStudio) reads the week's commits, pull requests and issues plus up to 20 of your Buffer posts from the last 30 days, and plans an arc: the story of the week, the decisions behind it, who it's for, what's next. A side panel shows the change being discussed, with the diff.
5. **Harvest.** When you stop, Claude Sonnet reads the whole conversation, finds the bigger story, and proposes one to five Ideas. Each has an angle for a title, your sentences under the question that drew them out (rebuilt from your transcript by sentence number, so the words are always exactly yours), and three short questions to help you develop it. Topics you didn't get to are offered as Ideas to answer later.
6. **Save.** You edit, untick and pick pillars, then the ones you keep go to Buffer as Ideas with your pillar tag (`aiAssisted: false` for your own words, `true` for saved-for-later questions).

## Buffer API use

- Scopes: `account:read ideas:read ideas:write posts:read posts:write offline_access`. `posts:write` is for the planned "Start a draft" button, which creates a draft linked to an Idea.
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
   - `MINDSTUDIO_API_KEY` (optional): turns on the AI interviewer: Claude Sonnet (through MindStudio) plans the agenda and harvests ideas, DeepSeek answers typed turns fast, voice questions (`textToSpeech`) and spoken answers (`transcribeAudio`), all through MindStudio's step API. `INTERVIEW_MODEL` and `VOICE_MODEL` vars override the model ids.
   - `OPENAI_API_KEY` (optional): turns on the live voice conversation. The browser connects to OpenAI's realtime model over WebRTC with a two-minute key the Worker mints (`/v1/realtime/client_secrets`), so the real key never reaches the page. `REALTIME_MODEL` and `REALTIME_VOICE` override the defaults (`gpt-realtime-2.1`, `marin`). The default voice is GPT-Live (`gpt-live-1`), OpenAI's full-duplex voice model, which listens while it talks, with a switch on the talk screen back to the classic realtime voice. For GPT-Live the page sends its WebRTC offer to `/api/live` and the Worker opens the session, so no key reaches the browser (`LIVE_MODEL` overrides the id). Each person can start twelve live sessions an hour (pausing and resuming counts as a new one), each capped at 20 minutes.
   - `ANTHROPIC_API_KEY` (optional): a fallback for questions when MindStudio isn't set. Without either key, the interviewer uses rule-based questions built from the commits.

Spoken answers are held in KV behind a random link for at most 10 minutes, only so the transcription service can fetch them, and are deleted as soon as the text comes back.

## Later

- A "Start a draft" button that turns a saved answer into a Buffer draft linked to its Idea.
- Search across past answers.
- A skill so a personal agent can run the interview with more context.
- An anonymous usage tally (people connected, interviews run, Ideas saved) on a private stats page, with nothing that identifies anyone.
