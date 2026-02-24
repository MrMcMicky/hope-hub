#!/usr/bin/env bash
set -euo pipefail

APP_NAME="hope-hub-prod"
APP_PORT="8014"
ECOSYSTEM="/home/michael/webapps/ecosystem.config.js"
PORT_MANAGER="/home/michael/scripts/port-manager.sh"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/"
PROJECT_ROOT="/home/michael/webapps/hope-hub"

usage() {
  cat <<'USAGE'
Usage: prod-server-manager.sh <command>

Commands:
  start      Start hope-hub production server via PM2
  stop       Stop hope-hub production server
  restart    Restart hope-hub production server
  status     Show PM2 status and port listener
  logs       Tail PM2 logs (default 200 lines)
  health     Check HTTP response on the prod server
  free       Kill any process listening on the prod port (8014)
USAGE
}

require_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "pm2 not found on PATH."
    exit 1
  fi
}

require_build() {
  if [ ! -f "${PROJECT_ROOT}/.next/BUILD_ID" ]; then
    echo "No production build found at ${PROJECT_ROOT}/.next/BUILD_ID"
    echo "Run: npm run build"
    exit 1
  fi
}

show_port_listener() {
  ss -tulpn 2>/dev/null | rg ":${APP_PORT}\\b" || true
}

check_port() {
  if [ ! -x "$PORT_MANAGER" ]; then
    echo "Port manager not found: $PORT_MANAGER"
    exit 1
  fi

  set +e
  "$PORT_MANAGER" check "$APP_PORT"
  local status=$?
  set -e

  if [ "$status" -eq 1 ]; then
    echo "Port $APP_PORT is in use:"
    show_port_listener
    exit 1
  fi
}

cmd_start() {
  require_pm2
  require_build
  check_port
  pm2 start "$ECOSYSTEM" --only "$APP_NAME"
  pm2 save
}

cmd_stop() {
  require_pm2
  pm2 stop "$APP_NAME" || true
}

cmd_restart() {
  require_pm2
  require_build
  pm2 restart "$APP_NAME" || pm2 start "$ECOSYSTEM" --only "$APP_NAME"
  pm2 save
}

cmd_status() {
  require_pm2
  pm2 status "$APP_NAME" || echo "$APP_NAME not found in PM2."
  show_port_listener
}

cmd_logs() {
  require_pm2
  pm2 logs "$APP_NAME" --lines "${LOG_LINES:-200}"
}

cmd_health() {
  curl -fsS "$HEALTH_URL" >/dev/null
  echo "OK: $HEALTH_URL"
}

cmd_free() {
  local pids
  pids=$(ss -tulpn 2>/dev/null | rg ":${APP_PORT}\\b" | rg -o 'pid=[0-9]+' | rg -o '[0-9]+' | sort -u | tr '\n' ' ')
  if [ -z "$pids" ]; then
    echo "No listener found on port $APP_PORT."
    exit 0
  fi
  echo "Killing listeners on $APP_PORT: $pids"
  kill $pids
}

case "${1:-}" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  restart) cmd_restart ;;
  status) cmd_status ;;
  logs) cmd_logs ;;
  health) cmd_health ;;
  free) cmd_free ;;
  *) usage; exit 1 ;;
esac
