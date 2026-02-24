import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { getPrototypeSnapshot } from "@/lib/prototype/seed-data";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatRelativeHours(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  if (hours < 1) return "<1h";
  return `${hours}h`;
}

export const metadata = {
  title: "HOPE Hub Demo Cockpit",
};

export default async function HubPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=%2Fhub");
  }

  const snapshot = getPrototypeSnapshot();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">HOPE Hub Prototype</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">Operations Cockpit</h1>
            <p className="mt-3 text-sm text-foreground/75">
              Angemeldet als <strong>{session.user.email}</strong> ({session.user.role}) | Datenstand{" "}
              {formatDateTime(snapshot.generatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Landing
            </Link>
            <Link href="/api/auth/signout?callbackUrl=%2F" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
              Logout
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Sync Queue</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.pendingSyncEvents}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Belegung</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.kpis.occupancyRate}%</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <article className="overflow-hidden rounded-2xl border border-black/8 bg-white">
          <div className="border-b border-black/8 px-5 py-4">
            <h2 className="text-lg font-semibold text-foreground">Case Pipeline</h2>
            <p className="mt-1 text-sm text-foreground/70">30 seed records für Demo und Proposal Walkthrough.</p>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-white/95 text-xs uppercase tracking-[0.12em] text-foreground/60">
                <tr>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.cases.map((item) => (
                  <tr key={item.id} className="border-t border-black/6">
                    <td className="px-4 py-3 font-semibold text-foreground">{item.caseRef}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.subjectName}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.status}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.riskLevel}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.assignedTeam}</td>
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
                const ratio = Math.round((site.occupied / site.capacity) * 100);
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
                    {client.owner} | pending: {client.pendingEvents} | last seen {formatRelativeHours(client.lastSeenAt)}
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
                <p className="text-foreground/70">{activity.note}</p>
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
                  {task.caseRef} | {task.owner} | due {formatDateTime(task.dueAt)}
                </p>
                <p className="text-foreground/70">Status: {task.status}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
