# RLS Policy Conventions

This folder documents SQL policy rules that complement Prisma models.

## Baseline

- Every sensitive domain table has RLS enabled.
- Default behavior is deny-by-default.
- Access is granted only through explicit policies that use request context.

## Request Context Contract

Application code must set PostgreSQL settings per request before data access:

- `app.user_id`
- `app.user_role`
- `app.case_scope` (optional CSV/JSON list for assignment scope)

## Recommended Policy Split

- `SELECT` policies: read scope by role and case assignment.
- `INSERT/UPDATE/DELETE` policies: stricter role checks and legal-hold constraints.
- `AuditEvent`: append-only insert policy, no update/delete.

## Notes

Prisma remains the default query layer, but RLS-critical paths should use SQL with explicit context setup and transaction boundaries.

Starter templates live in `prisma/policies/001_rls_templates.sql`.
