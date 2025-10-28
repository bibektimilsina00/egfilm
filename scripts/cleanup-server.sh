#!/bin/bash

# Egfilm Server Cleanup Script
# This script helps transition from full setup to minimal streaming-only setup
# Removes unnecessary Docker containers, images, and volumes

set -e

echo "🧹 Egfilm Server Cleanup - Removing unnecessary services..."
echo "This will remove: Redis, BullMQ worker, admin panel, and related data"
echo ""

# Function to ask for confirmation
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
}

# Stop and remove existing containers
if confirm "Stop and remove existing Egfilm containers?"; then
    echo "🛑 Stopping containers..."
    docker compose down --remove-orphans 2>/dev/null || true
    
    # Remove specific containers if they exist
    containers=("egfilm-worker" "egfilm-redis" "egfilm-admin" "egfilm-app" "egfilm-postgres")
    for container in "${containers[@]}"; do
        if docker ps -a --format "table {{.Names}}" | grep -q "^${container}$"; then
            echo "🗑️  Removing container: $container"
            docker rm -f "$container" 2>/dev/null || true
        fi
    done
fi

# Remove unused Docker images
if confirm "Remove unused Egfilm Docker images?"; then
    echo "🗑️  Removing unused Docker images..."
    
    # Remove worker and admin specific images
    docker rmi ghcr.io/bibektimilsina00/egfilm:deploy-worker 2>/dev/null || true
    docker rmi egfilm-admin 2>/dev/null || true
    
    # Clean up dangling images
    docker image prune -f
fi

# Remove Redis data (since we're not using it anymore)
if confirm "Remove Redis data volume? (Background job queue data will be lost)"; then
    echo "🗑️  Removing Redis data..."
    docker volume rm egfilm_redis_data 2>/dev/null || true
fi

# Keep PostgreSQL data but ask for confirmation
if confirm "⚠️  WARNING: Remove PostgreSQL data? (ALL user data and movie metadata will be lost!)"; then
    echo "🗑️  Removing PostgreSQL data..."
    docker volume rm egfilm_postgres_data 2>/dev/null || true
else
    echo "✅ PostgreSQL data preserved"
fi

# Create backup of current docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    echo "📦 Backing up current docker-compose.yml to docker-compose.full.yml.backup"
    cp docker-compose.yml docker-compose.full.yml.backup
fi

# Clean up system resources
echo "🧼 Cleaning up Docker system resources..."
docker system prune -f

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📋 Summary of changes:"
echo "   ❌ Removed: Redis (caching/job queue)"
echo "   ❌ Removed: BullMQ Worker (background jobs)"
echo "   ❌ Removed: Admin panel services"
echo "   ✅ Kept: PostgreSQL database"
echo "   ✅ Kept: Main streaming application"
echo "   📝 Updated: docker-compose.yml now uses minimal configuration"
echo "   📦 Backup: Original saved as docker-compose.full.yml.backup"
echo ""
echo "🚀 To start the minimal setup:"
echo "   docker compose up -d"
echo ""
echo "📝 Note: Background features like blog generation are now disabled."
echo "   The app will focus purely on streaming functionality."