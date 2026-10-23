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

Built-in games are registered automatically as **published** missions when the platform starts: Beacon Bounce, Code Breaker, Phishing Detective, Pac-Man Challenge, and Cyber Word Scramble. They are immediately visible to players. The registrar only creates missing records: it never overwrites an admin's title, description, maximum score, or release state.

When integrating another built-in game, add its slug, title, player-facing description, and maximum score to `BuiltInGameMissionRegistrar`. Use a Flyway migration only when an already deployed built-in game's release state must change. The Admin Shell can still close or edit a generated game, and its manual form remains available for custom or non-game challenges.
