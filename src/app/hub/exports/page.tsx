import Link from "next/link";

import { createExportRecipientAction, deleteExportRecipientAction, updateExportRecipientAction } from "@/app/hub/actions";
import { HopeLogo } from "@/app/_components/hope-logo";
import { HubNav } from "@/app/hub/_components/hub-nav";
import { StatusBadge } from "@/app/hub/_components/status-badge";
import { requireHubActor } from "@/lib/auth/session";
import { ensureSeedData, listComplianceQueue, listExportQueue, listExportRecipients } from "@/lib/domain/workflows";

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
  title: "HOPE Hub Exporte",
};

export default async function ExportsPage() {
  const actor = await requireHubActor("/hub/exports");
  await ensureSeedData(actor);

  const [exportsQueue, recipients, complianceQueue] = await Promise.all([
    listExportQueue(actor),
    listExportRecipients(actor),
    listComplianceQueue(actor),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl leading-tight text-foreground">Exporte & Compliance</h1>
            <p className="mt-2 text-sm text-foreground/85">Exportpakete, Empfängerverzeichnis und Retention-Warteschlange.</p>
          </div>
          <HopeLogo variant="mark" className="h-auto w-9 shrink-0 sm:w-11" sizes="(max-width: 640px) 36px, 44px" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <HubNav active="exports" />
          <Link href="/hub/reports" className="rounded-xl border border-black/12 bg-white px-4 py-2 text-sm font-semibold text-foreground/88 hover:border-brand/40">
            Reports öffnen
          </Link>
        </div>
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Exportqueue</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {exportsQueue.map((item) => (
              <li key={item.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {item.exportRef} <span className="ml-2 align-middle"><StatusBadge value={item.status} /></span>
                </p>
                <p className="text-foreground/75">
                  {item.caseRef} | {item.subjectDisplayName}
                </p>
                <p className="text-foreground/70">
                  Empfänger: {item.recipient} | Freigabe: {formatDateTime(item.releasedAt)} | Update: {formatDateTime(item.updatedAt)}
                </p>
                {item.status === "READY" || item.status === "RELEASED" ? (
                  <p className="mt-2">
                    <a
                      href={`/api/exports/${item.id}/download`}
                      className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/85"
                    >
                      Verschlüsseltes Paket herunterladen
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Empfängerverzeichnis</h2>

          <form action={createExportRecipientAction} className="mt-4 grid gap-3">
            <label className="text-sm text-foreground/80">
              Bezeichnung
              <input name="label" required className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-foreground/80">
              Organisation
              <input name="organisation" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-foreground/80">
              Kanal
              <input name="channel" defaultValue="sftp" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-foreground/80">
              Endpoint
              <input name="endpoint" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-foreground/80">
              Schlüssel-Fingerprint
              <input name="keyFingerprint" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="authorityApproved" className="h-4 w-4" />
              Behördlich freigegeben
            </label>
            <button type="submit" className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
              Empfänger speichern
            </button>
          </form>

          <ul className="mt-4 space-y-2 text-sm">
            {recipients.map((recipient) => {
              const updateRecipient = updateExportRecipientAction.bind(null, recipient.id);
              const deleteRecipient = deleteExportRecipientAction.bind(null, recipient.id);

              return (
                <li key={recipient.id} className="rounded-xl border border-black/8 px-3 py-2">
                  <p className="font-semibold text-foreground">
                    {recipient.label} ({recipient.recipientRef})
                  </p>
                  <p className="text-foreground/75">
                    {recipient.organisation || "-"} | {recipient.channel} | {recipient.endpoint || "-"}
                  </p>
                  <p className="text-foreground/70">
                    Schlüssel: {recipient.keyFingerprint || "-"} | Behörde: {recipient.authorityApproved ? "Ja" : "Nein"}
                  </p>

                  <form action={updateRecipient} className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-foreground/70 sm:col-span-2">
                      Bezeichnung
                      <input name="label" defaultValue={recipient.label} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70">
                      Organisation
                      <input name="organisation" defaultValue={recipient.organisation} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70">
                      Kanal
                      <input name="channel" defaultValue={recipient.channel} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70 sm:col-span-2">
                      Endpoint
                      <input name="endpoint" defaultValue={recipient.endpoint} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70 sm:col-span-2">
                      Schlüssel-Fingerprint
                      <input name="keyFingerprint" defaultValue={recipient.keyFingerprint} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-foreground/70 sm:col-span-2">
                      <input type="checkbox" name="authorityApproved" defaultChecked={recipient.authorityApproved} className="h-4 w-4" />
                      Behördlich freigegeben
                    </label>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                        Empfänger aktualisieren
                      </button>
                      <button formAction={deleteRecipient} type="submit" className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        Empfänger löschen
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Compliance-Warteschlange</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-foreground/60">
              <tr>
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Retention</th>
                <th className="px-3 py-2">Fällig</th>
                <th className="px-3 py-2">Archiviert</th>
                <th className="px-3 py-2">Löschung</th>
                <th className="px-3 py-2">Legal Hold</th>
              </tr>
            </thead>
            <tbody>
              {complianceQueue.map((item) => (
                <tr key={item.caseId} className="border-t border-black/8">
                  <td className="px-3 py-2 font-semibold text-foreground">
                    <Link href={`/hub/cases/${item.caseId}`} className="underline decoration-brand/40 underline-offset-4">
                      {item.caseRef}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-foreground/80">{item.subjectDisplayName}</td>
                  <td className="px-3 py-2"><StatusBadge value={item.retentionStatus} /></td>
                  <td className="px-3 py-2 text-foreground/80">{formatDateTime(item.retentionDueAt)}</td>
                  <td className="px-3 py-2 text-foreground/80">{formatDateTime(item.archivedAt)}</td>
                  <td className="px-3 py-2 text-foreground/80">{formatDateTime(item.scheduledDeletionAt)}</td>
                  <td className="px-3 py-2 text-foreground/80">{item.legalHold ? "Ja" : "Nein"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
