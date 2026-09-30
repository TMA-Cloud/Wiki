import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import lastModified from 'fumadocs-mdx/plugins/last-modified';

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      // Keep JSX as components so custom components can render their own
      // Markdown via `asMarkdown()` in the llms output.
      includeProcessedMarkdown: { output: 'function' },
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  // Exposes `page.data.lastModified` from git history.
  plugins: [lastModified()],
  mdxOptions: {
    // MDX options
  },
});
