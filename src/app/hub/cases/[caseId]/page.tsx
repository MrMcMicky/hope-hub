import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addInvoiceLineAction,
  archiveCaseAction,
  checkOutStayAction,
  createCostApprovalAction,
  createExportPackageAction,
  createInvoiceDraftAction,
  createServiceEventAction,
  createStayAction,
  createTaskAction,
  deleteServiceEventAction,
  deleteCostApprovalAction,
  deleteTaskAction,
  runRetentionReviewAction,
  scheduleCaseDeletionAction,
  updateCaseAction,
  updateCostApprovalAction,
  updateCostApprovalStatusAction,
  updateExportStatusAction,
  updateInvoiceStatusAction,
  updateServiceEventAction,
  updateTaskStatusAction,
} from "@/app/hub/actions";
import { requireHubActor } from "@/lib/auth/session";
import { offeringByLabel } from "@/lib/domain/hope-structure";
import { HUB_SELECTS, WorkflowError, getCaseDetail } from "@/lib/domain/workflows";

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

function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

type CaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  let caseItem;
  try {
    caseItem = await getCaseDetail(actor, caseId);
  } catch (error) {
    if (error instanceof WorkflowError && error.code === "not_found") {
      notFound();
    }
    throw error;
  }

  const updateCase = updateCaseAction.bind(null, caseItem.id);
  const createStay = createStayAction.bind(null, caseItem.id);
  const createServiceEvent = createServiceEventAction.bind(null, caseItem.id);
  const createTask = createTaskAction.bind(null, caseItem.id);
  const createCostApproval = createCostApprovalAction.bind(null, caseItem.id);
  const createInvoiceDraft = createInvoiceDraftAction.bind(null, caseItem.id);
  const createExportPackage = createExportPackageAction.bind(null, caseItem.id);
  const runRetentionReview = runRetentionReviewAction.bind(null, caseItem.id);
  const archiveCase = archiveCaseAction.bind(null, caseItem.id);
  const scheduleDeletion = scheduleCaseDeletionAction.bind(null, caseItem.id);
  const defaultOfferingCode = offeringByLabel(caseItem.offering)?.code ?? HUB_SELECTS.offerings[0]?.code ?? "";
  const programAreaLabel = HUB_SELECTS.programAreas.find((item) => item.value === caseItem.programArea)?.label ?? caseItem.programArea;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">Fallakte</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">
              {caseItem.caseRef} | {caseItem.subjectDisplayName}
            </h1>
            <p className="mt-2 text-sm text-foreground/75">
              Angebot: {caseItem.offering} | Bereich: {programAreaLabel} | Letzte Änderung: {formatDateTime(caseItem.updatedAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/hub/cases" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Zur Fallliste
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
            <Link href="/hub" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">Retention-Status</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{caseItem.retentionStatus}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">Retention fällig</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(caseItem.retentionDueAt)}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">Archiviert</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(caseItem.archivedAt)}</p>
        </article>
        <article className="rounded-2xl border border-black/8 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">Löschung geplant</p>
          <p className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(caseItem.scheduledDeletionAt)}</p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Fallstammdaten</h2>
        <form action={updateCase} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm text-foreground/80">
            Name / Bezeichnung
            <input name="subjectDisplayName" defaultValue={caseItem.subjectDisplayName} required className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-foreground/80">
            Status
            <select name="status" defaultValue={caseItem.status} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.caseStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Risiko
            <select name="riskLevel" defaultValue={caseItem.riskLevel} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.riskLevels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Bereich
            <select name="programArea" defaultValue={caseItem.programArea} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.programAreas.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Angebot
            <select name="offeringCode" defaultValue={defaultOfferingCode} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.offerings.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label} ({item.area})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Team
            <input name="assignedTeam" defaultValue={caseItem.assignedTeam ?? ""} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-foreground/80">
            Nächste Aktion
            <input name="nextActionAt" type="datetime-local" defaultValue={toDateTimeLocalValue(caseItem.nextActionAt)} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-foreground/80">
            Zweck
            <input name="purpose" defaultValue={caseItem.purpose} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-foreground/80">
            Rechtsgrundlage
            <select name="legalBasis" defaultValue={caseItem.legalBasis} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.legalBases.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Share Policy
            <select name="sharePolicy" defaultValue={caseItem.sharePolicy} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.sharePolicies.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Datenklasse
            <select name="dataClass" defaultValue={caseItem.dataClass} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.dataClasses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80 sm:col-span-2 lg:col-span-3">
            Retention-Regel
            <input name="retentionRule" defaultValue={caseItem.retentionRule} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-foreground/80 sm:col-span-2 lg:col-span-3">
            <input type="checkbox" name="legalHold" defaultChecked={caseItem.legalHold} className="h-4 w-4" />
            Legal Hold aktiv
          </label>

          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
              Fall aktualisieren
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Aufenthalte (Check-in / Check-out)</h2>

          <form action={createStay} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-foreground/80">
              Check-in Zeit
              <input name="checkInAt" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <div className="flex items-end">
              <button type="submit" className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
                Check-in erfassen
              </button>
            </div>
          </form>

          <ul className="mt-4 space-y-2 text-sm">
            {caseItem.stays.map((stay) => {
              const checkOut = checkOutStayAction.bind(null, caseItem.id, stay.id);
              return (
                <li key={stay.id} className="rounded-xl border border-black/8 px-3 py-2">
                  <p className="font-semibold text-foreground">{stay.status}</p>
                  <p className="text-foreground/75">
                    In: {formatDateTime(stay.checkInAt)} | Out: {formatDateTime(stay.checkOutAt)} | {stay.createdBy}
                  </p>
                  {stay.status === "CHECKED_IN" ? (
                    <form action={checkOut} className="mt-2 flex flex-wrap items-end gap-2">
                      <label className="text-xs text-foreground/70">
                        Check-out Zeit
                        <input name="checkOutAt" type="datetime-local" className="mt-1 rounded-xl border border-black/15 px-3 py-2 text-sm" />
                      </label>
                      <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                        Check-out buchen
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Service-Events</h2>

          <form action={createServiceEvent} className="mt-4 grid gap-3">
            <label className="text-sm text-foreground/80">
              Event-Typ
              <input name="eventType" required placeholder="z.B. COUNSELING" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <label className="text-sm text-foreground/80">
              Aufenthalt (optional)
              <select name="stayId" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
                <option value="">Kein Bezug</option>
                {caseItem.stays.map((stay) => (
                  <option key={stay.id} value={stay.id}>
                    {stay.status} | {formatDateTime(stay.checkInAt)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-foreground/80">
              Zeitpunkt
              <input name="occurredAt" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <label className="text-sm text-foreground/80">
              Notiz
              <textarea name="notes" rows={3} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <button type="submit" className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
              Event speichern
            </button>
          </form>

          <ul className="mt-4 space-y-2 text-sm">
            {caseItem.serviceEvents.map((event) => {
              const updateServiceEvent = updateServiceEventAction.bind(null, caseItem.id, event.id);
              const deleteServiceEvent = deleteServiceEventAction.bind(null, caseItem.id, event.id);

              return (
                <li key={event.id} className="rounded-xl border border-black/8 px-3 py-2">
                  <p className="font-semibold text-foreground">{event.eventType}</p>
                  <p className="text-foreground/75">
                    {formatDateTime(event.occurredAt)} | {event.createdBy}
                  </p>
                  <p className="text-foreground/70">{event.notes || "-"}</p>

                  <form action={updateServiceEvent} className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-foreground/70 sm:col-span-2">
                      Event-Typ
                      <input name="eventType" defaultValue={event.eventType} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70">
                      Zeitpunkt
                      <input name="occurredAt" type="datetime-local" defaultValue={toDateTimeLocalValue(event.occurredAt)} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70">
                      Aufenthalt (optional)
                      <select name="stayId" defaultValue={event.stayId ?? ""} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
                        <option value="">Kein Bezug</option>
                        {caseItem.stays.map((stay) => (
                          <option key={stay.id} value={stay.id}>
                            {stay.status} | {formatDateTime(stay.checkInAt)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-foreground/70 sm:col-span-2">
                      Notiz
                      <input name="notes" defaultValue={event.notes} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <div className="sm:col-span-2 flex flex-wrap gap-2">
                      <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                        Event aktualisieren
                      </button>
                      <button formAction={deleteServiceEvent} type="submit" className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        Event löschen
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Billing / Rechnungsentwürfe</h2>

          <div className="mt-4 rounded-xl border border-black/8 bg-surface/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-strong">Kostengutsprache</h3>
            <form action={createCostApproval} className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-foreground/80">
                Behörde / Kostenträger
                <input name="authorityName" required className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-foreground/80">
                Betrag (Rappen)
                <input name="approvedAmountCents" defaultValue="50000" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-foreground/80">
                Währung
                <input name="currency" defaultValue="CHF" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-foreground/80">
                Gültig von
                <input name="validFrom" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-foreground/80">
                Gültig bis
                <input name="validUntil" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-foreground/80 sm:col-span-2">
                Notiz
                <input name="notes" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" placeholder="z.B. Verfügung / Aktenzeichen" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
                  Kostengutsprache erfassen
                </button>
              </div>
            </form>

            <ul className="mt-4 space-y-2 text-sm">
              {caseItem.costApprovals.map((approval) => {
                const updateApproval = updateCostApprovalAction.bind(null, caseItem.id, approval.id);
                const updateApprovalStatus = updateCostApprovalStatusAction.bind(null, caseItem.id, approval.id);
                const deleteApproval = deleteCostApprovalAction.bind(null, caseItem.id, approval.id);

                return (
                  <li key={approval.id} className="rounded-xl border border-black/8 bg-white px-3 py-3">
                    <p className="font-semibold text-foreground">
                      {approval.approvalRef} | {approval.status} | {approval.authorityName}
                    </p>
                    <p className="text-foreground/75">
                      Betrag: {formatMoney(approval.approvedAmountCents)} | Gültig: {formatDateTime(approval.validFrom)} bis {formatDateTime(approval.validUntil)}
                    </p>
                    <p className="text-foreground/70">
                      Erfasst von {approval.createdBy} | Verknüpfte Rechnungen: {approval.linkedInvoiceRefs.length ? approval.linkedInvoiceRefs.join(", ") : "-"}
                    </p>
                    <p className="text-foreground/70">{approval.notes || "-"}</p>

                    <form action={updateApprovalStatus} className="mt-2 flex flex-wrap items-end gap-2">
                      <select name="status" defaultValue={approval.status} className="rounded-xl border border-black/15 px-3 py-2 text-xs">
                        {HUB_SELECTS.costApprovalStatuses.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                        Status setzen
                      </button>
                    </form>

                    <form action={updateApproval} className="mt-2 grid gap-2 sm:grid-cols-2">
                      <label className="text-xs text-foreground/70 sm:col-span-2">
                        Behörde / Kostenträger
                        <input name="authorityName" defaultValue={approval.authorityName} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-foreground/70">
                        Betrag (Rappen)
                        <input name="approvedAmountCents" defaultValue={String(approval.approvedAmountCents)} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-foreground/70">
                        Währung
                        <input name="currency" defaultValue={approval.currency} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-foreground/70">
                        Gültig von
                        <input name="validFrom" type="datetime-local" defaultValue={toDateTimeLocalValue(approval.validFrom)} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-foreground/70">
                        Gültig bis
                        <input name="validUntil" type="datetime-local" defaultValue={toDateTimeLocalValue(approval.validUntil)} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                      </label>
                      <label className="text-xs text-foreground/70 sm:col-span-2">
                        Notiz
                        <input name="notes" defaultValue={approval.notes} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                      </label>
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                          Kostengutsprache aktualisieren
                        </button>
                        <button formAction={deleteApproval} type="submit" className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                          Löschen
                        </button>
                      </div>
                    </form>
                  </li>
                );
              })}
            </ul>
          </div>

          <form action={createInvoiceDraft} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-foreground/80">
              Zeitraum von
              <input name="periodStart" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-foreground/80">
              Zeitraum bis
              <input name="periodEnd" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-foreground/80">
              Steuer in %
              <input name="taxRatePercent" defaultValue="0" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-foreground/80 sm:col-span-2">
              Kostengutsprache (optional)
              <select name="costApprovalId" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
                <option value="">Keine Verknüpfung</option>
                {caseItem.costApprovals.map((approval) => (
                  <option key={approval.id} value={approval.id}>
                    {approval.approvalRef} | {approval.status} | {approval.authorityName} | {formatMoney(approval.approvedAmountCents)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-foreground/80 sm:col-span-2">
              Notiz
              <input name="notes" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" placeholder="z.B. Februar 2026 inkl. Verfügung" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
                Rechnungsentwurf erstellen
              </button>
            </div>
          </form>

          <ul className="mt-4 space-y-3 text-sm">
            {caseItem.invoices.map((invoice) => {
              const updateInvoiceStatus = updateInvoiceStatusAction.bind(null, caseItem.id, invoice.id);
              const addLine = addInvoiceLineAction.bind(null, caseItem.id, invoice.id);

              return (
                <li key={invoice.id} className="rounded-xl border border-black/8 px-3 py-3">
                  <p className="font-semibold text-foreground">
                    {invoice.invoiceRef} | {invoice.status}
                  </p>
                  <p className="text-foreground/75">
                    Zeitraum: {formatDateTime(invoice.periodStart)} bis {formatDateTime(invoice.periodEnd)}
                  </p>
                  <p className="text-foreground/75">
                    Total: {formatMoney(invoice.totalCents)} (Subtotal {formatMoney(invoice.subtotalCents)}, Steuer {formatMoney(invoice.taxCents)})
                  </p>
                  <p className="text-foreground/75">Kostengutsprache: {invoice.costApprovalRef ?? "-"}</p>
                  <p className="text-foreground/70">{invoice.notes || "-"}</p>

                  <form action={updateInvoiceStatus} className="mt-2 flex flex-wrap items-end gap-2">
                    <select name="status" defaultValue={invoice.status} className="rounded-xl border border-black/15 px-3 py-2 text-xs">
                      {HUB_SELECTS.invoiceStatuses.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                      Rechnungsstatus setzen
                    </button>
                  </form>

                  <form action={addLine} className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-foreground/70 sm:col-span-2">
                      Position
                      <input name="description" required className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70">
                      Menge
                      <input name="quantity" defaultValue="1" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70">
                      Einzelpreis (Rappen)
                      <input name="unitPriceCents" defaultValue="4500" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-foreground/70 sm:col-span-2">
                      Zeitpunkt (optional)
                      <input name="occurredAt" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
                    </label>
                    <div className="sm:col-span-2">
                      <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                        Position hinzufügen
                      </button>
                    </div>
                  </form>

                  <ul className="mt-3 space-y-1 text-xs text-foreground/70">
                    {invoice.lines.map((line) => (
                      <li key={line.id}>
                        {line.sourceType} | {line.description} | {line.quantity} x {formatMoney(line.unitPriceCents)} = {formatMoney(line.lineTotalCents)}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Exportpakete</h2>

          <form action={createExportPackage} className="mt-4 grid gap-3">
            <label className="text-sm text-foreground/80">
              Empfänger
              <select name="recipientId" required className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
                <option value="">Empfänger wählen</option>
                {caseItem.exportRecipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.label} ({recipient.recipientRef})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-foreground/80">
              Payload-Typ
              <input name="payloadType" defaultValue="case_bundle" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <label className="text-sm text-foreground/80">
              Zweck
              <input name="purpose" defaultValue={caseItem.purpose} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <label className="text-sm text-foreground/80">
              Ablaufdatum
              <input name="expiresAt" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <button type="submit" className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
              Exportpaket erstellen
            </button>
          </form>

          <ul className="mt-4 space-y-2 text-sm">
            {caseItem.exportPackages.map((exportItem) => {
              const updateExportStatus = updateExportStatusAction.bind(null, caseItem.id, exportItem.id);

              return (
                <li key={exportItem.id} className="rounded-xl border border-black/8 px-3 py-2">
                  <p className="font-semibold text-foreground">
                    {exportItem.exportRef} | {exportItem.status}
                  </p>
                  <p className="text-foreground/75">
                    {exportItem.recipientLabel} | Payload: {exportItem.payloadType}
                  </p>
                  <p className="text-foreground/75">
                    Verschlüsselt: {exportItem.encrypted ? "Ja" : "Nein"} | Ablauf: {formatDateTime(exportItem.expiresAt)}
                  </p>
                  <p className="text-foreground/70">
                    Zweck: {exportItem.purpose} | Hash: {exportItem.payloadHash || "-"}
                  </p>

                  <form action={updateExportStatus} className="mt-2 flex flex-wrap items-end gap-2">
                    <select name="status" defaultValue={exportItem.status} className="rounded-xl border border-black/15 px-3 py-2 text-xs">
                      {HUB_SELECTS.exportStatuses.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                      Exportstatus setzen
                    </button>
                    {exportItem.status === "READY" || exportItem.status === "RELEASED" ? (
                      <a
                        href={`/api/exports/${exportItem.id}/download`}
                        className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80"
                      >
                        Paket herunterladen
                      </a>
                    ) : null}
                  </form>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Compliance / Retention</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <form action={runRetentionReview}>
            <button type="submit" className="inline-flex w-full rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-foreground/85">
              Retention prüfen
            </button>
          </form>

          <form action={archiveCase} className="grid gap-2">
            <input name="archivedAt" type="datetime-local" className="rounded-xl border border-black/15 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-foreground/85">
              Fall archivieren
            </button>
          </form>

          <form action={scheduleDeletion} className="grid gap-2">
            <input name="scheduledDeletionAt" type="datetime-local" className="rounded-xl border border-black/15 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-foreground/85">
              Löschung planen
            </button>
          </form>
        </div>
        <p className="mt-3 text-sm text-foreground/72">
          Letzte Retention-Prüfung: {formatDateTime(caseItem.retentionLastCheck)} | Legal Hold: {caseItem.legalHold ? "aktiv" : "nicht aktiv"}
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>

          <form action={createTask} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-foreground/80 sm:col-span-2">
              Titel
              <input name="title" required className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <label className="text-sm text-foreground/80 sm:col-span-2">
              Details
              <textarea name="details" rows={2} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <label className="text-sm text-foreground/80">
              Owner
              <input name="ownerName" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <label className="text-sm text-foreground/80">
              Priorität
              <select name="priority" defaultValue="P2" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
                {HUB_SELECTS.taskPriorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-foreground/80 sm:col-span-2">
              Fällig am
              <input name="dueAt" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
            </label>

            <div className="sm:col-span-2">
              <button type="submit" className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
                Task anlegen
              </button>
            </div>
          </form>

          <ul className="mt-4 space-y-2 text-sm">
            {caseItem.tasks.map((task) => {
              const updateStatus = updateTaskStatusAction.bind(null, caseItem.id, task.id);
              const removeTask = deleteTaskAction.bind(null, caseItem.id, task.id);

              return (
                <li key={task.id} className="rounded-xl border border-black/8 px-3 py-2">
                  <p className="font-semibold text-foreground">
                    {task.priority} | {task.title}
                  </p>
                  <p className="text-foreground/75">
                    Owner: {task.ownerName || "-"} | Due: {formatDateTime(task.dueAt)}
                  </p>
                  <p className="text-foreground/70">{task.details || "-"}</p>

                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <form action={updateStatus}>
                      <select name="status" defaultValue={task.status} className="rounded-xl border border-black/15 px-3 py-2 text-xs">
                        {HUB_SELECTS.taskStatuses.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="ml-2 rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-foreground/80">
                        Status setzen
                      </button>
                    </form>
                    <form action={removeTask}>
                      <button type="submit" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        Löschen
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-2xl border border-black/8 bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">Audit-Trail</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {caseItem.auditTrail.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">
                  {entry.action} | {entry.entityType}
                </p>
                <p className="text-foreground/75">
                  {formatDateTime(entry.eventTs)} | {entry.actor}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
