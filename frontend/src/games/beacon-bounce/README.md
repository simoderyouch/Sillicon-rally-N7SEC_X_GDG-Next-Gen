# Beacon Bounce

## Game plan

Beacon Bounce is a non-security visual-memory game. A team watches a route travel through nine named beacons, then repeats the same order. It is a six-round knockout: one wrong beacon ends the run. Secured points remain available to dispatch, but the run cannot be replayed.

The round structure makes the game social: one person can watch, another can repeat the names, and a third can tap the beacons. The interface uses names and symbols alongside colour, so the puzzle is not colour-only.

## Rounds and scoring

Each cleared route permanently secures its listed points. The six values total the mission maximum of 100 points and rise as playback becomes faster.

| Round | Pace | Route length | Points |
| --- | --- | --- | --- |
| 1 | Steady · 760 ms | 3 beacons | 8 |
| 2 | Brisk · 650 ms | 3 beacons | 10 |
| 3 | Quick · 540 ms | 4 beacons | 13 |
| 4 | Hard mode · 380 ms | 6 beacons | 16 |
| 5 | Harder · 300 ms | 7 beacons | 22 |
| 6 | Final burst · 235 ms | 9 beacons | 31 |

Rounds 1–3 teach the rhythm. Round 4 is the hard-mode breakpoint: routes become longer and the beacon pace drops sharply. Rounds 5 and 6 require teams to remember seven and then all nine beacons under faster playback.

## Competition integrity

Starting the game creates one random six-route run in Redis for the authenticated team. Refreshing or reopening the page restores that same run; it does not generate another route or reset the score. A team can replay its current route once if it missed the playback; the server records that hint and deducts 2 points from the route if it is cleared. Every beacon selection is validated against the stored route by the private backend endpoint. After a wrong selection, the only available action is dispatching the points secured before the failure.

When the platform receives that dispatch, it compares the submitted points and completion state with the terminal Redis run. A forged or early browser score is rejected.

## Test coverage

`Game.test.tsx` verifies server-started routes, the penalized one-time route replay, backend-verified beacon attempts, and the dispatch-only state after a failure. `BeaconBounceRunServiceTest` verifies random route shape, persistent team state, penalized replays, and terminal failures.

## Scope

The game uses private Beacon Bounce endpoints only. It never calls the shared scoring API itself; the platform runner dispatches the final result after the game reports its server-verified outcome.
