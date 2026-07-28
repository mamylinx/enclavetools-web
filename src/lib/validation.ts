import { z } from 'zod';

const ALLOWED_DOMAINS = ['github.com', 'huggingface.co', 'kaggle.com', 'bitbucket.org', 'gitlab.com'];

/** Zod schema for validating tool submission URL and Turnstile token. */
export const submitUrlSchema = z.object({
  url: z.string().url("Must be a valid URL")
    .max(500, "URL too long")
    .refine((url) => {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, '');
        return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
      } catch {
        return false;
      }
    }, { message: "URL must be from: github.com, huggingface.co, kaggle.com, bitbucket.org, or gitlab.com" }),
  turnstileToken: z.string().min(1, "Turnstile token is required"),
});


