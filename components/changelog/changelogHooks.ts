import { useEffect, useMemo, useState } from 'react';
import type {
  ChangelogIndexManifest,
  ChangelogReleaseFile,
} from './changelogTypes';
import { buildIndexUrl, normalizeBaseUrl } from './changelogRepo';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

type FetchResult<T> = { url: string; data: T | null; error: string };

// Results are keyed by URL and loading is derived during render, so the effect
// only sets state from async callbacks and a stale result is never shown for
// a new URL.
function useFetchJson<T>(url: string | null) {
  const [result, setResult] = useState<FetchResult<T> | null>(null);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    fetchJson<T>(url).then(
      (data) => {
        if (!cancelled) setResult({ url, data, error: '' });
      },
      (e) => {
        if (!cancelled) {
          setResult({
            url,
            data: null,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  const current = url && result?.url === url ? result : null;
  return {
    data: current?.data ?? null,
    loading: !!url && !current,
    error: current?.error ?? '',
  };
}

export function useChangelogIndex(baseUrl: string) {
  const normalizedBaseUrl = useMemo(() => normalizeBaseUrl(baseUrl), [baseUrl]);
  const { data, loading, error } = useFetchJson<ChangelogIndexManifest>(
    normalizedBaseUrl ? buildIndexUrl(normalizedBaseUrl) : null,
  );

  return { index: data, loading, error };
}

export function useChangelogRelease(
  baseUrl: string,
  releaseFile: string | null,
) {
  const normalizedBaseUrl = useMemo(() => normalizeBaseUrl(baseUrl), [baseUrl]);
  const { data, loading, error } = useFetchJson<ChangelogReleaseFile>(
    normalizedBaseUrl && releaseFile
      ? `${normalizedBaseUrl}${releaseFile}`
      : null,
  );

  return { release: data, loading, error };
}
