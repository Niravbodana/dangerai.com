# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

**Rasoira** (package name: `aaj-kyabanayein`) is a free Indian meal-planning web app: Express API + React (Vite) + Tailwind CSS. Recipe data is stored in committed JSON under `aaj-kyabanayein/server/src/data/curated/` (~773 recipes). User data (accounts, favorites, ratings) is persisted in gitignored JSON files on disk — no database.

## Repository layout

```
aaj-kyabanayein/
├── server/     # Express API (port 5000)
├── client/     # React Vite frontend (port 3000, proxies /api → :5000)
└── package.json  # Root scripts: install:all, dev:server, dev:client
```

See [aaj-kyabanayein/README.md](./aaj-kyabanayein/README.md) for feature list and API docs.

## Cursor Cloud specific instructions

### Services to run

| Service | Command (from `aaj-kyabanayein/`) | URL |
|---------|-------------------------------------|-----|
| API | `npm run dev:server` | http://localhost:5000 |
| Frontend | `npm run dev:client` | http://localhost:3000 |

Run both in separate terminals (or tmux sessions). The frontend Vite dev server proxies `/api` to the backend.

### First-time env setup

Server env is **not** committed. On a fresh clone, create it once:

```bash
cd aaj-kyabanayein/server && bash setup-env.sh
```

This copies `.env.example` → `.env`. All vars are optional for core dev; defaults work for local auth and recipe browsing.

Optional client env (`aaj-kyabanayein/client/.env`): set `VITE_GOOGLE_CLIENT_ID` to enable Google sign-in.

### Lint / build / test

- **Lint** (client only): `cd aaj-kyabanayein/client && npm run lint` (oxlint; warnings are acceptable)
- **Build** (client): `cd aaj-kyabanayein/client && npm run build`
- **No automated test suite** in the repo. Smoke-test the API with `curl http://localhost:5000/api/health` (expect `totalRecipes: 773`).
- **Playwright** is not a project dependency; `aaj-kyabanayein/scripts/screenshot-post-login.mjs` requires a separate `playwright` install if used.

### Gotchas

- `npm install` in `server/` runs `postinstall` → `buildRecipeBooks.js`, which fetches TheMealDB recipes. Curated JSON is already committed, so the app works even if that fetch fails offline.
- `server/src/data/users.json` is gitignored. Register test users via `POST /api/auth/register` or the UI login modal.
- Recipe images may load from Wikipedia/Wikimedia; degraded images are expected without network or API keys (`GEMINI_API_KEY`, `GOOGLE_CSE_ID`).
- There is no `npm test` script at root, server, or client.
