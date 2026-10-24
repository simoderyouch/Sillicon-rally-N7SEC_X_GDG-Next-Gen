#!/usr/bin/env sh
# Produces the backend's build-time catalog from every real frontend game folder.
set -eu

GAMES_DIR=${1:?game directory is required}
OUTPUT=${2:?output path is required}

[ -d "$GAMES_DIR" ] || { echo "Game directory not found: $GAMES_DIR" >&2; exit 1; }
mkdir -p "$(dirname "$OUTPUT")"

TEMP_OUTPUT=$(mktemp "${OUTPUT}.XXXXXX")
trap 'rm -f "$TEMP_OUTPUT"' EXIT

found=0
for directory in "$GAMES_DIR"/*; do
  [ -d "$directory" ] || continue
  slug=$(basename "$directory")
  [ "$slug" = "_template" ] && continue
  case "$slug" in
    *[!a-z0-9-]* | "") echo "Invalid game directory name: $slug" >&2; exit 1 ;;
  esac
  printf '%s\n' "$slug" >> "$TEMP_OUTPUT"
  found=1
done

[ "$found" -eq 1 ] || { echo "No game folders found in $GAMES_DIR" >&2; exit 1; }
LC_ALL=C sort -u "$TEMP_OUTPUT" -o "$TEMP_OUTPUT"
mv "$TEMP_OUTPUT" "$OUTPUT"
trap - EXIT
