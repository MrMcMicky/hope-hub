import { createHash } from "node:crypto";
import {
  type Case,
  type CaseStatus,
  type CostApprovalStatus,
  type DataClass,
  type ExportPackageStatus,
  type InvoiceLineSource,
  type InvoiceStatus,
  type LegalBasis,
  type Prisma,
  type ProgramArea,
  type RetentionStatus,
  type RiskLevel,
  type SharePolicy,
  type StayStatus,
  type TaskPriority,
  type TaskStatus,
  type UserRole,
} from "@prisma/client";

import type { HubActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import {
  CASE_STATUS_OPTIONS,
  HOPE_OFFERINGS,
  HOPE_PROGRAM_AREAS,
  RISK_LEVEL_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  offeringByCode,
} from "@/lib/domain/hope-structure";
import { buildAppendOnlyAuditEvent } from "@/modules/audit";
import { computeAuditHash } from "@/modules/audit/hash-chain";
import { authorize, type ActorRole, type AuthzAction } from "@/modules/authz";

const DATA_CLASS_OPTIONS: Array<{ value: DataClass; label: string }> = [
  { value: "PUBLIC", label: "Öffentlich" },
  { value: "INTERNAL", label: "Intern" },
  { value: "CONFIDENTIAL", label: "Vertraulich" },
  { value: "HIGHLY_SENSITIVE", label: "Besonders schützenswert" },
];

const LEGAL_BASIS_OPTIONS: Array<{ value: LegalBasis; label: string }> = [
  { value: "CONSENT", label: "Einwilligung" },
  { value: "CONTRACT", label: "Vertrag" },
  { value: "LEGAL_OBLIGATION", label: "Rechtliche Pflicht" },
  { value: "VITAL_INTEREST", label: "Lebenswichtige Interessen" },
  { value: "PUBLIC_TASK", label: "Öffentliche Aufgabe" },
  { value: "LEGITIMATE_INTEREST", label: "Berechtigtes Interesse" },
];

const SHARE_POLICY_OPTIONS: Array<{ value: SharePolicy; label: string }> = [
  { value: "INTERNAL_ONLY", label: "Nur intern" },
  { value: "NEED_TO_KNOW", label: "Need-to-know" },
  { value: "AUTHORITY_ONLY", label: "Nur Behörden" },
  { value: "PARTNER_ALLOWED", label: "Partner erlaubt" },
];

const INVOICE_STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "DRAFT", label: "Entwurf" },
  { value: "READY", label: "Bereit" },
  { value: "SUBMITTED", label: "Eingereicht" },
  { value: "PAID", label: "Bezahlt" },
  { value: "CANCELLED", label: "Storniert" },
];

const EXPORT_STATUS_OPTIONS: Array<{ value: ExportPackageStatus; label: string }> = [
  { value: "DRAFT", label: "Entwurf" },
  { value: "READY", label: "Freigabebereit" },
  { value: "RELEASED", label: "Freigegeben" },
  { value: "CANCELLED", label: "Abgebrochen" },
];

const RETENTION_STATUS_OPTIONS: Array<{ value: RetentionStatus; label: string }> = [
  { value: "ACTIVE", label: "Aktiv" },
  { value: "DUE", label: "Fällig" },
  { value: "ARCHIVED", label: "Archiviert" },
  { value: "DELETION_SCHEDULED", label: "Löschung geplant" },
];

const COST_APPROVAL_STATUS_OPTIONS: Array<{ value: CostApprovalStatus; label: string }> = [
  { value: "DRAFT", label: "Entwurf" },
  { value: "SUBMITTED", label: "Eingereicht" },
  { value: "APPROVED", label: "Genehmigt" },
  { value: "REJECTED", label: "Abgelehnt" },
  { value: "EXPIRED", label: "Abgelaufen" },
  { value: "CANCELLED", label: "Storniert" },
];

export const HUB_SELECTS = {
  caseStatuses: CASE_STATUS_OPTIONS,
  riskLevels: RISK_LEVEL_OPTIONS,
  programAreas: HOPE_PROGRAM_AREAS,
  offerings: HOPE_OFFERINGS,
  dataClasses: DATA_CLASS_OPTIONS,
  legalBases: LEGAL_BASIS_OPTIONS,
  sharePolicies: SHARE_POLICY_OPTIONS,
  taskPriorities: TASK_PRIORITY_OPTIONS,
  taskStatuses: TASK_STATUS_OPTIONS,
  invoiceStatuses: INVOICE_STATUS_OPTIONS,
  exportStatuses: EXPORT_STATUS_OPTIONS,
  retentionStatuses: RETENTION_STATUS_OPTIONS,
  costApprovalStatuses: COST_APPROVAL_STATUS_OPTIONS,
};

export type CaseListItem = {
  id: string;
  caseRef: string;
  subjectDisplayName: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  programArea: ProgramArea;
  offering: string;
  assignedTeam: string | null;
  nextActionAt: string | null;
  legalHold: boolean;
  retentionStatus: RetentionStatus;
  retentionDueAt: string | null;
  openTasks: number;
  hasOpenStay: boolean;
  updatedAt: string;
};

export type DashboardSnapshot = {
  generatedAt: string;
  kpis: {
    activeCases: number;
    openTasks: number;
    highRiskCases: number;
    pendingSyncEvents: number;
    occupancyRate: number;
    billingDrafts: number;
    pendingExports: number;
    retentionDueCases: number;
    pendingCostApprovals: number;
    openWorkItems: number;
  };
  occupancy: Array<{ site: string; capacity: number; occupied: number }>;
  cases: CaseListItem[];
  activities: Array<{
    id: string;
    occurredAt: string;
    type: string;
    caseRef: string;
    actor: string;
    note: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    caseId: string;
    caseRef: string;
    owner: string;
    dueAt: string | null;
    priority: TaskPriority;
    status: TaskStatus;
  }>;
  syncClients: Array<{
    id: string;
    label: string;
    owner: string;
    lastSeenAt: string | null;
    pendingEvents: number;
  }>;
  invoiceQueue: Array<{
    id: string;
    invoiceRef: string;
    caseRef: string;
    status: InvoiceStatus;
    totalCents: number;
    updatedAt: string;
  }>;
  exportQueue: Array<{
    id: string;
    exportRef: string;
    caseRef: string;
    recipient: string;
    status: ExportPackageStatus;
    updatedAt: string;
  }>;
  complianceQueue: Array<{
    id: string;
    caseRef: string;
    subjectDisplayName: string;
    retentionStatus: RetentionStatus;
    retentionDueAt: string | null;
  }>;
};

export type CaseDetail = {
  id: string;
  caseRef: string;
  subjectDisplayName: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  programArea: ProgramArea;
  offering: string;
  assignedTeam: string | null;
  nextActionAt: string | null;
  dataClass: DataClass;
  legalBasis: LegalBasis;
  sharePolicy: SharePolicy;
  purpose: string;
  retentionRule: string;
  retentionDueAt: string | null;
  retentionStatus: RetentionStatus;
  retentionLastCheck: string | null;
  archivedAt: string | null;
  scheduledDeletionAt: string | null;
  legalHold: boolean;
  createdAt: string;
  updatedAt: string;
  stays: Array<{
    id: string;
    checkInAt: string;
    checkOutAt: string | null;
    status: StayStatus;
    createdBy: string;
  }>;
  serviceEvents: Array<{
    id: string;
    stayId: string | null;
    eventType: string;
    occurredAt: string;
    notes: string;
    createdBy: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    details: string;
    ownerName: string;
    dueAt: string | null;
    priority: TaskPriority;
      status: TaskStatus;
      createdAt: string;
    }>;
  invoices: Array<{
    id: string;
    invoiceRef: string;
    periodStart: string;
    periodEnd: string;
    status: InvoiceStatus;
    costApprovalId: string | null;
    costApprovalRef: string | null;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    notes: string;
    createdAt: string;
    updatedAt: string;
    issuedAt: string | null;
    paidAt: string | null;
    lines: Array<{
      id: string;
      sourceType: InvoiceLineSource;
      description: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
      occurredAt: string | null;
      createdAt: string;
    }>;
  }>;
  costApprovals: Array<{
    id: string;
    approvalRef: string;
    authorityName: string;
    approvedAmountCents: number;
    currency: string;
    validFrom: string;
    validUntil: string;
    status: CostApprovalStatus;
    notes: string;
    submittedAt: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    linkedInvoiceRefs: string[];
  }>;
  exportPackages: Array<{
    id: string;
    exportRef: string;
    recipientId: string;
    recipientLabel: string;
    recipientOrganisation: string;
    status: ExportPackageStatus;
    payloadType: string;
    purpose: string;
    legalBasis: LegalBasis;
    sharePolicy: SharePolicy;
    encrypted: boolean;
    payloadHash: string;
    expiresAt: string | null;
    releasedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  exportRecipients: Array<{
    id: string;
    recipientRef: string;
    label: string;
    organisation: string;
    channel: string;
    endpoint: string;
    authorityApproved: boolean;
    keyFingerprint: string;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    entityType: string;
    eventTs: string;
    actor: string;
  }>;
};

export type CaseFilters = {
  q?: string;
  status?: CaseStatus | "ALL";
  area?: ProgramArea | "ALL";
};

export type CreateCaseInput = {
  subjectDisplayName: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  programArea: ProgramArea;
  offeringCode: string;
  assignedTeam?: string;
  nextActionAt?: string;
  purpose?: string;
  legalBasis?: LegalBasis;
  sharePolicy?: SharePolicy;
  dataClass?: DataClass;
  retentionRule?: string;
};

export type UpdateCaseInput = {
  subjectDisplayName: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  programArea: ProgramArea;
  offeringCode: string;
  assignedTeam?: string;
  nextActionAt?: string;
  purpose: string;
  legalBasis: LegalBasis;
  sharePolicy: SharePolicy;
  dataClass: DataClass;
  retentionRule: string;
  legalHold: boolean;
};

export type CreateStayInput = {
  caseId: string;
  checkInAt?: string;
};

export type CheckOutStayInput = {
  caseId: string;
  stayId: string;
  checkOutAt?: string;
};

export type CreateServiceEventInput = {
  caseId: string;
  stayId?: string;
  eventType: string;
  occurredAt?: string;
  notes?: string;
};

export type UpdateServiceEventInput = {
  caseId: string;
  serviceEventId: string;
  stayId?: string;
  eventType: string;
  occurredAt?: string;
  notes?: string;
};

export type DeleteServiceEventInput = {
  caseId: string;
  serviceEventId: string;
};

export type CreateTaskInput = {
  caseId: string;
  title: string;
  details?: string;
  ownerName?: string;
  dueAt?: string;
  priority: TaskPriority;
};

export type UpdateTaskStatusInput = {
  caseId: string;
  taskId: string;
  status: TaskStatus;
};

export type DeleteTaskInput = {
  caseId: string;
  taskId: string;
};

export type CreateInvoiceDraftInput = {
  caseId: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  taxRatePercent?: number;
  costApprovalId?: string;
};

export type CreateCostApprovalInput = {
  caseId: string;
  authorityName: string;
  approvedAmountCents: number;
  currency?: string;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
};

export type UpdateCostApprovalInput = {
  caseId: string;
  costApprovalId: string;
  authorityName: string;
  approvedAmountCents: number;
  currency?: string;
  validFrom: string;
  validUntil: string;
  notes?: string;
};

export type UpdateCostApprovalStatusInput = {
  caseId: string;
  costApprovalId: string;
  status: CostApprovalStatus;
};

export type DeleteCostApprovalInput = {
  caseId: string;
  costApprovalId: string;
};

export type AddInvoiceLineInput = {
  caseId: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  occurredAt?: string;
};

export type UpdateInvoiceStatusInput = {
  caseId: string;
  invoiceId: string;
  status: InvoiceStatus;
};

export type CreateExportRecipientInput = {
  label: string;
  organisation?: string;
  channel?: string;
  endpoint?: string;
  authorityApproved?: boolean;
  keyFingerprint?: string;
};

export type UpdateExportRecipientInput = {
  recipientId: string;
  label: string;
  organisation?: string;
  channel?: string;
  endpoint?: string;
  authorityApproved?: boolean;
  keyFingerprint?: string;
};

export type DeleteExportRecipientInput = {
  recipientId: string;
};

export type CreateExportPackageInput = {
  caseId: string;
  recipientId: string;
  payloadType?: string;
  purpose?: string;
  expiresAt?: string;
};

export type UpdateExportStatusInput = {
  caseId: string;
  exportId: string;
  status: ExportPackageStatus;
};

export type RunRetentionReviewInput = {
  caseId: string;
};

export type ArchiveCaseInput = {
  caseId: string;
  archivedAt?: string;
};

export type ScheduleCaseDeletionInput = {
  caseId: string;
  scheduledDeletionAt?: string;
};

export type BillingQueueItem = {
  id: string;
  invoiceRef: string;
  caseId: string;
  caseRef: string;
  subjectDisplayName: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  totalCents: number;
  updatedAt: string;
};

export type ExportQueueItem = {
  id: string;
  exportRef: string;
  caseId: string;
  caseRef: string;
  subjectDisplayName: string;
  recipient: string;
  status: ExportPackageStatus;
  releasedAt: string | null;
  updatedAt: string;
};

export type ComplianceQueueItem = {
  caseId: string;
  caseRef: string;
  subjectDisplayName: string;
  retentionStatus: RetentionStatus;
  retentionDueAt: string | null;
  archivedAt: string | null;
  scheduledDeletionAt: string | null;
  legalHold: boolean;
};

export type ExportRecipientListItem = {
  id: string;
  recipientRef: string;
  label: string;
  organisation: string;
  channel: string;
  endpoint: string;
  authorityApproved: boolean;
  keyFingerprint: string;
};

export type BillingJournalRow = {
  invoiceRef: string;
  caseRef: string;
  subjectDisplayName: string;
  invoiceStatus: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  lineSource: InvoiceLineSource;
  lineDescription: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  occurredAt: string | null;
  createdAt: string;
};

export type AuditReportRow = {
  eventTs: string;
  caseRef: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  payloadJson: string;
};

export type OccupancyReportRow = {
  site: string;
  offering: string;
  capacity: number;
  occupied: number;
  occupancyRatePercent: number;
};

export type OpenWorkReportRow = {
  queueType: "INVOICE" | "EXPORT";
  reference: string;
  caseRef: string;
  subjectDisplayName: string;
  status: string;
  updatedAt: string;
};

export type ExportListReportRow = {
  exportRef: string;
  caseRef: string;
  subjectDisplayName: string;
  recipient: string;
  status: ExportPackageStatus;
  createdAt: string;
  updatedAt: string;
  releasedAt: string | null;
};

export type AuditIntegrityRow = {
  caseRef: string;
  chainValid: boolean;
  eventCount: number;
  brokenEventId: string | null;
  lastEventTs: string | null;
  reason: string | null;
};

export type SyncQueueSnapshot = {
  clients: Array<{
    id: string;
    clientRef: string;
    deviceLabel: string;
    owner: string;
    lastSeenAt: string | null;
    pendingEvents: number;
  }>;
  pendingEvents: Array<{
    id: string;
    clientRef: string;
    caseId: string;
    caseRef: string;
    eventType: string;
    sequence: number;
    receivedAt: string;
    actor: string;
  }>;
};

export type MarkSyncEventAppliedInput = {
  syncEventId: string;
};

export class WorkflowError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "WorkflowError";
    this.code = code;
  }
}

function mapActorRoleToUserRole(role: ActorRole): UserRole {
  if (role === "SYSTEM") return "ADMIN";
  return role;
}

function parseDateOrUndefined(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function nonEmpty(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function addYears(base: Date, years: number): Date {
  const next = new Date(base);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function addMonths(base: Date, months: number): Date {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function retentionYearsFromRule(rule: string): number | null {
  const match = /(\d{1,3})\s*(jahr|jahre|altersjahr)/i.exec(rule);
  if (!match) return null;
  const years = Number(match[1]);
  return Number.isFinite(years) && years > 0 ? years : null;
}

function retentionMonthsFromRule(rule: string): number | null {
  const match = /(\d{1,3})\s*(monat|monate)/i.exec(rule);
  if (!match) return null;
  const months = Number(match[1]);
  return Number.isFinite(months) && months > 0 ? months : null;
}

function computeRetentionDueAt(retentionRule: string, intakeAt: Date): Date {
  const years = retentionYearsFromRule(retentionRule);
  if (years) return addYears(intakeAt, years);

  const months = retentionMonthsFromRule(retentionRule);
  if (months) return addMonths(intakeAt, months);

  return addYears(intakeAt, 10);
}

function deriveRetentionStatus(input: {
  legalHold: boolean;
  retentionDueAt: Date | null;
  archivedAt: Date | null;
  scheduledDeletionAt: Date | null;
  now?: Date;
}): RetentionStatus {
  const now = input.now ?? new Date();

  if (input.legalHold) {
    if (input.archivedAt) return "ARCHIVED";
    if (input.retentionDueAt && input.retentionDueAt <= now) return "DUE";
    return "ACTIVE";
  }

  if (input.scheduledDeletionAt) return "DELETION_SCHEDULED";
  if (input.archivedAt) return "ARCHIVED";
  if (input.retentionDueAt && input.retentionDueAt <= now) return "DUE";
  return "ACTIVE";
}

function sanitizePositiveInt(input: number, fallback: number): number {
  if (!Number.isFinite(input)) return fallback;
  const rounded = Math.round(input);
  return rounded > 0 ? rounded : fallback;
}

function ensureAuthorized(actor: HubActor, action: AuthzAction, caseId?: string): void {
  const decision = authorize({
    actorId: actor.id,
    roles: actor.roles,
    action,
    resource: {
      caseId,
      assignmentCaseIds: actor.assignmentCaseIds,
    },
  });

  if (!decision.allowed) {
    throw new WorkflowError("forbidden", `Zugriff verweigert (${decision.reason}).`);
  }
}

function caseScope(actor: HubActor): Prisma.CaseWhereInput {
  if (
    actor.roles.includes("ADMIN") ||
    actor.roles.includes("SYSTEM") ||
    actor.roles.includes("AUDITOR") ||
    actor.roles.includes("BILLING")
  ) {
    return {};
  }

  if (!actor.assignmentCaseIds.length) {
    return { id: { in: ["__none__"] } };
  }

  return { id: { in: actor.assignmentCaseIds } };
}

async function ensureActorUser(tx: Prisma.TransactionClient, actor: HubActor): Promise<string> {
  const primaryRole = mapActorRoleToUserRole(actor.roles[0] ?? "SHIFT_WORKER");

  const byExternal = await tx.user.findUnique({
    where: { externalId: actor.id },
    select: { id: true },
  });

  if (byExternal) {
    await tx.user.update({
      where: { id: byExternal.id },
      data: {
        email: actor.email,
        displayName: actor.name,
        role: primaryRole,
        isActive: true,
      },
    });
    return byExternal.id;
  }

  const byEmail = await tx.user.findUnique({
    where: { email: actor.email },
    select: { id: true },
  });

  if (byEmail) {
    await tx.user.update({
      where: { id: byEmail.id },
      data: {
        externalId: actor.id,
        displayName: actor.name,
        role: primaryRole,
        isActive: true,
      },
    });
    return byEmail.id;
  }

  const created = await tx.user.create({
    data: {
      externalId: actor.id,
      email: actor.email,
      displayName: actor.name,
      role: primaryRole,
    },
    select: { id: true },
  });

  return created.id;
}

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

async function nextCaseRef(tx: Prisma.TransactionClient): Promise<string> {
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  const prefix = `HH-${yearSuffix}-`;

  const lastCase = await tx.case.findFirst({
    where: { caseRef: { startsWith: prefix } },
    orderBy: { caseRef: "desc" },
    select: { caseRef: true },
  });

  const nextSequence =
    lastCase && /^HH-\d{2}-(\d{4})$/.test(lastCase.caseRef)
      ? Number(lastCase.caseRef.slice(-4)) + 1
      : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

async function nextInvoiceRef(tx: Prisma.TransactionClient): Promise<string> {
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  const prefix = `INV-${yearSuffix}-`;

  const lastInvoice = await tx.invoiceDraft.findFirst({
    where: { invoiceRef: { startsWith: prefix } },
    orderBy: { invoiceRef: "desc" },
    select: { invoiceRef: true },
  });

  const nextSequence =
    lastInvoice && /^INV-\d{2}-(\d{4})$/.test(lastInvoice.invoiceRef)
      ? Number(lastInvoice.invoiceRef.slice(-4)) + 1
      : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

async function nextExportRef(tx: Prisma.TransactionClient): Promise<string> {
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  const prefix = `EXP-${yearSuffix}-`;

  const lastExport = await tx.exportPackage.findFirst({
    where: { exportRef: { startsWith: prefix } },
    orderBy: { exportRef: "desc" },
    select: { exportRef: true },
  });

  const nextSequence =
    lastExport && /^EXP-\d{2}-(\d{4})$/.test(lastExport.exportRef)
      ? Number(lastExport.exportRef.slice(-4)) + 1
      : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

async function nextRecipientRef(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = "REC-";

  const lastRecipient = await tx.exportRecipient.findFirst({
    where: { recipientRef: { startsWith: prefix } },
    orderBy: { recipientRef: "desc" },
    select: { recipientRef: true },
  });

  const nextSequence =
    lastRecipient && /^REC-(\d{4})$/.test(lastRecipient.recipientRef)
      ? Number(lastRecipient.recipientRef.slice(-4)) + 1
      : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

async function nextCostApprovalRef(tx: Prisma.TransactionClient): Promise<string> {
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  const prefix = `CAP-${yearSuffix}-`;

  const lastApproval = await tx.costApproval.findFirst({
    where: { approvalRef: { startsWith: prefix } },
    orderBy: { approvalRef: "desc" },
    select: { approvalRef: true },
  });

  const nextSequence =
    lastApproval && /^CAP-\d{2}-(\d{4})$/.test(lastApproval.approvalRef)
      ? Number(lastApproval.approvalRef.slice(-4)) + 1
      : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

async function appendAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    caseId?: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entityType: string;
    entityId: string;
    actorId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const previous = await tx.auditEvent.findFirst({
    where: input.caseId ? { caseId: input.caseId } : { caseId: null },
    orderBy: [{ eventTs: "desc" }, { id: "desc" }],
    select: { eventHash: true },
  });

  const event = buildAppendOnlyAuditEvent({
    caseId: input.caseId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId,
    payload: input.payload,
    previousHash: previous?.eventHash,
  });

  await tx.auditEvent.create({
    data: {
      caseId: event.caseId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorId: event.actorId,
      eventTs: new Date(event.eventTs),
      payload: event.payload as Prisma.InputJsonValue,
      prevHash: event.prevHash,
      eventHash: event.eventHash,
    },
  });
}

function buildExportPayloadHash(input: {
  caseId: string;
  recipientId: string;
  legalBasis: LegalBasis;
  sharePolicy: SharePolicy;
  payloadType: string;
  createdAt: Date;
}): string {
  const raw = `${input.caseId}|${input.recipientId}|${input.legalBasis}|${input.sharePolicy}|${input.payloadType}|${input.createdAt.toISOString()}`;
  return createHash("sha256").update(raw).digest("hex");
}

function allowedInvoiceTransition(current: InvoiceStatus, next: InvoiceStatus): boolean {
  if (current === next) return true;

  const map: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ["READY", "CANCELLED"],
    READY: ["DRAFT", "SUBMITTED", "CANCELLED"],
    SUBMITTED: ["PAID", "CANCELLED"],
    PAID: [],
    CANCELLED: [],
  };

  return map[current].includes(next);
}

function allowedExportTransition(current: ExportPackageStatus, next: ExportPackageStatus): boolean {
  if (current === next) return true;

  const map: Record<ExportPackageStatus, ExportPackageStatus[]> = {
    DRAFT: ["READY", "CANCELLED"],
    READY: ["DRAFT", "RELEASED", "CANCELLED"],
    RELEASED: [],
    CANCELLED: [],
  };

  return map[current].includes(next);
}

function allowedCostApprovalTransition(current: CostApprovalStatus, next: CostApprovalStatus): boolean {
  if (current === next) return true;

  const map: Record<CostApprovalStatus, CostApprovalStatus[]> = {
    DRAFT: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: ["EXPIRED", "CANCELLED"],
    REJECTED: ["DRAFT", "CANCELLED"],
    EXPIRED: ["CANCELLED"],
    CANCELLED: [],
  };

  return map[current].includes(next);
}

function normalizeCurrency(input: string | undefined): string {
  const currency = nonEmpty(input)?.toUpperCase();
  if (!currency) return "CHF";
  return currency.slice(0, 3);
}

function ensureExportPolicyAllowed(input: {
  caseSharePolicy: SharePolicy;
  recipientAuthorityApproved: boolean;
}): void {
  if (input.caseSharePolicy === "INTERNAL_ONLY") {
    throw new WorkflowError("compliance", "Export nicht erlaubt: Share-Policy ist auf intern gesetzt.");
  }

  if (input.caseSharePolicy === "AUTHORITY_ONLY" && !input.recipientAuthorityApproved) {
    throw new WorkflowError("compliance", "Export nur an behördlich freigegebene Empfänger erlaubt.");
  }
}

async function recomputeInvoiceTotals(tx: Prisma.TransactionClient, invoiceId: string): Promise<void> {
  const lines = await tx.invoiceLine.findMany({
    where: { invoiceDraftId: invoiceId },
    select: { lineTotalCents: true },
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  const invoice = await tx.invoiceDraft.findUnique({
    where: { id: invoiceId },
    select: { taxCents: true },
  });

  if (!invoice) {
    throw new WorkflowError("not_found", "Rechnungsentwurf nicht gefunden.");
  }

  await tx.invoiceDraft.update({
    where: { id: invoiceId },
    data: {
      subtotalCents,
      totalCents: subtotalCents + invoice.taxCents,
    },
  });
}

function resolveOffering(input: { offeringCode: string; programArea?: ProgramArea }) {
  const byCode = offeringByCode(input.offeringCode);
  if (!byCode) {
    throw new WorkflowError("validation", "Unbekanntes Angebot.");
  }

  if (input.programArea && byCode.area !== input.programArea) {
    throw new WorkflowError("validation", "Das Angebot passt nicht zum gewählten Bereich.");
  }

  return byCode;
}

export async function listCases(actor: HubActor, filters: CaseFilters = {}): Promise<CaseListItem[]> {
  ensureAuthorized(actor, "case:read");

  const scope = caseScope(actor);
  const where: Prisma.CaseWhereInput = {
    ...scope,
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.area && filters.area !== "ALL" ? { programArea: filters.area } : {}),
    ...(filters.q
      ? {
          OR: [
            { caseRef: { contains: filters.q, mode: "insensitive" } },
            { subjectDisplayName: { contains: filters.q, mode: "insensitive" } },
            { offering: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const cases = await prisma.case.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      tasks: {
        select: {
          status: true,
        },
      },
      stays: {
        where: { status: "CHECKED_IN" },
        select: { id: true },
      },
    },
  });

  return cases.map((item) => ({
    id: item.id,
    caseRef: item.caseRef,
    subjectDisplayName: item.subjectDisplayName,
    status: item.status,
    riskLevel: item.riskLevel,
    programArea: item.programArea,
    offering: item.offering,
    assignedTeam: item.assignedTeam,
    nextActionAt: toIso(item.nextActionAt),
    legalHold: item.legalHold,
    retentionStatus: item.retentionStatus,
    retentionDueAt: toIso(item.retentionDueAt),
    openTasks: item.tasks.filter((task) => task.status !== "DONE").length,
    hasOpenStay: item.stays.length > 0,
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function getCaseDetail(actor: HubActor, caseId: string): Promise<CaseDetail> {
  ensureAuthorized(actor, "case:read", caseId);

  const caseItem = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      stays: {
        orderBy: { checkInAt: "desc" },
        include: {
          createdBy: {
            select: { displayName: true, email: true },
          },
        },
      },
      serviceEvents: {
        orderBy: { occurredAt: "desc" },
        include: {
          createdBy: {
            select: { displayName: true, email: true },
          },
        },
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      },
      invoices: {
        orderBy: { updatedAt: "desc" },
        include: {
          costApproval: {
            select: {
              id: true,
              approvalRef: true,
            },
          },
          lines: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      costApprovals: {
        orderBy: { updatedAt: "desc" },
        include: {
          createdBy: {
            select: { displayName: true, email: true },
          },
          invoices: {
            select: { invoiceRef: true },
          },
        },
      },
      exportPackages: {
        orderBy: { updatedAt: "desc" },
        include: {
          recipient: true,
        },
      },
      auditEvents: {
        orderBy: { eventTs: "desc" },
        take: 40,
        include: {
          actor: {
            select: { displayName: true, email: true },
          },
        },
      },
    },
  });

  if (!caseItem) {
    throw new WorkflowError("not_found", "Fall nicht gefunden.");
  }

  const exportRecipients = await prisma.exportRecipient.findMany({
    orderBy: [{ authorityApproved: "desc" }, { label: "asc" }],
  });

  return {
    id: caseItem.id,
    caseRef: caseItem.caseRef,
    subjectDisplayName: caseItem.subjectDisplayName,
    status: caseItem.status,
    riskLevel: caseItem.riskLevel,
    programArea: caseItem.programArea,
    offering: caseItem.offering,
    assignedTeam: caseItem.assignedTeam,
    nextActionAt: toIso(caseItem.nextActionAt),
    dataClass: caseItem.dataClass,
    legalBasis: caseItem.legalBasis,
    sharePolicy: caseItem.sharePolicy,
    purpose: caseItem.purpose,
    retentionRule: caseItem.retentionRule,
    retentionDueAt: toIso(caseItem.retentionDueAt),
    retentionStatus: caseItem.retentionStatus,
    retentionLastCheck: toIso(caseItem.retentionLastCheck),
    archivedAt: toIso(caseItem.archivedAt),
    scheduledDeletionAt: toIso(caseItem.scheduledDeletionAt),
    legalHold: caseItem.legalHold,
    createdAt: caseItem.createdAt.toISOString(),
    updatedAt: caseItem.updatedAt.toISOString(),
    stays: caseItem.stays.map((stay) => ({
      id: stay.id,
      checkInAt: stay.checkInAt.toISOString(),
      checkOutAt: toIso(stay.checkOutAt),
      status: stay.status,
      createdBy: stay.createdBy?.displayName ?? stay.createdBy?.email ?? "System",
    })),
    serviceEvents: caseItem.serviceEvents.map((event) => ({
      id: event.id,
      stayId: event.stayId,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      notes: event.notes ?? "",
      createdBy: event.createdBy?.displayName ?? event.createdBy?.email ?? "System",
    })),
    tasks: caseItem.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      details: task.details ?? "",
      ownerName: task.ownerName ?? "",
      dueAt: toIso(task.dueAt),
      priority: task.priority,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
    })),
    invoices: caseItem.invoices.map((invoice) => ({
      id: invoice.id,
      invoiceRef: invoice.invoiceRef,
      periodStart: invoice.periodStart.toISOString(),
      periodEnd: invoice.periodEnd.toISOString(),
      status: invoice.status,
      costApprovalId: invoice.costApproval?.id ?? null,
      costApprovalRef: invoice.costApproval?.approvalRef ?? null,
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      notes: invoice.notes ?? "",
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      issuedAt: toIso(invoice.issuedAt),
      paidAt: toIso(invoice.paidAt),
      lines: invoice.lines.map((line) => ({
        id: line.id,
        sourceType: line.sourceType,
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
        occurredAt: toIso(line.occurredAt),
        createdAt: line.createdAt.toISOString(),
      })),
    })),
    costApprovals: caseItem.costApprovals.map((approval) => ({
      id: approval.id,
      approvalRef: approval.approvalRef,
      authorityName: approval.authorityName,
      approvedAmountCents: approval.approvedAmountCents,
      currency: approval.currency,
      validFrom: approval.validFrom.toISOString(),
      validUntil: approval.validUntil.toISOString(),
      status: approval.status,
      notes: approval.notes ?? "",
      submittedAt: toIso(approval.submittedAt),
      approvedAt: toIso(approval.approvedAt),
      rejectedAt: toIso(approval.rejectedAt),
      createdAt: approval.createdAt.toISOString(),
      updatedAt: approval.updatedAt.toISOString(),
      createdBy: approval.createdBy?.displayName ?? approval.createdBy?.email ?? "System",
      linkedInvoiceRefs: approval.invoices.map((invoice) => invoice.invoiceRef),
    })),
    exportPackages: caseItem.exportPackages.map((exportItem) => ({
      id: exportItem.id,
      exportRef: exportItem.exportRef,
      recipientId: exportItem.recipientId,
      recipientLabel: exportItem.recipient.label,
      recipientOrganisation: exportItem.recipient.organisation ?? "",
      status: exportItem.status,
      payloadType: exportItem.payloadType,
      purpose: exportItem.purpose,
      legalBasis: exportItem.legalBasis,
      sharePolicy: exportItem.sharePolicy,
      encrypted: exportItem.encrypted,
      payloadHash: exportItem.payloadHash ?? "",
      expiresAt: toIso(exportItem.expiresAt),
      releasedAt: toIso(exportItem.releasedAt),
      createdAt: exportItem.createdAt.toISOString(),
      updatedAt: exportItem.updatedAt.toISOString(),
    })),
    exportRecipients: exportRecipients.map((recipient) => ({
      id: recipient.id,
      recipientRef: recipient.recipientRef,
      label: recipient.label,
      organisation: recipient.organisation ?? "",
      channel: recipient.channel,
      endpoint: recipient.endpoint ?? "",
      authorityApproved: recipient.authorityApproved,
      keyFingerprint: recipient.keyFingerprint ?? "",
    })),
    auditTrail: caseItem.auditEvents.map((event) => ({
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      eventTs: event.eventTs.toISOString(),
      actor: event.actor?.displayName ?? event.actor?.email ?? "System",
    })),
  };
}

export async function createCaseWorkflow(actor: HubActor, input: CreateCaseInput): Promise<string> {
  ensureAuthorized(actor, "case:update");

  const subjectDisplayName = nonEmpty(input.subjectDisplayName);
  if (!subjectDisplayName) {
    throw new WorkflowError("validation", "Name/Bezeichnung ist erforderlich.");
  }

  const offering = resolveOffering({
    offeringCode: input.offeringCode,
    programArea: input.programArea,
  });
  const retentionRule = nonEmpty(input.retentionRule) ?? offering.defaultRetentionRule;

  return prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const caseRef = await nextCaseRef(tx);
    const intakeAt = new Date();
    const retentionDueAt = computeRetentionDueAt(retentionRule, intakeAt);

    const created = await tx.case.create({
      data: {
        caseRef,
        subjectDisplayName,
        status: input.status,
        riskLevel: input.riskLevel,
        programArea: input.programArea,
        offering: offering.label,
        assignedTeam: nonEmpty(input.assignedTeam),
        nextActionAt: parseDateOrUndefined(input.nextActionAt),
        dataClass: input.dataClass ?? offering.defaultDataClass,
        purpose: nonEmpty(input.purpose) ?? offering.defaultPurpose,
        legalBasis: input.legalBasis ?? offering.defaultLegalBasis,
        sharePolicy: input.sharePolicy ?? offering.defaultSharePolicy,
        retentionRule,
        intakeAt,
        retentionDueAt,
        retentionStatus: deriveRetentionStatus({
          legalHold: false,
          retentionDueAt,
          archivedAt: null,
          scheduledDeletionAt: null,
        }),
        retentionLastCheck: new Date(),
      },
      select: { id: true },
    });

    await tx.caseAssignment.create({
      data: {
        caseId: created.id,
        userId: actorUserId,
      },
    });

    await appendAuditEvent(tx, {
      caseId: created.id,
      action: "CREATE",
      entityType: "Case",
      entityId: created.id,
      actorId: actorUserId,
      payload: {
        status: input.status,
        riskLevel: input.riskLevel,
        offering: offering.label,
      },
    });

    return created.id;
  });
}

export async function updateCaseWorkflow(actor: HubActor, caseId: string, input: UpdateCaseInput): Promise<void> {
  ensureAuthorized(actor, "case:update", caseId);

  const subjectDisplayName = nonEmpty(input.subjectDisplayName);
  if (!subjectDisplayName) {
    throw new WorkflowError("validation", "Name/Bezeichnung ist erforderlich.");
  }

  const offering = resolveOffering({
    offeringCode: input.offeringCode,
    programArea: input.programArea,
  });

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.case.findUnique({
      where: { id: caseId },
      select: {
        intakeAt: true,
        archivedAt: true,
        scheduledDeletionAt: true,
      },
    });

    if (!existing) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const retentionDueAt = computeRetentionDueAt(input.retentionRule, existing.intakeAt);
    const scheduledDeletionAt = input.legalHold ? null : existing.scheduledDeletionAt;
    const retentionStatus = deriveRetentionStatus({
      legalHold: input.legalHold,
      retentionDueAt,
      archivedAt: existing.archivedAt,
      scheduledDeletionAt,
    });

    await tx.case.update({
      where: { id: caseId },
      data: {
        subjectDisplayName,
        status: input.status,
        riskLevel: input.riskLevel,
        programArea: input.programArea,
        offering: offering.label,
        assignedTeam: nonEmpty(input.assignedTeam),
        nextActionAt: parseDateOrUndefined(input.nextActionAt),
        purpose: input.purpose,
        legalBasis: input.legalBasis,
        sharePolicy: input.sharePolicy,
        dataClass: input.dataClass,
        retentionRule: input.retentionRule,
        legalHold: input.legalHold,
        retentionDueAt,
        scheduledDeletionAt,
        retentionStatus,
        retentionLastCheck: new Date(),
      },
    });

    await appendAuditEvent(tx, {
      caseId,
      action: "UPDATE",
      entityType: "Case",
      entityId: caseId,
      actorId: actorUserId,
      payload: {
        status: input.status,
        riskLevel: input.riskLevel,
        offering: offering.label,
        legalHold: input.legalHold,
      },
    });
  });
}

export async function createStayWorkflow(actor: HubActor, input: CreateStayInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        dataClass: true,
        legalBasis: true,
        sharePolicy: true,
        purpose: true,
      },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const stay = await tx.stay.create({
      data: {
        caseId: caseItem.id,
        checkInAt: parseDateOrUndefined(input.checkInAt) ?? new Date(),
        status: "CHECKED_IN",
        dataClass: caseItem.dataClass,
        legalBasis: caseItem.legalBasis,
        sharePolicy: caseItem.sharePolicy,
        purpose: caseItem.purpose,
        createdById: actorUserId,
      },
      select: { id: true },
    });

    await tx.case.update({
      where: { id: caseItem.id },
      data: { status: "ACTIVE" },
    });

    await appendAuditEvent(tx, {
      caseId: caseItem.id,
      action: "CREATE",
      entityType: "Stay",
      entityId: stay.id,
      actorId: actorUserId,
      payload: { status: "CHECKED_IN" },
    });
  });
}

export async function checkOutStayWorkflow(actor: HubActor, input: CheckOutStayInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const stay = await tx.stay.findUnique({
      where: { id: input.stayId },
      select: { id: true, caseId: true, status: true },
    });

    if (!stay || stay.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Aufenthalt nicht gefunden.");
    }

    if (stay.status === "CHECKED_OUT") {
      return;
    }

    await tx.stay.update({
      where: { id: stay.id },
      data: {
        status: "CHECKED_OUT",
        checkOutAt: parseDateOrUndefined(input.checkOutAt) ?? new Date(),
      },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "UPDATE",
      entityType: "Stay",
      entityId: stay.id,
      actorId: actorUserId,
      payload: { status: "CHECKED_OUT" },
    });
  });
}

export async function createServiceEventWorkflow(actor: HubActor, input: CreateServiceEventInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  const eventType = nonEmpty(input.eventType);
  if (!eventType) {
    throw new WorkflowError("validation", "Event-Typ ist erforderlich.");
  }

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        dataClass: true,
        legalBasis: true,
        sharePolicy: true,
        purpose: true,
      },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const serviceEvent = await tx.serviceEvent.create({
      data: {
        caseId: caseItem.id,
        stayId: nonEmpty(input.stayId),
        eventType,
        occurredAt: parseDateOrUndefined(input.occurredAt) ?? new Date(),
        notes: nonEmpty(input.notes),
        dataClass: caseItem.dataClass,
        legalBasis: caseItem.legalBasis,
        sharePolicy: caseItem.sharePolicy,
        purpose: caseItem.purpose,
        createdById: actorUserId,
      },
      select: { id: true },
    });

    await tx.case.update({
      where: { id: caseItem.id },
      data: {
        nextActionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    });

    await appendAuditEvent(tx, {
      caseId: caseItem.id,
      action: "CREATE",
      entityType: "ServiceEvent",
      entityId: serviceEvent.id,
      actorId: actorUserId,
      payload: { eventType },
    });
  });
}

export async function updateServiceEventWorkflow(actor: HubActor, input: UpdateServiceEventInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  const eventType = nonEmpty(input.eventType);
  if (!eventType) {
    throw new WorkflowError("validation", "Event-Typ ist erforderlich.");
  }

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.serviceEvent.findUnique({
      where: { id: input.serviceEventId },
      select: { id: true, caseId: true },
    });

    if (!existing || existing.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Service-Event nicht gefunden.");
    }

    await tx.serviceEvent.update({
      where: { id: existing.id },
      data: {
        stayId: nonEmpty(input.stayId),
        eventType,
        occurredAt: parseDateOrUndefined(input.occurredAt) ?? new Date(),
        notes: nonEmpty(input.notes),
      },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "UPDATE",
      entityType: "ServiceEvent",
      entityId: existing.id,
      actorId: actorUserId,
      payload: {
        eventType,
      },
    });
  });
}

export async function deleteServiceEventWorkflow(actor: HubActor, input: DeleteServiceEventInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.serviceEvent.findUnique({
      where: { id: input.serviceEventId },
      select: { id: true, caseId: true },
    });

    if (!existing || existing.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Service-Event nicht gefunden.");
    }

    await tx.serviceEvent.delete({
      where: { id: existing.id },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "DELETE",
      entityType: "ServiceEvent",
      entityId: existing.id,
      actorId: actorUserId,
      payload: {},
    });
  });
}

export async function createTaskWorkflow(actor: HubActor, input: CreateTaskInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  const title = nonEmpty(input.title);
  if (!title) {
    throw new WorkflowError("validation", "Task-Titel ist erforderlich.");
  }

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const task = await tx.task.create({
      data: {
        caseId: input.caseId,
        title,
        details: nonEmpty(input.details),
        ownerName: nonEmpty(input.ownerName),
        dueAt: parseDateOrUndefined(input.dueAt),
        priority: input.priority,
        status: "OPEN",
        createdById: actorUserId,
      },
      select: { id: true },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "CREATE",
      entityType: "Task",
      entityId: task.id,
      actorId: actorUserId,
      payload: { priority: input.priority },
    });
  });
}

export async function updateTaskStatusWorkflow(actor: HubActor, input: UpdateTaskStatusInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const task = await tx.task.findUnique({
      where: { id: input.taskId },
      select: { id: true, caseId: true },
    });

    if (!task || task.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Task nicht gefunden.");
    }

    await tx.task.update({
      where: { id: input.taskId },
      data: { status: input.status },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "UPDATE",
      entityType: "Task",
      entityId: input.taskId,
      actorId: actorUserId,
      payload: { status: input.status },
    });
  });
}

export async function deleteTaskWorkflow(actor: HubActor, input: DeleteTaskInput): Promise<void> {
  ensureAuthorized(actor, "case:update", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const task = await tx.task.findUnique({
      where: { id: input.taskId },
      select: { id: true, caseId: true },
    });

    if (!task || task.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Task nicht gefunden.");
    }

    await tx.task.delete({
      where: { id: input.taskId },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "DELETE",
      entityType: "Task",
      entityId: input.taskId,
      actorId: actorUserId,
      payload: {},
    });
  });
}

export async function createCostApprovalWorkflow(actor: HubActor, input: CreateCostApprovalInput): Promise<string> {
  ensureAuthorized(actor, "billing:write", input.caseId);

  const authorityName = nonEmpty(input.authorityName);
  if (!authorityName) {
    throw new WorkflowError("validation", "Behörde/Kostenträger ist erforderlich.");
  }

  const approvedAmountCents = Math.max(0, Math.round(input.approvedAmountCents));
  if (!approvedAmountCents) {
    throw new WorkflowError("validation", "Genehmigter Betrag muss grösser als 0 sein.");
  }

  const validFrom = parseDateOrUndefined(input.validFrom) ?? new Date();
  const validUntil = parseDateOrUndefined(input.validUntil) ?? addMonths(validFrom, 3);
  if (validUntil <= validFrom) {
    throw new WorkflowError("validation", "Gültig bis muss nach Gültig von liegen.");
  }

  return prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: { id: true },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const approvalRef = await nextCostApprovalRef(tx);
    const costApproval = await tx.costApproval.create({
      data: {
        caseId: input.caseId,
        approvalRef,
        authorityName,
        approvedAmountCents,
        currency: normalizeCurrency(input.currency),
        validFrom,
        validUntil,
        status: "DRAFT",
        notes: nonEmpty(input.notes),
        createdById: actorUserId,
      },
      select: { id: true },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "CREATE",
      entityType: "CostApproval",
      entityId: costApproval.id,
      actorId: actorUserId,
      payload: {
        approvalRef,
        authorityName,
        approvedAmountCents,
      },
    });

    return costApproval.id;
  });
}

export async function updateCostApprovalWorkflow(actor: HubActor, input: UpdateCostApprovalInput): Promise<void> {
  ensureAuthorized(actor, "billing:write", input.caseId);

  const authorityName = nonEmpty(input.authorityName);
  if (!authorityName) {
    throw new WorkflowError("validation", "Behörde/Kostenträger ist erforderlich.");
  }

  const approvedAmountCents = Math.max(0, Math.round(input.approvedAmountCents));
  if (!approvedAmountCents) {
    throw new WorkflowError("validation", "Genehmigter Betrag muss grösser als 0 sein.");
  }

  const validFrom = parseDateOrUndefined(input.validFrom);
  const validUntil = parseDateOrUndefined(input.validUntil);
  if (!validFrom || !validUntil) {
    throw new WorkflowError("validation", "Gültigkeitszeitraum ist ungültig.");
  }
  if (validUntil <= validFrom) {
    throw new WorkflowError("validation", "Gültig bis muss nach Gültig von liegen.");
  }

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.costApproval.findUnique({
      where: { id: input.costApprovalId },
      include: {
        invoices: {
          select: { id: true },
        },
      },
    });

    if (!existing || existing.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Kostengutsprache nicht gefunden.");
    }

    if (["APPROVED", "EXPIRED", "CANCELLED"].includes(existing.status)) {
      throw new WorkflowError("validation", "Kostengutsprache mit diesem Status kann nicht mehr inhaltlich geändert werden.");
    }

    if (existing.invoices.length > 0) {
      throw new WorkflowError("validation", "Kostengutsprache ist bereits mit Rechnungen verknüpft.");
    }

    await tx.costApproval.update({
      where: { id: existing.id },
      data: {
        authorityName,
        approvedAmountCents,
        currency: normalizeCurrency(input.currency),
        validFrom,
        validUntil,
        notes: nonEmpty(input.notes),
      },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "UPDATE",
      entityType: "CostApproval",
      entityId: existing.id,
      actorId: actorUserId,
      payload: {
        authorityName,
        approvedAmountCents,
      },
    });
  });
}

export async function updateCostApprovalStatusWorkflow(actor: HubActor, input: UpdateCostApprovalStatusInput): Promise<void> {
  ensureAuthorized(actor, "billing:write", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.costApproval.findUnique({
      where: { id: input.costApprovalId },
      include: {
        invoices: {
          select: { id: true },
        },
      },
    });

    if (!existing || existing.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Kostengutsprache nicht gefunden.");
    }

    if (!allowedCostApprovalTransition(existing.status, input.status)) {
      throw new WorkflowError("validation", "Ungültiger Statuswechsel für Kostengutsprache.");
    }

    if (input.status === "APPROVED" && existing.validUntil <= new Date()) {
      throw new WorkflowError("validation", "Abgelaufene Kostengutsprache kann nicht genehmigt werden.");
    }

    if (input.status === "CANCELLED" && existing.invoices.length > 0) {
      throw new WorkflowError("validation", "Verknüpfte Kostengutsprache kann nicht storniert werden.");
    }

    const submittedAt =
      input.status === "SUBMITTED"
        ? existing.submittedAt ?? new Date()
        : input.status === "DRAFT"
          ? null
          : existing.submittedAt;
    const approvedAt =
      input.status === "APPROVED"
        ? existing.approvedAt ?? new Date()
        : ["DRAFT", "REJECTED", "CANCELLED"].includes(input.status)
          ? null
          : existing.approvedAt;
    const rejectedAt =
      input.status === "REJECTED"
        ? existing.rejectedAt ?? new Date()
        : ["DRAFT", "APPROVED", "CANCELLED"].includes(input.status)
          ? null
          : existing.rejectedAt;

    await tx.costApproval.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        submittedAt,
        approvedAt,
        rejectedAt,
      },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "UPDATE",
      entityType: "CostApproval",
      entityId: existing.id,
      actorId: actorUserId,
      payload: {
        status: input.status,
      },
    });
  });
}

export async function deleteCostApprovalWorkflow(actor: HubActor, input: DeleteCostApprovalInput): Promise<void> {
  ensureAuthorized(actor, "billing:write", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.costApproval.findUnique({
      where: { id: input.costApprovalId },
      include: {
        invoices: {
          select: { id: true },
        },
      },
    });

    if (!existing || existing.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Kostengutsprache nicht gefunden.");
    }

    if (!["DRAFT", "REJECTED", "CANCELLED"].includes(existing.status)) {
      throw new WorkflowError("validation", "Nur Entwurf, abgelehnte oder stornierte Kostengutsprachen können gelöscht werden.");
    }

    if (existing.invoices.length > 0) {
      throw new WorkflowError("validation", "Kostengutsprache ist mit Rechnungen verknüpft und kann nicht gelöscht werden.");
    }

    await tx.costApproval.delete({
      where: { id: existing.id },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "DELETE",
      entityType: "CostApproval",
      entityId: existing.id,
      actorId: actorUserId,
      payload: {},
    });
  });
}

function overlapDays(startA: Date, endA: Date, startB: Date, endB: Date): number {
  const start = Math.max(startA.getTime(), startB.getTime());
  const end = Math.min(endA.getTime(), endB.getTime());
  if (end <= start) return 0;
  return Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
}

export async function createInvoiceDraftWorkflow(actor: HubActor, input: CreateInvoiceDraftInput): Promise<string> {
  ensureAuthorized(actor, "billing:write", input.caseId);

  const now = new Date();
  const periodStart = parseDateOrUndefined(input.periodStart) ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const periodEnd = parseDateOrUndefined(input.periodEnd) ?? now;

  if (periodEnd <= periodStart) {
    throw new WorkflowError("validation", "Der Abrechnungszeitraum ist ungültig.");
  }

  return prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const invoiceRef = await nextInvoiceRef(tx);
    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
      },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const selectedCostApprovalId = nonEmpty(input.costApprovalId);
    let selectedCostApproval:
      | {
          id: string;
          approvalRef: string;
          authorityName: string;
          approvedAmountCents: number;
          status: CostApprovalStatus;
          validFrom: Date;
          validUntil: Date;
        }
      | null = null;

    if (selectedCostApprovalId) {
      const candidate = await tx.costApproval.findUnique({
        where: { id: selectedCostApprovalId },
        select: {
          id: true,
          caseId: true,
          approvalRef: true,
          authorityName: true,
          approvedAmountCents: true,
          status: true,
          validFrom: true,
          validUntil: true,
        },
      });

      if (!candidate || candidate.caseId !== input.caseId) {
        throw new WorkflowError("validation", "Kostengutsprache gehört nicht zu diesem Fall.");
      }
      if (!["APPROVED", "SUBMITTED"].includes(candidate.status)) {
        throw new WorkflowError("validation", "Nur eingereichte oder genehmigte Kostengutsprachen können für Billing verwendet werden.");
      }
      if (candidate.validUntil < periodStart || candidate.validFrom > periodEnd) {
        throw new WorkflowError("validation", "Kostengutsprache ist für den gewählten Zeitraum nicht gültig.");
      }

      selectedCostApproval = candidate;
    }

    const invoice = await tx.invoiceDraft.create({
      data: {
        caseId: caseItem.id,
        invoiceRef,
        periodStart,
        periodEnd,
        status: "DRAFT",
        notes: nonEmpty(input.notes),
        costApprovalId: selectedCostApproval?.id ?? null,
        createdById: actorUserId,
      },
      select: { id: true },
    });

    const stays = await tx.stay.findMany({
      where: {
        caseId: input.caseId,
        checkInAt: { lte: periodEnd },
        OR: [{ checkOutAt: null }, { checkOutAt: { gte: periodStart } }],
      },
      select: {
        id: true,
        checkInAt: true,
        checkOutAt: true,
      },
    });

    const stayDays = stays.reduce(
      (sum, stay) =>
        sum +
        overlapDays(
          stay.checkInAt,
          stay.checkOutAt ?? periodEnd,
          periodStart,
          periodEnd,
        ),
      0,
    );

    const serviceEvents = await tx.serviceEvent.findMany({
      where: {
        caseId: input.caseId,
        occurredAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: { id: true, occurredAt: true },
    });

    const lines: Prisma.InvoiceLineCreateManyInput[] = [];

    if (stayDays > 0) {
      lines.push({
        invoiceDraftId: invoice.id,
        caseId: input.caseId,
        sourceType: "STAY",
        description: "Aufenthaltstage (Notschlafstelle/Unterbringung)",
        quantity: stayDays,
        unitPriceCents: 9000,
        lineTotalCents: stayDays * 9000,
      });
    }

    if (serviceEvents.length > 0) {
      const quantity = serviceEvents.length;
      lines.push({
        invoiceDraftId: invoice.id,
        caseId: input.caseId,
        sourceType: "SERVICE_EVENT",
        description: "Begleitungs- und Serviceleistungen",
        quantity,
        unitPriceCents: 4500,
        lineTotalCents: quantity * 4500,
      });
    }

    if (selectedCostApproval) {
      lines.push({
        invoiceDraftId: invoice.id,
        caseId: input.caseId,
        sourceType: "COST_APPROVAL",
        sourceId: selectedCostApproval.id,
        description: `Kostengutsprache ${selectedCostApproval.approvalRef} (${selectedCostApproval.authorityName})`,
        quantity: 1,
        unitPriceCents: 0,
        lineTotalCents: 0,
      });

      const currentSubtotal = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
      if (currentSubtotal > selectedCostApproval.approvedAmountCents) {
        const deduction = currentSubtotal - selectedCostApproval.approvedAmountCents;
        lines.push({
          invoiceDraftId: invoice.id,
          caseId: input.caseId,
          sourceType: "COST_APPROVAL",
          sourceId: selectedCostApproval.id,
          description: `Deckelung gemäss Kostengutsprache ${selectedCostApproval.approvalRef}`,
          quantity: 1,
          unitPriceCents: -deduction,
          lineTotalCents: -deduction,
        });
      }
    }

    if (lines.length === 0) {
      lines.push({
        invoiceDraftId: invoice.id,
        caseId: input.caseId,
        sourceType: "MANUAL",
        description: "Keine abrechenbaren Positionen im Zeitraum",
        quantity: 1,
        unitPriceCents: 0,
        lineTotalCents: 0,
      });
    }

    await tx.invoiceLine.createMany({ data: lines });

    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const taxRatePercent = Math.max(0, input.taxRatePercent ?? 0);
    const taxCents = Math.round((subtotalCents * taxRatePercent) / 100);

    await tx.invoiceDraft.update({
      where: { id: invoice.id },
      data: {
        subtotalCents,
        taxCents,
        totalCents: subtotalCents + taxCents,
      },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "CREATE",
      entityType: "InvoiceDraft",
      entityId: invoice.id,
      actorId: actorUserId,
      payload: {
        invoiceRef,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        lineCount: lines.length,
        costApprovalRef: selectedCostApproval?.approvalRef ?? null,
      },
    });

    return invoice.id;
  });
}

export async function addInvoiceLineWorkflow(actor: HubActor, input: AddInvoiceLineInput): Promise<void> {
  ensureAuthorized(actor, "billing:write", input.caseId);

  const description = nonEmpty(input.description);
  if (!description) {
    throw new WorkflowError("validation", "Beschreibung ist erforderlich.");
  }

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const invoice = await tx.invoiceDraft.findUnique({
      where: { id: input.invoiceId },
      select: { id: true, caseId: true, status: true },
    });

    if (!invoice || invoice.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Rechnungsentwurf nicht gefunden.");
    }

    if (["SUBMITTED", "PAID", "CANCELLED"].includes(invoice.status)) {
      throw new WorkflowError("validation", "Rechnungsentwurf kann nicht mehr geändert werden.");
    }

    const quantity = sanitizePositiveInt(input.quantity, 1);
    const unitPriceCents = Math.max(0, Math.round(input.unitPriceCents));
    const lineTotalCents = quantity * unitPriceCents;

    const line = await tx.invoiceLine.create({
      data: {
        invoiceDraftId: invoice.id,
        caseId: input.caseId,
        sourceType: "MANUAL",
        description,
        quantity,
        unitPriceCents,
        lineTotalCents,
        occurredAt: parseDateOrUndefined(input.occurredAt),
      },
      select: { id: true },
    });

    await recomputeInvoiceTotals(tx, invoice.id);

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "CREATE",
      entityType: "InvoiceLine",
      entityId: line.id,
      actorId: actorUserId,
      payload: {
        invoiceId: invoice.id,
        quantity,
        unitPriceCents,
      },
    });
  });
}

export async function updateInvoiceStatusWorkflow(actor: HubActor, input: UpdateInvoiceStatusInput): Promise<void> {
  ensureAuthorized(actor, "billing:write", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const invoice = await tx.invoiceDraft.findUnique({
      where: { id: input.invoiceId },
      select: { id: true, caseId: true, status: true, issuedAt: true, paidAt: true },
    });

    if (!invoice || invoice.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Rechnungsentwurf nicht gefunden.");
    }

    if (!allowedInvoiceTransition(invoice.status, input.status)) {
      throw new WorkflowError("validation", "Ungültiger Rechnungsstatus-Wechsel.");
    }

    await tx.invoiceDraft.update({
      where: { id: invoice.id },
      data: {
        status: input.status,
        issuedAt: input.status === "SUBMITTED" ? invoice.issuedAt ?? new Date() : invoice.issuedAt,
        paidAt: input.status === "PAID" ? invoice.paidAt ?? new Date() : input.status === "CANCELLED" ? null : invoice.paidAt,
      },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "UPDATE",
      entityType: "InvoiceDraft",
      entityId: invoice.id,
      actorId: actorUserId,
      payload: {
        status: input.status,
      },
    });
  });
}

export async function listBillingQueue(actor: HubActor): Promise<BillingQueueItem[]> {
  ensureAuthorized(actor, "billing:write");

  const scope = caseScope(actor);
  const invoices = await prisma.invoiceDraft.findMany({
    where: {
      case: scope,
    },
    include: {
      case: {
        select: {
          id: true,
          caseRef: true,
          subjectDisplayName: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 180,
  });

  return invoices.map((item) => ({
    id: item.id,
    invoiceRef: item.invoiceRef,
    caseId: item.caseId,
    caseRef: item.case.caseRef,
    subjectDisplayName: item.case.subjectDisplayName,
    status: item.status,
    periodStart: item.periodStart.toISOString(),
    periodEnd: item.periodEnd.toISOString(),
    totalCents: item.totalCents,
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function listBillingJournalRows(actor: HubActor): Promise<BillingJournalRow[]> {
  ensureAuthorized(actor, "billing:write");

  const scope = caseScope(actor);
  const lines = await prisma.invoiceLine.findMany({
    where: {
      case: scope,
    },
    include: {
      case: {
        select: {
          caseRef: true,
          subjectDisplayName: true,
        },
      },
      invoiceDraft: {
        select: {
          invoiceRef: true,
          status: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 3000,
  });

  return lines.map((line) => ({
    invoiceRef: line.invoiceDraft.invoiceRef,
    caseRef: line.case.caseRef,
    subjectDisplayName: line.case.subjectDisplayName,
    invoiceStatus: line.invoiceDraft.status,
    periodStart: line.invoiceDraft.periodStart.toISOString(),
    periodEnd: line.invoiceDraft.periodEnd.toISOString(),
    lineSource: line.sourceType,
    lineDescription: line.description,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents,
    occurredAt: toIso(line.occurredAt),
    createdAt: line.createdAt.toISOString(),
  }));
}

export async function createExportRecipientWorkflow(actor: HubActor, input: CreateExportRecipientInput): Promise<string> {
  ensureAuthorized(actor, "export:create");

  const label = nonEmpty(input.label);
  if (!label) {
    throw new WorkflowError("validation", "Empfänger-Bezeichnung ist erforderlich.");
  }

  return prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const recipientRef = await nextRecipientRef(tx);
    const created = await tx.exportRecipient.create({
      data: {
        recipientRef,
        label,
        organisation: nonEmpty(input.organisation),
        channel: nonEmpty(input.channel) ?? "sftp",
        endpoint: nonEmpty(input.endpoint),
        authorityApproved: Boolean(input.authorityApproved),
        keyFingerprint: nonEmpty(input.keyFingerprint),
      },
      select: { id: true },
    });

    await appendAuditEvent(tx, {
      action: "CREATE",
      entityType: "ExportRecipient",
      entityId: created.id,
      actorId: actorUserId,
      payload: {
        recipientRef,
        label,
      },
    });

    return created.id;
  });
}

export async function updateExportRecipientWorkflow(actor: HubActor, input: UpdateExportRecipientInput): Promise<void> {
  ensureAuthorized(actor, "export:create");

  const label = nonEmpty(input.label);
  if (!label) {
    throw new WorkflowError("validation", "Empfänger-Bezeichnung ist erforderlich.");
  }

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.exportRecipient.findUnique({
      where: { id: input.recipientId },
      select: { id: true },
    });

    if (!existing) {
      throw new WorkflowError("not_found", "Export-Empfänger nicht gefunden.");
    }

    await tx.exportRecipient.update({
      where: { id: existing.id },
      data: {
        label,
        organisation: nonEmpty(input.organisation),
        channel: nonEmpty(input.channel) ?? "sftp",
        endpoint: nonEmpty(input.endpoint),
        authorityApproved: Boolean(input.authorityApproved),
        keyFingerprint: nonEmpty(input.keyFingerprint),
      },
    });

    await appendAuditEvent(tx, {
      action: "UPDATE",
      entityType: "ExportRecipient",
      entityId: existing.id,
      actorId: actorUserId,
      payload: {
        label,
      },
    });
  });
}

export async function deleteExportRecipientWorkflow(actor: HubActor, input: DeleteExportRecipientInput): Promise<void> {
  ensureAuthorized(actor, "export:create");

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const existing = await tx.exportRecipient.findUnique({
      where: { id: input.recipientId },
      include: {
        packages: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new WorkflowError("not_found", "Export-Empfänger nicht gefunden.");
    }

    if (existing.packages.length > 0) {
      throw new WorkflowError("validation", "Empfänger ist in Exportpaketen referenziert und kann nicht gelöscht werden.");
    }

    await tx.exportRecipient.delete({
      where: { id: existing.id },
    });

    await appendAuditEvent(tx, {
      action: "DELETE",
      entityType: "ExportRecipient",
      entityId: existing.id,
      actorId: actorUserId,
      payload: {},
    });
  });
}

export async function listExportRecipients(actor: HubActor): Promise<ExportRecipientListItem[]> {
  ensureAuthorized(actor, "export:create");

  const recipients = await prisma.exportRecipient.findMany({
    orderBy: [{ authorityApproved: "desc" }, { label: "asc" }],
  });

  return recipients.map((item) => ({
    id: item.id,
    recipientRef: item.recipientRef,
    label: item.label,
    organisation: item.organisation ?? "",
    channel: item.channel,
    endpoint: item.endpoint ?? "",
    authorityApproved: item.authorityApproved,
    keyFingerprint: item.keyFingerprint ?? "",
  }));
}

export async function listAuditReportRows(actor: HubActor): Promise<AuditReportRow[]> {
  ensureAuthorized(actor, "case:read");

  const hasGlobalScope =
    actor.roles.includes("ADMIN") ||
    actor.roles.includes("SYSTEM") ||
    actor.roles.includes("AUDITOR") ||
    actor.roles.includes("BILLING");

  const events = await prisma.auditEvent.findMany({
    where: hasGlobalScope
      ? {}
      : {
          caseId: {
            in: actor.assignmentCaseIds.length ? actor.assignmentCaseIds : ["__none__"],
          },
        },
    include: {
      case: {
        select: {
          caseRef: true,
        },
      },
      actor: {
        select: {
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: [{ eventTs: "desc" }],
    take: 3000,
  });

  return events.map((event) => ({
    eventTs: event.eventTs.toISOString(),
    caseRef: event.case?.caseRef ?? "-",
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    actor: event.actor?.displayName ?? event.actor?.email ?? "System",
    payloadJson: JSON.stringify(event.payload),
  }));
}

export async function listAuditIntegrityRows(actor: HubActor): Promise<AuditIntegrityRow[]> {
  ensureAuthorized(actor, "case:read");

  const hasGlobalScope =
    actor.roles.includes("ADMIN") ||
    actor.roles.includes("SYSTEM") ||
    actor.roles.includes("AUDITOR") ||
    actor.roles.includes("BILLING");

  const events = await prisma.auditEvent.findMany({
    where: hasGlobalScope
      ? {}
      : {
          caseId: {
            in: actor.assignmentCaseIds.length ? actor.assignmentCaseIds : ["__none__"],
          },
        },
    include: {
      case: {
        select: {
          caseRef: true,
        },
      },
    },
    orderBy: [{ caseId: "asc" }, { eventTs: "asc" }, { id: "asc" }],
    take: 8000,
  });

  const grouped = new Map<string, typeof events>();
  for (const event of events) {
    const key = event.caseId ?? "__global__";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(event);
  }

  const rows: AuditIntegrityRow[] = [];
  for (const [caseKey, chain] of grouped.entries()) {
    let expectedPrev = "GENESIS";
    let chainValid = true;
    let brokenEventId: string | null = null;
    let reason: string | null = null;

    for (const event of chain) {
      if (event.prevHash !== expectedPrev) {
        chainValid = false;
        brokenEventId = event.id;
        reason = "prev_hash_mismatch";
        break;
      }

      const expectedHash = computeAuditHash({
        prevHash: event.prevHash ?? "GENESIS",
        caseId: event.caseId ?? undefined,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        actorId: event.actorId ?? "",
        eventTs: event.eventTs.toISOString(),
        payload: event.payload as Record<string, unknown>,
      });

      if (expectedHash !== event.eventHash) {
        chainValid = false;
        brokenEventId = event.id;
        reason = "event_hash_mismatch";
        break;
      }

      expectedPrev = event.eventHash;
    }

    const last = chain[chain.length - 1];
    rows.push({
      caseRef: last?.case?.caseRef ?? (caseKey === "__global__" ? "GLOBAL" : caseKey),
      chainValid,
      eventCount: chain.length,
      brokenEventId,
      lastEventTs: last ? last.eventTs.toISOString() : null,
      reason,
    });
  }

  return rows.sort((a, b) => a.caseRef.localeCompare(b.caseRef, "de-CH"));
}

export async function listOccupancyReportRows(actor: HubActor): Promise<OccupancyReportRow[]> {
  ensureAuthorized(actor, "case:read");

  const scope = caseScope(actor);
  const openStays = await prisma.stay.findMany({
    where: {
      status: "CHECKED_IN",
      case: scope,
    },
    include: {
      case: {
        select: {
          offering: true,
        },
      },
    },
  });

  const occupiedByOffering = new Map<string, number>();
  for (const stay of openStays) {
    occupiedByOffering.set(stay.case.offering, (occupiedByOffering.get(stay.case.offering) ?? 0) + 1);
  }

  return occupancyBlueprint().map((slot) => {
    const occupied = occupiedByOffering.get(slot.offering) ?? 0;
    return {
      site: slot.site,
      offering: slot.offering,
      capacity: slot.capacity,
      occupied,
      occupancyRatePercent: slot.capacity ? Math.round((occupied / slot.capacity) * 100) : 0,
    };
  });
}

export async function listOpenWorkReportRows(actor: HubActor): Promise<OpenWorkReportRow[]> {
  ensureAuthorized(actor, "case:read");

  const scope = caseScope(actor);
  const [invoices, exports] = await Promise.all([
    prisma.invoiceDraft.findMany({
      where: {
        case: scope,
        status: { in: ["DRAFT", "READY"] },
      },
      include: {
        case: {
          select: {
            caseRef: true,
            subjectDisplayName: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 1500,
    }),
    prisma.exportPackage.findMany({
      where: {
        case: scope,
        status: { in: ["DRAFT", "READY"] },
      },
      include: {
        case: {
          select: {
            caseRef: true,
            subjectDisplayName: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 1500,
    }),
  ]);

  const invoiceRows: OpenWorkReportRow[] = invoices.map((item) => ({
    queueType: "INVOICE",
    reference: item.invoiceRef,
    caseRef: item.case.caseRef,
    subjectDisplayName: item.case.subjectDisplayName,
    status: item.status,
    updatedAt: item.updatedAt.toISOString(),
  }));
  const exportRows: OpenWorkReportRow[] = exports.map((item) => ({
    queueType: "EXPORT",
    reference: item.exportRef,
    caseRef: item.case.caseRef,
    subjectDisplayName: item.case.subjectDisplayName,
    status: item.status,
    updatedAt: item.updatedAt.toISOString(),
  }));

  return [...invoiceRows, ...exportRows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listExportListReportRows(actor: HubActor): Promise<ExportListReportRow[]> {
  ensureAuthorized(actor, "export:create");

  const scope = caseScope(actor);
  const items = await prisma.exportPackage.findMany({
    where: {
      case: scope,
    },
    include: {
      case: {
        select: {
          caseRef: true,
          subjectDisplayName: true,
        },
      },
      recipient: {
        select: {
          label: true,
          organisation: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 3000,
  });

  return items.map((item) => ({
    exportRef: item.exportRef,
    caseRef: item.case.caseRef,
    subjectDisplayName: item.case.subjectDisplayName,
    recipient: item.recipient.organisation ? `${item.recipient.label} (${item.recipient.organisation})` : item.recipient.label,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    releasedAt: toIso(item.releasedAt),
  }));
}

export async function createExportPackageWorkflow(actor: HubActor, input: CreateExportPackageInput): Promise<string> {
  ensureAuthorized(actor, "export:create", input.caseId);

  return prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        purpose: true,
        legalBasis: true,
        sharePolicy: true,
      },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const recipient = await tx.exportRecipient.findUnique({
      where: { id: input.recipientId },
      select: {
        id: true,
        authorityApproved: true,
        keyFingerprint: true,
      },
    });

    if (!recipient) {
      throw new WorkflowError("not_found", "Export-Empfänger nicht gefunden.");
    }

    ensureExportPolicyAllowed({
      caseSharePolicy: caseItem.sharePolicy,
      recipientAuthorityApproved: recipient.authorityApproved,
    });

    if (!recipient.keyFingerprint) {
      throw new WorkflowError("compliance", "Empfänger benötigt einen Schlüssel-Fingerprint für verschlüsselte Exporte.");
    }

    const createdAt = new Date();
    const payloadType = nonEmpty(input.payloadType) ?? "case_bundle";
    const purpose = nonEmpty(input.purpose) ?? caseItem.purpose;
    const exportRef = await nextExportRef(tx);
    const payloadHash = buildExportPayloadHash({
      caseId: caseItem.id,
      recipientId: recipient.id,
      legalBasis: caseItem.legalBasis,
      sharePolicy: caseItem.sharePolicy,
      payloadType,
      createdAt,
    });

    const exportPackage = await tx.exportPackage.create({
      data: {
        caseId: caseItem.id,
        exportRef,
        recipientId: recipient.id,
        status: "DRAFT",
        payloadType,
        encrypted: true,
        purpose,
        legalBasis: caseItem.legalBasis,
        sharePolicy: caseItem.sharePolicy,
        payloadHash,
        expiresAt: parseDateOrUndefined(input.expiresAt) ?? addMonths(new Date(), 1),
        createdById: actorUserId,
        createdAt,
      },
      select: { id: true },
    });

    await appendAuditEvent(tx, {
      caseId: caseItem.id,
      action: "CREATE",
      entityType: "ExportPackage",
      entityId: exportPackage.id,
      actorId: actorUserId,
      payload: {
        exportRef,
        payloadType,
      },
    });

    return exportPackage.id;
  });
}

export async function updateExportStatusWorkflow(actor: HubActor, input: UpdateExportStatusInput): Promise<void> {
  ensureAuthorized(actor, "export:create", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const exportPackage = await tx.exportPackage.findUnique({
      where: { id: input.exportId },
      select: { id: true, caseId: true, status: true, releasedAt: true },
    });

    if (!exportPackage || exportPackage.caseId !== input.caseId) {
      throw new WorkflowError("not_found", "Exportpaket nicht gefunden.");
    }

    if (!allowedExportTransition(exportPackage.status, input.status)) {
      throw new WorkflowError("validation", "Ungültiger Exportstatus-Wechsel.");
    }

    await tx.exportPackage.update({
      where: { id: exportPackage.id },
      data: {
        status: input.status,
        releasedAt: input.status === "RELEASED" ? exportPackage.releasedAt ?? new Date() : input.status === "CANCELLED" ? null : exportPackage.releasedAt,
      },
    });

    await appendAuditEvent(tx, {
      caseId: input.caseId,
      action: "UPDATE",
      entityType: "ExportPackage",
      entityId: exportPackage.id,
      actorId: actorUserId,
      payload: {
        status: input.status,
      },
    });
  });
}

export async function listExportQueue(actor: HubActor): Promise<ExportQueueItem[]> {
  ensureAuthorized(actor, "export:create");

  const scope = caseScope(actor);
  const exports = await prisma.exportPackage.findMany({
    where: {
      case: scope,
    },
    include: {
      case: {
        select: {
          id: true,
          caseRef: true,
          subjectDisplayName: true,
        },
      },
      recipient: {
        select: {
          label: true,
          organisation: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 180,
  });

  return exports.map((item) => ({
    id: item.id,
    exportRef: item.exportRef,
    caseId: item.caseId,
    caseRef: item.case.caseRef,
    subjectDisplayName: item.case.subjectDisplayName,
    recipient: item.recipient.organisation ? `${item.recipient.label} (${item.recipient.organisation})` : item.recipient.label,
    status: item.status,
    releasedAt: toIso(item.releasedAt),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function runRetentionReviewWorkflow(actor: HubActor, input: RunRetentionReviewInput): Promise<void> {
  ensureAuthorized(actor, "compliance:write", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        intakeAt: true,
        retentionRule: true,
        legalHold: true,
        archivedAt: true,
        scheduledDeletionAt: true,
      },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const retentionDueAt = computeRetentionDueAt(caseItem.retentionRule, caseItem.intakeAt);
    const scheduledDeletionAt = caseItem.legalHold ? null : caseItem.scheduledDeletionAt;
    const retentionStatus = deriveRetentionStatus({
      legalHold: caseItem.legalHold,
      retentionDueAt,
      archivedAt: caseItem.archivedAt,
      scheduledDeletionAt,
    });

    await tx.case.update({
      where: { id: caseItem.id },
      data: {
        retentionDueAt,
        scheduledDeletionAt,
        retentionStatus,
        retentionLastCheck: new Date(),
      },
    });

    await appendAuditEvent(tx, {
      caseId: caseItem.id,
      action: "UPDATE",
      entityType: "ComplianceRetention",
      entityId: caseItem.id,
      actorId: actorUserId,
      payload: {
        retentionStatus,
      },
    });
  });
}

export async function archiveCaseWorkflow(actor: HubActor, input: ArchiveCaseInput): Promise<void> {
  ensureAuthorized(actor, "compliance:write", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        intakeAt: true,
        retentionRule: true,
        legalHold: true,
        scheduledDeletionAt: true,
      },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    const archivedAt = parseDateOrUndefined(input.archivedAt) ?? new Date();
    const retentionDueAt = computeRetentionDueAt(caseItem.retentionRule, caseItem.intakeAt);
    const retentionStatus = deriveRetentionStatus({
      legalHold: caseItem.legalHold,
      retentionDueAt,
      archivedAt,
      scheduledDeletionAt: caseItem.legalHold ? null : caseItem.scheduledDeletionAt,
    });

    await tx.case.update({
      where: { id: caseItem.id },
      data: {
        status: "CLOSED",
        archivedAt,
        retentionDueAt,
        retentionStatus,
        retentionLastCheck: new Date(),
      },
    });

    await appendAuditEvent(tx, {
      caseId: caseItem.id,
      action: "UPDATE",
      entityType: "CaseArchive",
      entityId: caseItem.id,
      actorId: actorUserId,
      payload: {
        archivedAt: archivedAt.toISOString(),
      },
    });
  });
}

export async function scheduleCaseDeletionWorkflow(actor: HubActor, input: ScheduleCaseDeletionInput): Promise<void> {
  ensureAuthorized(actor, "compliance:write", input.caseId);

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const caseItem = await tx.case.findUnique({
      where: { id: input.caseId },
      select: {
        id: true,
        intakeAt: true,
        retentionRule: true,
        legalHold: true,
        archivedAt: true,
      },
    });

    if (!caseItem) {
      throw new WorkflowError("not_found", "Fall nicht gefunden.");
    }

    if (caseItem.legalHold) {
      throw new WorkflowError("compliance", "Löschplanung nicht erlaubt: Legal Hold ist aktiv.");
    }

    if (!caseItem.archivedAt) {
      throw new WorkflowError("validation", "Fall muss vor der Löschplanung archiviert werden.");
    }

    const scheduledDeletionAt = parseDateOrUndefined(input.scheduledDeletionAt) ?? addMonths(new Date(), 1);
    if (scheduledDeletionAt <= new Date()) {
      throw new WorkflowError("validation", "Löschdatum muss in der Zukunft liegen.");
    }

    const retentionDueAt = computeRetentionDueAt(caseItem.retentionRule, caseItem.intakeAt);
    const retentionStatus = deriveRetentionStatus({
      legalHold: false,
      retentionDueAt,
      archivedAt: caseItem.archivedAt,
      scheduledDeletionAt,
    });

    await tx.case.update({
      where: { id: caseItem.id },
      data: {
        retentionDueAt,
        scheduledDeletionAt,
        retentionStatus,
        retentionLastCheck: new Date(),
      },
    });

    await appendAuditEvent(tx, {
      caseId: caseItem.id,
      action: "UPDATE",
      entityType: "CaseDeletionPlan",
      entityId: caseItem.id,
      actorId: actorUserId,
      payload: {
        scheduledDeletionAt: scheduledDeletionAt.toISOString(),
      },
    });
  });
}

export async function listComplianceQueue(actor: HubActor): Promise<ComplianceQueueItem[]> {
  ensureAuthorized(actor, "case:read");

  const scope = caseScope(actor);
  const soon = addMonths(new Date(), 3);
  const cases = await prisma.case.findMany({
    where: {
      ...scope,
      OR: [
        { retentionStatus: { in: ["DUE", "ARCHIVED", "DELETION_SCHEDULED"] } },
        { retentionDueAt: { lte: soon } },
      ],
    },
    orderBy: [{ retentionStatus: "desc" }, { retentionDueAt: "asc" }],
    take: 180,
    select: {
      id: true,
      caseRef: true,
      subjectDisplayName: true,
      retentionStatus: true,
      retentionDueAt: true,
      archivedAt: true,
      scheduledDeletionAt: true,
      legalHold: true,
    },
  });

  return cases.map((item) => ({
    caseId: item.id,
    caseRef: item.caseRef,
    subjectDisplayName: item.subjectDisplayName,
    retentionStatus: item.retentionStatus,
    retentionDueAt: toIso(item.retentionDueAt),
    archivedAt: toIso(item.archivedAt),
    scheduledDeletionAt: toIso(item.scheduledDeletionAt),
    legalHold: item.legalHold,
  }));
}

export async function getSyncQueueSnapshot(actor: HubActor): Promise<SyncQueueSnapshot> {
  ensureAuthorized(actor, "sync:append");

  const hasGlobalScope =
    actor.roles.includes("ADMIN") ||
    actor.roles.includes("SYSTEM") ||
    actor.roles.includes("AUDITOR") ||
    actor.roles.includes("BILLING");

  const actorUser = await prisma.user.findUnique({
    where: { externalId: actor.id },
    select: { id: true },
  });

  const clients = await prisma.syncClient.findMany({
    where: hasGlobalScope ? {} : { userId: actorUser?.id ?? "__none__" },
    include: {
      user: {
        select: { displayName: true, email: true },
      },
      events: {
        where: { appliedAt: null },
        select: { id: true },
      },
    },
    orderBy: [{ lastSeenAt: "desc" }],
    take: 80,
  });

  const visibleCaseScope = caseScope(actor);
  const pendingEvents = await prisma.syncEvent.findMany({
    where: {
      appliedAt: null,
      case: visibleCaseScope,
      ...(hasGlobalScope
        ? {}
        : {
            syncClient: {
              userId: actorUser?.id ?? "__none__",
            },
          }),
    },
    include: {
      case: {
        select: { id: true, caseRef: true },
      },
      syncClient: {
        select: {
          clientRef: true,
          user: {
            select: { displayName: true, email: true },
          },
        },
      },
    },
    orderBy: [{ receivedAt: "desc" }],
    take: 400,
  });

  return {
    clients: clients.map((client) => ({
      id: client.id,
      clientRef: client.clientRef,
      deviceLabel: client.deviceLabel ?? "-",
      owner: client.user.displayName ?? client.user.email,
      lastSeenAt: toIso(client.lastSeenAt),
      pendingEvents: client.events.length,
    })),
    pendingEvents: pendingEvents.map((event) => ({
      id: event.id,
      clientRef: event.syncClient.clientRef,
      caseId: event.case.id,
      caseRef: event.case.caseRef,
      eventType: event.eventType,
      sequence: event.sequence,
      receivedAt: event.receivedAt.toISOString(),
      actor: event.syncClient.user.displayName ?? event.syncClient.user.email,
    })),
  };
}

export async function markSyncEventAppliedWorkflow(actor: HubActor, input: MarkSyncEventAppliedInput): Promise<void> {
  ensureAuthorized(actor, "sync:append");

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);

    const event = await tx.syncEvent.findUnique({
      where: { id: input.syncEventId },
      include: {
        syncClient: {
          include: {
            user: {
              select: { externalId: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new WorkflowError("not_found", "Sync-Event nicht gefunden.");
    }

    const hasGlobalScope =
      actor.roles.includes("ADMIN") ||
      actor.roles.includes("SYSTEM") ||
      actor.roles.includes("AUDITOR") ||
      actor.roles.includes("BILLING");

    const ownsClient = event.syncClient.user.externalId === actor.id;
    const assignedCase = actor.assignmentCaseIds.includes(event.caseId);
    if (!hasGlobalScope && !ownsClient && !assignedCase) {
      throw new WorkflowError("forbidden", "Zugriff auf dieses Sync-Event verweigert.");
    }

    if (event.appliedAt) {
      return;
    }

    await tx.syncEvent.update({
      where: { id: event.id },
      data: {
        appliedAt: new Date(),
      },
    });

    await appendAuditEvent(tx, {
      caseId: event.caseId,
      action: "UPDATE",
      entityType: "SyncEvent",
      entityId: event.id,
      actorId: actorUserId,
      payload: {
        sequence: event.sequence,
        syncClientId: event.syncClientId,
        status: "APPLIED",
      },
    });
  });
}

function occupancyBlueprint() {
  return HOPE_OFFERINGS.filter((item) => item.occupancySite && item.capacity)
    .map((item) => ({
      site: item.occupancySite as string,
      offering: item.label,
      capacity: item.capacity as number,
    }))
    .sort((a, b) => a.site.localeCompare(b.site, "de-CH"));
}

export async function getDashboardSnapshot(actor: HubActor): Promise<DashboardSnapshot> {
  const cases = await listCases(actor);
  const caseIds = cases.map((item) => item.id);

  const [
    activities,
    tasks,
    syncClientsRaw,
    openStays,
    pendingSyncEvents,
    billingDrafts,
    pendingExports,
    retentionDueCases,
    pendingCostApprovals,
    invoiceQueueRaw,
    exportQueueRaw,
    complianceQueueRaw,
  ] = await Promise.all([
    caseIds.length
      ? prisma.serviceEvent.findMany({
          where: { caseId: { in: caseIds } },
          include: {
            case: { select: { caseRef: true } },
            createdBy: { select: { displayName: true, email: true } },
          },
          orderBy: { occurredAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
    caseIds.length
      ? prisma.task.findMany({
          where: {
            caseId: { in: caseIds },
            status: { not: "DONE" },
          },
          include: {
            case: { select: { id: true, caseRef: true } },
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          take: 40,
        })
      : Promise.resolve([]),
    prisma.syncClient.findMany({
      include: {
        user: { select: { displayName: true, email: true } },
        events: {
          where: { appliedAt: null },
          select: { id: true },
        },
      },
      orderBy: { lastSeenAt: "desc" },
      take: 8,
    }),
    caseIds.length
      ? prisma.stay.findMany({
          where: {
            caseId: { in: caseIds },
            status: "CHECKED_IN",
          },
          include: {
            case: { select: { offering: true } },
          },
        })
      : Promise.resolve([]),
    prisma.syncEvent.count({
      where: { appliedAt: null },
    }),
    caseIds.length
      ? prisma.invoiceDraft.count({
          where: {
            caseId: { in: caseIds },
            status: { in: ["DRAFT", "READY"] },
          },
        })
      : Promise.resolve(0),
    caseIds.length
      ? prisma.exportPackage.count({
          where: {
            caseId: { in: caseIds },
            status: { in: ["DRAFT", "READY"] },
          },
        })
      : Promise.resolve(0),
    caseIds.length
      ? prisma.case.count({
          where: {
            id: { in: caseIds },
            OR: [{ retentionStatus: { in: ["DUE", "DELETION_SCHEDULED"] } }, { retentionDueAt: { lte: new Date() } }],
          },
        })
      : Promise.resolve(0),
    caseIds.length
      ? prisma.costApproval.count({
          where: {
            caseId: { in: caseIds },
            status: { in: ["DRAFT", "SUBMITTED"] },
          },
        })
      : Promise.resolve(0),
    caseIds.length
      ? prisma.invoiceDraft.findMany({
          where: {
            caseId: { in: caseIds },
            status: { in: ["DRAFT", "READY", "SUBMITTED"] },
          },
          include: {
            case: {
              select: { caseRef: true },
            },
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 8,
        })
      : Promise.resolve([]),
    caseIds.length
      ? prisma.exportPackage.findMany({
          where: {
            caseId: { in: caseIds },
            status: { in: ["DRAFT", "READY"] },
          },
          include: {
            case: {
              select: { caseRef: true },
            },
            recipient: {
              select: { label: true },
            },
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 8,
        })
      : Promise.resolve([]),
    caseIds.length
      ? prisma.case.findMany({
          where: {
            id: { in: caseIds },
            OR: [{ retentionStatus: { in: ["DUE", "DELETION_SCHEDULED"] } }, { retentionDueAt: { lte: addMonths(new Date(), 2) } }],
          },
          orderBy: [{ retentionDueAt: "asc" }],
          take: 8,
          select: {
            id: true,
            caseRef: true,
            subjectDisplayName: true,
            retentionStatus: true,
            retentionDueAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const occupiedByOffering = new Map<string, number>();
  for (const stay of openStays) {
    const key = stay.case.offering;
    occupiedByOffering.set(key, (occupiedByOffering.get(key) ?? 0) + 1);
  }

  const occupancy = occupancyBlueprint().map((slot) => ({
    site: slot.site,
    capacity: slot.capacity,
    occupied: occupiedByOffering.get(slot.offering) ?? 0,
  }));

  const totalCapacity = occupancy.reduce((sum, item) => sum + item.capacity, 0);
  const totalOccupied = occupancy.reduce((sum, item) => sum + item.occupied, 0);

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      activeCases: cases.filter((item) => item.status === "ACTIVE" || item.status === "INTAKE").length,
      openTasks: tasks.length,
      highRiskCases: cases.filter((item) => item.riskLevel === "HIGH").length,
      pendingSyncEvents,
      occupancyRate: totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
      billingDrafts,
      pendingExports,
      retentionDueCases,
      pendingCostApprovals,
      openWorkItems: billingDrafts + pendingExports,
    },
    occupancy,
    cases: cases.slice(0, 40),
    activities: activities.map((item) => ({
      id: item.id,
      occurredAt: item.occurredAt.toISOString(),
      type: item.eventType,
      caseRef: item.case.caseRef,
      actor: item.createdBy?.displayName ?? item.createdBy?.email ?? "System",
      note: item.notes ?? "",
    })),
    tasks: tasks.map((item) => ({
      id: item.id,
      title: item.title,
      caseId: item.case.id,
      caseRef: item.case.caseRef,
      owner: item.ownerName ?? "Team",
      dueAt: toIso(item.dueAt),
      priority: item.priority,
      status: item.status,
    })),
    syncClients: syncClientsRaw.map((item) => ({
      id: item.id,
      label: item.deviceLabel ?? item.clientRef,
      owner: item.user.displayName ?? item.user.email,
      lastSeenAt: toIso(item.lastSeenAt),
      pendingEvents: item.events.length,
    })),
    invoiceQueue: invoiceQueueRaw.map((item) => ({
      id: item.id,
      invoiceRef: item.invoiceRef,
      caseRef: item.case.caseRef,
      status: item.status,
      totalCents: item.totalCents,
      updatedAt: item.updatedAt.toISOString(),
    })),
    exportQueue: exportQueueRaw.map((item) => ({
      id: item.id,
      exportRef: item.exportRef,
      caseRef: item.case.caseRef,
      recipient: item.recipient.label,
      status: item.status,
      updatedAt: item.updatedAt.toISOString(),
    })),
    complianceQueue: complianceQueueRaw.map((item) => ({
      id: item.id,
      caseRef: item.caseRef,
      subjectDisplayName: item.subjectDisplayName,
      retentionStatus: item.retentionStatus,
      retentionDueAt: toIso(item.retentionDueAt),
    })),
  };
}

function seededNames() {
  return [
    "M. Schneider",
    "L. Baumann",
    "S. Novak",
    "R. Costa",
    "E. Berger",
    "F. Keller",
    "A. Yildiz",
    "T. Huber",
    "N. Lenz",
    "J. Meier",
    "P. Wolf",
    "I. Rossi",
    "D. Frei",
    "K. Lorenz",
    "G. Haas",
    "B. Krüger",
    "Y. Lehmann",
    "C. Steiner",
    "O. Graf",
    "W. Schmid",
    "V. Moser",
    "H. Kunz",
    "Q. Dietrich",
    "U. Langer",
    "R. Baum",
    "Z. Maurer",
    "M. Vogel",
    "X. Fischer",
    "N. Albrecht",
    "S. Weber",
  ];
}

function seedStatuses(): CaseStatus[] {
  return ["ACTIVE", "ACTIVE", "INTAKE", "FOLLOW_UP", "WAITLIST", "ACTIVE", "CLOSED"];
}

function seedRiskLevels(): RiskLevel[] {
  return ["MEDIUM", "HIGH", "LOW", "MEDIUM", "HIGH", "LOW"];
}

async function seedUsers(tx: Prisma.TransactionClient): Promise<string[]> {
  const seeds = [
    { externalId: "seed:anna", email: "anna@hope.local", displayName: "Anna", role: "SHIFT_WORKER" as UserRole },
    { externalId: "seed:noah", email: "noah@hope.local", displayName: "Noah", role: "SHIFT_WORKER" as UserRole },
    { externalId: "seed:samira", email: "samira@hope.local", displayName: "Samira", role: "SHIFT_LEAD" as UserRole },
    { externalId: "seed:jasmin", email: "jasmin@hope.local", displayName: "Jasmin", role: "SHIFT_WORKER" as UserRole },
    { externalId: "seed:eva", email: "eva@hope.local", displayName: "Eva", role: "BILLING" as UserRole },
    { externalId: "seed:jonas", email: "jonas@hope.local", displayName: "Jonas", role: "SHIFT_WORKER" as UserRole },
  ];

  const ids: string[] = [];
  for (const seed of seeds) {
    const user = await tx.user.upsert({
      where: { externalId: seed.externalId },
      update: {
        email: seed.email,
        displayName: seed.displayName,
        role: seed.role,
        isActive: true,
      },
      create: seed,
      select: { id: true },
    });
    ids.push(user.id);
  }

  return ids;
}

async function seedExportRecipients(tx: Prisma.TransactionClient): Promise<string[]> {
  const seeds = [
    {
      recipientRef: "REC-0001",
      label: "Sozialdienst Baden",
      organisation: "Stadt Baden",
      channel: "sftp",
      endpoint: "sftp://stadt-baden.ch/hope",
      authorityApproved: true,
      keyFingerprint: "AGE-1A24-BA7C-4432",
    },
    {
      recipientRef: "REC-0002",
      label: "Kantonaler Fachbereich",
      organisation: "Kanton Aargau",
      channel: "sftp",
      endpoint: "sftp://ag.ch/hope-intake",
      authorityApproved: true,
      keyFingerprint: "AGE-8C91-D3FE-5100",
    },
    {
      recipientRef: "REC-0003",
      label: "Partnerinstitution Übergang",
      organisation: "Netzwerk Übergang",
      channel: "sftp",
      endpoint: "sftp://partner.local/exports",
      authorityApproved: false,
      keyFingerprint: "AGE-3B29-773D-AB10",
    },
  ];

  const ids: string[] = [];
  for (const seed of seeds) {
    const recipient = await tx.exportRecipient.upsert({
      where: { recipientRef: seed.recipientRef },
      update: {
        label: seed.label,
        organisation: seed.organisation,
        channel: seed.channel,
        endpoint: seed.endpoint,
        authorityApproved: seed.authorityApproved,
        keyFingerprint: seed.keyFingerprint,
      },
      create: seed,
      select: { id: true },
    });
    ids.push(recipient.id);
  }

  return ids;
}

async function ensureRetentionFields(tx: Prisma.TransactionClient): Promise<void> {
  const cases = await tx.case.findMany({
    select: {
      id: true,
      intakeAt: true,
      retentionRule: true,
      legalHold: true,
      archivedAt: true,
      scheduledDeletionAt: true,
    },
  });

  for (const item of cases) {
    const retentionDueAt = computeRetentionDueAt(item.retentionRule, item.intakeAt);
    const scheduledDeletionAt = item.legalHold ? null : item.scheduledDeletionAt;
    const retentionStatus = deriveRetentionStatus({
      legalHold: item.legalHold,
      retentionDueAt,
      archivedAt: item.archivedAt,
      scheduledDeletionAt,
    });

    await tx.case.update({
      where: { id: item.id },
      data: {
        retentionDueAt,
        scheduledDeletionAt,
        retentionStatus,
        retentionLastCheck: new Date(),
      },
    });
  }
}

type ApprovedCostApprovalSeed = {
  id: string;
  approvalRef: string;
  approvedAmountCents: number;
};

async function seedCostApprovals(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  caseIds: string[],
): Promise<Map<string, ApprovedCostApprovalSeed>> {
  const existingCount = await tx.costApproval.count();

  if (existingCount === 0) {
    const statuses: CostApprovalStatus[] = ["APPROVED", "SUBMITTED", "DRAFT", "APPROVED", "REJECTED", "APPROVED"];

    for (let index = 0; index < Math.min(caseIds.length, 16); index += 1) {
      const validFrom = addMonths(new Date(), -2);
      const validUntil = addMonths(new Date(), 2 + (index % 4));
      const status = statuses[index % statuses.length];
      const approvalRef = await nextCostApprovalRef(tx);
      const approvedAmountCents = 48000 + index * 3500;

      await tx.costApproval.create({
        data: {
          caseId: caseIds[index],
          approvalRef,
          authorityName: index % 2 === 0 ? "Sozialdienst Baden" : "Kanton Aargau",
          approvedAmountCents,
          currency: "CHF",
          validFrom,
          validUntil,
          status,
          notes: "Seed-Daten: automatisch erzeugte Kostengutsprache.",
          createdById: actorUserId,
          submittedAt: ["SUBMITTED", "APPROVED", "REJECTED", "EXPIRED"].includes(status) ? addMonths(new Date(), -1) : null,
          approvedAt: status === "APPROVED" ? addMonths(new Date(), -1) : null,
          rejectedAt: status === "REJECTED" ? addMonths(new Date(), -1) : null,
        },
      });
    }
  }

  const approved = await tx.costApproval.findMany({
    where: {
      caseId: { in: caseIds },
      status: "APPROVED",
      validUntil: { gte: new Date() },
    },
    orderBy: [{ validUntil: "desc" }],
    select: {
      id: true,
      caseId: true,
      approvalRef: true,
      approvedAmountCents: true,
    },
  });

  const byCase = new Map<string, ApprovedCostApprovalSeed>();
  for (const item of approved) {
    if (!byCase.has(item.caseId)) {
      byCase.set(item.caseId, {
        id: item.id,
        approvalRef: item.approvalRef,
        approvedAmountCents: item.approvedAmountCents,
      });
    }
  }

  return byCase;
}

async function seedFinanceAndExportData(tx: Prisma.TransactionClient, actorUserId: string): Promise<void> {
  const caseItems = await tx.case.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      legalBasis: true,
      sharePolicy: true,
      purpose: true,
    },
    take: 20,
  });

  if (!caseItems.length) return;

  const approvedCostApprovalByCase = await seedCostApprovals(
    tx,
    actorUserId,
    caseItems.map((item) => item.id),
  );

  const recipientIds = await seedExportRecipients(tx);

  const invoiceCount = await tx.invoiceDraft.count();
  if (invoiceCount === 0) {
    const statuses: InvoiceStatus[] = ["DRAFT", "READY", "SUBMITTED", "PAID"];

    for (let index = 0; index < Math.min(caseItems.length, 12); index += 1) {
      const caseItem = caseItems[index];
      const invoiceRef = await nextInvoiceRef(tx);
      const periodEnd = new Date(Date.now() - index * 24 * 60 * 60 * 1000);
      const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const status = statuses[index % statuses.length];
      const issuedAt = status === "SUBMITTED" || status === "PAID" ? new Date(periodEnd.getTime() - 2 * 24 * 60 * 60 * 1000) : null;
      const paidAt = status === "PAID" ? new Date(periodEnd.getTime() - 1 * 24 * 60 * 60 * 1000) : null;
      const linkedApproval = index % 2 === 0 ? approvedCostApprovalByCase.get(caseItem.id) : undefined;

      const invoice = await tx.invoiceDraft.create({
        data: {
          caseId: caseItem.id,
          invoiceRef,
          periodStart,
          periodEnd,
          status,
          notes: "Seed-Daten: automatisch erzeugter Abrechnungsentwurf.",
          costApprovalId: linkedApproval?.id,
          createdById: actorUserId,
          issuedAt,
          paidAt,
        },
        select: { id: true },
      });

      const lineA = 3 + (index % 4);
      const lineB = 1 + (index % 3);
      const baseSubtotalCents = lineA * 9000 + lineB * 4500;
      const hasCap = linkedApproval && baseSubtotalCents > linkedApproval.approvedAmountCents;
      const capDelta = hasCap ? baseSubtotalCents - linkedApproval.approvedAmountCents : 0;
      const subtotalCents = baseSubtotalCents - capDelta;

      const lines: Prisma.InvoiceLineCreateManyInput[] = [
        {
          invoiceDraftId: invoice.id,
          caseId: caseItem.id,
          sourceType: "STAY",
          description: "Aufenthaltstage",
          quantity: lineA,
          unitPriceCents: 9000,
          lineTotalCents: lineA * 9000,
        },
        {
          invoiceDraftId: invoice.id,
          caseId: caseItem.id,
          sourceType: "SERVICE_EVENT",
          description: "Begleitungsleistungen",
          quantity: lineB,
          unitPriceCents: 4500,
          lineTotalCents: lineB * 4500,
        },
      ];

      if (linkedApproval) {
        lines.push({
          invoiceDraftId: invoice.id,
          caseId: caseItem.id,
          sourceType: "COST_APPROVAL",
          sourceId: linkedApproval.id,
          description: `Kostengutsprache ${linkedApproval.approvalRef}`,
          quantity: 1,
          unitPriceCents: 0,
          lineTotalCents: 0,
        });

        if (hasCap) {
          lines.push({
            invoiceDraftId: invoice.id,
            caseId: caseItem.id,
            sourceType: "COST_APPROVAL",
            sourceId: linkedApproval.id,
            description: `Deckelung gemäss Kostengutsprache ${linkedApproval.approvalRef}`,
            quantity: 1,
            unitPriceCents: -capDelta,
            lineTotalCents: -capDelta,
          });
        }
      }

      await tx.invoiceLine.createMany({
        data: lines,
      });

      await tx.invoiceDraft.update({
        where: { id: invoice.id },
        data: {
          subtotalCents,
          taxCents: 0,
          totalCents: subtotalCents,
        },
      });
    }
  }

  const exportCount = await tx.exportPackage.count();
  if (exportCount === 0 && recipientIds.length) {
    for (let index = 0; index < Math.min(caseItems.length, 10); index += 1) {
      const caseItem = caseItems[index];
      if (caseItem.sharePolicy === "INTERNAL_ONLY") continue;

      const recipientId = recipientIds[index % recipientIds.length];
      const status: ExportPackageStatus = index % 3 === 0 ? "READY" : "DRAFT";
      const exportRef = await nextExportRef(tx);
      const createdAt = new Date(Date.now() - index * 4 * 60 * 60 * 1000);
      const payloadHash = buildExportPayloadHash({
        caseId: caseItem.id,
        recipientId,
        legalBasis: caseItem.legalBasis,
        sharePolicy: caseItem.sharePolicy,
        payloadType: "case_bundle",
        createdAt,
      });

      await tx.exportPackage.create({
        data: {
          caseId: caseItem.id,
          exportRef,
          recipientId,
          status,
          payloadType: "case_bundle",
          encrypted: true,
          purpose: caseItem.purpose,
          legalBasis: caseItem.legalBasis,
          sharePolicy: caseItem.sharePolicy,
          payloadHash,
          expiresAt: addMonths(createdAt, 1),
          releasedAt: null,
          createdById: actorUserId,
          createdAt,
        },
      });
    }
  }
}

export async function ensureSeedData(actor: HubActor): Promise<void> {
  const existingCaseCount = await prisma.case.count();

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const helperUserIds = await seedUsers(tx);
    const allAssignees = [actorUserId, ...helperUserIds];

    if (existingCaseCount === 0) {
      const names = seededNames();
      const statuses = seedStatuses();
      const risks = seedRiskLevels();
      const teams = ["Outreach Nord", "Case Management", "Nachtbetrieb", "Sozialdienst", "Wohnbegleitung"];

      const yearSuffix = String(new Date().getFullYear()).slice(-2);
      const prefix = `HH-${yearSuffix}-`;

      const createdCases: Array<Pick<Case, "id" | "offering" | "status">> = [];

      for (let index = 0; index < names.length; index += 1) {
        const offering = HOPE_OFFERINGS[index % HOPE_OFFERINGS.length];
        const caseRef = `${prefix}${String(index + 1).padStart(4, "0")}`;
        const intakeAt = new Date(Date.now() - (index + 2) * 24 * 60 * 60 * 1000);
        const retentionDueAt = computeRetentionDueAt(offering.defaultRetentionRule, intakeAt);

        const createdCase = await tx.case.create({
          data: {
            caseRef,
            subjectDisplayName: names[index],
            status: statuses[index % statuses.length],
            riskLevel: risks[index % risks.length],
            programArea: offering.area,
            offering: offering.label,
            assignedTeam: teams[index % teams.length],
            nextActionAt: new Date(Date.now() + ((index % 5) + 1) * 24 * 60 * 60 * 1000),
            intakeAt,
            dataClass: offering.defaultDataClass,
            purpose: offering.defaultPurpose,
            legalBasis: offering.defaultLegalBasis,
            sharePolicy: offering.defaultSharePolicy,
            retentionRule: offering.defaultRetentionRule,
            retentionDueAt,
            retentionStatus: deriveRetentionStatus({
              legalHold: false,
              retentionDueAt,
              archivedAt: null,
              scheduledDeletionAt: null,
            }),
            retentionLastCheck: new Date(),
          },
          select: { id: true, offering: true, status: true },
        });

        createdCases.push(createdCase);

        await tx.caseAssignment.create({
          data: {
            caseId: createdCase.id,
            userId: allAssignees[index % allAssignees.length],
          },
        });

        await tx.serviceEvent.create({
          data: {
            caseId: createdCase.id,
            eventType: "INTAKE",
            occurredAt: new Date(Date.now() - (index + 4) * 60 * 60 * 1000),
            notes: "Erstkontakt dokumentiert und Priorität gesetzt.",
            dataClass: offering.defaultDataClass,
            purpose: offering.defaultPurpose,
            legalBasis: offering.defaultLegalBasis,
            sharePolicy: offering.defaultSharePolicy,
            createdById: allAssignees[index % allAssignees.length],
          },
        });

        await tx.task.create({
          data: {
            caseId: createdCase.id,
            title: index % 2 === 0 ? "Follow-up Termin bestätigen" : "Falldokumentation abschliessen",
            ownerName: ["Anna", "Noah", "Samira", "Jasmin", "Eva", "Jonas"][index % 6],
            dueAt: new Date(Date.now() + (index % 7 + 1) * 60 * 60 * 1000),
            priority: (["P1", "P2", "P3"] as TaskPriority[])[index % 3],
            status: (["OPEN", "IN_PROGRESS", "DONE", "OPEN"] as TaskStatus[])[index % 4],
            createdById: actorUserId,
          },
        });
      }

      for (let index = 0; index < createdCases.length; index += 1) {
        const caseItem = createdCases[index];
        const isHousing = ["Notschlafstelle", "Notpension", "Übergangswohnen", "Wohnzentrum", "Wohnexternat"].includes(caseItem.offering);
        if (!isHousing) continue;

        await tx.stay.create({
          data: {
            caseId: caseItem.id,
            checkInAt: new Date(Date.now() - (index % 4 + 1) * 24 * 60 * 60 * 1000),
            checkOutAt: caseItem.status === "CLOSED" ? new Date(Date.now() - 5 * 60 * 60 * 1000) : null,
            status: caseItem.status === "CLOSED" ? "CHECKED_OUT" : "CHECKED_IN",
            dataClass: "CONFIDENTIAL",
            purpose: "Unterbringung und Stabilisierung",
            legalBasis: "VITAL_INTEREST",
            sharePolicy: "NEED_TO_KNOW",
            createdById: actorUserId,
          },
        });
      }

      for (let index = 0; index < helperUserIds.length; index += 1) {
        await tx.syncClient.upsert({
          where: { clientRef: `seed-sync-${index + 1}` },
          update: {
            userId: helperUserIds[index],
            deviceLabel: [
              "Tablet Nord 1",
              "Tablet Nord 2",
              "Phone Intake",
              "Laptop CaseMgmt",
              "Tablet Medical",
              "Night Shift A",
            ][index],
            lastSeenAt: new Date(Date.now() - index * 45 * 60 * 1000),
          },
          create: {
            clientRef: `seed-sync-${index + 1}`,
            userId: helperUserIds[index],
            deviceLabel: [
              "Tablet Nord 1",
              "Tablet Nord 2",
              "Phone Intake",
              "Laptop CaseMgmt",
              "Tablet Medical",
              "Night Shift A",
            ][index],
            lastSeenAt: new Date(Date.now() - index * 45 * 60 * 1000),
          },
        });
      }
    }

    await ensureRetentionFields(tx);
    await seedFinanceAndExportData(tx, actorUserId);
  });
}
