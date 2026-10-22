# Parcel Panic

## Game plan

An easy, non-security sorting puzzle for early in the rally. A team routes eight incoming parcels by matching each parcel stamp to the stamp on a delivery depot.

- `★` — Express truck
- `☾` — Library return
- `✦` — Market cart

The interface is intentionally selection-based rather than drag-and-drop, so it works reliably with mice, trackpads, keyboards, and touch devices.

## Hints and scoring

1. Explains that only the stamp matters — 10% score deduction.
2. Reveals the complete stamp-to-depot guide — 20% total score deduction.
3. Routes one waiting parcel automatically — 30% total score deduction.

Incorrect depot choices do not move a parcel and deduct 5% each, capped at three mistakes. Completion calls the shared `onComplete` callback once with the bounded score, hint count, incorrect route count, and number of sorted parcels.

## Test coverage

`Game.test.tsx` proves a perfect route reports the mission maximum and that a hint reduces the projected score.

## Scope

This game is completely frontend-only. It does not use a private verification endpoint and it does not call the shared scoring API directly.
