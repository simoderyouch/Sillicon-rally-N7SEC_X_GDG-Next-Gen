# Final Flag Challenge

Slug: `final-flag-challenge`. Uses the existing team session, registry, mission catalogue and `onComplete`. Maximum score: **100**. No separate login, leaderboard or direct scoring API. All files are confined to this game's frontend, private backend package, and corresponding backend tests.

## Content

- `content.ts`: title, story, placeholder and success message.
- `assets/challenge.png`: the original organiser-provided image, copied without conversion. Replace this file to change the evidence; no image processing or hidden-answer extraction is performed.
- `style.css`: scoped final-stage styling, responsive layout and reduced-motion support.

Click the evidence to open a native modal dialog (focus containment, Escape to close). Zoom ranges from 100% to 300%; the enlarged image scrolls without changing its aspect ratio.

## Private configuration

The exact, case-sensitive answer requested by the organiser is bundled as `DEFAULT_FLAG` in backend `FinalFlagService.java`. A normal deployment from GitHub is already configured without a private environment file. Leading/trailing whitespace is ignored. The answer is visible to anyone with repository access, but is absent from the browser bundle and is never stored in Redis or logged by the game. A nonblank `FINAL_FLAG_CHALLENGE_FLAG` environment variable overrides the default.

Other optional backend variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `FINAL_FLAG_CHALLENGE_MAX_ATTEMPTS` | `0` | Unlimited; positive values set a shared per-team cap |
| `FINAL_FLAG_CHALLENGE_COOLDOWN_MS` | `3000` | Minimum delay between guesses, at least 1000ms |

The normal root command `docker compose up --build -d` uses the bundled backend default. No extra flag configuration is needed locally or remotely. To optionally replace that answer, combine the root compose file with this folder's `compose.flag.yml`, which passes only the three game variables to the existing backend. Never put the answer in frontend content or a `VITE_` variable.

Only if overriding the bundled answer, enter an alternative flag in PowerShell:

```powershell
$privateFlag = Read-Host 'Private final flag' -AsSecureString
$env:FINAL_FLAG_CHALLENGE_FLAG = [System.Net.NetworkCredential]::new('', $privateFlag).Password
docker compose -f docker-compose.yml -f frontend/src/games/final-flag-challenge/compose.flag.yml up --build -d
Remove-Item Env:FINAL_FLAG_CHALLENGE_FLAG
```

Alternatively, supply an external private environment file using `docker compose --env-file <private-file> -f docker-compose.yml -f frontend/src/games/final-flag-challenge/compose.flag.yml up --build -d`. Use the override on future recreations only when retaining an alternative flag; the plain root compose command uses the bundled default.

Open `http://localhost:5173/games/final-flag-challenge` after joining a team. The existing build-time catalogue automatically registers the new folder. If managed manually by an admin, use slug `final-flag-challenge`, maximum score `100` and release state `PUBLISHED`. Keep the event open and leaderboard unlocked. This is presented as a final challenge; prerequisite games are not enforced by the existing platform.

## Private protocol and completion

- `GET /api/v1/games/final-flag-challenge/state`: safe attempt count, cap, cooldown, configuration availability, solved and score-recorded status.
- `POST /api/v1/games/final-flag-challenge/verify`: `{ "flag": "..." }`; only authenticated active teams, published mission and open event/unlocked leaderboard can submit.
- Requests use the existing `X-Team-Token`. A SHA-256 digest is compared using `MessageDigest.isEqual`; neither the secret nor guesses are passed to Redis. Redis Lua atomically checks completed state, cap and cooldown, then increments attempts and marks success. Time comes from Redis, not the browser. No TTL: refreshes and renewed sessions cannot reset progress. Keys include the actual team ID and mission ID. Rejected duplicates, throttled requests and blank submissions consume no attempt.
- Wrong answer: no score/callback. Correct answer: a short success animation followed by a single `onComplete({ score: 100, completed: true, details: { challenge: 'final-flag', solved: true, attempts } })` per mounted game. The existing runner sends and retries the score.
- If a successful verification response is lost or the page reloads before handoff, the server's solved state resumes the callback. Once the shared score exists, no further callback is issued. Score transport can be retried across reloads; the platform's existing per-team/mission score storage is idempotent, rather than claiming exactly-once network delivery.
- Successful teams cannot submit again (409). There is no restart button or reset endpoint.

This validator never writes scores. The existing shared scoring endpoint's trust model is unchanged, as required by the game's ownership boundary.

## Checks

```powershell
cd frontend
npm.cmd test -- --run src/games/final-flag-challenge/Game.test.tsx
npm.cmd run build
```

Backend tests: `mvn -Dtest=com.silliconrally.api.games.final_flag_challenge.FinalFlagTest test`. On Windows, use Git Bash for the project's shell-based catalogue generator, or test with `-Dexec.skip=true` after the normal catalogue has been generated. CI runs `scripts/check.sh` on Linux.
