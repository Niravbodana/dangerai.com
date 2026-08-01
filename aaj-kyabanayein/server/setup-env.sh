#!/bin/bash
# Run once from server folder: bash setup-env.sh
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  echo ".env already exists at $ENV_FILE"
  exit 0
fi
cp "$(dirname "$0")/.env.example" "$ENV_FILE"
echo "Created $ENV_FILE — paste your Gemini API key from https://aistudio.google.com/apikey"
echo "Edit: nano $ENV_FILE"
echo "Then restart: npm run dev:server"
