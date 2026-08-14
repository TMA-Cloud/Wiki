import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  // must match the `language` passed to `create` in components/search.tsx
  language: 'english',
});
