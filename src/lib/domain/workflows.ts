import {
  type Case,
  type CaseStatus,
  type DataClass,
  type LegalBasis,
  type Prisma,
  type ProgramArea,
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
  if (actor.roles.includes("ADMIN") || actor.roles.includes("SYSTEM") || actor.roles.includes("AUDITOR")) {
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

  return prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const caseRef = await nextCaseRef(tx);

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
        retentionRule: nonEmpty(input.retentionRule) ?? offering.defaultRetentionRule,
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

  const [activities, tasks, syncClientsRaw, openStays, pendingSyncEvents] = await Promise.all([
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
            case: { select: { caseRef: true } },
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

export async function ensureSeedData(actor: HubActor): Promise<void> {
  const existingCaseCount = await prisma.case.count();
  if (existingCaseCount > 0) return;

  await prisma.$transaction(async (tx) => {
    const actorUserId = await ensureActorUser(tx, actor);
    const helperUserIds = await seedUsers(tx);
    const allAssignees = [actorUserId, ...helperUserIds];

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
          dataClass: offering.defaultDataClass,
          purpose: offering.defaultPurpose,
          legalBasis: offering.defaultLegalBasis,
          sharePolicy: offering.defaultSharePolicy,
          retentionRule: offering.defaultRetentionRule,
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
      const isHousing = ["Notschlafstelle", "Notpension", "Übergangswohnen"].includes(caseItem.offering);
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
      await tx.syncClient.create({
        data: {
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
  });
}
