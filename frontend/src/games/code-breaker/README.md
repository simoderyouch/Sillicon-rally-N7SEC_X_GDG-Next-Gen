# Code Breaker

## Game plan

Code Breaker is a three-round deduction puzzle for teams. Every team receives its own stable set of hidden codes: refreshing the page preserves a team's puzzle, while another team receives different sequences. Players assemble a sequence from eight symbols and submit it to uncover three clear clues:

- **Exact** — the right symbol in the right slot.
- **Shifted** — the right symbol, but in a different slot.
- **Absent** — a symbol not used in the hidden code.

The board is intentionally collaborative: one teammate can read the feedback log, one can eliminate possibilities, and one can enter the next sequence.

## Rounds and scoring

| Round | Slots | Attempts | Maximum | Deduction per wrong guess | Hint cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 · Warm-up code | 3 | 7 | 20 | 1 | 2 |
| 2 · Practice signal | 3 | 6 | 30 | 2 | 3 |
| 3 · Master sequence | 5 | 4 | 50 | 5 | 5 |

The round maxima add to 100 points. A solved code earns its maximum minus the listed deduction for each earlier wrong guess. A single optional hint can reveal one position in a round for the listed deduction. If a team uses all attempts without cracking a code, that round is locked and the team continues to the next round. Once round 3 ends, the secured result must be dispatched.

## Competition integrity

The private backend owns one Redis-backed run per authenticated team: attempt budgets, hint usage, active round, points, and completion state all survive a refresh. A player cannot replay a failed round, use a second hint, or return to a previous round. The browser only renders backend feedback and sends the final server-verified score through the platform runner.

The shared score route compares that dispatched result against the completed server run, so it rejects an early dispatch or a score that does not match the server calculation.

## Test coverage

`Game.test.tsx` verifies a full-score three-round run, feedback categories, team-specific hint display, and the required final dispatch after missed rounds. `CodeBreakerPuzzleTest` verifies stable team-specific generation and duplicate-safe feedback. `CodeBreakerRunServiceTest` verifies that a failed round advances and cannot be replayed.

## Scope

The frontend never calls the shared score API directly; it reports the final result once through `onComplete`. Its isolated backend package exposes start, attempt, and hint endpoints. Those endpoints authenticate the team session, derive each team's code from its UUID, and keep the competition run in Redis without editing platform score or event data.
