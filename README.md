# The Interviewer

A weekly interview about what you built. It reads a public GitHub repo, asks three to five specific questions about that week's commits, pull requests and closed issues, and saves your answers word for word to Buffer as Ideas, tagged by your content pillars. You write the posts. The AI only asks.

Built by Ligaya Beebe for Buffer Commit 2026. Not made by or affiliated with Buffer.

## How it works

1. **Connect with Buffer.** OAuth 2.0 Authorization Code with PKCE. Buffer is the only sign-in. The PKCE verifier and the `state` value stay on the server, and the state is pinned to the browser by a short-lived cookie.
2. **Paste a public repo.** Read through GitHub's public REST API, so there's no GitHub sign-in.
3. **Pick pillars.** Up to three of your existing Buffer tags.
4. **Interview.** Questions point at one real piece of work each, and follow up on earlier answers saved in Buffer.
5. **Save.** Each answer becomes a Buffer Idea: the question as its title, your answer as its text (exactly as written), your chosen pillar tag, and `aiAssisted: false`. A question you skip is saved as an Idea too, marked `aiAssisted: true`, so you can answer it later.

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
   - `ANTHROPIC_API_KEY` (optional): without it, the interviewer uses rule-based questions built from the commits.

## Later

- A "Start a draft" button that turns a saved answer into a Buffer draft linked to its Idea.
- Search across past answers.
- A skill so a personal agent can run the interview with more context.
- An anonymous usage tally (people connected, interviews run, Ideas saved) on a private stats page, with nothing that identifies anyone.
