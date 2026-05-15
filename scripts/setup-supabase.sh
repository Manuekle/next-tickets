#!/bin/bash
set -e

echo "============================================="
echo "  next-tickets — Supabase + HF Setup"
echo "============================================="
echo ""

# Check token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not set"
    echo "   export SUPABASE_ACCESS_TOKEN=your_token"
    exit 1
fi

PROJECT_NAME="next-tickets"
ORG_NAME=$(echo "$SUPABASE_ACCESS_TOKEN" | cut -d'.' -f1 2>/dev/null || echo "personal")

echo "1️⃣  Creating Supabase project..."
PROJECT_JSON=$(npx supabase projects create "$PROJECT_NAME" \
  --org-id "$ORG_NAME" \
  --plan free \
  --region us-east-1 \
  --db-password "$(openssl rand -base64 16)" 2>&1)

PROJECT_ID=$(echo "$PROJECT_JSON" | grep -oP 'id: \K[a-z0-9-]+' | head -1)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Failed to create project. Trying manual setup..."
    echo "   Go to: https://supabase.com/dashboard/new"
    echo "   Create project '$PROJECT_NAME'"
    echo ""
    echo "   Then run: ./scripts/setup-supabase-step2.sh"
    exit 1
fi

echo "✅ Project created: $PROJECT_ID"
echo "   Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"

echo ""
echo "2️⃣  Waiting for database to be ready (60s)..."
sleep 60

echo ""
echo "3️⃣  Getting connection string..."
DB_URL=$(npx supabase projects list --output json 2>/dev/null | \
  python3 -c "import sys,json; projects=json.load(sys.stdin); p=[x for x in projects if x['id']=='$PROJECT_ID']; print(p[0]['db_url'] if p else '')" 2>/dev/null)

if [ -z "$DB_URL" ]; then
    # Alternative: construct manually
    DB_PASSWORD=$(echo "$PROJECT_JSON" | grep -oP 'db_password: \K.*' | head -1)
    DB_URL="postgresql://postgres:$DB_PASSWORD@db.$PROJECT_ID.supabase.co:5432/postgres"
fi

echo "✅ Database URL obtained"
echo "   $DB_URL" | sed 's/:[^:@]*@/:****@/'

echo ""
echo "4️⃣  Running migrations..."
cd /home/manudev/Dev/next-tickets/apps/api
DATABASE_URL="$DB_URL" npx prisma db push --accept-data-loss 2>&1 | tail -3
DATABASE_URL="$DB_URL" npx ts-node prisma/seed.ts 2>&1

echo ""
echo "5️⃣  Generating .env.production..."
cat > /home/manudev/Dev/next-tickets/.env.production << ENVEOF
NODE_ENV=production
PORT=7860
FRONTEND_URL=https://next-tickets.vercel.app
DATABASE_URL=$DB_URL
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
ENVEOF

echo "✅ .env.production created"

echo ""
echo "============================================="
echo "  Setup Complete!"
echo "============================================="
echo ""
echo "Next steps:"
echo "  1. Deploy API to Hugging Face:"
echo "     https://huggingface.co/new-space"
echo "     - Owner: Manuekle"
echo "     - Space name: next-tickets"
echo "     - SDK: Docker"
echo ""
echo "  2. Copy .env.production contents to"
echo "     HF Space → Settings → Repository Secrets"
echo ""
echo "  3. Set Dockerfile path in HF Space:"
echo "     docker/hf.Dockerfile"
echo ""
echo "  4. Deploy frontend to Vercel:"
echo "     npx vercel --prod"
echo "     NEXT_PUBLIC_API_URL=https://Manuekle-next-tickets.hf.space/api"
echo ""
echo "============================================="
