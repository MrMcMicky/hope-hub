#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ECOSYSTEM="/home/michael/webapps/ecosystem.config.js"
APP_NAME="hope-hub-prod"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 not found on PATH."
  exit 1
fi

cd "$PROJECT_ROOT"

npm run build
pm2 restart "$APP_NAME" || pm2 start "$ECOSYSTEM" --only "$APP_NAME"
pm2 save

curl -fsS http://127.0.0.1:8014/ >/dev/null

echo "Deployment successful: http://127.0.0.1:8014"
