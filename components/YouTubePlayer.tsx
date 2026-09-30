'use client';

import { useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/**
 * Click-to-play YouTube embed. Shows a local poster first and only loads the
 * player (from youtube-nocookie.com) on click, so pages stay light and no
 * YouTube cookies are set until the reader asks for the video.
 */
export function YouTubePlayer({
  id,
  title,
  poster,
}: {
  id: string;
  title: string;
  poster: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="not-prose relative my-6 aspect-video w-full overflow-hidden rounded-xl border border-fd-border bg-black shadow-lg">
      {playing ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 size-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE}/img/${poster}`}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-opacity group-hover:opacity-90"
          />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#ff0000] shadow-xl transition-transform group-hover:scale-110">
            <svg
              viewBox="0 0 24 24"
              className="ml-1 size-8 fill-white"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

export default YouTubePlayer;
