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
| 1 · Opening key | 3 | 6 | 25 | 2 | 3 |
| 2 · Crossing wires | 4 | 5 | 32 | 3 | 4 |
| 3 · Master sequence | 5 | 4 | 43 | 5 | 5 |

The round maxima add to 100 points. A solved code earns its maximum minus the listed deduction for each earlier wrong guess. A single optional hint can reveal one position in a round for the listed deduction. If a team uses all attempts without cracking a code, the run ends and nothing is submitted.

## Test coverage

`Game.test.tsx` verifies a full-score three-round run, feedback categories, team-specific hint display, and the no-submission failure path. `CodeBreakerPuzzleTest` verifies stable team-specific generation and duplicate-safe feedback.

## Scope

The frontend never calls the shared score API directly; it reports the final result once through `onComplete`. Its isolated backend package exposes only Code Breaker attempt and hint endpoints. Those endpoints authenticate the team session, deterministically derive the team's code from its UUID, and do not write shared score or event data.
