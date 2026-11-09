export interface Env {
  SESSIONS: KVNamespace;
  APP_URL: string;
  BUFFER_CLIENT_ID: string;
  BUFFER_CLIENT_SECRET: string;
  // 32 random bytes, base64. Encrypts Buffer tokens at rest in KV.
  TOKEN_KEY: string;
}
