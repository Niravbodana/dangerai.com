# Rasoira

Ghar ka khana — free meal planner for Indian home cooks. 770+ real recipes with authentic ingredients, Hot Makings, pantry suggestions, and step-by-step cooking.

**Stack:** Node.js (Express) + React (Vite) + Tailwind CSS

## Features

- **770+ real recipes** across 11 cuisines (Indian, Chinese, Thai, Korean, Italian, Mexican, and more) — authentic ingredients & cooking steps
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
│       ├── data/curated/     # 770+ real recipes (TheMealDB + hand-crafted Indian)
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

### Backend

```bash
cd server
npm install          # builds curated recipe books on first install
npm run dev          # http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev          # http://localhost:3000
```

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
