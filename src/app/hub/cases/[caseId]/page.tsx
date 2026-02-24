import Link from "next/link";
import { notFound } from "next/navigation";

import {
  checkOutStayAction,
  createServiceEventAction,
  createStayAction,
  createTaskAction,
  deleteTaskAction,
  updateCaseAction,
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
            <Link href="/hub" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

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
            {caseItem.serviceEvents.map((event) => (
              <li key={event.id} className="rounded-xl border border-black/8 px-3 py-2">
                <p className="font-semibold text-foreground">{event.eventType}</p>
                <p className="text-foreground/75">
                  {formatDateTime(event.occurredAt)} | {event.createdBy}
                </p>
                <p className="text-foreground/70">{event.notes || "-"}</p>
              </li>
            ))}
          </ul>
        </article>
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
