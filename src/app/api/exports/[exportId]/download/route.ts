import { type Prisma, type UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorize } from "@/modules/authz";

import { getHubActorFromApiSession } from "@/lib/auth/api-session";
import { encryptExportPayload } from "@/lib/crypto/export-envelope";
import { prisma } from "@/lib/db/client";
import { buildAppendOnlyAuditEvent } from "@/modules/audit";

type ExportDownloadRouteProps = {
  params: Promise<{
    exportId: string;
  }>;
};

export async function GET(_: Request, { params }: ExportDownloadRouteProps) {
  const actor = await getHubActorFromApiSession();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { exportId } = await params;
  const exportPackage = await prisma.exportPackage.findUnique({
    where: { id: exportId },
    include: {
      case: {
        include: {
          stays: {
            select: {
              id: true,
              checkInAt: true,
              checkOutAt: true,
              status: true,
            },
            orderBy: { checkInAt: "desc" },
            take: 10,
          },
          serviceEvents: {
            select: {
              id: true,
              eventType: true,
              occurredAt: true,
              notes: true,
            },
            orderBy: { occurredAt: "desc" },
            take: 20,
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              dueAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
      recipient: {
        select: {
          label: true,
          organisation: true,
          keyFingerprint: true,
        },
      },
    },
  });

  if (!exportPackage) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!["READY", "RELEASED"].includes(exportPackage.status)) {
    return NextResponse.json({ error: "export_not_ready" }, { status: 409 });
  }

  if (exportPackage.expiresAt && exportPackage.expiresAt < new Date()) {
    return NextResponse.json({ error: "export_expired" }, { status: 410 });
  }

  const decision = authorize({
    actorId: actor.id,
    roles: actor.roles,
    action: "case:read",
    resource: {
      caseId: exportPackage.caseId,
      assignmentCaseIds: actor.assignmentCaseIds,
    },
  });

  if (!decision.allowed) {
    return NextResponse.json({ error: "forbidden", reason: decision.reason }, { status: 403 });
  }

  if (!exportPackage.recipient.keyFingerprint) {
    return NextResponse.json({ error: "recipient_key_missing" }, { status: 409 });
  }

  const secret = process.env.EXPORT_PACKAGE_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "encryption_key_missing" }, { status: 503 });
  }

  const payload = {
    exportRef: exportPackage.exportRef,
    generatedAt: new Date().toISOString(),
    case: {
      caseRef: exportPackage.case.caseRef,
      subjectDisplayName: exportPackage.case.subjectDisplayName,
      status: exportPackage.case.status,
      riskLevel: exportPackage.case.riskLevel,
      offering: exportPackage.case.offering,
      purpose: exportPackage.case.purpose,
      legalBasis: exportPackage.case.legalBasis,
      sharePolicy: exportPackage.case.sharePolicy,
      retentionStatus: exportPackage.case.retentionStatus,
    },
    stays: exportPackage.case.stays.map((stay) => ({
      id: stay.id,
      checkInAt: stay.checkInAt.toISOString(),
      checkOutAt: stay.checkOutAt?.toISOString() ?? null,
      status: stay.status,
    })),
    serviceEvents: exportPackage.case.serviceEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      notes: event.notes ?? "",
    })),
    tasks: exportPackage.case.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueAt: task.dueAt?.toISOString() ?? null,
    })),
  };

  const envelope = encryptExportPayload({
    payload,
    secret,
    recipientFingerprint: exportPackage.recipient.keyFingerprint,
  });

  const mapRole = (role: string): UserRole => {
    if (role === "SYSTEM") return "ADMIN";
    if (["ADMIN", "SHIFT_LEAD", "SHIFT_WORKER", "AUDITOR", "BILLING"].includes(role)) {
      return role as UserRole;
    }
    return "SHIFT_WORKER";
  };

  const actorUserId = await prisma.$transaction(async (tx) => {
    const role = mapRole(actor.roles[0] ?? "SHIFT_WORKER");

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
          role,
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
          role,
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
        role,
      },
      select: { id: true },
    });

    return created.id;
  });

  await prisma.$transaction(async (tx) => {
    const previous = await tx.auditEvent.findFirst({
      where: { caseId: exportPackage.caseId },
      orderBy: [{ eventTs: "desc" }, { id: "desc" }],
      select: { eventHash: true },
    });

    const event = buildAppendOnlyAuditEvent({
      caseId: exportPackage.caseId,
      action: "EXPORT",
      entityType: "ExportPackageDownload",
      entityId: exportPackage.id,
      actorId: actorUserId,
      payload: {
        exportRef: exportPackage.exportRef,
        recipient: exportPackage.recipient.label,
        recipientFingerprint: exportPackage.recipient.keyFingerprint,
        downloadAt: new Date().toISOString(),
      },
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
  });

  const packageName = `hope-export-${exportPackage.exportRef}.hopepkg.json`;

  return new NextResponse(
    JSON.stringify(
      {
        exportRef: exportPackage.exportRef,
        recipient: {
          label: exportPackage.recipient.label,
          organisation: exportPackage.recipient.organisation ?? "",
          keyFingerprint: exportPackage.recipient.keyFingerprint,
        },
        envelope,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename=\"${packageName}\"`,
      },
    },
  );
}
