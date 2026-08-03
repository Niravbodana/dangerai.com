export function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      auth_provider TEXT DEFAULT 'email',
      picture TEXT,
      plan TEXT DEFAULT 'free',
      preferences TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT,
      meal_type TEXT NOT NULL,
      cuisine TEXT DEFAULT 'indian',
      category TEXT,
      budget TEXT DEFAULT 'medium',
      cook_time INTEGER DEFAULT 30,
      calories INTEGER DEFAULT 300,
      spice TEXT DEFAULT 'medium',
      health_score INTEGER DEFAULT 5,
      thumb_url TEXT,
      local_image TEXT,
      source TEXT DEFAULT 'curated',
      is_custom INTEGER DEFAULT 0,
      owner_user_id TEXT,
      tags TEXT DEFAULT '[]',
      diet TEXT DEFAULT '[]',
      pantry_keys TEXT DEFAULT '[]',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      name_hi TEXT,
      quantity TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      lang TEXT NOT NULL CHECK (lang IN ('en','hi')),
      sort_order INTEGER NOT NULL,
      body TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, recipe_id)
    );

    CREATE TABLE IF NOT EXISTS recipe_ratings (
      recipe_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (recipe_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS saved_meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      recipe_name TEXT,
      meal_date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      added_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      recipe_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_images (
      recipe_id TEXT PRIMARY KEY,
      file_path TEXT,
      source TEXT,
      title TEXT,
      original_url TEXT,
      score REAL,
      fetched_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
    CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_meals_user ON saved_meals(user_id);

    CREATE TABLE IF NOT EXISTS user_sync (
      user_id TEXT NOT NULL,
      sync_key TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, sync_key)
    );

    CREATE TABLE IF NOT EXISTS kitchen_helpers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      language TEXT DEFAULT 'hi',
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS helper_tokens (
      token TEXT PRIMARY KEY,
      helper_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS imported_recipes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT,
      source_type TEXT,
      recipe_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      subscription_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, endpoint)
    );

    CREATE INDEX IF NOT EXISTS idx_kitchen_helpers_user ON kitchen_helpers(user_id);
    CREATE INDEX IF NOT EXISTS idx_imported_recipes_user ON imported_recipes(user_id);

    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'created',
      created_at TEXT NOT NULL,
      paid_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_razorpay ON payment_orders(razorpay_order_id);
  `);
}
