# ADR-003: Export Payload Encryption Standard

- Status: Accepted
- Date: 2026-02-24
- Deciders: HOPE Hub engineering

## Context

Compliance requirements for sensitive transfer demand payload encryption beyond transport security. Partners may have mixed tooling support.

Options:
- age only
- PGP only
- age default with PGP fallback

## Decision

Use `age` as the primary export encryption format.

Add PGP fallback support for partner interoperability where required by recipient capabilities.

## Consequences

Positive:
- simpler and safer default operational path,
- retains compatibility path for legacy partner workflows.

Trade-offs:
- dual-key registry metadata is needed,
- export policy logic must choose target format deterministically.

## Follow-up

- Introduce recipient key directory with format metadata.
- Record encryption format and recipient key fingerprint in immutable audit events.
- Add conformance tests for `age` default and PGP fallback behavior.
