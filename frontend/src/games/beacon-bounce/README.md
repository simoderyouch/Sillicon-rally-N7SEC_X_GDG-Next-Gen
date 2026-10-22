# Beacon Bounce

## Game plan

Beacon Bounce is an easy, non-security visual-memory game. A team watches a route travel through six named beacons, then repeats the same order. The three rounds contain three, four, and five stops.

The round structure makes the game social: one person can watch, another can repeat the names, and a third can tap the beacons. The interface uses names and symbols alongside colour, so the puzzle is not colour-only.

## Hints and scoring

1. Replay the route — 10% total score deduction.
2. Pin the first two route stops below the board — 20% total score deduction.
3. Clear the current route — 30% total score deduction.

A wrong beacon resets only the player's current attempt; it does not deduct points. The final shared callback contains the bounded score, hint count, and number of incorrect sequences.

## Test coverage

`Game.test.tsx` verifies a perfect three-round run reports the mission maximum and that opening a hint reduces the projected score.

## Scope

This is a frontend-only game. It uses no private game endpoint and never calls the shared scoring API itself.
