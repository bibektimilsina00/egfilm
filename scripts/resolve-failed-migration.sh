#!/bin/bash

# Resolve Failed Migration Script
# This script resolves the failed 20251021_add_admin_features migration

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Resolving Failed Migration: 20251021_add_admin_features"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mark the failed migration as resolved
echo "▶ Marking migration as resolved..."
npx prisma migrate resolve --applied 20251021_add_admin_features

if [ $? -eq 0 ]; then
    echo "✔ Migration marked as resolved"
    
    # Deploy any pending migrations
    echo "▶ Deploying pending migrations..."
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✔ All migrations deployed successfully"
        exit 0
    else
        echo "✖ Failed to deploy migrations"
        exit 1
    fi
else
    echo "✖ Failed to resolve migration"
    exit 1
fi
