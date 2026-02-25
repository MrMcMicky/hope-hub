import Link from "next/link";

import { HubNav } from "@/app/hub/_components/hub-nav";
import { StatusBadge } from "@/app/hub/_components/status-badge";
import { requireHubActor } from "@/lib/auth/session";
import { ensureSeedData, getDashboardSnapshot } from "@/lib/domain/workflows";

function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

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

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type HubPageProps = {
  searchParams?: {
    q?: string;
    status?: string;
  };
};

export const metadata = {
  title: "HOPE Hub Operations",
};

export default async function HubPage({ searchParams }: HubPageProps) {
  const actor = await requireHubActor("/hub");
  await ensureSeedData(actor);
  const snapshot = await getDashboardSnapshot(actor);

  const q = asString(searchParams?.q).trim();
  const status = asString(searchParams?.status).trim();

  const statusOptions = Array.from(new Set(snapshot.cases.map((item) => item.status))).sort();
  const visibleCases = snapshot.cases.filter((item) => {
    const byStatus = !status || status === "ALL" || item.status === status;
    const byQuery =
      !q ||
      item.caseRef.toLowerCase().includes(q.toLowerCase()) ||
      item.subjectDisplayName.toLowerCase().includes(q.toLowerCase()) ||
      item.offering.toLowerCase().includes(q.toLowerCase());

    return byStatus && byQuery;
  });
  const caseRows = visibleCases.slice(0, 12);
  const hiddenCaseCount = Math.max(0, visibleCases.length - caseRows.length);

  const now = new Date();
  const todayTasks = snapshot.tasks
    .filter((task) => task.dueAt && task.status !== "DONE" && isSameDate(new Date(task.dueAt), now))
    .slice(0, 8);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">HOPE Hub</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">Operations Cockpit</h1>
            <p className="mt-3 text-sm text-foreground/85">
              Angemeldet als <strong>{actor.email}</strong> ({actor.roles[0]}) | Datenstand {formatDateTime(snapshot.generatedAt)}
            </p>
          </div>
          <HubNav active="dashboard" />
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/65">Aktive Fälle</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.activeCases}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/65">Heute fällig</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{todayTasks.length}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/65">Open Work</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.openWorkItems}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/65">High-Risk</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.highRiskCases}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/65">Belegung</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.occupancyRate}%</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/65">Sync Pending</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.pendingSyncEvents}</p>
        </article>
      </section>

      <details className="mt-3 rounded-2xl border border-black/8 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground/88">Weitere Kennzahlen anzeigen</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-black/8 bg-surface/70 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/65">Offene Tasks</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{snapshot.kpis.openTasks}</p>
          </article>
          <article className="rounded-xl border border-black/8 bg-surface/70 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/65">Billing Drafts</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{snapshot.kpis.billingDrafts}</p>
          </article>
          <article className="rounded-xl border border-black/8 bg-surface/70 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/65">Pending Exports</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{snapshot.kpis.pendingExports}</p>
          </article>
          <article className="rounded-xl border border-black/8 bg-surface/70 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/65">Retention fällig</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{snapshot.kpis.retentionDueCases}</p>
          </article>
        </div>
      </details>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Heute zu erledigen</h2>
          {todayTasks.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/78">Keine offenen Fälligkeiten für heute.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {todayTasks.map((task) => (
                <li key={task.id} className="rounded-xl border border-black/8 px-3 py-2">
                  <p className="font-semibold text-foreground">
                    <StatusBadge value={task.priority} /> <span className="ml-2">{task.title}</span>
                  </p>
                  <p className="mt-1 text-foreground/82">
                    {task.caseRef} | {task.owner} | fällig {formatDateTime(task.dueAt)}
                  </p>
                  <p className="mt-2">
                    <Link href={`/hub/cases/${task.caseId}#task-section`} className="rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/88">
                      Task öffnen
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Entscheidungsfokus</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="rounded-xl border border-black/8 px-3 py-2">
              <p className="font-semibold text-foreground">Billing-Warteschlange</p>
              <p className="text-foreground/82">{snapshot.kpis.billingDrafts} offene Rechnungsentwürfe</p>
              <Link href="/hub/billing" className="mt-2 inline-flex rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/88">
                Zu Billing
              </Link>
            </li>
            <li className="rounded-xl border border-black/8 px-3 py-2">
              <p className="font-semibold text-foreground">Export-Warteschlange</p>
              <p className="text-foreground/82">{snapshot.kpis.pendingExports} offene Exportpakete</p>
              <Link href="/hub/exports" className="mt-2 inline-flex rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/88">
                Zu Exporten
              </Link>
            </li>
            <li className="rounded-xl border border-black/8 px-3 py-2">
              <p className="font-semibold text-foreground">Retention & Compliance</p>
              <p className="text-foreground/82">{snapshot.kpis.retentionDueCases} Fälle mit baldiger oder fälliger Retention</p>
              <Link href="/hub/exports" className="mt-2 inline-flex rounded-lg border border-black/12 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/88">
                Compliance prüfen
              </Link>
            </li>
          </ul>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <article className="overflow-hidden rounded-2xl border border-black/8 bg-white">
          <div className="border-b border-black/8 px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Case Pipeline</h2>
            <p className="mt-1 text-sm text-foreground/82">Gefilterte Sicht mit schnellen Einstiegspunkten je Fall.</p>

            <form method="get" className="mt-3 grid gap-2 sm:grid-cols-3">
              <label className="text-xs text-foreground/72 sm:col-span-2">
                Suche
                <input name="q" defaultValue={q} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" placeholder="Case, Person, Angebot" />
              </label>
              <label className="text-xs text-foreground/72">
                Status
                <select name="status" defaultValue={status || "ALL"} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
                  <option value="ALL">Alle</option>
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-3">
                <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/88">
                  Filter anwenden
                </button>
              </div>
            </form>
          </div>

          <div>
            <table className="min-w-full table-fixed text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-[0.12em] text-foreground/70">
                <tr>
                  <th className="w-[16%] px-4 py-3">Case</th>
                  <th className="w-[34%] px-4 py-3">Person / Angebot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3">Tasks</th>
                  <th className="w-[23%] px-4 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {caseRows.map((item) => (
                  <tr key={item.id} className="border-t border-black/8">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link href={`/hub/cases/${item.id}`} className="underline decoration-brand/40 underline-offset-4">
                        {item.caseRef}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold leading-5 text-foreground/92">{item.subjectDisplayName}</p>
                      <p className="mt-0.5 text-[13px] leading-5 text-foreground/78">{item.offering}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={item.riskLevel} />
                    </td>
                    <td className="px-4 py-3 text-foreground/86">{item.openTasks}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/hub/cases/${item.id}`} className="rounded-lg border border-black/12 bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground/88">
                          Öffnen
                        </Link>
                        <Link href={`/hub/cases/${item.id}#service-event-section`} className="rounded-lg border border-black/12 bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground/88">
                          Event
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hiddenCaseCount > 0 ? (
              <p className="px-4 py-3 text-xs text-foreground/72">
                {hiddenCaseCount} weitere Fälle vorhanden.
                <Link href="/hub/cases" className="ml-1 font-semibold text-foreground underline decoration-brand/40 underline-offset-4">
                  Vollständige Fallliste öffnen
                </Link>
              </p>
            ) : null}
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
                    <div className="mb-1 flex justify-between text-sm text-foreground/85">
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
                  <p className="text-foreground/84">
                    {client.owner} | pending: {client.pendingEvents} | letzte Sichtung {formatRelativeTime(client.lastSeenAt)}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Billing-Warteschlange</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {snapshot.invoiceQueue.map((invoice) => (
              <li key={invoice.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {invoice.invoiceRef} <span className="ml-2 align-middle"><StatusBadge value={invoice.status} /></span>
                </p>
                <p className="text-foreground/84">
                  {invoice.caseRef} | {formatMoney(invoice.totalCents)}
                </p>
                <p className="text-foreground/75">Update {formatDateTime(invoice.updatedAt)}</p>
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
                  {item.exportRef} <span className="ml-2 align-middle"><StatusBadge value={item.status} /></span>
                </p>
                <p className="text-foreground/84">
                  {item.caseRef} | {item.recipient}
                </p>
                <p className="text-foreground/75">Update {formatDateTime(item.updatedAt)}</p>
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
                  {item.caseRef} <span className="ml-2 align-middle"><StatusBadge value={item.retentionStatus} /></span>
                </p>
                <p className="text-foreground/84">{item.subjectDisplayName}</p>
                <p className="text-foreground/75">Fällig {formatDateTime(item.retentionDueAt)}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
