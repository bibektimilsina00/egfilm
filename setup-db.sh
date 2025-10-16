#!/bin/bash
# Database Setup Script for StreamFlix - PostgreSQL

set -e

echo "🚀 StreamFlix Database Setup (PostgreSQL)"
echo "=========================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local file with DATABASE_URL"
    echo ""
    echo "Example DATABASE_URL for PostgreSQL:"
    echo "DATABASE_URL=postgresql://movieuser:moviepass@localhost:5432/moviedb"
    exit 1
fi

# Check if PostgreSQL is running (optional, but helpful)
if command -v pg_isready &> /dev/null; then
    echo "🔍 Checking PostgreSQL connection..."
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "⚠️  Warning: PostgreSQL doesn't seem to be running on localhost:5432"
        echo "If you're using Docker, make sure to start it with: docker-compose up -d database"
    else
        echo "✅ PostgreSQL is running"
    fi
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running:"
echo "   - Docker: docker-compose up -d database"
echo "   - Local: brew services start postgresql (macOS)"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Login with: demo@example.com / demo123"
echo "4. Your data will persist in PostgreSQL database"
echo ""
echo "Database: PostgreSQL at localhost:5432"
echo "View data: npx prisma studio"
echo ""
