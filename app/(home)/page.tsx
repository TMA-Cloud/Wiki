import Link from 'next/link';

const features = [
  {
    icon: '🔐',
    title: 'Authentication & Security',
    desc: 'JWT-based authentication with optional Google OAuth and multi-factor authentication.',
    href: '/docs/concepts/authentication',
  },
  {
    icon: '📁',
    title: 'File Management',
    desc: 'Upload, organize, move, copy, and delete files and folders in a hierarchical structure.',
    href: '/docs/guides/user/upload-files',
  },
  {
    icon: '🔗',
    title: 'Sharing & Collaboration',
    desc: 'Public and private share links with optional expiry and a custom share domain.',
    href: '/docs/guides/user/share-files',
  },
  {
    icon: '⚙️',
    title: 'Admin Controls',
    desc: 'User management, signup control, and per-user storage limits.',
    href: '/docs/guides/admin/user-management',
  },
  {
    icon: '🔌',
    title: 'API Integration',
    desc: 'A complete REST API for automation and integration with external applications.',
    href: '/docs/api/overview',
  },
  {
    icon: '📊',
    title: 'Audit & Monitoring',
    desc: 'Structured application logs and queue-based audit events for full traceability.',
    href: '/docs/guides/operations/audit-logs',
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
            Build, integrate, and extend your self-hosted cloud with TMA&apos;s
            powerful and flexible APIs — file storage, sharing, document
            editing, and full audit logging.
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
            Get up and running with TMA Cloud in minutes.
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
