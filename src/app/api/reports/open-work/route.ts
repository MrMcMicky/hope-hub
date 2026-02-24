import { NextResponse } from "next/server";

import { getHubActorFromApiSession } from "@/lib/auth/api-session";
import { WorkflowError, listOpenWorkReportRows } from "@/lib/domain/workflows";
import { toCsv } from "@/lib/reports/csv";

export async function GET() {
  const actor = await getHubActorFromApiSession();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listOpenWorkReportRows(actor);
    const csv = toCsv(rows, [
      { header: "queue_type", get: (row) => row.queueType },
      { header: "reference", get: (row) => row.reference },
      { header: "case_ref", get: (row) => row.caseRef },
      { header: "subject", get: (row) => row.subjectDisplayName },
      { header: "status", get: (row) => row.status },
      { header: "updated_at", get: (row) => row.updatedAt },
    ]);

    const filename = `hope-open-work-${new Date().toISOString().slice(0, 10)}.csv`;

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
