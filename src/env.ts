export interface Env {
  SESSIONS: KVNamespace;
  APP_URL: string;
  BUFFER_CLIENT_ID: string;
  BUFFER_CLIENT_SECRET: string;
  // 32 random bytes, base64. Encrypts Buffer tokens at rest in KV.
  TOKEN_KEY: string;
  // Optional. Raises GitHub's public API limit from 60 to 5,000 requests an hour.
  GITHUB_TOKEN?: string;
  // Optional. Without it the interviewer asks rule-based questions from the commits.
  ANTHROPIC_API_KEY?: string;
}
