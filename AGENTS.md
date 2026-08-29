# Base44 dev environment notes

- Run with `docker compose -f docker-compose.base44.yml up -d` (Postgres + install + drizzle push + api + vite web).
- pnpm must run with `dangerously-allow-all-builds` (bcrypt/esbuild/sharp postinstall scripts), otherwise install exits 1 with ERR_PNPM_IGNORED_BUILDS.
- Vite requires both `PORT` and `BASE_PATH` env vars or it throws at config load.
- Frontend calls the API with relative `/api` paths. Single-origin setup: `API_PROXY_TARGET=http://api:8080` enables the dev-server proxy added in `artifacts/gem-mining/vite.config.ts`.
- Schema is applied via `pnpm push-force` in `lib/db` (drizzle-kit push), no migration files.
- No external service credentials needed; DB creds and `SESSION_SECRET` are dev values set in compose.
- Admin access: register a user, then `UPDATE users SET is_admin = true WHERE username = '...';`.
