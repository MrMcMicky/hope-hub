import { HopeLogo } from "@/app/_components/hope-logo";
import { HubNav } from "@/app/hub/_components/hub-nav";
import { requireHubActor } from "@/lib/auth/session";
import { ensureSeedData } from "@/lib/domain/workflows";

const REPORT_SECTIONS = [
  {
    title: "Betrieb",
    items: [
      { label: "Billing Journal CSV", href: "/api/reports/billing-journal", note: "Rechnungspositionen und Perioden." },
      { label: "Open-Work CSV", href: "/api/reports/open-work", note: "Offene Rechnungen und Exporte." },
      { label: "Belegung CSV", href: "/api/reports/occupancy", note: "Kapazität und Auslastung pro Standort." },
    ],
  },
  {
    title: "Compliance",
    items: [
      { label: "Audit-Report CSV", href: "/api/reports/audit", note: "Audit-Ereignisse mit Payload." },
      { label: "Audit-Integrity CSV", href: "/api/reports/audit-integrity", note: "Hash-Chain Integritätsprüfung." },
      { label: "Export-Liste CSV", href: "/api/reports/export-list", note: "Exportpakete inkl. Status und Empfänger." },
    ],
  },
];

export const metadata = {
  title: "HOPE Hub Reports",
};

export default async function ReportsPage() {
  const actor = await requireHubActor("/hub/reports");
  await ensureSeedData(actor);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <HopeLogo variant="mark" className="h-auto w-16 sm:w-20" sizes="(max-width: 640px) 64px, 80px" />
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">Reports</h1>
            <p className="mt-3 text-sm text-foreground/82">Zentraler Zugriff auf operative und compliance-relevante CSV-Auswertungen.</p>
          </div>
          <HubNav active="reports" />
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {REPORT_SECTIONS.map((section) => (
          <article key={section.title} className="rounded-2xl border border-black/8 bg-white p-5">
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <ul className="mt-4 space-y-2">
              {section.items.map((item) => (
                <li key={item.href} className="rounded-xl border border-black/8 px-4 py-3">
                  <p>
                    <a href={item.href} className="text-sm font-semibold text-foreground underline decoration-brand/40 underline-offset-4">
                      {item.label}
                    </a>
                  </p>
                  <p className="mt-1 text-sm text-foreground/78">{item.note}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
