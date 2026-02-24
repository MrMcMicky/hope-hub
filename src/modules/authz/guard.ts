import type { ActorRole, AuthzAction, AuthzContext, AuthzDecision } from "./types";

const ROLE_PERMISSIONS: Record<ActorRole, Set<AuthzAction>> = {
  ADMIN: new Set(["sync:append", "case:read", "case:update", "audit:append", "export:create", "billing:write", "compliance:write"]),
  SHIFT_LEAD: new Set(["sync:append", "case:read", "case:update", "audit:append", "billing:write", "compliance:write"]),
  SHIFT_WORKER: new Set(["sync:append", "case:read", "audit:append"]),
  AUDITOR: new Set(["case:read", "compliance:write"]),
  BILLING: new Set(["case:read", "export:create", "billing:write"]),
  SYSTEM: new Set(["sync:append", "case:read", "case:update", "audit:append", "export:create", "billing:write", "compliance:write"]),
};

function hasRolePermission(roles: ActorRole[], action: AuthzAction): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.has(action));
}

function canAccessCaseByAssignment(context: AuthzContext): boolean {
  const caseId = context.resource?.caseId;
  const assignmentCaseIds = context.resource?.assignmentCaseIds ?? [];

  if (!caseId) return true;
  if (context.roles.includes("ADMIN") || context.roles.includes("SYSTEM")) return true;
  if (context.roles.includes("AUDITOR") && context.action === "case:read") return true;

  return assignmentCaseIds.includes(caseId);
}

export function authorize(context: AuthzContext): AuthzDecision {
  if (!context.actorId) {
    return { allowed: false, reason: "missing_actor" };
  }

  if (!context.roles.length) {
    return { allowed: false, reason: "missing_roles" };
  }

  if (!hasRolePermission(context.roles, context.action)) {
    return { allowed: false, reason: "role_not_permitted" };
  }

  if (!canAccessCaseByAssignment(context)) {
    return { allowed: false, reason: "assignment_scope_denied" };
  }

  return { allowed: true };
}
