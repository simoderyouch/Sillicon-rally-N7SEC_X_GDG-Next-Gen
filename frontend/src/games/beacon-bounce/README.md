# Beacon Bounce

## Game plan

Beacon Bounce is a non-security visual-memory game. A team watches a route travel through nine named beacons, then repeats the same order. It is a six-round knockout: one wrong beacon ends the run, returns the team to round 1, and submits no score.

The round structure makes the game social: one person can watch, another can repeat the names, and a third can tap the beacons. The interface uses names and symbols alongside colour, so the puzzle is not colour-only.

## Rounds and scoring

Each cleared route permanently secures its listed points. The six values total the mission maximum of 100 points and rise as playback becomes faster.

| Round | Pace | Route length | Points |
| --- | --- | --- | --- |
| 1 | Steady · 760 ms | 3 beacons | 8 |
| 2 | Brisk · 650 ms | 3 beacons | 10 |
| 3 | Quick · 540 ms | 4 beacons | 13 |
| 4 | Rapid · 450 ms | 4 beacons | 16 |
| 5 | Fast · 360 ms | 5 beacons | 22 |
| 6 | Full speed · 285 ms | 6 beacons | 31 |

## Hints

The **Need a hand?** card clearly states the next available hint. Each round permits two free assists: replay the route and pin its first two stops. These never clear a round and never reduce its route value.

The final shared callback is made only after all six routes are cleared. It contains the earned score and total hints used.

## Test coverage

`Game.test.tsx` verifies a perfect six-round run reports the mission maximum and that a wrong beacon ends the run without submitting a score.

## Scope

This is a frontend-only game. It uses no private game endpoint and never calls the shared scoring API itself.
