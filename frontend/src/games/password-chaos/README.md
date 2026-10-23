# Password Chaos

Slug: `password-chaos`. Twenty timed password puzzles. The game calls `onComplete` once. GameRunner submits the score. There is no private backend endpoint.

## How to play

Press **Start**. The briefing does not use challenge time. Each challenge shows every rule at once. Type a password that turns every rule green, then press **Validate** or Enter. A correct password scores immediately and the next countdown starts. There is no skip and no retry. When a countdown reaches zero, that challenge scores 0 and the next one starts.

The deadline is an absolute timestamp in `sessionStorage`, keyed by team token and mission id: `rally:password-chaos:v2:{teamToken}:{missionId}`. Reloading restores the active challenge and the remaining time. Time spent with the page closed still expires challenges, including several in a row.

If every countdown runs out, the session lasts 525 seconds (8 minutes 45 seconds): 345 seconds across the HARD challenges and 180 seconds across EXPERT. A correct password still starts the next challenge immediately.

Sessions saved as `v1` used the retired shorter limits. Those deadlines are not resumed. Opening the game removes the old record and shows the briefing, with a note that the previous attempt was not continued. A `v2` session already in progress is left as it is.

## Score

HARD challenges 1–15 are worth at most 4 points: 2 for a correct password and up to 2 for speed. EXPERT challenges 16–20 are worth at most 8: 4 plus up to 4 for speed.

`score = base + bonus × (time remaining / time limit)`, using milliseconds, then rounded to two decimals. A timeout scores 0. The displayed total is the clamped sum, at most 100.

The platform stores an integer, and the leaderboard does not store a time tie-break. The submitted score is `round(total / 100 × mission.maxScore)`. `details.preciseScore` and `details.elapsedMs` travel with the callback. The server does not persist `details`.

## Rule readings

- A special character is printable ASCII that is not a letter or a digit.
- Vowels are A, E, I, O, and U. Y is a consonant.
- Challenge 2 asks for exactly one adjacent digit pair, and that pair must be prime. No other digits are allowed.
- Challenge 4 asks for exactly two distinct digit values. Those digits may repeat.
- A three-letter palindrome compares letters with case sensitivity.
- Challenges 12 and 20 treat the first `N7SEC` match as the required substring. Digits outside that match are the additional digits. The sum still counts every digit, including the 7.

## Registration

An organiser can create a draft from the admin dashboard:

- Slug: `password-chaos`
- Title: `Password Chaos`
- Description: `Build passwords that satisfy every rule. Twenty timed logic challenges, scored on speed.`
- Point ceiling: `100`
- Release state: `DRAFT`
