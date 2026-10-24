# OpenShip production deployment

This application expects OpenShip Edge to terminate TLS and forward every path to
the loopback-bound frontend container. The frontend then proxies `/api/` and
`/ws/` to the private backend container. Do not publish the backend, PostgreSQL,
or Redis ports.

## Production environment

Create the deployment `.env` with strong database and admin passwords, then set:

```dotenv
FRONTEND_BIND_ADDRESS=127.0.0.1
FRONTEND_PORT=5173
APP_CORS_ALLOWED_ORIGINS=https://silicon-rally.edder.studio
OPEN_TEAM_REGISTRATION=true
APP_TEAM_JOIN_CODE=replace-with-a-private-event-code
```

Replace the example join code with a private code and share it with participants. The backend rejects name-only joins; registration being enabled does not bypass the join-code check.

`OPEN_TEAM_REGISTRATION=false` deliberately makes a new-team request return 403.
An existing inactive team or an incorrect join code also returns 403. These are
application controls, not CORS failures.

Start or update the private application stack with:

```bash
docker compose up --build -d
```

## OpenShip Edge headers

OpenShip must overwrite these headers when it proxies the public HTTPS request to
`http://127.0.0.1:5173`; do not pass client-supplied forwarded headers through.
The frontend preserves these trusted values when it proxies to Spring Boot.

```nginx
location / {
    proxy_pass http://127.0.0.1:5173;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
}
```

With the public connection terminated as HTTPS, `$scheme` is `https`. Spring Boot
uses the trusted forwarded headers to retain the original request scheme. The
WebSocket `Origin` is preserved unchanged and is checked against the exact
origins in `APP_CORS_ALLOWED_ORIGINS`.

## Verification

```bash
curl -fsS https://silicon-rally.edder.studio/api/v1/leaderboard
curl -i -X OPTIONS https://silicon-rally.edder.studio/api/v1/team-sessions \
  -H 'Origin: https://silicon-rally.edder.studio' \
  -H 'Access-Control-Request-Method: POST'
```

The preflight response must contain `Access-Control-Allow-Origin:
https://silicon-rally.edder.studio`. The browser WebSocket handshake to
`wss://silicon-rally.edder.studio/ws/leaderboard` should then receive `101
Switching Protocols`.
