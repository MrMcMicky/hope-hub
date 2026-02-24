#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POLICY_SQL="${PROJECT_ROOT}/prisma/policies/002_rls_baseline.sql"

if [ ! -f "$POLICY_SQL" ]; then
  echo "Policy file not found: $POLICY_SQL"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "${PROJECT_ROOT}/.env.local" ]; then
    set -a
    # shellcheck source=/dev/null
    source "${PROJECT_ROOT}/.env.local"
    set +a
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set."
  exit 1
fi

echo "Applying RLS policies from ${POLICY_SQL}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$POLICY_SQL"

echo "RLS baseline applied successfully."
