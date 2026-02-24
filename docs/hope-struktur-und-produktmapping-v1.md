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

- Lebensmittelabgabe
- Soziale Beratungsstelle
- Notschlafstelle und Notpension
- Tagesstruktur / Beschäftigung

Quellen:

- https://www.hope-baden.ch/lebensmittelabgabe/
- https://www.hope-baden.ch/soziale-beratungsstelle/
- https://www.hope-baden.ch/notschlafstelle-and-notpension/

Zusätzliche Grössenordnungen aus Jahresbericht (zur realistischen Seed-Kalibrierung):

- 346 beherbergte Menschen
- 182 Arbeitsplätze im Beschäftigungsbetrieb
- 65'590 Mittagessen
- 66'300 Gratissuppen

Quelle:

- https://www.hope-baden.ch/wp-content/uploads/2023/06/HOPE-Jahresbericht-2022_Ansicht.pdf

## 2) Produkt-Mapping in HOPE Hub

Die Organisation wird im Produkt über `programArea` + `offering` modelliert:

- `BEGEGNUNG` -> Lebensmittelabgabe
- `BETREUEN` -> Soziale Beratungsstelle
- `BEHERBERGEN` -> Notschlafstelle, Notpension, Übergangswohnen
- `BESCHAEFTIGEN` -> Tagesstruktur / Beschäftigung

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

### 3.4 Aufgabensteuerung (Task)

- Aufgaben anlegen
- Statuswechsel (`OPEN`, `IN_PROGRESS`, `DONE`)
- Löschen (mit Audit-Eintrag)

### 3.5 Audit

- Append-only Audit pro Fall mit Hash-Chain
- Ereignisse für Create/Update/Delete werden persistent gespeichert

Implementiert in:

- `src/lib/domain/workflows.ts`
- `src/modules/audit/*`

## 4) UI-Abbildung

- Dashboard: `src/app/hub/page.tsx`
- Fallliste + Neuanlage: `src/app/hub/cases/page.tsx`
- Fallakte mit CRUD für Stay/ServiceEvent/Task: `src/app/hub/cases/[caseId]/page.tsx`

## 5) Dokumentationspflicht (verbindlich)

Bei jeder Änderung an:

- Domänenmodell (`prisma/schema.prisma`)
- Workflow-Logik (`src/lib/domain/workflows.ts`)
- Angebotsstruktur (`src/lib/domain/hope-structure.ts`)

muss dieses Dokument aktualisiert werden (Abschnitt 1-4).
