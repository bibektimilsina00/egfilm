#!/bin/bash

# Database Migration Script
# This script helps separate egfilm and egfilm-admin databases

set -e

echo "🔄 Database Separation Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database credentials
DB_HOST="128.199.195.107"
DB_PORT="5432"
DB_USER="egfilm_admin"
DB_PASS="anihortes"
CURRENT_DB="egfilm-database"
NEW_ADMIN_DB="egfilm-admin-database"

echo -e "${YELLOW}Current Setup:${NC}"
echo "  Main App (egfilm) -> $CURRENT_DB"
echo "  Admin App (egfilm-admin) -> $CURRENT_DB (⚠️  CONFLICT!)"
echo ""

echo -e "${GREEN}Proposed Setup:${NC}"
echo "  Main App (egfilm) -> $CURRENT_DB"
echo "  Admin App (egfilm-admin) -> $NEW_ADMIN_DB"
echo ""

# Step 1: Create new admin database
echo -e "${YELLOW}Step 1: Create new admin database${NC}"
echo "Run this SQL on your PostgreSQL server:"
echo ""
echo "CREATE DATABASE \"$NEW_ADMIN_DB\";"
echo "GRANT ALL PRIVILEGES ON DATABASE \"$NEW_ADMIN_DB\" TO $DB_USER;"
echo ""

read -p "Have you created the new database? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please create the database first and run this script again.${NC}"
    exit 1
fi

# Step 2: Update egfilm-admin .env
echo ""
echo -e "${YELLOW}Step 2: Update egfilm-admin database connection${NC}"

ADMIN_ENV_FILE="../egfilm-admin/.env"
NEW_DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$NEW_ADMIN_DB?connection_limit=50&pool_timeout=60&connect_timeout=30"

if [ -f "$ADMIN_ENV_FILE" ]; then
    # Backup existing .env
    cp "$ADMIN_ENV_FILE" "$ADMIN_ENV_FILE.backup"
    echo "  ✓ Backed up existing .env to .env.backup"
    
    # Update DATABASE_URL
    if grep -q "DATABASE_URL=" "$ADMIN_ENV_FILE"; then
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$NEW_DATABASE_URL|" "$ADMIN_ENV_FILE"
        echo "  ✓ Updated DATABASE_URL in egfilm-admin/.env"
    else
        echo "DATABASE_URL=$NEW_DATABASE_URL" >> "$ADMIN_ENV_FILE"
        echo "  ✓ Added DATABASE_URL to egfilm-admin/.env"
    fi
else
    echo -e "${RED}  ✗ egfilm-admin/.env not found${NC}"
    exit 1
fi

# Step 3: Run migrations for admin
echo ""
echo -e "${YELLOW}Step 3: Initialize egfilm-admin database${NC}"
cd ../egfilm-admin
echo "  Running: npx prisma migrate deploy"
npx prisma migrate deploy
echo "  Running: npx prisma generate"
npx prisma generate
echo "  ✓ Admin database initialized"

# Step 4: Migrate blog data (optional)
echo ""
echo -e "${YELLOW}Step 4: Migrate existing blog data (optional)${NC}"
echo "Do you want to migrate existing blog posts from the old database?"
read -p "(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Run this SQL to export blog data from old database:"
    echo ""
    echo "pg_dump -h $DB_HOST -U $DB_USER -d $CURRENT_DB \\"
    echo "  -t 'BlogPost' -t 'BlogComment' -t 'BlogLike' -t 'BlogCategory' \\"
    echo "  --data-only --inserts > blog_data.sql"
    echo ""
    echo "Then import to new database:"
    echo "psql -h $DB_HOST -U $DB_USER -d $NEW_ADMIN_DB < blog_data.sql"
    echo ""
fi

# Step 5: Clean up egfilm schema
echo ""
echo -e "${YELLOW}Step 5: Clean up main app schema${NC}"
cd ../egfilm

echo "Removing blog-related models from egfilm schema..."
# This would need manual editing of schema.prisma

echo ""
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo ""
echo "Summary:"
echo "  ✓ Created new admin database: $NEW_ADMIN_DB"
echo "  ✓ Updated egfilm-admin to use new database"
echo "  ✓ Ran migrations for admin database"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Remove blog models from egfilm/prisma/schema.prisma"
echo "  2. Run 'npx prisma migrate dev' in egfilm directory"
echo "  3. Test both applications"
echo "  4. Update production secrets with new DATABASE_URL"
echo ""
echo -e "${YELLOW}Rollback Instructions:${NC}"
echo "  If something goes wrong, restore egfilm-admin/.env.backup"
echo ""
