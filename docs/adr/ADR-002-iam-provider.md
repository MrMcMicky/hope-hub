# ADR-002: IAM Provider Selection

- Status: Accepted
- Date: 2026-02-24
- Deciders: HOPE Hub engineering

## Context

HOPE Hub requires OIDC-based auth with MFA readiness, role claims, and low-friction on-prem operations. Two candidates were shortlisted:
- Keycloak
- Authentik

## Decision

Use Authentik as primary IAM provider for phase 0 and phase 1.

Why:
- lower operational footprint for MVP setup,
- straightforward OIDC provider configuration,
- good fit for self-hosted, small-team operations.

Keep a documented exit path to Keycloak if future enterprise IAM complexity demands it.

## Consequences

Positive:
- faster bootstrap for protected routes and role claim propagation,
- reduced IAM setup complexity in early implementation.

Trade-offs:
- migration effort exists if provider is switched later,
- claim mapping contract must stay stable across provider boundaries.

## Follow-up

- Define claim contract (`sub`, `email`, `roles`, optional `org_units`) in app auth layer.
- Wire OIDC login + callback handling in phase 0.
- Add test fixtures for role claims and denied-access cases.
