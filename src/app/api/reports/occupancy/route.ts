import { NextResponse } from "next/server";

import { getHubActorFromApiSession } from "@/lib/auth/api-session";
import { WorkflowError, listOccupancyReportRows } from "@/lib/domain/workflows";
import { toCsv } from "@/lib/reports/csv";

export async function GET() {
  const actor = await getHubActorFromApiSession();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listOccupancyReportRows(actor);
    const csv = toCsv(rows, [
      { header: "site", get: (row) => row.site },
      { header: "offering", get: (row) => row.offering },
      { header: "capacity", get: (row) => row.capacity },
      { header: "occupied", get: (row) => row.occupied },
      { header: "occupancy_rate_percent", get: (row) => row.occupancyRatePercent },
    ]);

    const filename = `hope-occupancy-${new Date().toISOString().slice(0, 10)}.csv`;

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
