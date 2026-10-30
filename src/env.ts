export interface Env {
  SESSIONS: KVNamespace;
  APP_URL: string;
  BUFFER_CLIENT_ID: string;
  BUFFER_CLIENT_SECRET: string;
  // 32 random bytes, base64. Encrypts Buffer tokens at rest in KV.
  TOKEN_KEY: string;
  // Optional. Raises GitHub's public API limit from 60 to 5,000 requests an hour.
  GITHUB_TOKEN?: string;
  // Optional. Turns on DeepSeek questions and follow-ups, and voice, through MindStudio.
  MINDSTUDIO_API_KEY?: string;
  // Optional overrides for the MindStudio model ids.
  INTERVIEW_MODEL?: string;
  THINKING_MODEL?: string;
  VOICE_MODEL?: string;
  // Optional. Turns on the live voice conversation (OpenAI's realtime model).
  OPENAI_API_KEY?: string;
  OPEN_AI_KEY?: string; // the same key under the name it was first saved with
  REALTIME_MODEL?: string;
  REALTIME_VOICE?: string;
  LIVE_MODEL?: string; // GPT-Live, the full-duplex voice option
  // Optional fallback for questions when MindStudio isn't set up. Without
  // either key the interviewer asks rule-based questions from the commits.
  ANTHROPIC_API_KEY?: string;
}
