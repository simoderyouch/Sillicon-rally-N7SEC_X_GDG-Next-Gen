#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

"$ROOT/scripts/validate-games.sh"
(cd "$ROOT/frontend" && npm test && npm run build)
(cd "$ROOT/backend" && mvn test)
