# Validation

Verified locally on 24 October 2026, on `game/final-flag-challenge`.

- `scripts/check.sh` through Git Bash: game ownership structure check, all **65 frontend tests**, production frontend build and all **36 backend tests** passed. After adding the malformed-body regression, the dedicated **5 backend tests** passed (one additional test).
- Browser testing against the real Docker platform, without mocked API replies: existing team join, catalogue registration, opening the game through GameRunner, original image rendering, modal open/close, 125% zoom, incorrect flag feedback, server attempt count, exact configured correct flag, success view, automatic callback, return to catalogue and **FINISHED · 100 PTS** locked card. Opening the completed route again displays the recorded result without an input or replay control.
- Responsive browser check at **390 × 844**: single-column story and form, readable evidence, modal and zoom operate correctly. Temporary viewport override reset afterwards.
- Real private API checks: a separate team starts at zero attempts; no-token state request returns 401; blank input returns 400; rapid second guess returns 429; completed team submission returns 409 even after renewing its session. Only accepted guesses increment attempts. UI test team: `Final Flag QA`; additional isolated API/mobile QA teams remain in the local test database.
- Source image and copied asset SHA-256 hashes match. The organiser's real flag has zero matches in game frontend files and generated frontend `dist` files. At the organiser's explicit request, the answer is now bundled only in backend Java as the default, with an optional environment override. It is visible in the Git repository. The dedicated backend tests verify the default as well as an environment override.

No shared game runner, scoring, authentication, other games, migrations, root compose file or registry was changed. Network score delivery is retried by the existing runner; the documented recovery path does not promise globally exactly-once callback delivery across separate browser mounts.
