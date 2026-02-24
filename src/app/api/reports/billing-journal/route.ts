import { NextResponse } from "next/server";

import { getHubActorFromApiSession } from "@/lib/auth/api-session";
import { WorkflowError, listBillingJournalRows } from "@/lib/domain/workflows";
import { toCsv } from "@/lib/reports/csv";

export async function GET() {
  const actor = await getHubActorFromApiSession();
  if (!actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listBillingJournalRows(actor);
    const csv = toCsv(rows, [
      { header: "invoice_ref", get: (row) => row.invoiceRef },
      { header: "case_ref", get: (row) => row.caseRef },
      { header: "subject", get: (row) => row.subjectDisplayName },
      { header: "invoice_status", get: (row) => row.invoiceStatus },
      { header: "period_start", get: (row) => row.periodStart },
      { header: "period_end", get: (row) => row.periodEnd },
      { header: "line_source", get: (row) => row.lineSource },
      { header: "line_description", get: (row) => row.lineDescription },
      { header: "quantity", get: (row) => row.quantity },
      { header: "unit_price_cents", get: (row) => row.unitPriceCents },
      { header: "line_total_cents", get: (row) => row.lineTotalCents },
      { header: "occurred_at", get: (row) => row.occurredAt },
      { header: "created_at", get: (row) => row.createdAt },
    ]);

    const filename = `hope-billing-journal-${new Date().toISOString().slice(0, 10)}.csv`;

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
