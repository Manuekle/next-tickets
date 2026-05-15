#!/bin/bash
# Manual Supabase setup — run after creating the project via UI

set -e

if [ -z "$SUPABASE_DB_URL" ]; then
    echo ""
    echo "============================================="
    echo "  Manual Supabase Setup"
    echo "============================================="
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/new"
    echo "2. Create project 'next-tickets' (password guardalo)"
    echo "3. Espera 1-2 min a que termine la creación"
    echo "4. Ve a Project Settings → Database → Connection string"
    echo "5. Copia la URI (postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres)"
    echo ""
    echo "Luego ejecuta:"
    echo "  export SUPABASE_DB_URL='postgresql://postgres:tu-pass@db.tu-proyecto.supabase.co:5432/postgres'"
    echo "  bash scripts/setup-supabase-manual.sh"
    exit 0
fi

echo "1️⃣  Migrating database..."
cd /home/manudev/Dev/next-tickets/apps/api
DATABASE_URL="$SUPABASE_DB_URL" npx prisma db push --accept-data-loss 2>&1 | tail -3

echo ""
echo "2️⃣  Seeding data..."
DATABASE_URL="$SUPABASE_DB_URL" npx ts-node prisma/seed.ts 2>&1

echo ""
echo "3️⃣  Generating .env.production..."
cat > /home/manudev/Dev/next-tickets/.env.production << ENVEOF
NODE_ENV=production
PORT=7860
FRONTEND_URL=https://next-tickets.vercel.app
DATABASE_URL=$SUPABASE_DB_URL
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# S3 (Backblaze B2 — free tier)
S3_ENDPOINT=https://s3.us-east-1.backblazeb2.com
S3_REGION=us-east-1
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
S3_BUCKET=next-tickets
S3_PUBLIC_URL=https://f000.backblazeb2.com/file/next-tickets

# SMTP (Resend — free 100 emails/day)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=smtp
SMTP_PASS=your-resend-key
EMAIL_FROM=noreply@nexttickets.com
ENVEOF

echo "✅ .env.production created"
echo ""
echo "Contents to copy to Hugging Face Secrets:"
echo "─────────────────────────────────────────"
cat /home/manudev/Dev/next-tickets/.env.production | grep -v '^#' | grep -v '^$'
echo "─────────────────────────────────────────"
echo ""
echo "All done! ✅"