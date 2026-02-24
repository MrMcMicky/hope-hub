import Link from "next/link";

import { markSyncEventAppliedAction } from "@/app/hub/actions";
import { requireHubActor } from "@/lib/auth/session";
import { ensureSeedData, getSyncQueueSnapshot } from "@/lib/domain/workflows";

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

export const metadata = {
  title: "HOPE Hub Sync",
};

export default async function SyncPage() {
  const actor = await requireHubActor("/hub/sync");
  await ensureSeedData(actor);
  const snapshot = await getSyncQueueSnapshot(actor);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">HOPE Hub</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">Sync-Monitoring</h1>
            <p className="mt-2 text-sm text-foreground/75">Offline-Queue, Geräte-Clients und Reconciliation-Status.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/hub" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Dashboard
            </Link>
            <Link href="/hub/cases" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Fälle
            </Link>
            <Link href="/hub/billing" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Billing
            </Link>
            <Link href="/hub/exports" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Exporte
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Sync-Clients</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-foreground/60">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Gerät</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Letzte Sichtung</th>
                <th className="px-3 py-2">Pending Events</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.clients.map((client) => (
                <tr key={client.id} className="border-t border-black/8">
                  <td className="px-3 py-2 font-semibold text-foreground">{client.clientRef}</td>
                  <td className="px-3 py-2 text-foreground/80">{client.deviceLabel}</td>
                  <td className="px-3 py-2 text-foreground/80">{client.owner}</td>
                  <td className="px-3 py-2 text-foreground/80">{formatDateTime(client.lastSeenAt)}</td>
                  <td className="px-3 py-2 text-foreground/80">{client.pendingEvents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Pending Sync-Events</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-foreground/60">
              <tr>
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Sequenz</th>
                <th className="px-3 py-2">Empfangen</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.pendingEvents.map((event) => {
                const markApplied = markSyncEventAppliedAction.bind(null, event.id);
                return (
                  <tr key={event.id} className="border-t border-black/8">
                    <td className="px-3 py-2 font-semibold text-foreground">
                      <Link href={`/hub/cases/${event.caseId}`} className="underline decoration-brand/40 underline-offset-4">
                        {event.caseRef}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-foreground/80">{event.clientRef}</td>
                    <td className="px-3 py-2 text-foreground/80">{event.eventType}</td>
                    <td className="px-3 py-2 text-foreground/80">{event.sequence}</td>
                    <td className="px-3 py-2 text-foreground/80">{formatDateTime(event.receivedAt)}</td>
                    <td className="px-3 py-2 text-foreground/80">{event.actor}</td>
                    <td className="px-3 py-2 text-foreground/80">
                      <form action={markApplied}>
                        <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/85">
                          Als angewendet markieren
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
