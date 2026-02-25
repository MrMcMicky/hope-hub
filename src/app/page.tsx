import Link from "next/link";

import { HopeLogo } from "@/app/_components/hope-logo";

export default function Home() {
  const capabilities = [
    {
      title: "Fallführung mit Persistenz",
      text: "Cases werden dauerhaft gespeichert und als strukturierte Fallakten geführt.",
    },
    {
      title: "Operative Workflows",
      text: "Check-in, Check-out, Service-Events, Billing und Export laufen als persistente CRUD-Prozesse.",
    },
    {
      title: "Compliance und Nachvollziehbarkeit",
      text: "Retention, Legal Hold und Audit-Trail sind in den Kernabläufen verankert.",
    },
  ];

  const areas = [
    {
      title: "Begegnung",
      items: "Öffentliches Restaurant, Lebensmittelabgabe, Streetwork",
    },
    {
      title: "Betreuen",
      items: "Soziale Beratungsstelle, Wohnbegleitung / Umzugsbegleitung",
    },
    {
      title: "Beherbergen",
      items: "Notschlafstelle, Notpension, Übergangswohnen, Wohnzentrum, Wohnexternat",
    },
    {
      title: "Beschäftigen",
      items: "Tagesstruktur und Arbeitsintegration",
    },
  ];

  const demoSteps = [
    "Login als Super Admin",
    "Neuen Fall erfassen oder bestehende Akte öffnen",
    "Aufenthalt und Service-Event dokumentieren",
    "Rechnungsentwurf erzeugen und Exportpaket freigeben",
    "Compliance-Status und Kennzahlen live zeigen",
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-10 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-surface/96 p-8 shadow-[0_20px_70px_-28px_rgb(18_22_27/0.45)] sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[color:var(--hope-accent)]/45 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-[color:var(--hope-primary)]/22 blur-3xl"
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <HopeLogo
            variant="full"
            priority
            className="h-auto w-[220px] sm:w-[290px]"
            sizes="(max-width: 640px) 220px, 290px"
          />
          <p className="inline-flex rounded-full border border-brand/25 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            Sales Draft v1
          </p>
        </div>

        <h1 className="max-w-5xl font-display text-4xl leading-[1.03] tracking-tight text-foreground sm:text-6xl">
          Operative Plattform für HOPE:
          <br />
          vom Erstkontakt bis zum auditfähigen Fallabschluss.
        </h1>

        <p className="mt-5 max-w-4xl text-base leading-7 text-foreground/80 sm:text-lg">
          Dieser Prototyp zeigt bereits persistente Business-Logik mit realistischen Seed-Daten, strukturiert entlang
          der 4 B&apos;s von HOPE: Begegnung, Betreuen, Beherbergen und Beschäftigen.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-black/8 bg-white/85 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Persistente Cases</p>
            <p className="mt-1 text-xl font-semibold text-foreground">30+</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white/85 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">CRUD Workflows</p>
            <p className="mt-1 text-xl font-semibold text-foreground">Case | Stay | Task | Billing | Export</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white/85 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Audit Trail</p>
            <p className="mt-1 text-xl font-semibold text-foreground">Append-only</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white/85 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Rollenmodell</p>
            <p className="mt-1 text-xl font-semibold text-foreground">Admin bis Billing</p>
          </div>
          <div className="rounded-2xl border border-black/8 bg-white/85 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Produktiv online</p>
            <p className="mt-1 text-xl font-semibold text-foreground">hope-hub.online</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/login" className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white">
            Live-Demo öffnen
          </Link>
          <Link href="/hub" className="rounded-full border border-black/15 bg-white px-6 py-2.5 text-sm font-semibold text-foreground/85">
            Operations Cockpit
          </Link>
          <Link href="/hub/cases" className="rounded-full border border-black/15 bg-white px-6 py-2.5 text-sm font-semibold text-foreground/85">
            Fallführung zeigen
          </Link>
          <Link href="/hub/exports" className="rounded-full border border-black/15 bg-white px-6 py-2.5 text-sm font-semibold text-foreground/85">
            Export & Compliance zeigen
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-black/8 bg-white p-6">
          <h2 className="font-display text-2xl text-foreground">Was im Gespräch live gezeigt werden kann</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {capabilities.map((item) => (
              <div key={item.title} className="rounded-xl border border-black/8 bg-surface/85 p-4">
                <p className="text-sm font-semibold text-brand-strong">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/78">{item.text}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-6">
          <h2 className="font-display text-2xl text-foreground">Demo in 5 Minuten</h2>
          <ol className="mt-4 space-y-2 text-sm text-foreground/82">
            {demoSteps.map((step, index) => (
              <li key={step} className="rounded-xl border border-black/8 bg-surface/85 px-3 py-2">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <article className="rounded-2xl border border-black/8 bg-white p-6">
          <h2 className="font-display text-2xl text-foreground">HOPE-Struktur im Produkt</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {areas.map((area) => (
              <div key={area.title} className="rounded-xl border border-black/8 bg-surface/85 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-strong">{area.title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/78">{area.items}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-6">
          <h2 className="font-display text-2xl text-foreground">Aktueller Ausbaustand</h2>
          <div className="mt-4 space-y-3 text-sm text-foreground/82">
            <p className="rounded-xl border border-black/8 bg-surface/85 px-4 py-3">
              <strong>1. Billing und Export:</strong> Rechnungsentwürfe mit Positionen sowie verschlüsselte Exportpakete
              inkl. Statusfluss sind live.
            </p>
            <p className="rounded-xl border border-black/8 bg-surface/85 px-4 py-3">
              <strong>2. Compliance:</strong> Retention-Review, Archivierung, Löschplanung und Legal-Hold-Guardrails sind
              im Workflow verankert.
            </p>
            <p className="rounded-xl border border-black/8 bg-surface/85 px-4 py-3">
              <strong>3. Verifikation:</strong> E2E-Teststrecke für Login, Fallführung, Billing und Export ist integriert.
            </p>
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-brand/35 bg-brand/8 px-4 py-3 text-sm text-foreground/80">
            Zielbild: MVP mit produktionsnahen Kernprozessen und belastbarer Story für Trägerschaft, Leitung und
            Behörden.
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-black/8 bg-white p-6">
        <h2 className="font-display text-2xl text-foreground">Direkter Einstieg für das Verkaufsgespräch</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/78">
          Starte mit <strong>Live-Demo öffnen</strong>, zeige danach die Fallliste und öffne eine Fallakte. Damit sind
          Nutzen, Struktur und technische Reife in wenigen Minuten sichtbar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/auth/login" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
            Zum Login
          </Link>
          <Link href="/hub/cases" className="rounded-full border border-black/15 bg-white px-5 py-2 text-sm font-semibold text-foreground/85">
            Zur Fallliste
          </Link>
          <Link href="/hub" className="rounded-full border border-black/15 bg-white px-5 py-2 text-sm font-semibold text-foreground/85">
            Zum Cockpit
          </Link>
        </div>
      </section>

      <section className="pb-2">
        <div className="rounded-2xl border border-black/10 bg-surface/88 px-5 py-3 text-xs tracking-[0.12em] text-foreground/60">
          Draft-Status: Sales-geeigneter Frontpage-Entwurf für Erstgespräche (Stand 24.02.2026).
        </div>
      </section>
    </main>
  );
}
