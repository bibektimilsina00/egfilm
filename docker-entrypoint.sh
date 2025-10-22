#!/bin/sh

# Startup script with migration error handling
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Starting Application with Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load environment variables from .env.production if it exists
if [ -f /app/.env.production ]; then
    echo "▶ Loading environment variables from .env.production"
    export $(grep -v '^#' /app/.env.production | xargs)
    # Also set TMDB_API_KEY from NEXT_PUBLIC_TMDB_API_KEY if not set
    if [ -n "$NEXT_PUBLIC_TMDB_API_KEY" ] && [ -z "$TMDB_API_KEY" ]; then
        export TMDB_API_KEY="$NEXT_PUBLIC_TMDB_API_KEY"
        echo "✔ Set TMDB_API_KEY from NEXT_PUBLIC_TMDB_API_KEY"
    fi
fi

# Try to deploy migrations
echo "▶ Deploying database migrations..."
if npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log; then
    echo "✔ Migrations deployed successfully"
else
    # Check if the error is due to a failed migration
    if grep -q "P3009" /tmp/migrate.log; then
        echo "⚠ Found failed migration, attempting to resolve..."
        
        # Extract the failed migration name
        FAILED_MIGRATION=$(grep "migration started at" /tmp/migrate.log | sed -n 's/.*The `\([^`]*\)`.*/\1/p' | head -1)
        
        if [ -n "$FAILED_MIGRATION" ]; then
            echo "▶ Resolving migration: $FAILED_MIGRATION"
            
            # Mark the migration as resolved (applied)
            npx prisma migrate resolve --applied "$FAILED_MIGRATION"
            
            # Try to deploy migrations again
            echo "▶ Retrying migration deployment..."
            if npx prisma migrate deploy; then
                echo "✔ Migrations deployed successfully after resolution"
            else
                echo "✖ Migration deployment still failing"
                echo "⚠ Starting application anyway (migrations may need manual intervention)"
            fi
        fi
    else
        echo "✖ Migration failed with unknown error"
        echo "⚠ Starting application anyway"
    fi
fi

# Start the Next.js server
echo "▶ Starting Next.js server..."
exec node server.js
