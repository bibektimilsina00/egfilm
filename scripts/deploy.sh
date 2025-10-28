#!/bin/bash

# Egfilm Production Deployment Script
# Deploy the streamlined streaming application (PostgreSQL + App only)
# Removed: Redis, BullMQ Worker, Admin Panel, Background Jobs

set -e

echo "🚀 Egfilm Production Deployment"
echo "Deploying optimized streaming application for VPS environments"
echo ""

# Configuration
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/bibektimilsina00/egfilm:latest}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
APP_DIR="${APP_DIR:-~/egfilm}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
log_info "Running pre-deployment checks..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Determine docker-compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

log_success "Docker and Docker Compose are available"

# Navigate to application directory
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR" || exit 1
    log_info "Changed to directory: $APP_DIR"
else
    log_error "Application directory not found: $APP_DIR"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Docker Compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Stop existing containers
log_info "Stopping existing containers..."
$DOCKER_COMPOSE down --remove-orphans || true

# Pull latest image
log_info "Pulling latest image: $IMAGE_NAME"
if IMAGE_NAME="$IMAGE_NAME" $DOCKER_COMPOSE pull; then
    log_success "Image pulled successfully"
else
    log_warning "Failed to pull image, using local version if available"
fi

# Start services
log_info "Starting services..."
if IMAGE_NAME="$IMAGE_NAME" $DOCKER_COMPOSE up -d; then
    log_success "Services started successfully"
else
    log_error "Failed to start services"
    exit 1
fi

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if $DOCKER_COMPOSE exec postgres pg_isready -U egfilm_admin -d egfilm-database &> /dev/null; then
        log_success "PostgreSQL is ready"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        log_error "PostgreSQL did not become ready in time"
        $DOCKER_COMPOSE logs postgres
        exit 1
    fi
done

# Run database migrations
log_info "Running database migrations..."
if $DOCKER_COMPOSE exec app npx prisma migrate deploy; then
    log_success "Database migrations completed"
else
    log_warning "Migration failed or not needed"
fi

# Health check
log_info "Performing health check..."
for i in {1..30}; do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        log_success "Application is healthy and responding"
        break
    fi
    echo -n "."
    sleep 3
    if [ $i -eq 30 ]; then
        log_error "Health check failed"
        echo ""
        log_info "Container status:"
        $DOCKER_COMPOSE ps
        echo ""
        log_info "Application logs:"
        $DOCKER_COMPOSE logs app --tail=20
        exit 1
    fi
done

# Show final status
echo ""
log_success "🎉 Deployment completed successfully!"
echo ""
log_info "Service Status:"
$DOCKER_COMPOSE ps
echo ""
log_info "Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
echo ""
log_info "Application URLs:"
echo "   🏠 Main App: http://localhost:8000"
echo "   🏥 Health Check: http://localhost:8000/api/health"
echo ""
log_info "Useful Commands:"
echo "   📊 View logs: $DOCKER_COMPOSE logs -f app"
echo "   🔄 Restart: $DOCKER_COMPOSE restart app" 
echo "   🛑 Stop: $DOCKER_COMPOSE down"
echo "   🧹 Cleanup: ./scripts/cleanup-server.sh"
echo "   🚀 Redeploy: ./scripts/deploy.sh"