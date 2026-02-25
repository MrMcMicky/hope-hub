import Link from "next/link";

import { createCaseAction } from "@/app/hub/actions";
import { HopeLogo } from "@/app/_components/hope-logo";
import { HubNav } from "@/app/hub/_components/hub-nav";
import { StatusBadge } from "@/app/hub/_components/status-badge";
import { requireHubActor } from "@/lib/auth/session";
import { HUB_SELECTS, ensureSeedData, listCases } from "@/lib/domain/workflows";

function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const SORT_FIELDS = [
  "caseRef",
  "subjectDisplayName",
  "offering",
  "status",
  "riskLevel",
  "retentionStatus",
  "openTasks",
  "hasOpenStay",
] as const;

type SortField = (typeof SORT_FIELDS)[number];
type SortDirection = "asc" | "desc";

function isSortField(value: string): value is SortField {
  return SORT_FIELDS.includes(value as SortField);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "de-CH", { sensitivity: "base", numeric: true });
}

function getNextDirection(currentField: SortField | null, currentDirection: SortDirection, targetField: SortField): SortDirection {
  if (currentField !== targetField) return "asc";
  return currentDirection === "asc" ? "desc" : "asc";
}

type CasesPageProps = {
  searchParams?: {
    q?: string;
    status?: string;
    area?: string;
    sort?: string;
    dir?: string;
  };
};

export const metadata = {
  title: "HOPE Hub Fälle",
};

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const actor = await requireHubActor("/hub/cases");
  await ensureSeedData(actor);

  const q = asString(searchParams?.q).trim();
  const status = asString(searchParams?.status).trim();
  const area = asString(searchParams?.area).trim();
  const sort = asString(searchParams?.sort).trim();
  const dir = asString(searchParams?.dir).trim().toLowerCase();
  const sortField = isSortField(sort) ? sort : null;
  const sortDirection: SortDirection = dir === "desc" ? "desc" : "asc";

  const cases = await listCases(actor, {
    q: q || undefined,
    status: (status || "ALL") as typeof HUB_SELECTS.caseStatuses[number]["value"] | "ALL",
    area: (area || "ALL") as typeof HUB_SELECTS.programAreas[number]["value"] | "ALL",
  });
  const sortedCases = [...cases];
  if (sortField) {
    sortedCases.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "caseRef":
          comparison = compareText(a.caseRef, b.caseRef);
          break;
        case "subjectDisplayName":
          comparison = compareText(a.subjectDisplayName, b.subjectDisplayName);
          break;
        case "offering":
          comparison = compareText(a.offering, b.offering);
          break;
        case "status":
          comparison = compareText(a.status, b.status);
          break;
        case "riskLevel":
          comparison = compareText(a.riskLevel, b.riskLevel);
          break;
        case "retentionStatus":
          comparison = compareText(a.retentionStatus, b.retentionStatus);
          break;
        case "openTasks":
          comparison = a.openTasks - b.openTasks;
          break;
        case "hasOpenStay":
          comparison = Number(a.hasOpenStay) - Number(b.hasOpenStay);
          break;
      }

      if (comparison === 0) {
        comparison = compareText(a.caseRef, b.caseRef);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }

  const commonParams = new URLSearchParams();
  if (q) commonParams.set("q", q);
  if (status) commonParams.set("status", status);
  if (area) commonParams.set("area", area);

  function sortLink(target: SortField): string {
    const params = new URLSearchParams(commonParams);
    params.set("sort", target);
    params.set("dir", getNextDirection(sortField, sortDirection, target));
    return `/hub/cases?${params.toString()}`;
  }

  function sortIndicator(target: SortField): string {
    if (sortField !== target) return "";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10">
      <header className="rounded-3xl border border-black/10 bg-surface/95 p-6 shadow-[0_18px_60px_-26px_rgb(18_22_27/0.38)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <HopeLogo variant="mark" className="h-auto w-16 sm:w-20" sizes="(max-width: 640px) 64px, 80px" />
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">Fälle</h1>
            <p className="mt-2 text-sm text-foreground/85">Persistente Fallführung mit strukturierter HOPE-Abbildung.</p>
          </div>
          <HubNav active="cases" />
        </div>
      </header>

      <section id="new-case" className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Neuen Fall anlegen</h2>
        <form action={createCaseAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm text-foreground/80">
            Name / Bezeichnung
            <input
              name="subjectDisplayName"
              required
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
              placeholder="z.B. M. Muster"
            />
          </label>

          <label className="text-sm text-foreground/80">
            Status
            <select name="status" defaultValue="INTAKE" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.caseStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Risiko
            <select name="riskLevel" defaultValue="MEDIUM" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.riskLevels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Bereich
            <select name="programArea" defaultValue="BETREUEN" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.programAreas.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Angebot
            <select name="offeringCode" defaultValue="SOCIAL_COUNSELING" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.offerings.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label} ({item.area})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Team
            <input name="assignedTeam" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" placeholder="z.B. Sozialdienst" />
          </label>

          <label className="text-sm text-foreground/80">
            Nächste Aktion
            <input name="nextActionAt" type="datetime-local" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-foreground/80">
            Zweck
            <input name="purpose" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" placeholder="z.B. Akutunterbringung" />
          </label>

          <label className="text-sm text-foreground/80">
            Rechtsgrundlage
            <select name="legalBasis" defaultValue="CONTRACT" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.legalBases.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Share Policy
            <select name="sharePolicy" defaultValue="NEED_TO_KNOW" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.sharePolicies.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80">
            Datenklasse
            <select name="dataClass" defaultValue="CONFIDENTIAL" className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              {HUB_SELECTS.dataClasses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-foreground/80 sm:col-span-2 lg:col-span-3">
            Retention-Regel
            <input
              name="retentionRule"
              defaultValue="Klientenakte bis 100. Altersjahr"
              className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm"
            />
          </label>

          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
              Fall erstellen
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">Fallliste</h2>

        <form method="get" className="mt-4 grid gap-3 sm:grid-cols-4">
          <label className="text-sm text-foreground/80 sm:col-span-2">
            Suche
            <input name="q" defaultValue={q} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm" placeholder="Case, Name oder Angebot" />
          </label>
          <label className="text-sm text-foreground/80">
            Status
            <select name="status" defaultValue={status || "ALL"} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              <option value="ALL">Alle</option>
              {HUB_SELECTS.caseStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-foreground/80">
            Bereich
            <select name="area" defaultValue={area || "ALL"} className="mt-1 w-full rounded-xl border border-black/15 px-3 py-2 text-sm">
              <option value="ALL">Alle</option>
              {HUB_SELECTS.programAreas.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-4">
            {sortField ? <input type="hidden" name="sort" value={sortField} /> : null}
            {sortField ? <input type="hidden" name="dir" value={sortDirection} /> : null}
            <button type="submit" className="inline-flex rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-foreground/80">
              Filtern
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-xs uppercase tracking-[0.12em] text-foreground/70">
              <tr>
                <th className="px-3 py-2">
                  <Link href={sortLink("caseRef")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Case <span className="text-foreground/65">{sortIndicator("caseRef")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">
                  <Link href={sortLink("subjectDisplayName")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Person <span className="text-foreground/65">{sortIndicator("subjectDisplayName")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">
                  <Link href={sortLink("offering")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Angebot <span className="text-foreground/65">{sortIndicator("offering")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">
                  <Link href={sortLink("status")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Status <span className="text-foreground/65">{sortIndicator("status")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">
                  <Link href={sortLink("riskLevel")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Risiko <span className="text-foreground/65">{sortIndicator("riskLevel")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">
                  <Link href={sortLink("retentionStatus")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Retention <span className="text-foreground/65">{sortIndicator("retentionStatus")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">
                  <Link href={sortLink("openTasks")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Open Tasks <span className="text-foreground/65">{sortIndicator("openTasks")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">
                  <Link href={sortLink("hasOpenStay")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Open Stay <span className="text-foreground/65">{sortIndicator("hasOpenStay")}</span>
                  </Link>
                </th>
                <th className="px-3 py-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {sortedCases.map((item) => (
                <tr key={item.id} className="border-t border-black/8">
                  <td className="px-3 py-2 font-semibold text-foreground">
                    <Link href={`/hub/cases/${item.id}`} className="underline decoration-brand/40 underline-offset-4">
                      {item.caseRef}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-foreground/88">{item.subjectDisplayName}</td>
                  <td className="px-3 py-2 text-foreground/86">{item.offering}</td>
                  <td className="px-3 py-2"><StatusBadge value={item.status} /></td>
                  <td className="px-3 py-2"><StatusBadge value={item.riskLevel} /></td>
                  <td className="px-3 py-2"><StatusBadge value={item.retentionStatus} /></td>
                  <td className="px-3 py-2 text-foreground/86">{item.openTasks}</td>
                  <td className="px-3 py-2 text-foreground/86">{item.hasOpenStay ? "Ja" : "Nein"}</td>
                  <td className="px-3 py-2">
                    <Link href={`/hub/cases/${item.id}`} className="rounded-lg border border-black/12 bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground/88">
                      Öffnen
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
