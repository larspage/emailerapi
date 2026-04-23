#!/usr/bin/env bash
set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-3000}"
MAX_WAIT_SECONDS=60

echo "=========================================="
echo "  Starting EmailerAPI"
echo "=========================================="
echo ""

# Ensure data directory exists
mkdir -p data

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "Dependencies installed."
    echo ""
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."

    # Generate a secure API key (64 hex chars)
    API_KEY=$(openssl rand -hex 32)

    cat > .env <<EOF
PORT=$PORT
LOG_LEVEL=info
LOKI_URL=http://localhost:3100
NODE_ENV=development
API_KEY=$API_KEY

# SMTP (email sending)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM="Sender Name <sender@example.com>"

# Database
DB_PATH=./data/emailer.db
EOF
    echo ".env created."
    echo ""
    echo "  Generated API Key: $API_KEY"
    echo ""
fi

echo "Starting API on port $PORT..."
echo ""

# Start dev server in background
PORT=$PORT npm run dev > /tmp/emailerapi-dev.log 2>&1 &
PID=$!

echo "Server starting (PID: $PID)..."
echo ""

# Health check - poll until server is up
echo "Waiting for server to be ready..."

for i in $(seq 1 $MAX_WAIT_SECONDS); do
    if curl -sSf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
        echo ""
        echo "========================================"
        echo "  Server is UP and RUNNING!"
        echo "========================================"
        echo ""
        echo "  URL: http://localhost:$PORT"
        echo ""
        echo "  To stop the server:"
        echo "    kill $PID"
        echo ""
        echo "  Server logs: tail -f /tmp/emailerapi-dev.log"
        echo ""
        echo "========================================"
        echo ""
        trap 'kill $PID 2>/dev/null; exit 0' SIGINT SIGTERM
        wait $PID
    fi

    # Show progress every 5 seconds
    if [ $((i % 5)) -eq 0 ]; then
        echo "  Still waiting... ($i seconds)"
    fi

    sleep 1
done

echo ""
echo "Error: Server did not start within $MAX_WAIT_SECONDS seconds" >&2
echo "Check logs: tail -f /tmp/emailerapi-dev.log" >&2
kill $PID 2>/dev/null || true
exit 1