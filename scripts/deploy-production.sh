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

for attempt in {1..20}; do
  if curl -fsS http://127.0.0.1:8014/ >/dev/null; then
    echo "Deployment successful: http://127.0.0.1:8014"
    exit 0
  fi
  sleep 1
done

echo "Deployment failed: health check on http://127.0.0.1:8014 did not pass in time."
exit 1
