import { asMarkdown, md } from 'fumadocs-core/server';
import { Callout as BaseCallout } from 'fumadocs-ui/components/callout';
import type { ComponentProps } from 'react';

// GitHub-style alert for each Fumadocs callout type.
const alerts = {
  info: 'NOTE',
  idea: 'TIP',
  success: 'TIP',
  warn: 'WARNING',
  warning: 'WARNING',
  error: 'CAUTION',
} as const;

/**
 * Fumadocs' callout, rendered as a GitHub alert blockquote in the llms
 * Markdown output instead of raw JSX.
 */
export function Callout(props: ComponentProps<typeof BaseCallout>) {
  if (asMarkdown()) {
    const { type = 'info', title, children } = props;
    return md.linePrefix('> ')`[!${alerts[type]}]
${title ? md`**${title}**\n\n` : ''}${children}`;
  }

  return <BaseCallout {...props} />;
}
