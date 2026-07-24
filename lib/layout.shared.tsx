import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${BASE}/img/logo.png`}
            alt="TMA Cloud"
            width={26}
            height={26}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              backgroundColor: '#1c1c1c',
            }}
          />
          <span style={{ fontWeight: 600 }}>{appName}</span>
        </>
      ),
      transparentMode: 'top',
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
