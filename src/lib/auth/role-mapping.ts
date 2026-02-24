import type { ActorRole } from "@/modules/authz";

const DEFAULT_ROLE: ActorRole = "SHIFT_WORKER";

const DIRECT_ROLES: ActorRole[] = ["ADMIN", "SHIFT_LEAD", "SHIFT_WORKER", "AUDITOR", "BILLING", "SYSTEM"];

const EXTERNAL_ROLE_MAP: Record<string, ActorRole> = {
  HOPE_ADMIN: "ADMIN",
  HOPE_SHIFT_LEAD: "SHIFT_LEAD",
  HOPE_SHIFT_WORKER: "SHIFT_WORKER",
  HOPE_AUDITOR: "AUDITOR",
  HOPE_BILLING: "BILLING",
  ROLE_ADMIN: "ADMIN",
  ROLE_SHIFT_LEAD: "SHIFT_LEAD",
  ROLE_SHIFT_WORKER: "SHIFT_WORKER",
  ROLE_AUDITOR: "AUDITOR",
  ROLE_BILLING: "BILLING",
};

function asActorRole(value: string): ActorRole | undefined {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");

  if (DIRECT_ROLES.includes(normalized as ActorRole)) {
    return normalized as ActorRole;
  }

  const mapped = EXTERNAL_ROLE_MAP[normalized];
  if (mapped) return mapped;

  const pathTail = normalized.split("_").filter(Boolean).at(-1);
  if (pathTail === "ADMIN") return "ADMIN";
  if (pathTail === "LEAD") return "SHIFT_LEAD";
  if (pathTail === "WORKER") return "SHIFT_WORKER";
  if (pathTail === "AUDITOR") return "AUDITOR";
  if (pathTail === "BILLING") return "BILLING";

  return undefined;
}

function normalizeRoleList(values: string[]): ActorRole[] {
  const collected: ActorRole[] = [];

  for (const value of values) {
    const role = asActorRole(value);
    if (!role || collected.includes(role)) continue;
    collected.push(role);
  }

  return collected.length ? collected : [DEFAULT_ROLE];
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function rolesFromClaims(claims: Record<string, unknown>): ActorRole[] {
  const roleCandidates = [
    ...stringArray(claims.roles),
    ...stringArray(claims.groups),
    ...stringArray(claims["x-hub-roles"]),
  ];

  if (typeof claims.role === "string") {
    roleCandidates.push(claims.role);
  }

  return normalizeRoleList(roleCandidates);
}

export function rolesFromTokenLike(input: { roles?: unknown; role?: unknown }): ActorRole[] {
  const candidates: string[] = [];

  if (Array.isArray(input.roles)) {
    candidates.push(...input.roles.filter((entry): entry is string => typeof entry === "string"));
  }

  if (typeof input.role === "string") {
    candidates.push(input.role);
  }

  return normalizeRoleList(candidates);
}

export function caseIdsFromClaims(claims: Record<string, unknown>): string[] {
  const candidates = claims.case_ids ?? claims["x-hub-case-ids"];
  if (!Array.isArray(candidates)) return [];

  const unique: string[] = [];
  for (const value of candidates) {
    if (typeof value !== "string") continue;
    if (!value.trim()) continue;
    if (unique.includes(value)) continue;
    unique.push(value);
  }

  return unique;
}

export function caseIdsFromTokenLike(input: { assignmentCaseIds?: unknown }): string[] {
  if (!Array.isArray(input.assignmentCaseIds)) return [];

  const unique: string[] = [];
  for (const value of input.assignmentCaseIds) {
    if (typeof value !== "string") continue;
    if (!value.trim()) continue;
    if (unique.includes(value)) continue;
    unique.push(value);
  }

  return unique;
}
