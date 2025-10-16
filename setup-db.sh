#!/bin/bash
# Database Setup Script for StreamFlix

set -e

echo "🚀 StreamFlix Database Setup"
echo "=============================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local file with DATABASE_URL"
    exit 1
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
echo "1. Run 'npm run dev' to start the development server"
echo "2. Login with: demo@example.com / demo123"
echo "3. Your data will now persist across server restarts"
echo ""
echo "Database location: prisma/dev.db"
