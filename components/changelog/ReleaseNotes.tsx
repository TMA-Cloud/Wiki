import React from 'react';
import {
  CHANGE_GROUPS,
  type ChangelogEntry,
  type ChangelogReleaseFile,
} from './changelogTypes';

// Backticked spans become <code>; everything else stays text.
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(`[^`]+`)/)
        .map((part, i) =>
          part.startsWith('`') && part.endsWith('`') && part.length > 1 ? (
            <code key={i}>{part.slice(1, -1)}</code>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          ),
        )}
    </>
  );
}

const entryText = (e: ChangelogEntry) => (typeof e === 'string' ? e : e.text);
const isBreaking = (e: ChangelogEntry) => typeof e !== 'string' && !!e.breaking;

function EntryList({ id, entries }: { id: string; entries: ChangelogEntry[] }) {
  // Breaking changes come first in their group; the rest keep their order.
  const sorted = [
    ...entries.filter(isBreaking),
    ...entries.filter((e) => !isBreaking(e)),
  ];
  return (
    <ul className="changelogList">
      {sorted.map((entry, i) => (
        <li key={`${id}-${i}`}>
          {isBreaking(entry) ? (
            <strong className="changelogBreaking">Breaking:</strong>
          ) : null}{' '}
          <InlineCode text={entryText(entry)} />
        </li>
      ))}
    </ul>
  );
}

// The body of one release: notice, then grouped changes (or the flat list
// older releases use), then any notes.
export function ReleaseNotes({ release }: { release: ChangelogReleaseFile }) {
  const groups = CHANGE_GROUPS.filter(
    ([key]) => (release.groups?.[key]?.length ?? 0) > 0,
  );
  return (
    <div>
      <h3 style={{ marginBottom: 4 }}>
        {release.tag}{' '}
        {release.channel ? (
          <span style={{ opacity: 0.8 }}>{`(${release.channel})`}</span>
        ) : null}
      </h3>
      {release.date ? (
        <p className="changelogDate">
          Released <time dateTime={release.date}>{release.date}</time>
        </p>
      ) : null}

      {release.notice ? (
        <p className="changelogNotice">
          <InlineCode text={release.notice} />
        </p>
      ) : release.intro ? (
        <p style={{ marginTop: 0 }}>{release.intro}</p>
      ) : null}

      {groups.length
        ? groups.map(([key, title]) => (
            <section key={key}>
              <h4 className="changelogGroup">{title}</h4>
              <EntryList
                id={`${release.tag}-${key}`}
                entries={release.groups?.[key] ?? []}
              />
            </section>
          ))
        : null}
      {!groups.length && release.items?.length ? (
        <EntryList id={release.tag} entries={release.items} />
      ) : null}

      {release.spatialNotes ? (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ marginBottom: 6 }}>Notes</h4>
          <div style={{ whiteSpace: 'pre-wrap', opacity: 0.95 }}>
            {release.spatialNotes}
          </div>
        </div>
      ) : null}
    </div>
  );
}
