# Production Readiness Guide

Minimal checklist for deploying Rasoira.

## Environment

### Server (`server/.env`)

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | Set to `production` |
| `JWT_SECRET` | Yes | Long random string — never use the dev default |
| `PORT` | No | Default `5000` |
| `HOST` | No | Default `0.0.0.0` (LAN/phone access) |
| `CORS_ORIGIN` | Recommended | Comma-separated allowed origins, e.g. `https://rasoira.com` |
| `GOOGLE_CLIENT_ID` | If using Google auth | Same as client |
| `GROQ_API_KEY` | Optional | Recipe enrichment on select |

### Client (`client/.env`)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | If using Google auth | Web application type |
| `VITE_API_BASE` | No | Default `/api` — set if API is on another origin |

## Build & run

```bash
cd aaj-kyabanayein
npm run install:all
npm run build:client
NODE_ENV=production npm run start --prefix server
```

When `NODE_ENV=production` and `client/dist` exists, the server serves the built SPA.

## Security headers

The server applies these via `server/src/middleware/security.js`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation disabled)
- `Strict-Transport-Security` (production only — use behind HTTPS)

For reverse proxies (nginx, Cloudflare), also enable HTTPS redirect and rate limiting at the edge.

## Client resilience

- **apiFetch** (`client/src/lib/apiFetch.js`) — 15s timeout, 1 retry on network/5xx errors
- **ErrorBoundary** — catches React render errors
- **OfflineBanner** — shows when `navigator.onLine` is false
- **Offline cook packs** — Plus users can save recipes; Cooking Mode falls back to `getOfflinePack()`
- **Service worker** (`client/public/sw.js`) — caches shell + API recipe loads

## Logging

- Server: `logger` in `server/src/lib/logger.js` — `debug` suppressed in production
- Client analytics: `console.debug` only when `window.__RASOIRA_DEBUG__` is set

## PWA

- Manifest: `client/public/manifest.webmanifest`
- Service worker registered in `client/src/main.jsx`
- Bump `CACHE` version in `sw.js` when deploying breaking cache changes
