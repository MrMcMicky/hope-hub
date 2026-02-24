# HOPE Struktur und Produkt-Mapping (v1)

- Stand: 2026-02-24
- Zweck: Abbildung der realen HOPE-Organisation in persistente HOPE-Hub Workflows

## 1) Verifizierte Struktur (Online-Recherche)

Die Struktur von HOPE wird in der öffentlichen Kommunikation entlang der «4 B's» beschrieben:

- Begegnen
- Betreuen
- Beherbergen
- Beschäftigen

Quellen:

- https://www.hope-baden.ch/wer-wir-sind/
- https://www.hope-baden.ch/

Operative Angebotsbausteine (Auszug):

- Öffentliches Restaurant
- Streetwork
- Lebensmittelabgabe
- Soziale Beratungsstelle
- Wohnbegleitung / Umzugsbegleitung
- Notschlafstelle, Notpension, Wohnzentrum, Wohnexternat
- Tagesstruktur und Arbeitsintegration

Quellen:

- https://www.hope-baden.ch/streetwork/
- https://www.hope-baden.ch/lebensmittelabgabe/
- https://www.hope-baden.ch/soziale-beratungsstelle/
- https://www.hope-baden.ch/notschlafstelle-and-notpension/
- https://www.hope-baden.ch/wohnzentrum/
- https://www.hope-baden.ch/wohnexternat/
- https://www.hope-baden.ch/wohnbegleitung-und-umzugsbegleitung/
- https://www.hope-baden.ch/tagesstruktur/

Zusätzliche Grössenordnungen aus Jahresbericht (zur realistischen Seed-Kalibrierung):

- 346 beherbergte Menschen
- 182 Arbeitsplätze im Beschäftigungsbetrieb
- 65'590 Mittagessen
- 66'300 Gratissuppen

Quelle:

- https://www.hope-baden.ch/wp-content/uploads/2023/06/HOPE-Jahresbericht-2022_Ansicht.pdf

## 2) Produkt-Mapping in HOPE Hub

Die Organisation wird im Produkt über `programArea` + `offering` modelliert:

- `BEGEGNUNG` -> Öffentliches Restaurant, Lebensmittelabgabe, Streetwork
- `BETREUEN` -> Soziale Beratungsstelle, Wohnbegleitung / Umzugsbegleitung
- `BEHERBERGEN` -> Notschlafstelle, Notpension, Übergangswohnen, Wohnzentrum, Wohnexternat
- `BESCHAEFTIGEN` -> Tagesstruktur / Beschäftigung, Arbeitsintegration

Implementiert in:

- `src/lib/domain/hope-structure.ts`

## 3) Persistente Kern-Workflows

### 3.1 Fallführung (Case)

- Create: neue Fallakte inkl. Bereich, Angebot, Risiko, Datenschutz-Metadaten
- Read/List: Filter nach Status/Bereich/Suche
- Update: fachliche und datenschutzrelevante Felder inkl. Legal Hold

### 3.2 Aufenthalte (Stay)

- Check-in: Aufenthalt erfassen
- Check-out: Aufenthalt abschliessen
- Offene Aufenthalte fliessen in Belegungskennzahlen ein

### 3.3 Service-Ereignisse (ServiceEvent)

- Dokumentation von Interaktionen und Leistungen
- Optionaler Bezug zu einem Aufenthalt
- Voller CRUD (Create/Update/Delete) mit Audit-Ereignissen

### 3.4 Aufgabensteuerung (Task)

- Aufgaben anlegen
- Statuswechsel (`OPEN`, `IN_PROGRESS`, `DONE`)
- Löschen (mit Audit-Eintrag)

### 3.5 Audit

- Append-only Audit pro Fall mit Hash-Chain
- Ereignisse für Create/Update/Delete werden persistent gespeichert

### 3.6 Billing (InvoiceDraft / InvoiceLine)

- Rechnungsentwurf pro Fall und Zeitraum
- Automatische Positionen aus Aufenthalten und Service-Ereignissen
- Verknüpfung mit genehmigter Kostengutsprache inkl. Deckelungs-Logik
- Manuelle Positionen und Statusfluss (`DRAFT`, `READY`, `SUBMITTED`, `PAID`, `CANCELLED`)

### 3.7 Kostengutsprache (CostApproval)

- Persistenter Workflow pro Fall mit Referenznummer `CAP-YY-####`
- Statusfluss (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`)
- Verknüpfung mit Rechnungsentwürfen (`InvoiceDraft.costApprovalId`)
- CRUD in der Fallakte inkl. Audit-Ereignissen

### 3.8 Export (ExportRecipient / ExportPackage)

- Empfängerverzeichnis mit Schlüssel-Fingerprint
- Verschlüsselte Exportpakete pro Fall inkl. Hash
- Statusfluss (`DRAFT`, `READY`, `RELEASED`, `CANCELLED`) und Compliance-Prüfung via Share-Policy
- Downloadroute liefert verschlüsselte Payload nur bei `READY`/`RELEASED` und schreibt `EXPORT`-Audit-Ereignis
- Empfängerverzeichnis unterstützt CRUD (Löschen nur ohne Paket-Referenzen)

### 3.9 Compliance (Retention / Archivierung / Löschplanung)

- Retention-Berechnung aus Retention-Regel
- Retention-Review pro Fall inkl. `retentionStatus`
- Archivierung und Löschplanung mit Legal-Hold-Guardrails

### 3.10 Offline-Sync / Queue

- Persistenter Sync-Batch-Import über `/api/sync`
- Speicherung in `SyncClient` und `SyncEvent`
- Reconciliation-Workflow im UI über `Sync-Monitoring` (`/hub/sync`)

### 3.11 Reports

- Billing Journal CSV (`/api/reports/billing-journal`)
- Audit Report CSV (`/api/reports/audit`)
- Audit-Integrity CSV (`/api/reports/audit-integrity`)
- Occupancy CSV (`/api/reports/occupancy`)
- Open-Work CSV (`/api/reports/open-work`)
- Export-Liste CSV (`/api/reports/export-list`)

Implementiert in:

- `src/lib/domain/workflows.ts`
- `src/modules/audit/*`

## 4) UI-Abbildung

- Dashboard: `src/app/hub/page.tsx`
- Billing-Übersicht: `src/app/hub/billing/page.tsx`
- Export- und Compliance-Übersicht: `src/app/hub/exports/page.tsx`
- Sync-Monitoring: `src/app/hub/sync/page.tsx`
- Report-Hub: `src/app/hub/reports/page.tsx`
- Fallliste + Neuanlage: `src/app/hub/cases/page.tsx`
- Fallakte mit CRUD für Stay/ServiceEvent/Task/Kostengutsprache/Billing/Export/Compliance: `src/app/hub/cases/[caseId]/page.tsx`

## 5) Dokumentationspflicht (verbindlich)

Bei jeder Änderung an:

- Domänenmodell (`prisma/schema.prisma`)
- Workflow-Logik (`src/lib/domain/workflows.ts`)
- Angebotsstruktur (`src/lib/domain/hope-structure.ts`)

muss dieses Dokument aktualisiert werden (Abschnitt 1-4).
