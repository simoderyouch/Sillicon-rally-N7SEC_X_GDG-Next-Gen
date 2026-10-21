#!/usr/bin/env sh
# Generate isolated game-client files and an optional private validation endpoint.
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <game-slug>" >&2
  exit 1
fi

SLUG=$1
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

case "$SLUG" in
  *[!a-z0-9-]* | "") echo "Game slug must use lowercase letters, numbers, and hyphens only." >&2; exit 1 ;;
esac
TARGET="$ROOT/frontend/src/games/$SLUG"
PACKAGE_SLUG=$(printf '%s' "$SLUG" | tr '-' '_')
BACKEND_TARGET="$ROOT/backend/src/main/java/com/silliconrally/api/games/$PACKAGE_SLUG"
if [ -e "$TARGET" ] || [ -e "$BACKEND_TARGET" ]; then
  echo "Game files already exist for '$SLUG'. Choose another slug or remove both generated locations." >&2
  exit 1
fi
cp -R "$ROOT/frontend/src/games/_template" "$TARGET"
find "$TARGET" -type f -exec sed -i "s/__GAME_SLUG__/$SLUG/g" {} +
mkdir -p "$BACKEND_TARGET"
sed -e "s/__GAME_SLUG__/$SLUG/g" -e "s/__GAME_PACKAGE__/$PACKAGE_SLUG/g" \
  "$ROOT/docs/templates/game-backend/GameController.java.template" > "$BACKEND_TARGET/GameController.java"
sed "s/__GAME_SLUG__/$SLUG/g" \
  "$ROOT/docs/templates/game-backend/gameApi.ts.template" > "$TARGET/gameApi.ts"

echo "Created $TARGET"
echo "Created optional private endpoint $BACKEND_TARGET/GameController.java"
echo "Next: implement the game, write tests, then run ./scripts/check.sh."
echo "Ask the platform owner to register '$SLUG' before it is merged. Do not alter shared API code."
