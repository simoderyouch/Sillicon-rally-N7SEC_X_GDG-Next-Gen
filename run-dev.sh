#!/usr/bin/env sh
# Start the local Sillicon Rally stack: PostgreSQL, Spring Boot API, and React UI.
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

for command in docker mvn npm curl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Change its credentials before a real event."
fi

# The .env file uses simple KEY=value lines and is safe to load as shell variables.
set -a
. ./.env
set +a

: "${POSTGRES_DB:=sillicon_rally}"
: "${POSTGRES_USER:=sillicon}"
: "${POSTGRES_PASSWORD:=change-me}"
: "${ADMIN_EMAIL:=admin@sillicon-rally.local}"
: "${ADMIN_PASSWORD:=change-me-before-an-event}"

docker compose --env-file .env up -d postgres

printf 'Waiting for PostgreSQL'
attempt=0
until docker compose --env-file .env exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "\nPostgreSQL did not become ready." >&2
    exit 1
  fi
  printf '.'
  sleep 1
done
printf ' ready.\n'

(
  cd "$PROJECT_DIR/backend"
  SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5433/$POSTGRES_DB" \
  SPRING_DATASOURCE_USERNAME="$POSTGRES_USER" \
  SPRING_DATASOURCE_PASSWORD="$POSTGRES_PASSWORD" \
  ADMIN_EMAIL="$ADMIN_EMAIL" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  exec mvn spring-boot:run
) &
BACKEND_PID=$!

printf 'Waiting for API'
attempt=0
until curl --silent --fail --max-time 2 http://localhost:8080/api/v1/missions >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 45 ]; then
    echo "\nAPI did not start. Check the Spring Boot output above." >&2
    exit 1
  fi
  printf '.'
  sleep 1
done
printf ' ready.\n'

if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
  (cd "$PROJECT_DIR/frontend" && npm ci)
fi

echo "\nSillicon Rally is running:"
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:8080"
echo "Press Ctrl+C to stop the frontend and API. PostgreSQL remains available on port 5433."

(
  cd "$PROJECT_DIR/frontend"
  exec npm run dev -- --host 0.0.0.0
) &
FRONTEND_PID=$!

wait "$FRONTEND_PID"
