import { expect, type Page, test } from "@playwright/test";

const DEMO_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? "";
const DEMO_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "";

if (!DEMO_EMAIL || !DEMO_PASSWORD) {
  throw new Error("DEMO_ADMIN_EMAIL und DEMO_ADMIN_PASSWORD müssen für E2E-Tests gesetzt sein.");
}

async function login(page: Page) {
  await page.goto("/auth/login?callbackUrl=%2Fhub");
  await page.getByLabel("E-Mail").fill(DEMO_EMAIL);
  await page.getByLabel("Passwort").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Als Demo Admin anmelden" }).click();
  await expect(page).toHaveURL(/\/hub$/);
}

test("Dashboard, Billing und Exportseiten sind erreichbar", async ({ page }) => {
  await login(page);

  await expect(page.getByRole("heading", { name: "Operations Cockpit" })).toBeVisible();

  await page.goto("/hub/billing");
  await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();

  await page.goto("/hub/exports");
  await expect(page.getByRole("heading", { name: "Exporte & Compliance" })).toBeVisible();
});

test("Fall-Workflow inkl. Billing und Export", async ({ page }) => {
  await login(page);

  await page.goto("/hub/cases");
  const suffix = String(Date.now()).slice(-6);
  const authorityName = `Sozialdienst E2E ${suffix}`;
  await page.getByLabel("Name / Bezeichnung").first().fill(`E2E Fall ${suffix}`);
  await page.getByRole("button", { name: "Fall erstellen" }).click();

  await expect(page).toHaveURL(/\/hub\/cases\/[a-z0-9]+$/);
  await expect(page.getByText(`E2E Fall ${suffix}`)).toBeVisible();

  await page.getByRole("button", { name: "Check-in erfassen" }).click();
  await expect(page.getByText("CHECKED_IN").first()).toBeVisible();

  await page.locator('input[name="eventType"]').first().fill(`E2E_EVENT_${suffix}`);
  await page.getByRole("button", { name: "Event speichern" }).click();
  await expect(page.getByText(`E2E_EVENT_${suffix}`).first()).toBeVisible();

  const serviceEventCard = page.locator("li", { hasText: `E2E_EVENT_${suffix}` }).first();
  await serviceEventCard.locator('input[name="eventType"]').first().fill(`E2E_EVENT_UPDATED_${suffix}`);
  await serviceEventCard.getByRole("button", { name: "Event aktualisieren" }).click();
  await expect(page.getByText(`E2E_EVENT_UPDATED_${suffix}`).first()).toBeVisible();

  const updatedServiceEventCard = page.locator("li", { hasText: `E2E_EVENT_UPDATED_${suffix}` }).first();
  await updatedServiceEventCard.getByRole("button", { name: "Event löschen" }).click();
  await expect(page.getByText(`E2E_EVENT_UPDATED_${suffix}`)).toHaveCount(0);

  await page.getByLabel("Titel").fill(`E2E Task ${suffix}`);
  await page.getByRole("button", { name: "Task anlegen" }).click();
  await expect(page.getByText(`E2E Task ${suffix}`)).toBeVisible();

  await page.locator('input[name="authorityName"]').first().fill(authorityName);
  await page.locator('input[name="approvedAmountCents"]').first().fill("55000");
  await page.getByRole("button", { name: "Kostengutsprache erfassen" }).click();
  await expect(page.getByText(/CAP-\d{2}-\d{4}/).first()).toBeVisible();

  const approvalCard = page.locator("li", { hasText: authorityName }).first();
  await approvalCard.locator('select[name="status"]').first().selectOption("SUBMITTED");
  await approvalCard.getByRole("button", { name: "Status setzen" }).click();

  await page.locator('select[name="costApprovalId"]').first().selectOption({ index: 1 });
  await page.getByRole("button", { name: "Rechnungsentwurf erstellen" }).click();
  await expect(page.getByText(/INV-\d{2}-\d{4}/).first()).toBeVisible();
  await expect(page.getByText(/Kostengutsprache:\s*CAP-\d{2}-\d{4}/).first()).toBeVisible();

  const recipientSelect = page.locator('select[name="recipientId"]').first();
  await recipientSelect.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Exportpaket erstellen" }).click();

  const exportCard = page.locator("li", { hasText: /EXP-\d{2}-\d{4}/ }).first();
  await expect(exportCard).toBeVisible();

  await exportCard.locator('select[name="status"]').first().selectOption("READY");
  await exportCard.getByRole("button", { name: "Exportstatus setzen" }).click();

  const exportCardUpdated = page.locator("li", { hasText: /EXP-\d{2}-\d{4}/ }).first();
  await expect(exportCardUpdated.getByText("READY")).toBeVisible();

  const downloadHref = await exportCardUpdated.locator('a[href*="/api/exports/"]').first().getAttribute("href");
  expect(downloadHref).toBeTruthy();
  const downloadResponse = await page.request.get(downloadHref!);
  expect(downloadResponse.status()).toBe(200);
  const downloadJson = await downloadResponse.json();
  expect(downloadJson?.envelope?.algorithm).toBe("aes-256-gcm");
});

test("Reports und Sync-API", async ({ page }) => {
  await login(page);

  const billingReport = await page.request.get("/api/reports/billing-journal");
  expect(billingReport.status()).toBe(200);
  const billingText = await billingReport.text();
  expect(billingText).toContain("invoice_ref");

  const auditReport = await page.request.get("/api/reports/audit");
  expect(auditReport.status()).toBe(200);
  const auditText = await auditReport.text();
  expect(auditText).toContain("event_ts");

  const auditIntegrityReport = await page.request.get("/api/reports/audit-integrity");
  expect(auditIntegrityReport.status()).toBe(200);
  const auditIntegrityText = await auditIntegrityReport.text();
  expect(auditIntegrityText).toContain("chain_valid");

  const occupancyReport = await page.request.get("/api/reports/occupancy");
  expect(occupancyReport.status()).toBe(200);
  const occupancyText = await occupancyReport.text();
  expect(occupancyText).toContain("site");

  const openWorkReport = await page.request.get("/api/reports/open-work");
  expect(openWorkReport.status()).toBe(200);
  const openWorkText = await openWorkReport.text();
  expect(openWorkText).toContain("queue_type");

  const exportListReport = await page.request.get("/api/reports/export-list");
  expect(exportListReport.status()).toBe(200);
  const exportListText = await exportListReport.text();
  expect(exportListText).toContain("export_ref");

  await page.goto("/hub/cases");
  const firstCaseLink = page.locator('a[href^="/hub/cases/"]').first();
  await expect(firstCaseLink).toBeVisible();
  const href = await firstCaseLink.getAttribute("href");
  expect(href).toBeTruthy();
  const caseId = href!.split("/").pop()!;

  const clientRef = `pw-sync-${Date.now()}`;
  const syncResponse = await page.request.post("/api/sync", {
    data: {
      clientRef,
      deviceLabel: "Playwright Tablet",
      events: [
        {
          clientEventId: `evt-${Date.now()}`,
          caseId,
          sequence: 1,
          eventType: "PLAYWRIGHT_SYNC_TEST",
          payload: {
            note: "sync integration test",
          },
        },
      ],
    },
  });

  expect(syncResponse.status()).toBe(202);
  const syncJson = await syncResponse.json();
  expect(syncJson.inserted).toBeGreaterThanOrEqual(1);

  await page.goto("/hub/sync");
  await expect(page.getByText(clientRef).first()).toBeVisible();
});
