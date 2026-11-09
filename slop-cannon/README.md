# Slop Cannon

Type something mundane. Pick a flavor of AI slop. Slop Cannon turns it into B2B SaaS thought leadership, packed with every AI tell in the book, then fires a different post into every open slot in your Buffer queue for the next week. With a cannon sound.

There is no AI in it. Every post comes from hand-written templates and a seeded random number (`src/slop.ts`). AI slop is formulaic, so a formula can write it.

## How it works

- **Sign-in:** Buffer OAuth (PKCE), scopes `account:read posts:read posts:write offline_access`. Tokens are AES-GCM encrypted in KV.
- **Aim:** reads your channels, their posting schedules and timezones, and what's already scheduled; finds the open slots in the next 7 days, up to your plan's queue limit per channel (`limits.scheduledPosts`, 10 on Free).
- **Fire:** one `createPost` per slot at that exact time. Drafts by default (nothing publishes); live rounds behind a switch and a confirm.
- **Undo barrage:** deletes everything the last shot created.
- Text-only services only (X, LinkedIn, Threads, Bluesky, Mastodon, Facebook, Google Business). X, Bluesky and Threads get the short version.
- Guard rails: 30 posts a shot, 6 shots an hour, and it backs off when Buffer's shared 15-minute quota runs low.

## Setup

1. Buffer: create an app client named Slop Cannon with redirect URI `https://slopcannon.lbeebe.com/callback` and the scopes above. Put its client ID in `wrangler.toml`.
2. Cloudflare: create a KV namespace and put its id in `wrangler.toml`. Create a Worker from this repo with root directory `slop-cannon`, add the custom domain `slopcannon.lbeebe.com`, and set secrets `BUFFER_CLIENT_SECRET` and `TOKEN_KEY` (32 random bytes, base64: `openssl rand -base64 32`).
3. `npm install && npm run check`, then deploy.

Not affiliated with OpenAI, Anthropic, Google, xAI or Buffer.
