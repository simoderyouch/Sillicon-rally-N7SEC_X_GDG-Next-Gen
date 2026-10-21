# Sillicon Rally Next

New implementation of the team cybersecurity game: React frontend, Spring Boot backend (Java 17+), and PostgreSQL.

## What is included

- Team join flow (open registration enabled for local development)
- Public mission catalogue
- Admin login and team management skeleton
- Event open/close and leaderboard lock state
- Shared server-backed score submission and a live WebSocket leaderboard
- PostgreSQL schema and mission seed data through Flyway
- Parallel game-development workflow, game template, PR template, and CI

## Local setup

```bash
cp .env.example .env
docker compose up -d postgres redis

cd backend
ADMIN_EMAIL=admin@sillicon-rally.local ADMIN_PASSWORD=change-me-before-an-event \
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/sillicon_rally \
SPRING_DATASOURCE_USERNAME=sillicon SPRING_DATASOURCE_PASSWORD=change-me \
mvn spring-boot:run

cd ../frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`; the API starts on `http://localhost:8080`.

## Shared event sessions

Opaque team and admin tokens are stored in Redis with a 12-hour expiry, so any API instance can serve a client behind the load balancer. They remain browser-held tokens for this local-network event; use HTTPS, restricted LAN access, strong admin credentials, rate limits, hashed team join codes, and secure HTTP-only sessions (or an approved identity provider) for an internet-facing deployment.

## Live leaderboard

The projector and player scoreboard use `GET /api/v1/leaderboard` for the initial state and `ws://<host>/ws/leaderboard` for updates after each successful score. Redis distributes each update to every API instance, so clients connected to either server receive the same board. The UI also reconciles with the API every 15 seconds if a WebSocket reconnect is needed.

For the three-PC local event topology and an Nginx configuration, read [docs/LOCAL_EVENT_DEPLOYMENT.md](docs/LOCAL_EVENT_DEPLOYMENT.md).

## API skeleton

- `POST /api/v1/team-sessions` — join/create a team
- `GET /api/v1/me` — current team identity
- `GET /api/v1/missions` — visible mission catalogue
- `POST /api/v1/admin/sessions` — admin login
- `GET|POST|PATCH /api/v1/admin/teams` — manage teams
- `GET|PATCH /api/v1/admin/event` — view/update event state
- `POST /api/v1/games/{slug}/score` — save a team game's best score
- `GET /api/v1/leaderboard` — public ranked teams

## Game team workflow

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/GAME_DEVELOPMENT.md](docs/GAME_DEVELOPMENT.md) before assigning game work. Each team creates one `game/<slug>` branch, then runs:

```bash
./scripts/new-game.sh inbox-triage
./scripts/check.sh
```

The generator creates an isolated frontend game folder and an optional private validation-endpoint package. A game completes through a callback; the shared runner submits the score to the locked backend route, so game developers never build, call, or modify scoring endpoints. A private endpoint may validate game-specific answers but cannot record points. Read [frontend/src/games/README.md](frontend/src/games/README.md) before starting a game.

`frontend/src/games/intake/` is a deliberately small working reference game. It demonstrates the full flow: a game component receives a mission, reports completion through `onComplete`, and the shared runner sends its score to the API. New game teams should copy the template, not edit this reference game.

## Project structure

```text
frontend/  React + Vite + TypeScript
backend/   Spring Boot + JPA + Flyway
```
