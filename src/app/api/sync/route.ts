import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { buildAppendOnlyAuditEvent } from "@/modules/audit";
import { authorize } from "@/modules/authz";
import type { ActorRole } from "@/modules/authz";

type SyncEventInput = {
  clientEventId: string;
  caseId: string;
  sequence: number;
  eventType: string;
  payload: Record<string, unknown>;
};

function isSyncEventInput(value: unknown): value is SyncEventInput {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;

  return (
    typeof event.clientEventId === "string" &&
    typeof event.caseId === "string" &&
    typeof event.sequence === "number" &&
    typeof event.eventType === "string" &&
    typeof event.payload === "object" &&
    event.payload !== null &&
    !Array.isArray(event.payload)
  );
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  const actorId = session?.user?.id ?? "";
  const roles = (session?.user?.roles ?? []) as ActorRole[];
  const assignmentCaseIds = session?.user?.assignmentCaseIds ?? [];

  if (!actorId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const events = (body as { events?: unknown })?.events;
  if (!Array.isArray(events) || !events.every(isSyncEventInput)) {
    return NextResponse.json({ error: "invalid_events_payload" }, { status: 400 });
  }

  const firstCaseId = events[0]?.caseId;
  const decision = authorize({
    actorId,
    roles,
    action: "sync:append",
    resource: {
      caseId: firstCaseId,
      assignmentCaseIds,
    },
  });

  if (!decision.allowed) {
    return NextResponse.json({ error: "forbidden", reason: decision.reason }, { status: 403 });
  }

  const auditPreview = buildAppendOnlyAuditEvent({
    caseId: firstCaseId,
    action: "SYNC_APPEND",
    entityType: "SyncBatch",
    entityId: events[0]?.clientEventId ?? "unknown",
    actorId,
    payload: {
      acceptedEventCount: events.length,
      firstSequence: events[0]?.sequence,
      lastSequence: events[events.length - 1]?.sequence,
    },
  });

  return NextResponse.json(
    {
      status: "accepted",
      accepted: events.length,
      auditPreview,
      note: "Sync storage and reconciliation will be implemented in phase 0.",
    },
    { status: 202 },
  );
}
