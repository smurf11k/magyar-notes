import { defineCollection, z } from "astro:content";

const lessons = defineCollection({
  schema: z.object({
    title: z.string().default(""),
    description: z.string().optional(),
    hidden: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

export const collections = { lessons };
