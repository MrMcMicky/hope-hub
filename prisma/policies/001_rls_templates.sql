-- Foundation RLS policy templates for HOPE Hub.
-- Apply and adapt in controlled rollout environments.

-- Request context helper functions
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text AS $$
  SELECT nullif(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_user_role() RETURNS text AS $$
  SELECT nullif(current_setting('app.user_role', true), '');
$$ LANGUAGE sql STABLE;

-- Example: allow ADMIN and SYSTEM roles to read Case rows.
-- CREATE POLICY case_select_admin_or_system
--   ON "Case"
--   FOR SELECT
--   USING (app_current_user_role() IN ('ADMIN', 'SYSTEM'));

-- Example: assignment-based read policy for shift workers.
-- CREATE POLICY case_select_assignment
--   ON "Case"
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1
--       FROM "CaseAssignment" ca
--       WHERE ca."caseId" = "Case"."id"
--         AND ca."userId" = app_current_user_id()
--         AND ca."revokedAt" IS NULL
--     )
--   );

-- Example: append-only policy for AuditEvent.
-- CREATE POLICY audit_event_insert
--   ON "AuditEvent"
--   FOR INSERT
--   WITH CHECK (app_current_user_id() IS NOT NULL);
