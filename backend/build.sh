#!/bin/bash
# Smart Prisma build script for production deployment
# Handles both fresh databases and existing production databases

echo "🔍 Checking database state..."

# Generate Prisma Client first (always needed)
npx prisma generate

# Check if _prisma_migrations table exists
MIGRATIONS_EXIST=$(npx prisma db execute --stdin <<SQL
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = '_prisma_migrations'
) as exists;
SQL
)

if [[ "$MIGRATIONS_EXIST" == *"true"* ]]; then
  echo "✅ Existing database detected - using db push (safe for production)"
  # Use db push for existing databases - syncs schema without running migrations
  npx prisma db push --skip-generate
else
  echo "🆕 Fresh database detected - running migrations"
  # Fresh database - run all migrations
  npx prisma migrate deploy
fi

echo "✅ Database sync complete!"
