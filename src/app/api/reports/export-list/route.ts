import { NextResponse } from "next/server";

import { getHubActorFromApiSession } from "@/lib/auth/api-session";
import { WorkflowError, listExportListReportRows } from "@/lib/domain/workflows";
import { toCsv } from "@/lib/reports/csv";

export async function GET() {
  const actor = await getHubActorFromApiSession();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listExportListReportRows(actor);
    const csv = toCsv(rows, [
      { header: "export_ref", get: (row) => row.exportRef },
      { header: "case_ref", get: (row) => row.caseRef },
      { header: "subject", get: (row) => row.subjectDisplayName },
      { header: "recipient", get: (row) => row.recipient },
      { header: "status", get: (row) => row.status },
      { header: "created_at", get: (row) => row.createdAt },
      { header: "updated_at", get: (row) => row.updatedAt },
      { header: "released_at", get: (row) => row.releasedAt },
    ]);

    const filename = `hope-export-list-${new Date().toISOString().slice(0, 10)}.csv`;

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
