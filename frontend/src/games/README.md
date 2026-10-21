# Game developer guide

Each game team owns its isolated frontend folder and, when necessary, one isolated private backend package. The platform API skeleton, database, scoring, sessions, leaderboard, and shared runner are locked.

## Start your game

```bash
git switch -c game/<your-game-slug>
./scripts/new-game.sh <your-game-slug>
```

This creates:

```text
frontend/src/games/<your-game-slug>/
backend/src/main/java/com/silliconrally/api/games/<your_game_slug>/
```

The frontend directory is required. The backend directory is an optional private validation endpoint. Work only in these generated locations; this is what makes simultaneous game PRs merge without conflicts.

## Your required export

Your `index.tsx` must export one `game` object:

```tsx
export const game: GameDefinition = {
  slug: "your-game-slug",
  component: YourGame,
};
```

The app finds this automatically. Do not edit a central registry or route file.

## Sending points: use the callback, never the score API

The platform gives your component these props:

```tsx
function YourGame({ mission, onComplete, disabled }: GameProps) {
  // Your local game state and UI belong here.
}
```

When the player has finished, call the callback once:

```tsx
onComplete({
  score: 80,
  completed: true,
  details: { attempts: 2 },
});
```

The shared game runner owns the API call. It sends the result to:

```text
POST /api/v1/games/<your-game-slug>/score
```

It also supplies the team session token, handles loading/error state, and updates the leaderboard. **Do not call `/score`, do not import the shared `api` client, and do not edit platform backend files.**

The backend accepts only scores from `0` through `mission.maxScore`, retains a team's best score for a game, and rejects submissions when the event is closed or the leaderboard is locked.

## Optional server-side answer validation

Browser code is visible to players. If checking a correct answer, unlocking a hint, or calculating a result must happen on the server, use only the generated private package:

```text
backend/src/main/java/com/silliconrally/api/games/<your_game_slug>/GameController.java
```

It starts with a unique route for your game:

```text
POST /api/v1/games/<your-game-slug>/verify
```

The generated `gameApi.ts` in your game folder calls that route. You may change the request and response types and add more routes under your own `/api/v1/games/<your-game-slug>/...` prefix. Keep the endpoint self-contained: it may validate input and return `correct`, feedback, or a safe result. It must not change shared controllers/services/entities, add a migration, store a score, or call the score service.

After successful verification, still call `onComplete`. That is the only way a score reaches the leaderboard. The shared runner then uses the locked route:

```text
POST /api/v1/games/<your-game-slug>/score
```

Your game must never call that route itself.

## Tests and handoff

- Add at least one `*.test.tsx` file in your game folder.
- Keep images/audio in an `assets/` folder within your game folder.
- Ask the platform owner to register your final slug, title, description, and maximum score in the backend. Do not create a mission migration yourself.
- Run `./scripts/check.sh` before every PR.
- Open a PR from `game/<your-game-slug>`; CI accepts changes only in your two isolated locations and rejects shared-file changes.
