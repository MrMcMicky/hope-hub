export type ActorRole =
  | "ADMIN"
  | "SHIFT_LEAD"
  | "SHIFT_WORKER"
  | "AUDITOR"
  | "BILLING"
  | "SYSTEM";

export type AuthzAction =
  | "sync:append"
  | "case:read"
  | "case:update"
  | "audit:append"
  | "export:create";

export type AuthzResource = {
  caseId?: string;
  assignmentCaseIds?: string[];
};

export type AuthzContext = {
  actorId: string;
  roles: ActorRole[];
  action: AuthzAction;
  resource?: AuthzResource;
};

export type AuthzDecision =
  | { allowed: true }
  | { allowed: false; reason: string };
