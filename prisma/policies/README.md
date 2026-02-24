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
- optional: `app.case_scope`

## Available Policy Packs

- `001_rls_templates.sql`: non-executable starter snippets
- `002_rls_baseline.sql`: executable MVP baseline policy set

## Apply Baseline Policies

```bash
cd /home/michael/webapps/hope-hub
./scripts/apply-rls-policies.sh
```

The script reads `DATABASE_URL` from environment or `.env.local`.

## Notes

Prisma remains the default query layer, but RLS-critical paths should use SQL with explicit context setup and transaction boundaries.
