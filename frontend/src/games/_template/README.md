# Game starter template

1. From the repository root, run `./scripts/new-game.sh your-game-slug`.
2. Implement the generated `frontend/src/games/your-game-slug/index.tsx` component.
3. Keep all game state local to that folder. Do not edit shared app state or score APIs.
4. Complete the game by calling `onComplete({ score, completed: true, details })` exactly once.
5. Add/adjust tests in the same folder, then run `npm test` and `npm run build`.

The game runner clamps no values on the frontend; the backend rejects a score outside the mission maximum. Never put answer keys or score-secret data in browser code if the game affects the event ranking.
