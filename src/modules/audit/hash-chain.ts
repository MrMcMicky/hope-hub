import { createHash } from "node:crypto";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`)
    .join(",")}}`;
}

export function computeAuditHash(input: {
  prevHash: string;
  caseId?: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  eventTs: string;
  payload: Record<string, unknown>;
}): string {
  const canonical = [
    input.prevHash,
    input.caseId ?? "",
    input.action,
    input.entityType,
    input.entityId,
    input.actorId,
    input.eventTs,
    stableStringify(input.payload),
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
}
