export interface CloudflareEnv {
  RATE_LIMITER: KVNamespace;
  enclavetools_logos: R2Bucket;
  enclavetools_db: D1Database;
  ASSETS: Fetcher;
  ADMIN_PASSWORD: string;
  ADMIN_SECRET: string;
}
