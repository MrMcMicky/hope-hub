export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "EXPORT"
  | "PERMISSION_CHANGE"
  | "SYNC_APPEND"
  | "LOGIN"
  | "LOGOUT";

export type AuditEventInput = {
  caseId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorId: string;
  payload: Record<string, unknown>;
  timestamp?: string;
  previousHash?: string;
};

export type AuditEventRecord = {
  caseId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorId: string;
  eventTs: string;
  payload: Record<string, unknown>;
  prevHash: string;
  eventHash: string;
};
