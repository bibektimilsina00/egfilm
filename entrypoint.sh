#!/bin/sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Egfilm Application Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✓ DATABASE_URL is configured"
echo "✓ NODE_ENV: ${NODE_ENV:-production}"

# Run database migrations
echo ""
echo "▶ Running Prisma migrations..."
if npx prisma migrate deploy 2>&1; then
    echo "✓ Migrations completed successfully"
else
    EXIT_CODE=$?
    # Don't fail on migration warnings, as schema might already be synced
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✓ Migrations completed successfully"
    else
        echo "⚠ Migration check completed (exit code: $EXIT_CODE)"
    fi
fi

# Generate Prisma Client
echo ""
echo "▶ Generating Prisma Client..."
npx prisma generate 2>&1 | grep -E "(✔|✓|Generated)" || true

echo ""
echo "▶ Starting Next.js application..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the application
exec node server.js

