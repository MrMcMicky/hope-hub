# ADR-001: Foundation Architecture for HOPE Hub

- Status: Accepted
- Date: 2026-02-24
- Deciders: HOPE Hub engineering

## Context

HOPE Hub needs an on-prem friendly MVP that can satisfy strict compliance constraints early:
- append-only auditability,
- policy-enforced data access,
- encrypted exports,
- offline event sync,
- fast operational delivery.

A split microservice setup would increase coordination and deployment overhead in phase 0.

## Decision

Use a modular monolith for phase 0 and phase 1:
- Frontend + BFF: Next.js App Router in this repository.
- Identity provider: external OIDC provider (see ADR-002).
- Data: PostgreSQL as primary system of record.
- Object storage: MinIO for encrypted document/export objects.
- Background jobs: Redis + BullMQ when async workloads are introduced.

Data access strategy is a hybrid:
- Prisma is the default data access layer.
- SQL-first access is mandatory for RLS-critical paths, policy setup, and audit-sensitive queries.

## Consequences

Positive:
- fast implementation path with strong reuse of existing stack patterns,
- clear path to enforce RLS and append-only audit without waiting for service decomposition,
- simpler operations during MVP ramp-up.

Trade-offs:
- strict module boundaries must be enforced inside one codebase,
- additional discipline is required to keep Prisma usage compatible with RLS policy expectations,
- selective SQL usage increases developer responsibility on query hygiene.

## Follow-up

- Add foundational schema and migrations with RLS-ready tables.
- Add authz and audit skeleton modules with deny-by-default behavior.
- Add sync API skeleton and harden it iteratively in phase 0.
