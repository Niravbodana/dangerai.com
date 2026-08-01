#!/bin/bash
# Run once from server folder: bash setup-env.sh
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  echo ".env already exists at $ENV_FILE"
  exit 0
fi
cp "$(dirname "$0")/.env.example" "$ENV_FILE"
echo "Created $ENV_FILE"
echo ""
echo "Add your API keys:"
echo "  GROQ_API_KEY  — https://console.groq.com/keys (fast, recommended)"
echo "  GEMINI_API_KEY — https://aistudio.google.com/apikey (fallback)"
echo ""
echo "Edit: nano $ENV_FILE"
echo "Then restart: npm run dev:server"
