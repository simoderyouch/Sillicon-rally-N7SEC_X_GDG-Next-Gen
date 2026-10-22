# Code Breaker

## Game plan

Code Breaker is a six-round deduction puzzle for teams. Players assemble a sequence from eight symbols and submit it to uncover three clear clues:

- **Exact** — the right symbol in the right slot.
- **Shifted** — the right symbol, but in a different slot.
- **Absent** — a symbol not used in the hidden code.

The board is intentionally collaborative: one teammate can read the feedback log, one can eliminate possibilities, and one can enter the next sequence.

## Rounds and scoring

| Round | Slots | Attempts | Maximum | Deduction per wrong guess |
| --- | ---: | ---: | ---: | ---: |
| 1 · Warm-up | 3 | 6 | 8 | 1 |
| 2 · Pattern | 3 | 5 | 10 | 1 |
| 3 · Cross-check | 4 | 6 | 13 | 1 |
| 4 · Pressure | 4 | 5 | 16 | 2 |
| 5 · Cipher | 5 | 5 | 22 | 3 |
| 6 · Final code | 5 | 4 | 31 | 4 |

The round maxima add to 100 points. A solved code earns its maximum minus the listed deduction for each earlier wrong guess. A single optional hint can reveal one position in a round for a further 3-point deduction. If a team uses all attempts without cracking a code, the run ends and nothing is submitted.

## Test coverage

`Game.test.tsx` verifies a full-score six-round run, feedback categories, and the no-submission failure path.

## Scope

This is a frontend-only game. It never calls the shared score API directly; it reports the final result once through `onComplete`.
