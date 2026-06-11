import { z } from 'zod';

const ALLOWED_DOMAINS = ['github.com', 'huggingface.co', 'kaggle.com', 'bitbucket.org', 'gitlab.com'];

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

export const adminLoginSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  turnstileToken: z.string().min(1, "Turnstile token is required"),
});
