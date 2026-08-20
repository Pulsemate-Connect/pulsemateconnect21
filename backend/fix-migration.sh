#!/bin/bash
# Fix Failed Migration Script
# Run this in Render Shell or locally with DATABASE_URL set

echo "🔧 Fixing failed migration..."
echo ""

# Resolve the failed migration
echo "Step 1: Marking migration as applied..."
npx prisma migrate resolve --applied 20260809_critical_bug_fixes

if [ $? -eq 0 ]; then
  echo "✅ Migration resolved successfully!"
  echo ""
  echo "Step 2: Checking migration status..."
  npx prisma migrate status
  echo ""
  echo "✅ DONE! Now trigger a new deployment on Render."
  echo ""
  echo "Go to: https://dashboard.render.com"
  echo "Click: Manual Deploy → Deploy latest commit"
else
  echo "❌ Failed to resolve migration"
  echo ""
  echo "Try alternative method:"
  echo "npx prisma migrate resolve --rolled-back 20260809_critical_bug_fixes"
fi
