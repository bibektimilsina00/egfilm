#!/bin/bash

# Local Development Setup Script for StreamFlix
# This script sets up PostgreSQL with Docker and configures your local environment

set -e

echo "🎬 StreamFlix Local Development Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 Creating .env.local file...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✅ .env.local created${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env.local and add your TMDb API key${NC}"
    echo "Get your API key from: https://www.themoviedb.org/settings/api"
    echo ""
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing npm dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Starting PostgreSQL with Docker Compose...${NC}"

# Start only the database service
docker-compose up -d database

# Wait for PostgreSQL to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if database is healthy
RETRIES=0
MAX_RETRIES=30

while ! docker exec streamflix-postgres pg_isready -U movieuser -d moviedb &> /dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ $RETRIES -eq $MAX_RETRIES ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        echo "Check logs with: docker logs streamflix-postgres"
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
echo ""

# Generate Prisma Client
echo -e "${BLUE}🔧 Generating Prisma Client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
npx prisma migrate deploy

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Local development environment is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Database Info:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: moviedb"
echo "  User: movieuser"
echo ""
echo "🔗 Connection String:"
echo "  postgresql://movieuser:moviepass@localhost:5432/moviedb"
echo ""
echo "📝 Next Steps:"
echo "  1. Edit .env.local and add your TMDb API key"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:8000"
echo ""
echo "🛠️  Useful Commands:"
echo "  • View database: npx prisma studio"
echo "  • Stop database: docker-compose down"
echo "  • View logs: docker logs streamflix-postgres"
echo "  • Reset database: npm run db:reset"
echo ""

# Check if TMDb API key is set
if grep -q "your_tmdb_api_key_here" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Don't forget to add your TMDb API key in .env.local!${NC}"
    echo ""
fi
