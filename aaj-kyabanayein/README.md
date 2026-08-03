# Rasoira

Ghar ka khana — free meal planner for Indian home cooks. 5.7 Lakh+ recipes, Hot Makings, pantry suggestions, and step-by-step cooking.

**Stack:** Node.js (Express) + React (Vite) + Tailwind CSS

## Features

- **5.7 Lakh+ recipes** across 11 cuisines (Indian, Chinese, Thai, Korean, Italian, Mexican, and more)
- **Hot Makings** — trending recipes by ratings and cook popularity
- **Veg / Non-Veg filters** + cuisine and category browsing
- **Step-by-step Cooking Mode** with timers
- **Pantry suggestions** — ghar me kya pada, wahi se recipe
- **Weekly meal plan** + healthy week plan
- **Ratings, favorites, WhatsApp share**
- **Hindi / English** language toggle
- **Apple cream glass UI** — premium frosted design
- **100% free** — no payment required

## Project Structure

```
aaj-kyabanayein/
├── server/          # Express API
│   └── src/
│       ├── data/generated/   # 570k recipes (gitignored, auto-generated)
│       ├── routes/
│       └── services/
└── client/          # React Vite frontend
    └── src/
        ├── pages/
        └── components/
```

### Google Login (optional)

1. Create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized JavaScript origin: `http://localhost:3000` (and your production URL)
3. Copy Client ID to both env files:

```bash
# server/.env
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com

# client/.env
VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
```

Restart both server and client after setting env vars. Login/signup modal will show **Continue with Google** below the email form.

## Run Locally

```bash
cd aaj-kyabanayein
npm run install:all   # first time only
npm run db:init       # SQLite database + 941 recipes (first time)
npm run sync-images   # download photos locally (optional, ~10 min)
npm run dev           # starts API (5000) + app (3000) together — recommended
```

**Database:** SQLite (`server/data/rasoira.db`) — recipes, users, favorites, ratings, saved meals. Photos cache in `server/data/image-cache/` so bar-bar fetch nahi hota.

**Photo quality audit:**
```bash
npm run audit-images          # check matching (shahi paneer, dal tadka, etc.)
npm run audit-images -- --fix # auto-refetch bad photos + save to DB
npm run sync-images -- --force-bad   # re-sync only mismatched photos
npm run fix-ingredients       # sanitize all recipe ingredients in SQLite
```

**Admin panel:** `http://localhost:3000/admin` — login with **admin** / **Nirav@123** (change via `ADMIN_USERNAME` & `ADMIN_PASSWORD` in `server/.env`). Manage partners, payments, social links, quality & bug fixer.

On server start, **Quality Guardian** auto-fixes only bad/missing photos (not full re-sync). Disable: `GUARDIAN_DISABLED=1`.

**Or two terminals:**

```bash
npm run dev:server    # Terminal 1 → http://localhost:5000
npm run dev:client    # Terminal 2 → http://localhost:3000
```

> **Vite proxy error `ECONNREFUSED 127.0.0.1:5000`?**  
> Sirf `dev:client` chalaya hai — backend band hai. `npm run dev` use karo, ya alag terminal mein `npm run dev:server` chalao. Check: `curl http://localhost:5000/api/health`

> **Port 3000 already in use / server crash?**  
> Purana dev server band nahi hua. Pehle ports free karo, phir dubara start karo:
> ```bash
> npm run dev:kill
> npm run dev
> ```
> Agar 3000 busy ho to Vite automatically 3001 try karega — terminal mein jo URL dikhe wahi kholo.

> **Note:** `npm install` no longer downloads recipes from the internet. Curated ~900 recipes ship with the repo. To rebuild from APIs (slow): `npm run build-recipe-books -- --force`

### Phone on same Wi‑Fi (Mac)

`localhost` sirf Mac par chalta hai. Phone se khulne ke liye Mac ka IP use karo:

```bash
# Mac par IP dekho (Wi‑Fi)
ipconfig getifaddr en0
```

Phir dono servers chalao (`dev:server` + `dev:client`). Terminal mein Vite **Network** URL dikhega, jaise:

`http://192.168.1.42:3000`

Wahi URL phone browser mein kholo (Mac aur phone **same Wi‑Fi**).

Agar na khule: Mac **System Settings → Network → Firewall** mein Node/Vite allow karo, ya firewall temporarily off karke try karo.

## Regenerate Recipes

```bash
cd server
npm run generate-recipes
```

Generates 11 JSON files under `server/src/data/generated/` totaling ~570,000 recipes.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + recipe count |
| GET | `/api/recipes` | Paginated recipes (filters: diet, cuisine, category, search) |
| GET | `/api/recipes/trending` | Hot Makings — top rated recipes |
| GET | `/api/recipes/:id` | Single recipe with cooking flow |
| GET | `/api/recipes/categories` | Categories + cuisine counts |
| GET | `/api/recipes/:id/rating` | Recipe rating |
| POST | `/api/recipes/:id/rate` | Rate a recipe |
| GET/POST/DELETE | `/api/favorites` | Favorites |
| POST | `/api/pantry/suggest` | Pantry-based suggestions |
| POST | `/api/plan` | Weekly meal plan |
| POST | `/api/plan/healthy` | Healthy week plan |
| POST | `/api/auth/register` | Create account (optional) |
| POST | `/api/auth/login` | Login |

## Cuisines

Indian, North Indian, South Indian, Chinese, Italian, Korean, Thai, Mexican, Continental, Healthy

## License

MIT
