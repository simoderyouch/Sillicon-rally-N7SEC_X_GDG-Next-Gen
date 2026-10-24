# Algo Game

Slug: `algo-game`. A visual programming puzzle: build a program that walks a robot over every star. No private backend endpoint and no shared platform changes.

## How to play

The whole challenge lasts five minutes from the moment it opens. Completing a level, failing, editing, resetting the robot, reloading, or leaving the page does not add time. The deadline is stored in `sessionStorage` for the current team token and mission id.

- **Forward** moves one cell in the direction the robot is facing.
- **Turn left** and **Turn right** change that direction.
- **F1** and **F2** run those function rows. A function may call itself or the other function.
- **Red, orange, and cyan** are conditions, available on every level as in the reference cards. Select a color, then a command, then a slot. That command runs only while the robot is standing on a cell of that color. Click the color again to clear the brush.
- **F1** can be called from the first level. **F2** appears on levels 7 and 8.
- Select a command and click a slot to place it. Click a filled slot with no command selected to clear it.
- **Run** plays the program from F1. **Reset robot** restores the position and stars and keeps the program.
- Playback speeds are x1, x2, x4, and x50. The result is computed before the animation, so speed cannot change whether the solution works.
- Leaving the colored path fails the attempt. Programs stop after 500 instructions or 24 nested calls.

## Levels and score

Points are awarded once per level. The total is 100.

| Level | Points | Idea |
| --- | --- | --- |
| 1 | 5 | Five forwards along the red row |
| 2 | 5 | Turns on the L-shaped path |
| 3 | 10 | Three stars |
| 4 | 15 | F1 repeats a lap |
| 5 | 15 | F1 repeats a staircase |
| 6 | 15 | Commands conditioned on red and cyan |
| 7 | 15 | F1 calls F2 around a square |
| 8 | 20 | F1, F2, and a cyan turn |

If `mission.maxScore` is not 100, the submitted score is `round(earned / 100 * mission.maxScore)`, clamped to the mission ceiling. `onComplete` runs once, either when all eight levels are solved or when the clock hits zero. GameRunner submits that result. This game does not call the score API.

## Reference boards

`references/` holds the layout screenshots. Levels use an 8 by 4 grid taken from those boards.

- Level 1 matches the red row. The drawn triangle points north and the star is to the east; the playable robot faces east so the caption, "move forward to the star," is the solution.
- Level 2 matches the L and the star. F1 has 8 slots because five cannot spell that route.
- Level 3 joins the two reference clusters with one cell so every star is reachable, and F1 has 12 slots.
- Levels 4–8 keep the reference mechanics (repeat, color, F1 and F2) on original connected routes that fit the editors. Levels 7 and 8 use 8 and 6 F1 slots, and 5 F2 slots.

## Registration

Do not add a migration. An organiser can create a draft from the admin dashboard:

- Slug: `algo-game`
- Title: `Algo Game`
- Description: `Program a robot to collect stars and complete eight algorithmic puzzles in five minutes.`
- Point ceiling: `100`
- Release state: `DRAFT`

Publish it only when the event should show the challenge.
