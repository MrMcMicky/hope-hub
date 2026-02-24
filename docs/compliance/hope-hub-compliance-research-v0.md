# HOPE Hub Compliance Research (v0)

- Date: 2026-02-23
- Scope: Switzerland + Canton Aargau obligations relevant for HOPE Hub architecture and MVP scope
- Note: This is a technical/compliance synthesis, not legal advice

## 1) Regulatory baseline relevant for HOPE

## 1.1 Swiss federal data protection

Core framework:
- DSG (Swiss Federal Act on Data Protection)
- DSV (Data Protection Ordinance)

High-impact implications for HOPE Hub:
- DSFA/DPIA readiness for high-risk processing and sensitive data scenarios
- Data breach process with clear thresholding and reporting path
- TOM controls must be demonstrable (access, logging, encryption, process controls)

## 1.2 Aargau public-task context (IDAG relevance)

If HOPE processes data in delegated public-service contexts (e.g. municipal/cantonal service agreements), IDAG-level expectations can apply contractually and operationally.

Implications:
- Data minimization and purpose limitation must be enforceable in-system
- Processor/sub-processor governance and auditability are mandatory
- Incident reporting and responsibilities must be contract-ready

## 1.3 Social-work confidentiality and disclosure logic

Operational reality requires explicit tracking of:
- legal basis per data object
- consent/release scope and expiry
- disclosure constraints per recipient class
- source and handling constraints for third-party protected data

Without this, legally safe handover/export decisions are not reliably automatable.

## 1.4 Aargau AVB benchmark obligations

Two architecture-critical constraints:
- For highly sensitive data transfer, payload itself must be encrypted; TLS alone is not sufficient.
- Retention can require long-lived archival policy (up to 100th year benchmark for client data in referenced AVB context).

## 2) Mandatory product capabilities derived from above

1. Legal metadata as first-class fields
- `data_class`, `purpose`, `legal_basis`, `share_policy`, `retention_rule`

2. Enforceable access model
- RBAC + ABAC + Assignment model
- deny-by-default API + DB policy-backed restrictions

3. Export governance
- export policy check before materialization
- recipient key directory + key validity windows
- payload encryption artifact + immutable export audit

4. Retention and legal hold
- retention rules per object type
- legal hold flag blocks deletion/purge
- archive/export modes with manifest traceability

5. Incident and DSFA operations
- DSFA checklist + decision log template
- incident runbook with internal and external reporting paths

## 3) Compliance-to-architecture mapping

- Requirement: least-privilege access
  - Architecture: OIDC IAM, role claims, ABAC evaluator, PostgreSQL RLS

- Requirement: traceability and supervisory evidence
  - Architecture: append-only `AuditEvent`, hash-chain anchors, signed export manifests

- Requirement: safe transfer to authorities/payers
  - Architecture: encrypted export package (`.age` or `.pgp`) + recipient key registry

- Requirement: long retention windows
  - Architecture: retention scheduler + archive tier + legal hold state

- Requirement: breach handling readiness
  - Architecture: immutable logs, anomaly alerts, incident playbook, forensics-friendly event IDs

## 4) MVP guardrails (non-negotiable)

- No production use without:
  - MFA-enabled IAM
  - policy-aware data access path
  - export payload encryption for sensitive transfers
  - audit capture for create/update/delete/export/permission change
  - backup + restore test evidence

## 5) Suggested next documentation artifacts

- `docs/compliance/dsfa-checkliste.md`
- `docs/compliance/incident-runbook.md`
- `docs/compliance/export-policy-and-encryption.md`
- `docs/compliance/retention-and-legal-hold.md`

## 6) Sources

- DSG: `https://www.fedlex.admin.ch/eli/cc/2022/491/de`
- DSV: `https://www.fedlex.admin.ch/eli/cc/2022/568/de`
- EDOEB DSFA: `https://www.edoeb.admin.ch/de/datenschutz-folgenabschaetzung`
- EDOEB data breach guideline: `https://www.edoeb.admin.ch/dam/de/sd-web/T64CAUyvAMcF/1_2%20Leitfaden%20des%20ED%C3%96B%20betreffend%20die%20Meldung%20von%20Datensicherheitsverletzungen%20und%20Information%20der%20Betroffenen%20nach%20Art.%2024%20DSG_DE.pdf`
- IDAG AG: `https://gesetzessammlungen.ag.ch/data/150.700`
- AG AVB: `https://www.ag.ch/media/kanton-aargau/bks/behindertenbetreuung/einrichtungen/bksshw-avb-def.pdf`
- AG quality/oversight concept: `https://www.ag.ch/media/kanton-aargau/bks/behindertenbetreuung/einrichtungen/konzept-qualitaet-und-aufsicht-fuer-bewilligte-einrichtungen-und-daf.pdf`
- AG quality standards: `https://www.ag.ch/media/kanton-aargau/bks/behindertenbetreuung/einrichtungen/aargauer-qualitaetsstandards-fuer-einrichtungen-mit-betriebsbewilligung-fuer-erwachsene-menschen-mit-behinderungen.pdf`
