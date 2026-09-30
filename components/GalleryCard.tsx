import { asMarkdown, md } from 'fumadocs-core/server';
import { siteUrl } from '@/lib/shared';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function GalleryCard({
  img,
  title,
  subtitle,
  tag,
  portrait,
}: {
  img: string;
  title: string;
  subtitle?: string;
  tag?: string;
  portrait?: boolean;
}) {
  if (asMarkdown()) {
    // Absolute URL so the image resolves outside the site; parentheses in
    // file names like `dashboard(mobile).png` would end the Markdown link.
    const url = encodeURI(`${siteUrl}/img/${img}`)
      .replaceAll('(', '%28')
      .replaceAll(')', '%29');
    const caption = [tag, title].filter(Boolean).join(' — ');
    return md`![${caption}](${url})${
      subtitle
        ? `

${subtitle}`
        : ''
    }

`;
  }

  const src = `${BASE}/img/${img}`;
  return (
    <a
      className={`gallery-card${portrait ? ' gallery-card--mobile' : ''}`}
      href={src}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="gallery-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} loading="lazy" />
      </div>
      <div className="gallery-card__body">
        <div className="gallery-card__title">
          {tag && (
            <span className={`gallery-tag gallery-tag--${tag.toLowerCase()}`}>
              {tag}
            </span>
          )}
          {title}
        </div>
        {subtitle && <div className="gallery-card__subtitle">{subtitle}</div>}
      </div>
    </a>
  );
}

export default GalleryCard;
