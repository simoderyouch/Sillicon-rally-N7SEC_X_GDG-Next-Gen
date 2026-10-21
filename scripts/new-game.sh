#!/usr/bin/env sh
# Generate an isolated frontend game folder and its matching draft mission migration.
set -eu

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <game-slug> <game-title> <max-score>" >&2
  exit 1
fi

SLUG=$1
TITLE=$2
MAX_SCORE=$3
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

case "$SLUG" in
  *[!a-z0-9-]* | "") echo "Game slug must use lowercase letters, numbers, and hyphens only." >&2; exit 1 ;;
esac
case "$MAX_SCORE" in
  *[!0-9]* | "") echo "Max score must be a non-negative integer." >&2; exit 1 ;;
esac

TARGET="$ROOT/frontend/src/games/$SLUG"
if [ -e "$TARGET" ]; then
  echo "Game folder already exists: $TARGET" >&2
  exit 1
fi
if ! command -v uuidgen >/dev/null 2>&1; then
  echo "uuidgen is required to create the mission migration." >&2
  exit 1
fi

cp -R "$ROOT/frontend/src/games/_template" "$TARGET"
find "$TARGET" -type f -exec sed -i "s/__GAME_SLUG__/$SLUG/g" {} +

TIMESTAMP=$(date +%Y%m%d%H%M%S)
SAFE_SLUG=$(printf '%s' "$SLUG" | tr '-' '_')
MIGRATION="$ROOT/backend/src/main/resources/db/migration/V${TIMESTAMP}__add_${SAFE_SLUG}_mission.sql"
MISSION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
sed \
  -e "s/__MISSION_ID__/$MISSION_ID/g" \
  -e "s/__GAME_SLUG__/$SLUG/g" \
  -e "s/__GAME_TITLE__/$TITLE/g" \
  -e "s/__MAX_SCORE__/$MAX_SCORE/g" \
  "$ROOT/docs/templates/game-mission.sql.template" > "$MIGRATION"

echo "Created $TARGET"
echo "Created $MIGRATION"
echo "Next: implement the game, write tests, then run ./scripts/check.sh"
