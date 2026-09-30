import { asMarkdown, md } from 'fumadocs-core/server';
import {
  ChangelogMajor as ChangelogMajorView,
  ChangelogOverview as ChangelogOverviewView,
} from './ChangelogView';

const changelogUrl = 'https://tma-cloud.github.io/changelog/';

// The changelog is fetched in the browser, so the llms Markdown output points
// at its source instead of an empty client component.
export function ChangelogOverview() {
  if (asMarkdown()) {
    return md`Release notes are loaded live from the [TMA Cloud changelog](${changelogUrl}).

`;
  }

  return <ChangelogOverviewView />;
}

export function ChangelogMajor({ major }: { major: number }) {
  if (asMarkdown()) {
    return md`Release notes for every v${major}.x release are loaded live from the [TMA Cloud changelog](${changelogUrl}).

`;
  }

  return <ChangelogMajorView major={major} />;
}
