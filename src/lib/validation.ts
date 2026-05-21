import { z } from 'zod';

export const submitFormSchema = z.object({
  github_url: z.string().url().optional().or(z.literal('')),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  category: z.string().min(1, "Category is required"),
  license: z.string().optional().or(z.literal('')),
  
  // We accept these as strings (JSON arrays or comma separated) from the FormData
  language: z.string().optional(),
  hardware: z.string().optional(),
  deployment: z.string().optional(),
  model_format: z.string().optional(),
  maturity: z.string().optional(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
