import { NextResponse } from "next/server";

import { getHubActorFromApiSession } from "@/lib/auth/api-session";
import { WorkflowError, listAuditIntegrityRows } from "@/lib/domain/workflows";
import { toCsv } from "@/lib/reports/csv";

export async function GET() {
  const actor = await getHubActorFromApiSession();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listAuditIntegrityRows(actor);
    const csv = toCsv(rows, [
      { header: "case_ref", get: (row) => row.caseRef },
      { header: "chain_valid", get: (row) => row.chainValid },
      { header: "event_count", get: (row) => row.eventCount },
      { header: "broken_event_id", get: (row) => row.brokenEventId },
      { header: "last_event_ts", get: (row) => row.lastEventTs },
      { header: "reason", get: (row) => row.reason },
    ]);

    const filename = `hope-audit-integrity-${new Date().toISOString().slice(0, 10)}.csv`;

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
