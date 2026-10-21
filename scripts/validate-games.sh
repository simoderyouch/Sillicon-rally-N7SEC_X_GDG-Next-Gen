#!/usr/bin/env sh
# Validate the shared conventions that keep independent game PRs mergeable.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
GAMES_DIR="$ROOT/frontend/src/games"
has_error=0

for directory in "$GAMES_DIR"/*; do
  [ -d "$directory" ] || continue
  slug=$(basename "$directory")
  [ "$slug" = "_template" ] && continue

  if [ ! -f "$directory/index.tsx" ]; then
    echo "Game '$slug' has no index.tsx" >&2
    has_error=1
    continue
  fi
  if ! grep -q "slug: \"$slug\"" "$directory/index.tsx"; then
    echo "Game '$slug' must export a game object with slug: \"$slug\"" >&2
    has_error=1
  fi
  if ! find "$directory" -maxdepth 1 -name '*.test.tsx' -print -quit | grep -q .; then
    echo "Game '$slug' needs at least one *.test.tsx file" >&2
    has_error=1
  fi
done

[ "$has_error" -eq 0 ] || exit 1
echo "Game structure validation passed."
