import { computeAuditHash } from "./hash-chain";
import type { AuditEventInput, AuditEventRecord } from "./types";

export function buildAppendOnlyAuditEvent(input: AuditEventInput): AuditEventRecord {
  const eventTs = input.timestamp ?? new Date().toISOString();
  const prevHash = input.previousHash ?? "GENESIS";

  const eventHash = computeAuditHash({
    prevHash,
    caseId: input.caseId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId,
    eventTs,
    payload: input.payload,
  });

  return {
    caseId: input.caseId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId,
    eventTs,
    payload: input.payload,
    prevHash,
    eventHash,
  };
}
