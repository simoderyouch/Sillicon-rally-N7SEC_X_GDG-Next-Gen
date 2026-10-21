# Three-PC local event deployment

This setup supports approximately 50 team browsers plus one projector scoreboard on an isolated local network.

```text
Team browsers and projector
             |
PC 1: Nginx + built frontend + Redis
             |
      +------+------+
      |             |
PC 2: API + PostgreSQL     PC 3: API
```

PostgreSQL is the single source of truth for teams, scores, and the leaderboard. Redis is shared by both APIs for opaque team/admin sessions and to relay a leaderboard update to every WebSocket connection. Do not run separate PostgreSQL or Redis instances per API server.

## Before the event

1. Give the PCs fixed local IP addresses or DNS names. This guide uses `rally.local` (PC 1), `api-a.local` (PC 2), and `api-b.local` (PC 3).
2. Start PostgreSQL on PC 2 and Redis on PC 1. Allow only PC 2 and PC 3 to reach PostgreSQL port `5432` and Redis port `6379`.
3. Set the same values on both API PCs:

```sh
export SPRING_DATASOURCE_URL=jdbc:postgresql://api-a.local:5432/sillicon_rally
export SPRING_DATASOURCE_USERNAME=sillicon
export SPRING_DATASOURCE_PASSWORD='choose-a-strong-password'
export SPRING_DATA_REDIS_HOST=rally.local
export SPRING_DATA_REDIS_PORT=6379
export APP_CORS_ALLOWED_ORIGIN=http://rally.local
export ADMIN_EMAIL=admin@rally.local
export ADMIN_PASSWORD='choose-a-strong-password'
```

4. Run Flyway only once, before starting the second API instance. Then run the Spring Boot JAR on both PC 2 and PC 3.
5. Build the frontend with same-origin API and WebSocket paths. Do not set `VITE_API_BASE_URL` to `/api`: the client request paths already start with `/api`.

```sh
cd frontend
VITE_API_BASE_URL= npm run build
```

6. Copy `frontend/dist/` to PC 1, configure Nginx, and open `http://rally.local/leaderboard` full screen on the projector.

## Nginx configuration

Use this as a starting point on PC 1. Replace hostnames with your fixed local IP addresses if you do not run local DNS.

```nginx
upstream rally_api {
    least_conn;
    server api-a.local:8080;
    server api-b.local:8080;
}

server {
    listen 80;
    server_name rally.local;
    root /srv/sillicon-rally/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://rally_api;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws/ {
        proxy_pass http://rally_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 1h;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

WebSocket connections remain open to whichever API accepted them. Redis publishes every changed leaderboard to both APIs, so all connected projector and player screens update immediately regardless of the selected API server.

## Event check

Before inviting teams, verify all of the following from a different local PC:

- Open `http://rally.local`, join a test team, and complete a test challenge.
- Open `http://rally.local/leaderboard` on two browsers and confirm both update after a score submission.
- Restart one API server; the joined team should still be accepted by the other API because its session is in Redis.
- Confirm the admin page works with the production password, then open the event only when ready.
- Keep the projector on `/leaderboard`; it reconnects automatically and also refreshes every 15 seconds as a fallback.
