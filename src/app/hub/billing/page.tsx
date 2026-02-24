import Link from "next/link";

import { requireHubActor } from "@/lib/auth/session";
import { ensureSeedData, listBillingQueue } from "@/lib/domain/workflows";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export const metadata = {
  title: "HOPE Hub Billing",
};

export default async function BillingPage() {
  const actor = await requireHubActor("/hub/billing");
  await ensureSeedData(actor);
  const invoices = await listBillingQueue(actor);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">HOPE Hub</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">Billing</h1>
            <p className="mt-2 text-sm text-foreground/75">Alle Rechnungsentwürfe und Statusstände im Überblick.</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/api/reports/billing-journal"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              Journal CSV
            </a>
            <a
              href="/api/reports/open-work"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              Open-Work CSV
            </a>
            <a
              href="/api/reports/occupancy"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80"
            >
              Belegung CSV
            </a>
            <Link href="/hub" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Dashboard
            </Link>
            <Link href="/hub/cases" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Fälle
            </Link>
            <Link href="/hub/exports" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Exporte
            </Link>
            <Link href="/hub/sync" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Sync
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Rechnungs-Warteschlange</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-foreground/60">
              <tr>
                <th className="px-3 py-2">Rechnung</th>
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Zeitraum</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Aktualisiert</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-black/8">
                  <td className="px-3 py-2 font-semibold text-foreground">{invoice.invoiceRef}</td>
                  <td className="px-3 py-2 text-foreground/80">
                    <Link href={`/hub/cases/${invoice.caseId}`} className="underline decoration-brand/40 underline-offset-4">
                      {invoice.caseRef}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-foreground/80">{invoice.subjectDisplayName}</td>
                  <td className="px-3 py-2 text-foreground/80">{invoice.status}</td>
                  <td className="px-3 py-2 text-foreground/80">
                    {formatDateTime(invoice.periodStart)} bis {formatDateTime(invoice.periodEnd)}
                  </td>
                  <td className="px-3 py-2 text-foreground/80">{formatMoney(invoice.totalCents)}</td>
                  <td className="px-3 py-2 text-foreground/80">{formatDateTime(invoice.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
