import Link from "next/link";

import { requireHubActor } from "@/lib/auth/session";
import { ensureSeedData, getDashboardSnapshot } from "@/lib/domain/workflows";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "-";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export const metadata = {
  title: "HOPE Hub Operations",
};

export default async function HubPage() {
  const actor = await requireHubActor("/hub");
  await ensureSeedData(actor);
  const snapshot = await getDashboardSnapshot(actor);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">HOPE Hub</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">Operations Cockpit</h1>
            <p className="mt-3 text-sm text-foreground/75">
              Angemeldet als <strong>{actor.email}</strong> ({actor.roles[0]}) | Datenstand {formatDateTime(snapshot.generatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/hub/cases" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Fälle verwalten
            </Link>
            <Link href="/hub/billing" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Billing
            </Link>
            <Link href="/hub/exports" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Exporte
            </Link>
            <Link href="/hub/sync" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Sync
            </Link>
            <a href="/api/reports/occupancy" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Belegung CSV
            </a>
            <a href="/api/reports/open-work" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Open-Work CSV
            </a>
            <Link href="/" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Landing
            </Link>
            <Link href="/api/auth/signout?callbackUrl=%2F" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
              Logout
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-10">
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Aktive Fälle</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.activeCases}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Offene Tasks</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.openTasks}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">High-Risk</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.highRiskCases}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Sync-Warteschlange</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.pendingSyncEvents}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Belegung</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.occupancyRate}%</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Billing Drafts</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.billingDrafts}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Pending Exports</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.pendingExports}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Retention fällig</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.retentionDueCases}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Kostengutsprachen offen</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.pendingCostApprovals}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Open Work total</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.openWorkItems}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <article className="overflow-hidden rounded-2xl border border-black/8 bg-white">
          <div className="border-b border-black/8 px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Case Pipeline</h2>
            <p className="mt-1 text-sm text-foreground/70">Persistente Fälle mit CRUD-Workflow und Audit-Trail.</p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-white/95 text-xs uppercase tracking-[0.12em] text-foreground/60">
                <tr>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Angebot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.cases.map((item) => (
                  <tr key={item.id} className="border-t border-black/6">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link href={`/hub/cases/${item.id}`} className="underline decoration-brand/40 underline-offset-4">
                        {item.caseRef}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{item.subjectDisplayName}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.offering}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.status}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.riskLevel}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.openTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-black/8 bg-white p-5">
            <h2 className="text-lg font-semibold text-foreground">Standorte & Belegung</h2>
            <div className="mt-4 space-y-3">
              {snapshot.occupancy.map((site) => {
                const ratio = site.capacity ? Math.round((site.occupied / site.capacity) * 100) : 0;
                return (
                  <div key={site.site}>
                    <div className="mb-1 flex justify-between text-sm text-foreground/75">
                      <span>{site.site}</span>
                      <span>
                        {site.occupied}/{site.capacity} ({ratio}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-black/8">
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-black/8 bg-white p-5">
            <h2 className="text-lg font-semibold text-foreground">Sync Clients</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {snapshot.syncClients.map((client) => (
                <li key={client.id} className="rounded-xl border border-black/8 px-3 py-2">
                  <p className="font-semibold text-foreground">{client.label}</p>
                  <p className="text-foreground/75">
                    {client.owner} | pending: {client.pendingEvents} | last seen {formatRelativeTime(client.lastSeenAt)}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Neueste Aktivitäten</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {snapshot.activities.slice(0, 12).map((activity) => (
              <li key={activity.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {activity.type} | {activity.caseRef}
                </p>
                <p className="text-foreground/75">
                  {formatDateTime(activity.occurredAt)} | {activity.actor}
                </p>
                <p className="text-foreground/70">{activity.note || "-"}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Task Backlog</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {snapshot.tasks.slice(0, 14).map((task) => (
              <li key={task.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {task.priority} | {task.title}
                </p>
                <p className="text-foreground/75">
                  {task.caseRef} | {task.owner} | fällig {formatDateTime(task.dueAt)}
                </p>
                <p className="text-foreground/70">Status: {task.status}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Billing-Warteschlange</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {snapshot.invoiceQueue.map((invoice) => (
              <li key={invoice.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {invoice.invoiceRef} | {invoice.status}
                </p>
                <p className="text-foreground/75">
                  {invoice.caseRef} | {formatMoney(invoice.totalCents)}
                </p>
                <p className="text-foreground/70">Update {formatDateTime(invoice.updatedAt)}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Export-Warteschlange</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {snapshot.exportQueue.map((item) => (
              <li key={item.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {item.exportRef} | {item.status}
                </p>
                <p className="text-foreground/75">
                  {item.caseRef} | {item.recipient}
                </p>
                <p className="text-foreground/70">Update {formatDateTime(item.updatedAt)}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Compliance-Warteschlange</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {snapshot.complianceQueue.map((item) => (
              <li key={item.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {item.caseRef} | {item.retentionStatus}
                </p>
                <p className="text-foreground/75">{item.subjectDisplayName}</p>
                <p className="text-foreground/70">Fällig {formatDateTime(item.retentionDueAt)}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
