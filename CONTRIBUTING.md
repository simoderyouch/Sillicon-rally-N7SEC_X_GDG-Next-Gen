# Contributing a game

Every game is developed in its own branch and pull request. A game team owns `frontend/src/games/<game-slug>/` and may also own the matching private endpoint package; it should not alter another team's game or platform code.

## Branch and pull-request workflow

1. Update `main`, then create a branch named `game/<game-slug>`.
2. Create the starter files with `./scripts/new-game.sh <game-slug>`.
3. Build inside the assigned game folders only: `frontend/src/games/<game-slug>/` and, only if server validation is needed, `backend/src/main/java/com/silliconrally/api/games/<game_slug>/`.
4. Run `./scripts/check.sh` before pushing.
5. Open one PR per game. Do not mix a game with unrelated refactors or dependency upgrades.
6. Request one game/design review and one technical review. Merge only after CI is green.

Example:

```bash
git switch main
git pull --ff-only
git switch -c game/inbox-triage
./scripts/new-game.sh inbox-triage
./scripts/check.sh
```

## Game boundary

- Keep game-specific React components, assets, helpers, and tests inside its own frontend game folder.
- Export exactly one `game` object from `index.tsx`; the frontend discovers it automatically.
- Finish by calling the provided `onComplete({ score, completed, details })` callback. Do not call the score API from game components.
- If validation must stay server-side, add it only under `backend/src/main/java/com/silliconrally/api/games/<your_game_slug>/`, using routes beneath `/api/v1/games/<your-game-slug>/`. The generator supplies an example `/verify` route and local `gameApi.ts` helper.
- Do not change **anything** outside those two folders. This includes the API client, shared game runner, platform backend packages, database migrations, scripts, CI, package dependencies, and other games.
- Never commit production secrets, answer keys, private flags, or event credentials.

## Locked platform API, optional private endpoint, and score handoff

The API skeleton is platform-owned. Do not edit `backend/.../admin`, `config`, `event`, `mission`, `score`, or `team`; do not edit migrations or `application.yml`. Those files run teams, sessions, missions, scoring, and the leaderboard and are designed to stay conflict-free.

When a game needs private answer checking, it may add code only in its own `backend/.../games/<your_game_slug>/` package. Its endpoint must be unique to that game, for example `POST /api/v1/games/<your-game-slug>/verify`. It may validate an answer or return a hint, but it must not create migrations, modify shared entities, write a score, or expose answer keys. The game can call only this own private route through its generated local `gameApi.ts` helper.

The score route is locked: `POST /api/v1/games/{slug}/score`. Never call it directly and never add a score endpoint. Finish the game with `onComplete`; shared `GameRunner` sends the score with the player team session, handles errors, and refreshes ranking data.

After a game team has chosen its slug, the platform owner registers that slug, title, description, and maximum score in the backend. Only a registered and published mission appears in the player game list. A game team only needs to call `onComplete`; the shared game runner sends the result to the locked score endpoint.

## Required checks

```bash
./scripts/check.sh
```

This runs frontend tests, frontend production build, and backend Maven tests. CI runs the same checks on every pull request.
