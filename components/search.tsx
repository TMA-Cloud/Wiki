'use client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useStaticSearch } from 'fumadocs-core/search/client';
import { create } from 'zbsearch';
import { useI18n } from 'fumadocs-ui/contexts/i18n';

function initDB() {
  return create({
    schema: { _: 'string' },
    // must match the `language` passed to `createFromSource` in app/api/search/route.ts
    language: 'english',
  });
}

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n(); // (optional) for i18n
  // search, onSearchChange, isLoading, data and error: the props SearchDialog takes.
  const results = useStaticSearch({
    from: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/search`,
    initDB,
    locale,
  });

  return (
    <SearchDialog {...results} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
