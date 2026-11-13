import { docs } from 'collections/server';
import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/plugins/lucide-icons';
import { getMDXComponents } from '@/components/mdx';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImageUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url:
      '/' +
      [page.locale, ...docsImageRoute.split('/'), ...segments]
        .filter(Boolean)
        .join('/'),
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url:
      '/' +
      [page.locale, ...docsContentRoute.split('/'), ...segments]
        .filter(Boolean)
        .join('/'),
  };
}

// Renders `llms.txt`, `llms-full.txt` and the per-page Markdown routes.
export const docsLlms = llms(source, {
  renderPage: async (page) => {
    // MDX components reach the processed Markdown as page props.
    const rendered =
      source.getPage(page.slugs, {
        language: page.locale,
        props: { components: getMDXComponents() },
      }) ?? page;
    return `# ${page.data.title} (${page.url})

${await rendered.data.getText('processed')}`;
  },
});
