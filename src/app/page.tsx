import Link from "next/link";

export default function Home() {
  const pillars = [
    {
      title: "Connect",
      text: "Menschen finden schnell Gruppen, Events und Ansprechpartner, die wirklich passen.",
    },
    {
      title: "Care",
      text: "Beduerfnisse, Gebetsanliegen und Unterstuetzung werden sichtbar und koordiniert.",
    },
    {
      title: "Cultivate",
      text: "Klare naechste Schritte helfen, Glauben und Gemeinschaft praktisch zu leben.",
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-12 sm:py-14">
      <section className="rounded-3xl border border-black/5 bg-surface/95 p-8 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-12">
        <p className="mb-5 inline-flex rounded-full border border-brand/25 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
          HOPE-Hub
        </p>
        <h1 className="max-w-4xl font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Gemeinschaft mit Hoffnung. Struktur mit Wirkung.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-foreground/78 sm:text-lg">
          Das Projekt ist initial aufgesetzt. Sobald du Konzept und Design-Hinweise lieferst, bauen wir die
          Produktlogik und UI zielgerichtet aus.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">Setup abgeschlossen</span>
          <span className="rounded-full border border-black/10 bg-white/80 px-5 py-2 text-sm font-semibold text-foreground/80">
            Next.js + TypeScript
          </span>
          <span className="rounded-full border border-black/10 bg-white/80 px-5 py-2 text-sm font-semibold text-foreground/80">
            Tailwind CSS
          </span>
          <Link
            href="/auth/login"
            className="rounded-full border border-brand/25 bg-brand/10 px-5 py-2 text-sm font-semibold text-brand-strong"
          >
            Login (OIDC)
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-2xl border border-black/5 bg-surface/90 p-6">
            <h2 className="text-lg font-semibold text-brand-strong">{pillar.title}</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/78">{pillar.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-auto pt-8">
        <div className="rounded-2xl border border-dashed border-brand/35 bg-white/65 px-6 py-4 text-sm text-foreground/75">
          Naechster Schritt: Sende mir Konzept, Zielgruppe, Kernfeatures und visuelle Leitplanken.
        </div>
      </section>
    </main>
  );
}
