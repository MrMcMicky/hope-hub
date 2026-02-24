# hope-hub

Next.js App für `hope-hub.online` mit getrennter Dev- und Prod-Umgebung.

## Foundation Status (Phase 0)

- Architektur- und Security-Entscheide sind als ADRs dokumentiert:
  - `docs/adr/ADR-001-foundation-architecture.md`
  - `docs/adr/ADR-002-iam-provider.md`
  - `docs/adr/ADR-003-export-encryption.md`
- Technisches Bootstrap ist angelegt:
  - `prisma/schema.prisma`
  - `prisma/migrations/`
  - `prisma/policies/README.md`
  - `src/modules/audit/`
  - `src/modules/authz/`
  - `src/app/api/sync/route.ts`

## Lokal entwickeln

```bash
npm install
npm run dev
```

## Datenbank (Prisma Bootstrap)

```bash
# Prisma Client generieren
npm run db:generate

# Lokale Migration entwickeln
npm run db:migrate:dev

# Migrationen auf Zielsystem anwenden
npm run db:migrate:deploy

# Migrationsstatus prüfen
npm run db:migrate:status
```

## OIDC Login (Authentik)

Erforderliche `.env` Variablen:

```bash
AUTHENTIK_ISSUER=https://auth.example.com/application/o/hope-hub/
AUTHENTIK_CLIENT_ID=...
AUTHENTIK_CLIENT_SECRET=...
# Optional:
AUTHENTIK_SCOPE="openid profile email groups"
```

Routen:

- Login Seite: `/auth/login`
- NextAuth Handler: `/api/auth/[...nextauth]`

Hinweis:
- `/api/sync` nutzt Session-basierte Actor-Daten (`id`, `roles`, optionale `assignmentCaseIds`) aus OIDC Claims.

## Demo Login (Prototype)

Für Demo-/Proposal-Termine kann ein Credentials-Login aktiviert werden:

```bash
DEMO_ADMIN_EMAIL=demo.admin@example.com
DEMO_ADMIN_PASSWORD=replace-with-strong-demo-password
DEMO_ADMIN_NAME="Demo Super Admin"
```

Routen:

- Login Seite: `/auth/login`
- Demo Cockpit (geschützt): `/hub`

Hinweis:
- Der Demo-Login ist nur für Prototyping gedacht und ersetzt kein produktives IAM.

## Ports (Server)

- Dev: `8013`
- Prod: `8014`

Port-Check:

```bash
/home/michael/scripts/port-manager.sh check 8013
/home/michael/scripts/port-manager.sh check 8014
```

## PM2 Betrieb

PM2-Definitionen liegen zentral in `/home/michael/webapps/ecosystem.config.js`:

- `hope-hub-dev` -> `next dev` auf Port `8013`
- `hope-hub-prod` -> `next start` auf Port `8014`

App-Skripte:

```bash
# Dev
./scripts/dev-server-manager.sh start
./scripts/dev-server-manager.sh status
./scripts/dev-server-manager.sh logs

# Prod
npm run build
./scripts/prod-server-manager.sh start
./scripts/prod-server-manager.sh status
./scripts/prod-server-manager.sh logs

# Deploy (build + restart prod)
./scripts/deploy-production.sh
```

## Ingress (Nginx + Cloudflare Tunnel)

- `dev.hope-hub.online` -> `http://localhost:8013`
- `hope-hub.online` -> `http://localhost:8014`
- `www.hope-hub.online` -> `http://localhost:8014`

Nginx vHosts: `/etc/nginx/sites-available/`
Cloudflare Tunnel: `/etc/cloudflared/config.yml`

## Hinweis

`.env*` Dateien sind in `.gitignore` und dürfen nicht committed werden.

## Sprachregel Deutsch (Schweiz)

Für deutsche Texte im Repo gilt verbindlich: Umlaute immer als `ä`, `ö`, `ü` schreiben; keine Umschreibung mit `ae`, `oe`, `ue` in Fliesstexten.

Details und Prüfablauf:

- `docs/de-ch-orthografie.md`
