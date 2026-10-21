# Contributing a game

Every game is developed in its own branch and pull request. A game team owns its folder in `frontend/src/games/<game-slug>/`; it should not alter another team's game.

## Branch and pull-request workflow

1. Update `main`, then create a branch named `game/<game-slug>`.
2. Create the starter files with `./scripts/new-game.sh <game-slug> "Game Title" <max-score>`.
3. Build only the assigned game inside `frontend/src/games/<game-slug>/`.
4. Review the generated Flyway migration and commit it with the game.
5. Run `./scripts/check.sh` before pushing.
6. Open one PR per game. Do not mix a game with unrelated refactors or dependency upgrades.
7. Request one game/design review and one technical review. Merge only after CI is green.

Example:

```bash
git switch main
git pull --ff-only
git switch -c game/inbox-triage
./scripts/new-game.sh inbox-triage "Inbox Triage" 100
./scripts/check.sh
```

## Game boundary

- Keep game-specific React components, assets, helpers, and tests inside its own game folder.
- Export exactly one `game` object from `index.tsx`; the frontend discovers it automatically.
- Finish by calling the provided `onComplete({ score, completed, details })` callback. Do not call the score API from game components.
- Do not change shared API clients, session handling, scoring logic, or another game unless the PR explicitly has platform-owner approval.
- Never commit production secrets, answer keys, private flags, or event credentials.

## Backend registration

The new-game script creates a timestamped Flyway migration that registers the mission in PostgreSQL. Check its title, description, score maximum, and initial release state before committing. A mission is visible to players only when its release state is `PUBLISHED`.

## Required checks

```bash
./scripts/check.sh
```

This runs frontend tests, frontend production build, and backend Maven tests. CI runs the same checks on every pull request.
