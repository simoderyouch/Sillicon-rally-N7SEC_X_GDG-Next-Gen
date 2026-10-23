# Pac-Man Challenge

Slug: `pacman`. Original JavaScript gameplay by Brent Ward, reused from the existing local copy of `bward2/pacman-js`. No additional dependencies, shared platform changes, or private backend endpoint are needed.

## Play and scoring

Click **Start five-minute challenge** after assets are ready. Arrow keys/WASD move; Escape pauses gameplay; Q or the labelled sound button toggles sound. Click the maze to restore keyboard focus. One keyboard serves the whole team.

The challenge ends when the player loses the final life or when 300 seconds elapse after the explicit start—whichever happens first. The deadline, cumulative score and callback handoff marker are persisted in sessionStorage under the current team token and mission ID. A remount/reload resumes with a fresh maze and retained points/time. Closing the browser session or clearing storage is outside this client-only persistence guarantee. A team session has one attempt; there is deliberately no reset button.

The original three-life round, collisions, ghost AI, pellets, fruit and extra life remain intact. When the game reports game-over, the current points are submitted immediately and the challenge cannot be restarted. Disabled/error states remove the iframe, destroying its timers, audio and input listeners. Re-enabling/retrying starts a fresh round only before game-over or the deadline.

`challenge.ts` configures a 10,000 raw-point target. The maze contains 240 ordinary dots worth 10 each and four power pellets worth 50 (2,600 points). Fruit awards 100–5,000 depending on level; ghost chains award 200/400/800/1,600. Ten thousand matches the engine's extra-life threshold and rewards about three cleared mazes plus bonuses. This is an initial transparent calibration, not a measured student-performance percentile; organisers should playtest before the event and adjust this module consistently for everyone.

`round(raw / 10000 * mission.maxScore)`, clamped to `[0, mission.maxScore]`, is handed off once with `{ completed: true, details: { pacmanScore, durationSeconds: 300 } }`.

## Architecture and packaging

Original engine → coordinator `awardPoints` wrapper → typed/validated postMessage protocol → React game → `onComplete` → unchanged GameRunner → existing backend score route → existing leaderboard.

`frame.ts` assembles an iframe srcdoc from local HTML, compiled CSS and original source scripts. Vite's eager raw and URL imports emit/hash or inline every referenced resource. Dynamic sprite/audio paths use an explicit asset map. CSS stays inside the iframe. No public-directory copies, remote fonts, analytics, or CDN scripts are used. A local server is still required; offline here means no Internet dependency, not a service-worker/PWA installation.

`bridge.js` wraps actual coordinator methods before construction: preload completion, start, points, game-over and stop. Each message carries an instance ID, increasing sequence number, numeric score and timestamp. React checks origin, exact iframe window, instance, sequence, shape, score bounds and challenge state. Scores after the deadline are rejected. A stop acknowledgement drains earlier queued score messages; a 300ms fallback completes if the frame is missing. The engine checks the wall-clock deadline before frame processing and point awards, so the acknowledgement grace period never grants play time.

The browser may suspend JavaScript while a tab is backgrounded or the computer sleeps. On resumption, the expired deadline is enforced before further points; callback delivery can be delayed by browser suspension. The persisted handoff marker prevents callback duplication on navigation/remount. It means a failed shared API submission cannot be automatically retried by this module: exactly-once durable server delivery would require platform idempotency/retry support. The UI says “handed to Silicon Rally”, not “saved”.

This is not cheat-proof. Same-origin scripts, DevTools, storage/clock edits, copied sessions or a modified browser can forge client scores. Tokens/instance IDs are routing checks, not secrets. True authoritative validation and cross-device attempt enforcement require platform work outside this contribution. No new score API or database is introduced.

## Local launch

Use the existing workspace and services; do not duplicate already running servers. The inspected Compose file exposes PostgreSQL at 5433 and Redis at 6379.

```sh
# Repository root (existing .env supplies any local database overrides)
docker compose up -d postgres redis

# Separate terminal: use the installed JDK 17, not the host's default JDK 25.
cd backend
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH="$JAVA_HOME/bin:$PATH"
# Supply ADMIN_EMAIL / ADMIN_PASSWORD and database credentials from your local
# environment. application.yml already defaults the DB URL to localhost:5433.
mvn spring-boot:run

# Separate terminal; dependencies are already installed in this workspace.
cd frontend
npm run dev
# http://localhost:5173
```

The existing services were observed running at 5173 and 8080. `GET http://localhost:8080/api/v1/missions` returned `[]`. Integration browser testing used a separate Vite port 5174 and an isolated temporary preview, without creating or altering a real mission or team.

## Automatic registration and release

The platform creates the Pac-Man mission as `PUBLISHED` when it starts, so it is immediately available to players. The startup registrar creates it only when it is absent and never changes an existing administrator-managed mission. No separate registration command or manual creation is required.

Open `/admin`, sign in with the backend's configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` (login exchanges these for an opaque Redis session token). The fields below document the generated record and are only needed to recover a missing record manually:

- Slug: `pacman`
- Title: `Pac-Man Challenge`
- Description: `Collect points, avoid ghosts, and achieve the highest score in five minutes.`
- Point ceiling: `100`
- Release state: `DRAFT`

The real field name is **releaseState**, not initialState. Accepted values are `DRAFT`, `PUBLISHED`, `CLOSED`. All five fields are required; slug uses `[a-z0-9-]+` (80 characters max), title max 120, description max 1000, score integer 0–10000. Check the existing list first to avoid a duplicate slug.

When ready, click **Publish** only on Pac-Man. Publishing makes it visible in GET `/api/v1/missions` regardless of whether the event is open. An authenticated active team can open `/games/pacman`. To accept scores the event must additionally be open and `leaderboardLocked` must be false. The dashboard has **Open event**; unlocking is available through the existing API. Do not reset/wipe the event or publish any other mission.

Equivalent exact HTTP requests (replace shell variables locally; never put secrets in source):

```sh
# JSON escaping is handled by Python, not shell interpolation.
# Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment beforehand.
export API=http://localhost:8080
LOGIN_JSON=$(python3 -c 'import os,json; print(json.dumps({"email":os.environ["ADMIN_EMAIL"],"password":os.environ["ADMIN_PASSWORD"]}))')
ADMIN_TOKEN=$(printf '%s' "$LOGIN_JSON" | curl --fail-with-body -sS "$API/api/v1/admin/sessions" -H 'Content-Type: application/json' --data-binary @- | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
unset LOGIN_JSON
curl --fail-with-body -sS "$API/api/v1/admin/missions" -H "X-Admin-Token: $ADMIN_TOKEN"

# Only if pacman is absent; response is 201 with its generated id.
curl --fail-with-body -sS "$API/api/v1/admin/missions" \
  -H "X-Admin-Token: $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  --data-binary '{"slug":"pacman","title":"Pac-Man Challenge","description":"Collect points, avoid ghosts, and achieve the highest score in five minutes.","maxScore":100,"releaseState":"DRAFT"}'

# Set MISSION_ID to that response's id. Run only when ready to publish Pac-Man.
curl --fail-with-body -sS -X PUT "$API/api/v1/admin/missions/$MISSION_ID" \
  -H "X-Admin-Token: $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  --data-binary '{"slug":"pacman","title":"Pac-Man Challenge","description":"Collect points, avoid ghosts, and achieve the highest score in five minutes.","maxScore":100,"releaseState":"PUBLISHED"}'

curl --fail-with-body -sS "$API/api/v1/admin/event" -H "X-Admin-Token: $ADMIN_TOKEN"
# Event-wide organiser action, only when the event is ready:
curl --fail-with-body -sS -X PATCH "$API/api/v1/admin/event" \
  -H "X-Admin-Token: $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  --data-binary '{"isOpen":true,"leaderboardLocked":false}'
curl --fail-with-body -sS "$API/api/v1/missions"
unset ADMIN_TOKEN ADMIN_PASSWORD
```

Verify the final catalogue response contains `pacman` with `PUBLISHED`, then join through `/play` and open the mission. These API bodies are verified against local controllers/DTOs, not executed against an admin session during this integration.

## Attribution and deployment gate

`assets/vendor/LICENSE` retains the MIT notice, Copyright (c) 2020 Brent Ward. The same notice is embedded in the generated frame. Original gameplay source and media are retained; source adaptations are limited to resource mapping, preload readiness/error handling, scaling and reconnecting the engine entity list on fresh rounds.

The bundle contains branded Pac-Man artwork, characters and arcade audio. No separate permission or third-party clearance document was found in the supplied source. MIT permission for the implementation does not establish permission for those assets or trademarks. Obtain clearance or replace protected visuals/audio before public deployment. The assets have not been represented as cleared.

See `VALIDATION.md` for actual test results and `CHANGES.md` for the file inventory.
