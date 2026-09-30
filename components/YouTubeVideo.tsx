import { asMarkdown, md } from 'fumadocs-core/server';
import { YouTubePlayer } from './YouTubePlayer';

type YouTubeVideoProps = { id: string; title: string; poster: string };

/**
 * MDX entry point for YouTube embeds. The player itself is a client component,
 * so this server wrapper gives the llms Markdown output a plain video link.
 */
export function YouTubeVideo(props: YouTubeVideoProps) {
  if (asMarkdown()) {
    return md`[Video: ${props.title}](https://www.youtube.com/watch?v=${props.id})

`;
  }

  return <YouTubePlayer {...props} />;
}

export default YouTubeVideo;
