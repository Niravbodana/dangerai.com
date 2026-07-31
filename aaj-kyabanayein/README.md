# Aaj Kya Banayein 🍳

Roz ki tension — aaj kya banayein? Meal planner app with monthly subscription model.

**Stack:** Node.js (Express) + React (Vite)

## Features

- **22,000+ Indian recipes** with food photos
- **Step-by-step Cooking Mode** — cut, cook, timer, serve flow
- **Ghar me kya pada** — pantry-based recipe suggestions
- **Weekly Healthy Plan** — 7-day health-focused meals
- Separate categories: Veg/Non-Veg × Breakfast/Lunch/Dinner
- Diet filters: Veg, Non-veg, Jain, Diabetic, Vegan
- Grocery list (Pro plan)
- Login/Signup with saved preferences
- Subscription pricing: Free / ₹99 Pro / ₹199 Family

## Project Structure

```
aaj-kyabanayein/
├── server/          # Node.js Express API
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── services/
│       └── data/
└── client/          # React Vite frontend
    └── src/
        ├── pages/
        └── components/
```

## Run Locally

### 1. Start Backend (Node.js)

```bash
cd server
npm install
npm run dev
```

Server runs on http://localhost:5000

### 2. Start Frontend (React)

```bash
cd client
npm install
npm run dev
```

App runs on http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/recipes/:id` | Single recipe with full cooking flow |
| GET | `/api/recipes/categories` | Category list with counts |
| GET | `/api/pantry/items` | Common pantry items |
| POST | `/api/pantry/suggest` | Suggest recipes from home ingredients |
| POST | `/api/plan/healthy` | 7-day healthy meal plan |
| GET | `/api/pricing` | Subscription plans |
| POST | `/api/plan` | Generate meal plan (auth optional) |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (JWT required) |
| PUT | `/api/auth/preferences` | Save user preferences (JWT required) |

### POST /api/plan body example

```json
{
  "diet": "veg",
  "budget": "medium",
  "familySize": 4,
  "maxCookTime": 45,
  "plan": "pro"
}
```

## Regenerate Recipes (22,000+)

```bash
cd server
npm run generate-recipes   # Creates generatedRecipes.json (~30MB)
npm run dev                # postinstall auto-runs generator
```

**Coming soon cuisines:** Italian, Korean (structure ready)

## Cooking Flow

Each recipe has step-by-step flow:
1. **Samaan check** — ingredients list with checkboxes
2. **Cut/Prep** — "4 pyaz kaato" with next button
3. **Cook/Steam/Fry** — with built-in timer
4. **Serve** — final step
5. **Done!** 🎉

Try: `/recipe/chole-bhature` → **Start Cooking**

## Next Steps

- [ ] Razorpay subscription integration
- [x] User login/signup (JWT)
- [x] More recipes (30+ dishes)
- [ ] AI-powered custom recipes (OpenAI API)
