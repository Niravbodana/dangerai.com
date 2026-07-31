# Aaj Kya Banayein 🍳

Roz ki tension — aaj kya banayein? Meal planner app with monthly subscription model.

**Stack:** Node.js (Express) + React (Vite)

## Features

- Daily meal plan (nashta, lunch, dinner)
- Diet filters: Veg, Non-veg, Jain, Diabetic, Vegan
- Budget-based recipes (sasta / medium / premium)
- Grocery list (Pro plan)
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
| GET | `/api/recipes` | All recipes |
| GET | `/api/pricing` | Subscription plans |
| POST | `/api/plan` | Generate meal plan |

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

## Next Steps

- [ ] Razorpay subscription integration
- [ ] User login (JWT)
- [ ] More recipes database
- [ ] AI-powered custom recipes (OpenAI API)
