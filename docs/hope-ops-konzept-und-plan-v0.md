# HOPE Hub - Konzept und Umsetzungsplan (v0)

- Status: Draft v0 (Startdokument)
- Stand: 2026-02-23
- Kontext: Erste Arbeitsfassung auf Basis der gelieferten Architektur-Spezifikation v1
- Ziel: Von "Next.js Grundsetup" zu einem auditfaehigen, offline-faehigen, on-prem MVP

Erweiterungen in diesem Stand:
- Design-/Brand-Research aus `hope-baden.ch` aufgenommen
- Compliance-Vertiefung CH/AG als separates Research-Dokument aufgenommen

## 1) Ausgangslage

Dieses Repo (`hope-hub`) ist aktuell ein schlankes Next.js-16-Startprojekt ohne fachliche Module, ohne IAM, ohne Datenmodell, ohne API, ohne Offline-Sync und ohne Compliance-Mechanismen.

Aktueller Stand im Repo:
- Laufzeit/Build: `package.json` (Next 16.1.6, React 19, eslint)
- PM2/Nginx Betriebsbasis: `README.md`, `scripts/dev-server-manager.sh`, `scripts/prod-server-manager.sh`, `scripts/deploy-production.sh`
- App: statische Seite unter `src/app/page.tsx`

## 2) Fit/Gap-Vergleich mit bestehenden Next.js Projekten

### 2.1 Wiederverwendbare Muster (stark)

1. `church-nextjs`
- Stark in Auth + DB + Queue + PWA + Docker/Ops.
- Relevante Referenzen:
  - NextAuth Route: `webapps/church-nextjs/src/app/api/auth/[...nextauth]/route.ts`
  - DB Layer (PG, resiliente Query-Utilities): `webapps/church-nextjs/src/lib/db.ts`
  - Background Jobs (BullMQ): `webapps/church-nextjs/src/lib/queue.ts`
  - Service Worker/PWA Provider: `webapps/church-nextjs/public/sw.js`, `webapps/church-nextjs/src/components/pwa/EnhancedPWAProvider.tsx`
  - Docker + Deploy: `webapps/church-nextjs/docker-compose.yml`, `webapps/church-nextjs/deploy-production.sh`

2. `maxsfloors-shop`
- Stark in rollenbasierter Auth-Integration und Prisma-Basismuster.
- Relevante Referenzen:
  - Auth-Konfiguration: `webapps/maxsfloors-shop/lib/auth.ts`
  - NextAuth API Route: `webapps/maxsfloors-shop/app/api/auth/[...nextauth]/route.ts`
  - Prisma Client Singleton: `webapps/maxsfloors-shop/lib/prisma.ts`
  - Domainen in Prisma-Schema: `webapps/maxsfloors-shop/prisma/schema.prisma`

3. `taize-dev`
- Stark in PM2/Serverbetrieb + custom auth/session + rate-limit.
- Relevante Referenzen:
  - Admin Auth/Session: `webapps/taize-dev/src/lib/auth.ts`
  - Login Route mit Rate Limit: `webapps/taize-dev/src/app/api/admin/login/route.ts`
  - Redis Rate Limiter: `webapps/taize-dev/src/lib/rate-limit.ts`
  - Betriebsdokumentation PM2/Tunnel: `webapps/taize-dev/README.md`

### 2.2 Muster, die wir bewusst nicht uebernehmen

1. `in-or-out`
- Kein belastbares IAM/RBAC fuers HOPE-Setting.
- Public API/Socket Flows sind fuer Compliance- und Audit-Anforderungen zu offen.
- Relevante Referenzen:
  - Custom Socket Server: `webapps/in-or-out/server.js`
  - API ohne fachliches IAM: `webapps/in-or-out/src/app/api/game/start/route.ts`

### 2.3 Fazit Vergleich

- Die Bausteine fuer HOPE Hub existieren verteilt in eurem Bestand.
- Es fehlt aber bisher nirgends die volle Kombination aus:
  - Offline Event-Sync,
  - striktem ABAC/RLS,
  - Export-Payload-Verschluesselung,
  - Retention/Legal-Hold,
  - revisionsfester Audit-Kette.

## 3) Extern validierte Leitplanken (Research)

1. Next.js PWA Guide (aktuell auf 16.1.6 docs, Updatehinweis 2026-02-20)
- Manifest + Service Worker + Push/Background-Patterns sind mit App Router sauber abbildbar.
- Quelle: https://nextjs.org/docs/app/guides/progressive-web-apps

2. Next.js Security Headers
- HSTS und weitere Header sind nativ ueber `next.config` Headers konfigurierbar.
- Quelle: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

3. PostgreSQL RLS
- RLS ist table-nativ, default-deny greift ohne Policies.
- Quelle: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

4. Keycloak/Authentik OIDC
- Beide sind fuer OIDC-Provider-Rolle robust nutzbar.
- Quellen:
  - Keycloak OIDC: https://www.keycloak.org/securing-apps/oidc-layers
  - Authentik OAuth2/OIDC: https://docs.goauthentik.io/add-secure-apps/providers/oauth2/

5. MinIO SSE
- SSE-KMS wird als bevorzugte Variante dokumentiert; at-rest Verschluesselung ist compliance-relevant.
- Quelle: https://docs.min.io/enterprise/aistor-object-store/installation/linux/server-side-encryption/

6. AVB Aargau 2026 (von dir referenziert, gegen PDF geprueft)
- Besonders schuetzenswerte Daten: Payload selbst verschluesseln, TLS alleine reicht nicht.
- Archivregel: Klientendaten bis 100. Altersjahr, Verwaltungsakten 10 Jahre und danach Staatsarchiv anbieten.
- Quelle: https://www.ag.ch/media/kanton-aargau/bks/behindertenbetreuung/einrichtungen/bksshw-avb-def.pdf

7. EDOEB
- DSFA bei potenziell hohem Risiko.
- Data-Breach Leitfaden mit Fokus auf "voraussichtlich hohes Risiko".
- Quellen:
  - https://www.edoeb.admin.ch/de/datenschutz-folgenabschaetzung
  - https://www.edoeb.admin.ch/de/leitfaden-data-breach

## 3.1 Vertiefende Research-Dokumente im Repo

- Compliance Vertiefung (CH/AG): `docs/compliance/hope-hub-compliance-research-v0.md`
- Design-/Style-Audit der HOPE Website: `docs/design/hope-website-style-audit-v0.md`
- Design-System Leitlinien fuer Produkt-UI: `docs/design/hope-hub-design-system-v0.md`
- Runtime Tokens fuer UI-Implementierung: `src/app/tokens.css`
- Gesicherte Brand Assets: `docs/design/assets/hope-logo-inline-2026-02-23.svg`, `docs/design/assets/hope-favicon-2026-02-23.avif`

## 4) Zielarchitektur fuer `hope-hub` (MVP-tauglich)

## 4.1 Architekturentscheidung (v0)

Empfehlung fuer Phase 0-1:
- Frontend/BFF: Next.js App Router im bestehenden Repo
- IAM: externer OIDC Provider (Keycloak oder Authentik)
- Daten: PostgreSQL (RLS + Audit + Event Store)
- Dokumente/Exports: MinIO
- Jobs: Redis + BullMQ (mindestens fuer Export, Retention, Reporting-Jobs)

Warum so:
- Hohe Wiederverwendung aus `church-nextjs` + `taize-dev`.
- Schnellster Weg zu MVP ohne sofortigen Multi-Service-Overhead.
- Trotzdem sauber auf spaetere Service-Aufspaltung vorbereitbar.

## 4.2 Fachkern (v1)

- Event-first fuer Offline Sync (append-only Client Events)
- Materialisierte Read Models fuer schnelle Schichtscreens
- Pflicht-Metadaten je Datensatz:
  - `data_class`
  - `purpose`
  - `legal_basis`
  - `share_policy`

## 4.3 Security Baseline (nicht verhandelbar)

- MFA via IAM
- API deny-by-default
- DB RLS fuer `Case`, `Stay`, `ServiceEvent`, `DocumentMeta`
- Audit append-only + Hash-Chain pro Case
- Export nur mit legal basis + share policy + payload encryption
- Retention + legal hold policy engine

## 5) Repo-Zielstruktur (Start fuer Implementierung)

```text
hope-hub/
  docs/
    hope-ops-konzept-und-plan-v0.md
    design/
      hope-website-style-audit-v0.md
      assets/
        hope-logo-inline-2026-02-23.svg
    compliance/
      hope-hub-compliance-research-v0.md
      dsfa-checkliste.md
      incident-runbook.md
      retention-policy.md
    adr/
      ADR-001-architektur.md
      ADR-002-iam-provider.md
      ADR-003-export-encryption.md
  prisma/
    schema.prisma
    migrations/
    policies/
  src/
    app/
      (ui routes)
      api/
        sync/route.ts
        exports/route.ts
        billing/route.ts
        reports/route.ts
    modules/
      case/
      stay/
      service-event/
      cost-approval/
      billing/
      export/
      audit/
      authz/
    lib/
      db/
      auth/
      crypto/
      offline/
      validation/
  worker/
    src/
      export-worker.ts
      retention-worker.ts
      report-worker.ts
```

Hinweis: `worker/` kann optional spaeter ausgelagert werden. Startweise kann er auch als interner Prozess laufen.

## 6) Phasenplan (v0)

## Phase 0 - Foundation (P0, ca. 2-3 Wochen)

Ziele:
- Technische Leitplanken und Compliance-Basis setzen.

Arbeitspakete:
1. ADRs + Repo-Struktur + CI (lint, test, build)
2. OIDC Login + MFA Flows (IAM angebunden)
3. Grundrollen + Authorization Skeleton (RBAC/ABAC)
4. PostgreSQL Setup + erste RLS Policies
5. AuditEvent Basismodell + append-only write path
6. DSFA Checkliste + Incident Runbook + Logging Baseline
7. UI Token Baseline aus HOPE Brand (Farben/Schriften/Abstaende) als `tokens`-Dokument

Abnahme:
- Login mit MFA aktiv
- API deny-by-default aktiv
- Erste RLS Policies aktiv
- Audit Events fuer create/update/export vorhanden
- Brand-konforme UI-Basis (Design Tokens + Logo Assets) im Repo dokumentiert

## Phase 1 - MVP Vertical Slice (P0, ca. 4-7 Wochen)

Ziele:
- "Stay + Kostengutsprache + sichere Uebergabe + Billing Entwurf" produktionsnah bereit.

Arbeitspakete:
1. Case/Person minimal + Stay + Check-in/out
2. Offline Queue (IndexedDB) + Sync API
3. ServiceEvent + CostApproval
4. InvoiceDraft + Journal CSV Export
5. Secure Export Package (payload encrypted) + recipient key directory
6. Basisreports: Belegung, offene Drafts, Exportliste

Abnahme:
- Offline Check-in/out + Sync stabil
- InvoiceDraft aus ServiceEvent+CostApproval generierbar
- Export nur verschluesselt + voll auditiert

## Phase 2 - Hardening & Betrieb (P0/P1, ca. 2-4 Wochen)

Ziele:
- Betriebssicherheit und Nachweisfaehigkeit auf Produktionsniveau.

Arbeitspakete:
1. Retention Engine + Legal Hold
2. Backup/WAL/Restore-Test dokumentiert
3. Monitoring + Alerts (auth anomalies, export spikes, backup failures)
4. Audit Report/Export fuer Leitung/QM

Abnahme:
- Restore-Test erfolgreich dokumentiert
- Retention-Regeln aktiv
- Alerting aktiv

## 7) Konkreter Start-Backlog fuer die naechste Umsetzungsrunde

1. Architekturentscheid finalisieren
- IAM: Keycloak vs Authentik
- Exportformat: age vs PGP
- DB Access: Prisma-only vs Prisma + SQL layer fuer RLS-kritische Queries

2. Technisches Bootstrap im Repo
- `docs/adr/*` anlegen
- `prisma/schema.prisma` + initial migrations
- `src/modules/audit` + `src/modules/authz` skeleton
- `src/app/api/sync/route.ts` skeleton

3. Security/Compliance zuerst
- Klassifizierungsfelder als Pflicht im Domainmodell
- AuditEvent write path fuer kritische Aktionen
- Export policy guard (legal basis + share policy)

4. Designmaterial nutzbar machen
- gemeinsame `tokens` Datei fuer Frontend-Implementierung anlegen
- erste App-Shell (Header, Navigation, Sidebar) an HOPE Brand anlehnen
- Kontrast-/Accessibility Check der Primarfarben (WCAG AA)

## 8) Offene Fragen fuer deine naechsten Prompts

1. Priorisierter IAM Provider jetzt schon festlegen?
2. Soll v1 Exporte primar `age` nutzen oder PGP wegen Partner-Kompatibilitaet?
3. Welche Schicht-Rollen muessen im MVP zwingend offline lesen duerfen?
4. Soll `worker/` direkt separater Prozess sein oder erst in Phase 2?
5. Wie stark soll HOPE Hub visuell am Marketingauftritt bleiben vs. eigener "Operations UI" Stil?

## 9) Risikoindex (frueh aktiv adressieren)

- RLS/ABAC zu eng oder zu weit: hoher Impact auf Datenschutz und Bedienbarkeit
- Offline leakage: ohne starke lokale Verschluesselung nicht akzeptabel
- Export-Key-Management: organisatorisch und technisch zusammen designen
- Retention zu spaet: fuehrt zu teuren Datenmigrationen
- Fehlende Tests: bei Compliance-Systemen untragbar

---

Dieses Dokument ist absichtlich als Arbeitsdokument geschrieben und wird mit deinen naechsten Inputs iterativ in v1 ueberfuehrt.
