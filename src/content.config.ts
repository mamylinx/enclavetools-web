import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    author: z.string().default('Mamy Rakotomalala'),
  }),
});

export const collections = {
  'blog': blogCollection,
};
