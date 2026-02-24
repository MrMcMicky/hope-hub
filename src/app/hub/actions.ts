"use server";

import { type CaseStatus, type DataClass, type LegalBasis, type ProgramArea, type RiskLevel, type SharePolicy, type TaskPriority, type TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireHubActor } from "@/lib/auth/session";
import {
  WorkflowError,
  checkOutStayWorkflow,
  createCaseWorkflow,
  createServiceEventWorkflow,
  createStayWorkflow,
  createTaskWorkflow,
  deleteTaskWorkflow,
  updateCaseWorkflow,
  updateTaskStatusWorkflow,
} from "@/lib/domain/workflows";

function asNonEmptyString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function asOptionalString(formData: FormData, key: string): string | undefined {
  const value = asNonEmptyString(formData, key);
  return value ? value : undefined;
}

function asCaseStatus(value: string): CaseStatus {
  if (["INTAKE", "ACTIVE", "FOLLOW_UP", "WAITLIST", "CLOSED"].includes(value)) {
    return value as CaseStatus;
  }
  return "INTAKE";
}

function asRiskLevel(value: string): RiskLevel {
  if (["LOW", "MEDIUM", "HIGH"].includes(value)) {
    return value as RiskLevel;
  }
  return "MEDIUM";
}

function asProgramArea(value: string): ProgramArea {
  if (["BEGEGNUNG", "BETREUEN", "BEHERBERGEN", "BESCHAEFTIGEN"].includes(value)) {
    return value as ProgramArea;
  }
  return "BETREUEN";
}

function asLegalBasis(value: string): LegalBasis {
  if (["CONSENT", "CONTRACT", "LEGAL_OBLIGATION", "VITAL_INTEREST", "PUBLIC_TASK", "LEGITIMATE_INTEREST"].includes(value)) {
    return value as LegalBasis;
  }
  return "CONTRACT";
}

function asSharePolicy(value: string): SharePolicy {
  if (["INTERNAL_ONLY", "NEED_TO_KNOW", "AUTHORITY_ONLY", "PARTNER_ALLOWED"].includes(value)) {
    return value as SharePolicy;
  }
  return "NEED_TO_KNOW";
}

function asDataClass(value: string): DataClass {
  if (["PUBLIC", "INTERNAL", "CONFIDENTIAL", "HIGHLY_SENSITIVE"].includes(value)) {
    return value as DataClass;
  }
  return "CONFIDENTIAL";
}

function asTaskPriority(value: string): TaskPriority {
  if (["P1", "P2", "P3"].includes(value)) {
    return value as TaskPriority;
  }
  return "P2";
}

function asTaskStatus(value: string): TaskStatus {
  if (["OPEN", "IN_PROGRESS", "DONE"].includes(value)) {
    return value as TaskStatus;
  }
  return "OPEN";
}

function asBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function throwIfWorkflowError(error: unknown): never {
  if (error instanceof WorkflowError) {
    throw new Error(error.message);
  }
  throw error;
}

export async function createCaseAction(formData: FormData): Promise<void> {
  const actor = await requireHubActor("/hub/cases");

  try {
    const caseId = await createCaseWorkflow(actor, {
      subjectDisplayName: asNonEmptyString(formData, "subjectDisplayName"),
      status: asCaseStatus(asNonEmptyString(formData, "status")),
      riskLevel: asRiskLevel(asNonEmptyString(formData, "riskLevel")),
      programArea: asProgramArea(asNonEmptyString(formData, "programArea")),
      offeringCode: asNonEmptyString(formData, "offeringCode"),
      assignedTeam: asOptionalString(formData, "assignedTeam"),
      nextActionAt: asOptionalString(formData, "nextActionAt"),
      purpose: asOptionalString(formData, "purpose"),
      legalBasis: asLegalBasis(asNonEmptyString(formData, "legalBasis")),
      sharePolicy: asSharePolicy(asNonEmptyString(formData, "sharePolicy")),
      dataClass: asDataClass(asNonEmptyString(formData, "dataClass")),
      retentionRule: asOptionalString(formData, "retentionRule"),
    });

    revalidatePath("/hub");
    revalidatePath("/hub/cases");
    redirect(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}

export async function updateCaseAction(caseId: string, formData: FormData): Promise<void> {
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  try {
    await updateCaseWorkflow(actor, caseId, {
      subjectDisplayName: asNonEmptyString(formData, "subjectDisplayName"),
      status: asCaseStatus(asNonEmptyString(formData, "status")),
      riskLevel: asRiskLevel(asNonEmptyString(formData, "riskLevel")),
      programArea: asProgramArea(asNonEmptyString(formData, "programArea")),
      offeringCode: asNonEmptyString(formData, "offeringCode"),
      assignedTeam: asOptionalString(formData, "assignedTeam"),
      nextActionAt: asOptionalString(formData, "nextActionAt"),
      purpose: asNonEmptyString(formData, "purpose"),
      legalBasis: asLegalBasis(asNonEmptyString(formData, "legalBasis")),
      sharePolicy: asSharePolicy(asNonEmptyString(formData, "sharePolicy")),
      dataClass: asDataClass(asNonEmptyString(formData, "dataClass")),
      retentionRule: asNonEmptyString(formData, "retentionRule"),
      legalHold: asBoolean(formData, "legalHold"),
    });

    revalidatePath("/hub");
    revalidatePath("/hub/cases");
    revalidatePath(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}

export async function createStayAction(caseId: string, formData: FormData): Promise<void> {
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  try {
    await createStayWorkflow(actor, {
      caseId,
      checkInAt: asOptionalString(formData, "checkInAt"),
    });

    revalidatePath("/hub");
    revalidatePath(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}

export async function checkOutStayAction(caseId: string, stayId: string, formData: FormData): Promise<void> {
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  try {
    await checkOutStayWorkflow(actor, {
      caseId,
      stayId,
      checkOutAt: asOptionalString(formData, "checkOutAt"),
    });

    revalidatePath("/hub");
    revalidatePath(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}

export async function createServiceEventAction(caseId: string, formData: FormData): Promise<void> {
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  try {
    await createServiceEventWorkflow(actor, {
      caseId,
      stayId: asOptionalString(formData, "stayId"),
      eventType: asNonEmptyString(formData, "eventType"),
      occurredAt: asOptionalString(formData, "occurredAt"),
      notes: asOptionalString(formData, "notes"),
    });

    revalidatePath("/hub");
    revalidatePath(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}

export async function createTaskAction(caseId: string, formData: FormData): Promise<void> {
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  try {
    await createTaskWorkflow(actor, {
      caseId,
      title: asNonEmptyString(formData, "title"),
      details: asOptionalString(formData, "details"),
      ownerName: asOptionalString(formData, "ownerName"),
      dueAt: asOptionalString(formData, "dueAt"),
      priority: asTaskPriority(asNonEmptyString(formData, "priority")),
    });

    revalidatePath("/hub");
    revalidatePath(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}

export async function updateTaskStatusAction(caseId: string, taskId: string, formData: FormData): Promise<void> {
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  try {
    await updateTaskStatusWorkflow(actor, {
      caseId,
      taskId,
      status: asTaskStatus(asNonEmptyString(formData, "status")),
    });

    revalidatePath("/hub");
    revalidatePath(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}

export async function deleteTaskAction(caseId: string, taskId: string): Promise<void> {
  const actor = await requireHubActor(`/hub/cases/${caseId}`);

  try {
    await deleteTaskWorkflow(actor, {
      caseId,
      taskId,
    });

    revalidatePath("/hub");
    revalidatePath(`/hub/cases/${caseId}`);
  } catch (error) {
    throwIfWorkflowError(error);
  }
}
