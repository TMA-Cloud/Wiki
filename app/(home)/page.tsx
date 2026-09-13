import Link from 'next/link';

const features = [
  {
    icon: '🔒',
    title: 'Encrypted Storage',
    desc: 'AES-256-GCM encryption for files stored in S3-compatible buckets.',
    href: '/docs/concepts/file-system#storage',
  },
  {
    icon: '💽',
    title: 'Windows Cloud Drive',
    desc: 'Open and save cloud files from Windows applications.',
    href: '/docs/getting-started/desktop-app#cloud-drive-mounted-windows-drive',
  },
  {
    icon: '📝',
    title: 'Document Editing',
    desc: 'Edit with OnlyOffice or desktop applications and sync changes back.',
    href: '/docs/guides/user/upload-files#document-editing-and-viewers',
  },
  {
    icon: '🔗',
    title: 'Controlled Sharing',
    desc: 'Create expiring, read-only links on the app or a separate domain.',
    href: '/docs/concepts/sharing-model',
  },
  {
    icon: '👥',
    title: 'Sub-user Access',
    desc: 'Give each login separate permissions over the same account files.',
    href: '/docs/guides/user/sub-users',
  },
  {
    icon: '📦',
    title: 'Large-file Workflows',
    desc: 'Stream transfers and run bulk file operations through background jobs.',
    href: '/docs/concepts/file-system#large-file-handling',
  },
];

const steps = [
  {
    n: 1,
    title: 'Install',
    desc: 'Deploy with Docker Compose or a manual installation.',
  },
  {
    n: 2,
    title: 'Configure',
    desc: 'Set environment variables, database access, and optional services.',
  },
  {
    n: 3,
    title: 'Sign up',
    desc: 'Create the first account — it becomes the admin.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-fd-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--color-fd-primary) 18%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center">
          <span className="mb-4 rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            Self-hosted cloud storage
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            TMA Cloud
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-fd-muted-foreground">
            Store encrypted files in S3-compatible storage, open them through
            the web or a Windows drive, and control how they are shared.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/getting-started/overview"
              className="rounded-lg bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Started →
            </Link>
            <Link
              href="/docs/api/overview"
              className="rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 font-medium transition-colors hover:bg-fd-accent"
            >
              API Reference
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <h2 className="mb-10 text-center text-2xl font-semibold sm:text-3xl">
          Explore core features
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-xl border border-fd-border bg-fd-card p-6 transition-all hover:-translate-y-1 hover:border-fd-primary hover:shadow-lg"
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-1.5 font-semibold group-hover:text-fd-primary">
                {f.title}
              </h3>
              <p className="text-sm text-fd-muted-foreground">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick start */}
      <section className="border-t border-fd-border bg-fd-card/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <h2 className="mb-3 text-center text-2xl font-semibold sm:text-3xl">
            Quick start
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-fd-muted-foreground">
            Deploy the app and its background worker with Docker Compose.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-fd-border bg-fd-background p-6"
              >
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-fd-primary font-semibold text-fd-primary-foreground">
                  {s.n}
                </div>
                <h3 className="mb-1 font-semibold">{s.title}</h3>
                <p className="text-sm text-fd-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/docs/getting-started/overview"
              className="rounded-lg bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              View the Getting Started guide →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
