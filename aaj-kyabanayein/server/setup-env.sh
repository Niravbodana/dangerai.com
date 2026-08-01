#!/bin/bash
# Run once: bash setup-env.sh
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
  echo ".env already exists at $ENV_FILE"
  exit 0
fi
cat > "$ENV_FILE" << 'EOF'
# Gemini API key from https://aistudio.google.com/apikey
GEMINI_API_KEY=AQ.Ab8RN6Ioyg6TOiPIzXHqPPNxYZyEprWCxA4RQJwKWs-nyRqSRQ
GOOGLE_API_KEY=AQ.Ab8RN6Ioyg6TOiPIzXHqPPNxYZyEprWCxA4RQJwKWs-nyRqSRQ
GEMINI_MODEL=gemini-2.0-flash-lite
EOF
echo "Created $ENV_FILE with your Gemini API key"
echo "Restart server: npm run dev:server"
