import { NextResponse } from "next/server";

import { getHubActorFromApiSession } from "@/lib/auth/api-session";
import { WorkflowError, listAuditReportRows } from "@/lib/domain/workflows";
import { toCsv } from "@/lib/reports/csv";

export async function GET() {
  const actor = await getHubActorFromApiSession();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listAuditReportRows(actor);
    const csv = toCsv(rows, [
      { header: "event_ts", get: (row) => row.eventTs },
      { header: "case_ref", get: (row) => row.caseRef },
      { header: "action", get: (row) => row.action },
      { header: "entity_type", get: (row) => row.entityType },
      { header: "entity_id", get: (row) => row.entityId },
      { header: "actor", get: (row) => row.actor },
      { header: "payload_json", get: (row) => row.payloadJson },
    ]);

    const filename = `hope-audit-report-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error) {
    if (error instanceof WorkflowError && error.code === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
