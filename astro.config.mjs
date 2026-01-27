import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkCallouts } from "./src/lib/remark-callouts";
import { remarkRevealTranslation } from "./src/lib/remark-reveal-translation";
import { remarkSteps } from "./src/lib/remark-steps";

// https://astro.build/config
export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [
        remarkGfm,
        remarkCallouts,
        remarkRevealTranslation,
        remarkSteps,
      ],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    }),
  ],
});
