# Game brief: `<game name>`

Copy this brief for every game team before development starts. A clear brief protects the project from incompatible game mechanics and scoring rules.

## Ownership

- **Slug:** `<lowercase-hyphenated-slug>`
- **Branch:** `game/<slug>`
- **Team members:**
- **Reviewer:**

## Player experience

- **Learning objective:** What should a player understand after this game?
- **Narrative role:** How does it contribute to the event story?
- **Instructions shown to players:**
- **Expected duration:**
- **Mobile/desktop requirements:**

## Game rules

- **Inputs:**
- **Correct behaviour / answer logic:**
- **Failure behaviour:**
- **Completion condition:**
- **Accessibility considerations:**

## Score

- **Maximum score:**
- **How points are calculated:**
- **Retry policy:** The platform records a team's best submitted score.
- **Can the result be validated by the backend?** If yes, describe the payload and validation needed. If no, flag it for platform-owner review.

## Acceptance criteria

- [ ] The game lives only in `frontend/src/games/<slug>/`.
- [ ] It calls `onComplete` once with a score between `0` and `mission.maxScore`.
- [ ] It includes at least one focused test.
- [ ] It has a matching draft Flyway mission migration.
- [ ] `./scripts/check.sh` passes.
- [ ] Reviewer can complete the game from a fresh team session.
