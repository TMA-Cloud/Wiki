import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Callout } from './callout';
import { GalleryCard } from './GalleryCard';
import { YouTubeVideo } from './YouTubeVideo';
import {
  ChangelogMajor,
  ChangelogOverview,
} from './changelog/ChangelogOverview';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Callout,
    GalleryCard,
    YouTubeVideo,
    ChangelogOverview,
    ChangelogMajor,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
