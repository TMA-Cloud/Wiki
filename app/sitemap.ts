import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // `trailingSlash: true` in next.config.mjs, so canonical URLs end with `/`.
  const url = (path: string) => `${siteUrl}${path.replace(/\/?$/, '/')}`;

  return [
    { url: url('/') },
    ...source.getPages().map((page) => ({
      url: url(page.url),
      lastModified: page.data.lastModified,
    })),
  ];
}
