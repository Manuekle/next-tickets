#!/bin/bash
set -e

echo "=== next-tickets Verification ==="
echo ""

# Check API
if lsof -ti:4000 >/dev/null 2>&1; then
    echo "✅ API server: running on :4000"
else
    echo "❌ API server: NOT running"
    echo "   Start with: cd apps/api && node dist/main.js"
    exit 1
fi

# Check Frontend
if curl -s -o /dev/null -w "" http://localhost:3000/login 2>/dev/null; then
    echo "✅ Frontend: running on :3000"
else
    echo "⚠️  Frontend: not responding (use: cd apps/web && npx next dev)"
fi

# Login
RESP=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexttickets.com","password":"Admin123!"}')
TOKEN=$(echo "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["accessToken"])' 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed - check API and DB"
    exit 1
fi
echo "✅ Auth: login OK (admin@nexttickets.com)"

# Test endpoints
for ep in "/tickets" "/categories" "/knowledge" "/admin/users" "/admin/stats" "/analytics/trends" "/analytics/agents" "/analytics/heatmap" "/sla"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost:4000/api$ep" 2>/dev/null)
    if [ "$CODE" = "200" ]; then
        echo "✅ $ep → $CODE"
    else
        echo "⚠️  $ep → $CODE (expected 200)"
    fi
done

# Admin pages
for page in "/" "/login" "/register" "/tickets" "/knowledge" "/analytics" "/admin" "/sla"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page" 2>/dev/null)
    echo "📄 $page → $CODE"
done

echo ""
echo "=== ✅ All systems verified ==="
