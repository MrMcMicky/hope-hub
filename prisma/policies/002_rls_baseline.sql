-- HOPE Hub RLS baseline (phase 0/1).
-- Apply in controlled rollout windows only.
-- Requires per-request context via:
--   set_config('app.user_id', '<id>', true)
--   set_config('app.user_role', '<role>', true)

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS text AS $$
  SELECT nullif(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app.current_user_role() RETURNS text AS $$
  SELECT nullif(current_setting('app.user_role', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app.is_privileged() RETURNS boolean AS $$
  SELECT app.current_user_role() IN ('ADMIN', 'SYSTEM');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app.case_access(target_case_id text) RETURNS boolean AS $$
  SELECT
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'AUDITOR', 'BILLING')
    OR EXISTS (
      SELECT 1
      FROM "CaseAssignment" ca
      WHERE ca."caseId" = target_case_id
        AND ca."userId" = app.current_user_id()
        AND ca."revokedAt" IS NULL
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app.case_write_access(target_case_id text) RETURNS boolean AS $$
  SELECT
    app.is_privileged()
    OR (
      app.current_user_role() = 'SHIFT_LEAD'
      AND EXISTS (
        SELECT 1
        FROM "CaseAssignment" ca
        WHERE ca."caseId" = target_case_id
          AND ca."userId" = app.current_user_id()
          AND ca."revokedAt" IS NULL
      )
    );
$$ LANGUAGE sql STABLE;

ALTER TABLE "Case" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentMeta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceDraft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExportPackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExportRecipient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncClient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncEvent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_select_policy ON "Case";
DROP POLICY IF EXISTS case_insert_policy ON "Case";
DROP POLICY IF EXISTS case_update_policy ON "Case";
DROP POLICY IF EXISTS case_delete_policy ON "Case";

CREATE POLICY case_select_policy
  ON "Case"
  FOR SELECT
  USING (app.case_access("id"));

CREATE POLICY case_insert_policy
  ON "Case"
  FOR INSERT
  WITH CHECK (app.current_user_role() IN ('ADMIN', 'SYSTEM', 'SHIFT_LEAD'));

CREATE POLICY case_update_policy
  ON "Case"
  FOR UPDATE
  USING (app.case_write_access("id"))
  WITH CHECK (app.case_write_access("id"));

CREATE POLICY case_delete_policy
  ON "Case"
  FOR DELETE
  USING (app.case_write_access("id") AND NOT "legalHold");

DROP POLICY IF EXISTS stay_select_policy ON "Stay";
DROP POLICY IF EXISTS stay_write_policy ON "Stay";
CREATE POLICY stay_select_policy
  ON "Stay"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY stay_write_policy
  ON "Stay"
  FOR ALL
  USING (app.case_write_access("caseId"))
  WITH CHECK (app.case_write_access("caseId"));

DROP POLICY IF EXISTS service_event_select_policy ON "ServiceEvent";
DROP POLICY IF EXISTS service_event_write_policy ON "ServiceEvent";
CREATE POLICY service_event_select_policy
  ON "ServiceEvent"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY service_event_write_policy
  ON "ServiceEvent"
  FOR ALL
  USING (app.case_write_access("caseId"))
  WITH CHECK (app.case_write_access("caseId"));

DROP POLICY IF EXISTS task_select_policy ON "Task";
DROP POLICY IF EXISTS task_write_policy ON "Task";
CREATE POLICY task_select_policy
  ON "Task"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY task_write_policy
  ON "Task"
  FOR ALL
  USING (app.case_write_access("caseId"))
  WITH CHECK (app.case_write_access("caseId"));

DROP POLICY IF EXISTS document_meta_select_policy ON "DocumentMeta";
DROP POLICY IF EXISTS document_meta_write_policy ON "DocumentMeta";
CREATE POLICY document_meta_select_policy
  ON "DocumentMeta"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY document_meta_write_policy
  ON "DocumentMeta"
  FOR ALL
  USING (app.case_write_access("caseId"))
  WITH CHECK (app.case_write_access("caseId"));

DROP POLICY IF EXISTS invoice_draft_select_policy ON "InvoiceDraft";
DROP POLICY IF EXISTS invoice_draft_write_policy ON "InvoiceDraft";
CREATE POLICY invoice_draft_select_policy
  ON "InvoiceDraft"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY invoice_draft_write_policy
  ON "InvoiceDraft"
  FOR ALL
  USING (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING', 'SHIFT_LEAD')
    AND app.case_access("caseId")
  )
  WITH CHECK (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING', 'SHIFT_LEAD')
    AND app.case_access("caseId")
  );

DROP POLICY IF EXISTS invoice_line_select_policy ON "InvoiceLine";
DROP POLICY IF EXISTS invoice_line_write_policy ON "InvoiceLine";
CREATE POLICY invoice_line_select_policy
  ON "InvoiceLine"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY invoice_line_write_policy
  ON "InvoiceLine"
  FOR ALL
  USING (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING', 'SHIFT_LEAD')
    AND app.case_access("caseId")
  )
  WITH CHECK (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING', 'SHIFT_LEAD')
    AND app.case_access("caseId")
  );

DROP POLICY IF EXISTS export_recipient_select_policy ON "ExportRecipient";
DROP POLICY IF EXISTS export_recipient_write_policy ON "ExportRecipient";
CREATE POLICY export_recipient_select_policy
  ON "ExportRecipient"
  FOR SELECT
  USING (app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING', 'SHIFT_LEAD', 'AUDITOR'));
CREATE POLICY export_recipient_write_policy
  ON "ExportRecipient"
  FOR ALL
  USING (app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING'))
  WITH CHECK (app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING'));

DROP POLICY IF EXISTS export_package_select_policy ON "ExportPackage";
DROP POLICY IF EXISTS export_package_write_policy ON "ExportPackage";
CREATE POLICY export_package_select_policy
  ON "ExportPackage"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY export_package_write_policy
  ON "ExportPackage"
  FOR ALL
  USING (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING', 'SHIFT_LEAD')
    AND app.case_access("caseId")
  )
  WITH CHECK (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'BILLING', 'SHIFT_LEAD')
    AND app.case_access("caseId")
  );

DROP POLICY IF EXISTS audit_event_select_policy ON "AuditEvent";
DROP POLICY IF EXISTS audit_event_insert_policy ON "AuditEvent";
CREATE POLICY audit_event_select_policy
  ON "AuditEvent"
  FOR SELECT
  USING (
    ("caseId" IS NULL AND app.current_user_role() IN ('ADMIN', 'SYSTEM', 'AUDITOR'))
    OR ("caseId" IS NOT NULL AND app.case_access("caseId"))
  );
CREATE POLICY audit_event_insert_policy
  ON "AuditEvent"
  FOR INSERT
  WITH CHECK (
    app.current_user_id() IS NOT NULL
    AND app.current_user_role() IN ('ADMIN', 'SYSTEM', 'SHIFT_LEAD', 'SHIFT_WORKER', 'BILLING')
    AND ("actorId" IS NULL OR "actorId" = app.current_user_id())
  );

DROP POLICY IF EXISTS sync_client_select_policy ON "SyncClient";
DROP POLICY IF EXISTS sync_client_write_policy ON "SyncClient";
CREATE POLICY sync_client_select_policy
  ON "SyncClient"
  FOR SELECT
  USING ("userId" = app.current_user_id() OR app.is_privileged());
CREATE POLICY sync_client_write_policy
  ON "SyncClient"
  FOR ALL
  USING ("userId" = app.current_user_id() OR app.is_privileged())
  WITH CHECK ("userId" = app.current_user_id() OR app.is_privileged());

DROP POLICY IF EXISTS sync_event_select_policy ON "SyncEvent";
DROP POLICY IF EXISTS sync_event_write_policy ON "SyncEvent";
CREATE POLICY sync_event_select_policy
  ON "SyncEvent"
  FOR SELECT
  USING (app.case_access("caseId"));
CREATE POLICY sync_event_write_policy
  ON "SyncEvent"
  FOR ALL
  USING (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'SHIFT_LEAD', 'SHIFT_WORKER')
    AND app.case_access("caseId")
  )
  WITH CHECK (
    app.current_user_role() IN ('ADMIN', 'SYSTEM', 'SHIFT_LEAD', 'SHIFT_WORKER')
    AND app.case_access("caseId")
  );
