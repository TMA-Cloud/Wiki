export type ChangelogIndexManifest = {
  name?: string;
  updatedAt?: string;
  latest?: string;
  versions: Array<{
    version: string;
    tag: string;
    file: string;
    date?: string;
    channel?: string;
  }>;
};

// One change: plain text, or text marked as breaking. Text may hold `code`.
export type ChangelogEntry = string | { text: string; breaking?: boolean };

// Change groups in the order they are shown (as in Common Changelog).
export const CHANGE_GROUPS = [
  ['changed', 'Changed'],
  ['added', 'Added'],
  ['removed', 'Removed'],
  ['fixed', 'Fixed'],
] as const;

export type ChangeGroup = (typeof CHANGE_GROUPS)[number][0];

export type ChangelogReleaseFile = {
  version: string;
  tag: string;
  date?: string;
  channel?: string;
  title?: string;
  // One sentence of upgrade guidance, shown above the changes.
  notice?: string;
  intro?: string;
  groups?: Partial<Record<ChangeGroup, ChangelogEntry[]>>;
  // Releases before 4.0.0 list their changes without groups.
  items?: string[];
  spatialNotes?: string;
};
