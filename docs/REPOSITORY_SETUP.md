# Repository settings before inviting game teams

Configure these in GitHub after the initial push:

1. Protect `main`: require a pull request, require the `CI` workflow to pass, and require at least one approval.
2. Require review from Code Owners. `.github/CODEOWNERS` makes the API skeleton, shared runner, scripts, and CI platform-owned.
3. Block force pushes and direct pushes to `main`.
4. Enable automatic deletion of head branches after merge.
5. Add the technical lead and event lead as repository admins/maintainers; give game developers write access only.
6. Use the `game/<slug>` naming convention from `CONTRIBUTING.md`. CI permits these branches to change only their matching frontend game folder and optional matching private backend package; it blocks the shared API skeleton.
7. Turn on Dependabot alerts, but keep dependency-update PRs separate from game work.

Before assigning a game, give each team its game brief, this repository link, and the commands below:

```bash
git clone <repository-url>
cd sillicon-rally-next
./run-dev.sh
git switch -c game/<game-slug>
./scripts/new-game.sh <game-slug>
```
