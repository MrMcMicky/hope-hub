import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma, UserRole } from "@prisma/client";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
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

type SyncBatchInput = {
  clientRef: string;
  deviceLabel?: string;
  events: SyncEventInput[];
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

function isSyncBatchInput(value: unknown): value is SyncBatchInput {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.clientRef === "string" &&
    payload.clientRef.trim().length > 0 &&
    Array.isArray(payload.events) &&
    payload.events.every(isSyncEventInput) &&
    (payload.deviceLabel === undefined || typeof payload.deviceLabel === "string")
  );
}

function mapActorRoleToUserRole(roles: ActorRole[]): UserRole {
  const role = roles[0] ?? "SHIFT_WORKER";
  if (role === "SYSTEM") return "ADMIN";
  return role;
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

  if (!isSyncBatchInput(body)) {
    return NextResponse.json({ error: "invalid_events_payload" }, { status: 400 });
  }

  const clientRef = body.clientRef.trim();
  const deviceLabel = body.deviceLabel?.trim() || null;
  const events = body.events;
  if (!events.length) {
    return NextResponse.json({ error: "events_required" }, { status: 400 });
  }
  if (events.length > 500) {
    return NextResponse.json({ error: "too_many_events", limit: 500 }, { status: 400 });
  }

  for (const event of events) {
    const decision = authorize({
      actorId,
      roles,
      action: "sync:append",
      resource: {
        caseId: event.caseId,
        assignmentCaseIds,
      },
    });

    if (!decision.allowed) {
      return NextResponse.json(
        { error: "forbidden", reason: decision.reason, deniedCaseId: event.caseId },
        { status: 403 },
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { externalId: actorId },
      update: {
        email: session?.user?.email ?? "unknown@local.invalid",
        displayName: session?.user?.name ?? session?.user?.email ?? "Unbekannt",
        role: mapActorRoleToUserRole(roles),
        isActive: true,
      },
      create: {
        externalId: actorId,
        email: session?.user?.email ?? `${actorId}@local.invalid`,
        displayName: session?.user?.name ?? session?.user?.email ?? "Unbekannt",
        role: mapActorRoleToUserRole(roles),
        isActive: true,
      },
      select: { id: true },
    });

    const syncClient = await tx.syncClient.upsert({
      where: { clientRef },
      update: {
        userId: user.id,
        deviceLabel,
        lastSeenAt: new Date(),
      },
      create: {
        clientRef,
        userId: user.id,
        deviceLabel,
        lastSeenAt: new Date(),
      },
      select: { id: true, clientRef: true },
    });

    let inserted = 0;
    let duplicates = 0;
    const caseStats = new Map<string, { count: number; firstSequence: number; lastSequence: number }>();

    for (const event of events) {
      const existing = await tx.syncEvent.findUnique({
        where: {
          syncClientId_sequence: {
            syncClientId: syncClient.id,
            sequence: event.sequence,
          },
        },
        select: { id: true },
      });

      if (existing) {
        duplicates += 1;
        continue;
      }

      inserted += 1;
      await tx.syncEvent.create({
        data: {
          syncClientId: syncClient.id,
          caseId: event.caseId,
          sequence: event.sequence,
          eventType: event.eventType,
          payload: {
            ...event.payload,
            clientEventId: event.clientEventId,
            eventType: event.eventType,
          } as Prisma.InputJsonValue,
        },
      });

      const stats = caseStats.get(event.caseId);
      if (!stats) {
        caseStats.set(event.caseId, {
          count: 1,
          firstSequence: event.sequence,
          lastSequence: event.sequence,
        });
      } else {
        stats.count += 1;
        stats.firstSequence = Math.min(stats.firstSequence, event.sequence);
        stats.lastSequence = Math.max(stats.lastSequence, event.sequence);
      }
    }

    for (const [caseId, stats] of caseStats) {
      const previous = await tx.auditEvent.findFirst({
        where: { caseId },
        orderBy: [{ eventTs: "desc" }, { id: "desc" }],
        select: { eventHash: true },
      });

      const audit = buildAppendOnlyAuditEvent({
        caseId,
        action: "SYNC_APPEND",
        entityType: "SyncBatch",
        entityId: `${syncClient.clientRef}:${stats.firstSequence}-${stats.lastSequence}`,
        actorId: user.id,
        payload: {
          syncClientRef: syncClient.clientRef,
          acceptedEventCount: stats.count,
          firstSequence: stats.firstSequence,
          lastSequence: stats.lastSequence,
        },
        previousHash: previous?.eventHash,
      });

      await tx.auditEvent.create({
        data: {
          caseId: audit.caseId,
          action: audit.action,
          entityType: audit.entityType,
          entityId: audit.entityId,
          actorId: audit.actorId,
          eventTs: new Date(audit.eventTs),
          payload: audit.payload as Prisma.InputJsonValue,
          prevHash: audit.prevHash,
          eventHash: audit.eventHash,
        },
      });
    }

    return {
      syncClientRef: syncClient.clientRef,
      received: events.length,
      inserted,
      duplicates,
      pendingEvents: await tx.syncEvent.count({
        where: {
          syncClientId: syncClient.id,
          appliedAt: null,
        },
      }),
    };
  });

  return NextResponse.json(
    {
      status: "accepted",
      ...result,
    },
    { status: 202 },
  );
}
