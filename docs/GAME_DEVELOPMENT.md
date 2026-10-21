# Game development contract

## The only integration point a game needs

Every game receives a `mission` and an `onComplete` callback:

```tsx
type GameProps = {
  mission: Mission;
  onComplete: (result: {
    score: number;
    completed: boolean;
    details?: Record<string, string | number | boolean>;
  }) => void;
  disabled?: boolean;
};
```

When the player finishes, call:

```tsx
onComplete({ score: 80, completed: true, details: { attempts: 2 } });
```

The shared `GameRunner` sends that result to `POST /api/v1/games/{slug}/score`, shows a failure if the server rejects it, and returns the player to the game list after success.

## Server rules

- The player must have a valid team session.
- The event must be open and the leaderboard must not be locked.
- The game slug must exist as a published mission.
- `0 <= score <= mission.maxScore`.
- The backend retains only a team's best score for a game.

For this first skeleton the backend validates the score range and session, but it cannot prove all browser-game answers. Treat it as the common score pipeline. Before the live event, platform owners should add server validation for games where cheating would meaningfully affect rankings.

## Folder contract

```text
frontend/src/games/<game-slug>/
├── index.tsx       # exports `game`
├── Game.test.tsx   # game-specific tests
├── assets/         # optional, scoped assets
└── helpers.ts      # optional, scoped game utilities
```

Avoid adding game state to the global application. Keep timers, answer selection, animations, and local state inside the game folder.

## Registration migration

Each game has a Flyway migration in `backend/src/main/resources/db/migration/`. The generated migration inserts its mission as `DRAFT`; an organiser or platform owner changes it to `PUBLISHED` when it is ready for players.
