import { z } from 'zod';

export const submitFormSchema = z.object({
  github_url: z.string().url().max(500).optional().or(z.literal('')),
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  url: z.string().url("Must be a valid URL").max(500).optional().or(z.literal('')),
  category: z.string().min(1, "Category is required").max(100),
  license: z.string().max(100).optional().or(z.literal('')),
  
  // We accept these as strings (JSON arrays or comma separated) from the FormData
  language: z.string().max(500).optional(),
  hardware: z.string().max(500).optional(),
  deployment: z.string().max(500).optional(),
  model_format: z.string().max(500).optional(),
  maturity: z.string().max(100).optional(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});
