export interface CloudflareEnv {
  RATE_LIMITER: KVNamespace;
  enclavetools_db: D1Database;
  ASSETS: Fetcher;
  TURNSTILE_SITEKEY: string;
  TURNSTILE_WORKER_URL: string;
}
