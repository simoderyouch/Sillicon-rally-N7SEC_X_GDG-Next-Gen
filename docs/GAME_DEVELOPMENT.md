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

The shared `GameRunner`—not your game component—sends that result to the locked `POST /api/v1/games/{slug}/score`, shows a failure if the server rejects it, and returns the player to the game list after success.

**Never import the shared API client or call the score route.** The only permitted direct request is to your own optional private validation endpoint, through the generated local `gameApi.ts` file. That endpoint is described below.

## Server rules

- The player must have a valid team session.
- The event must be open and the leaderboard must not be locked.
- The game slug must exist as a published mission.
- `0 <= score <= mission.maxScore`.
- The backend retains only a team's best score for a game.

For this first skeleton the shared backend validates the score range and session, but it cannot prove all browser-game answers. Games that need stronger checking can add a private game endpoint for validation; the endpoint returns a validation result, then the frontend calls `onComplete` when appropriate. It never records points itself.

## Folder contract

```text
frontend/src/games/<game-slug>/
├── index.tsx       # exports `game`
├── Game.test.tsx   # game-specific tests
├── assets/         # optional, scoped assets
└── helpers.ts      # optional, scoped game utilities
```

Optional private server validation lives in only this matching location:

```text
backend/src/main/java/com/silliconrally/api/games/<game_slug>/
└── GameController.java  # e.g. POST /api/v1/games/<game-slug>/verify
```

The `new-game.sh` generator creates both isolated locations. The private controller is deliberately not connected to the database or score service. Keep it that way: validate an answer or issue a hint, then let `onComplete` use the shared score pipeline.

Avoid adding game state to the global application. Keep timers, answer selection, animations, and local state inside the game folder.

## Mission registration

Tell the platform owner the final slug, title, description, and maximum score from your game brief. They register and publish the mission separately. Do not add a Flyway migration. This prevents several game teams from editing the backend skeleton and creating migration conflicts.
