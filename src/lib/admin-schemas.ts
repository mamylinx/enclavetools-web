import { z } from 'zod';

export const contentUpdateSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
});

export const categorySchema = z.object({
  category_slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  icon_name: z.string().optional(),
  og_image: z.string().optional(),
  sort_order: z.number().int().optional(),
});

export const complementSchema = z.object({
  category_slug: z.string().min(1).max(100),
  complements: z.array(z.string()),
});

export const compareRowSchema = z.object({
  id: z.number().int().optional(),
  label: z.string().min(1).max(200),
  field_key: z.string().min(1).max(100),
  sort_order: z.number().int().optional(),
});

export const filterOptionSchema = z.object({
  id: z.number().int().optional(),
  group_key: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  sort_order: z.number().int().optional(),
  active: z.number().int().optional(),
});

export const legalPageSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  body: z.string().optional(),
});

export const marketingCardSchema = z.object({
  id: z.number().int().optional(),
  type: z.string().optional(),
  label: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  cta: z.string().optional(),
  url: z.string().optional(),
  logo: z.string().optional(),
  sort_order: z.number().int().optional(),
  active: z.number().int().optional(),
});

export const toolRejectSchema = z.object({
  explanation: z.string().optional(),
});
