#!/bin/bash
# Start development servers for next-tickets
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Starting infrastructure..."
cd "$SCRIPT_DIR" && docker compose -f docker/docker-compose.yml up -d postgres 2>/dev/null
sleep 1

echo "Pushing Prisma schema..."
cd "$SCRIPT_DIR/apps/api"
DATABASE_URL="postgresql://user:pass@localhost:5432/next_tickets" npx prisma db push --accept-data-loss 2>/dev/null

echo "Starting API on port 4000..."
cd "$SCRIPT_DIR/apps/api"
DATABASE_URL="postgresql://user:pass@localhost:5432/next_tickets" nohup node dist/main.js </dev/null > /tmp/api.log 2>&1 &
echo $! > /tmp/api.pid
sleep 2

echo "Starting Frontend on port 3000..."
cd "$SCRIPT_DIR/apps/web"
nohup npx next dev </dev/null > /tmp/web.log 2>&1 &
echo $! > /tmp/web.pid

echo ""
echo "=========================================="
echo "  next-tickets running!"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:4000/api"
echo "=========================================="
echo "  Login:    admin@nexttickets.com"
echo "  Password: Admin123!"
echo "=========================================="
echo ""
echo "To stop: kill \$(cat /tmp/api.pid) \$(cat /tmp/web.pid)"
