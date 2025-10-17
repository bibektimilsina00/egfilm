#!/bin/bash

###########################################
# StreamFlix Deployment Script
# Blue-Green Deployment with Health Checks
###########################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="$HOME/streamflix"
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/bibektimilsina00/stream-flix:deploy}"
CONTAINER_GREEN="streamflix-green"
CONTAINER_BLUE="streamflix-blue"
PORT_GREEN=8000
PORT_BLUE=8001
MAX_HEALTH_RETRIES=30
HEALTH_CHECK_INTERVAL=2

# Logging functions
log_header() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

log_error() {
    echo -e "${RED}✖ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Error handler
error_exit() {
    log_error "$1"
    exit 1
}

# Check if running in deploy directory
check_deploy_dir() {
    if [ ! -d "$DEPLOY_DIR" ]; then
        log_warning "Deploy directory not found. Creating $DEPLOY_DIR"
        mkdir -p "$DEPLOY_DIR"
    fi
    cd "$DEPLOY_DIR" || error_exit "Failed to change to deploy directory"
}

# Pull latest image
pull_image() {
    log_step "Pulling latest image: $IMAGE_NAME"
    
    if ! docker pull "$IMAGE_NAME"; then
        error_exit "Failed to pull Docker image"
    fi
    
    log_success "Image pulled successfully"
}

# Check if .env exists
check_env_file() {
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        log_warning ".env file not found in $DEPLOY_DIR"
        log_info "Creating .env template..."
        
        cat > "$DEPLOY_DIR/.env" << 'EOF'
# StreamFlix Environment Configuration
DATABASE_URL=file:/app/data/production.db
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
AUTH_SECRET=your_nextauth_secret_here
AUTH_URL=http://your-server-ip:8000
NODE_ENV=production

# Sentry Error Tracking (auto-configured)
SENTRY_DSN=https://73d62c48c64afbc5fb35441b1fb775e4@o4510202904707072.ingest.de.sentry.io/4510202941079632
NEXT_PUBLIC_SENTRY_DSN=https://23b85080fcb3a0a10f7dda940109e093@o4510202904707072.ingest.de.sentry.io/4510202921353296

# Umami Analytics (Cloud)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id_here
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
EOF
        
        log_warning "Please edit $DEPLOY_DIR/.env with actual values"
        log_info "Continuing with existing .env (if container was running)..."
    fi
    
    # Create data directory if it doesn't exist
    if [ ! -d "$DATA_DIR" ]; then
        log_step "Creating data directory for database"
        mkdir -p "$DATA_DIR"
        log_success "Data directory created at $DATA_DIR"
    fi
}

# Health check function
health_check() {
    local container_name=$1
    local port=$2
    local retries=0
    
    log_step "Running health check for $container_name on port $port"
    
    while [ $retries -lt $MAX_HEALTH_RETRIES ]; do
        if curl -sf "http://localhost:$port" > /dev/null 2>&1; then
            log_success "Health check passed for $container_name"
            return 0
        fi
        
        retries=$((retries + 1))
        echo -n "."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    echo ""
    log_error "Health check failed for $container_name after $MAX_HEALTH_RETRIES attempts"
    return 1
}

# Stop and remove container
remove_container() {
    local container_name=$1
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_step "Removing existing container: $container_name"
        docker stop "$container_name" > /dev/null 2>&1 || true
        docker rm "$container_name" > /dev/null 2>&1 || true
        log_success "Container $container_name removed"
    fi
}



# Function to setup PostgreSQL database
setup_postgres() {
    log_header "DATABASE SETUP"

    # Create Docker network if not exists
    if ! docker network inspect app-network >/dev/null 2>&1; then
        log_step "Creating Docker network: app-network"
        docker network create app-network
        log_success "Docker network created"
    else
        log_success "Docker network already exists"
    fi

    # Start PostgreSQL container if not running
    if ! docker ps | grep -q database; then
        log_step "Starting PostgreSQL container..."

        docker run -d \
            --name database \
            --restart unless-stopped \
            --network app-network \
            -p "${POSTGRES_PORT:-5432}:5432" \
            -v postgres_data:/var/lib/postgresql/data \
            -e POSTGRES_USER="${POSTGRES_USER:-movieuser}" \
            -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-moviepass}" \
            -e POSTGRES_DB="${POSTGRES_DB:-moviedb}" \
            --health-cmd="pg_isready -h localhost -p 5432 -U ${POSTGRES_USER:-movieuser}" \
            --health-interval=10s \
            --health-timeout=5s \
            --health-retries=5 \
            postgres:16-alpine > /dev/null

        log_success "Database container started"
    else
        log_success "Database container already running"
    fi

    # Wait for the database container to be healthy
    log_progress_start "Waiting for database to be ready..."
    i=0
    CHARS="/-\|"
    until docker inspect --format "{{.State.Health.Status}}" database 2>/dev/null | grep -q "healthy"; do
        i=$(( (i+1) % ${#CHARS} ))
        echo -ne "${CHARS:$i:1} "
        sleep 0.2
    done
    log_progress_done "Database ready!"
}


# Start blue container (staging)
start_blue_container() {
    log_header "Starting Blue Container (Staging)"
    
    remove_container "$CONTAINER_BLUE"
    
    log_step "Starting $CONTAINER_BLUE on port $PORT_BLUE"
    
    if ! docker run -d \
        --name "$CONTAINER_BLUE" \
        --network app-network \
        -p "$PORT_BLUE:8000" \
        --env-file "$DEPLOY_DIR/.env" \
        --restart unless-stopped \
        "$IMAGE_NAME"; then
        error_exit "Failed to start blue container"
    fi
    
    log_success "Blue container started"
    
    # Health check
    if ! health_check "$CONTAINER_BLUE" "$PORT_BLUE"; then
        log_error "Blue container failed health check"
        log_step "Viewing blue container logs:"
        docker logs --tail 50 "$CONTAINER_BLUE"
        remove_container "$CONTAINER_BLUE"
        error_exit "Deployment failed - blue container unhealthy"
    fi
}

# Deploy to green (production)
deploy_green_container() {
    log_header "Deploying to Green Container (Production)"
    
    remove_container "$CONTAINER_GREEN"
    
    log_step "Starting $CONTAINER_GREEN on port $PORT_GREEN"
    
    if ! docker run -d \
        --name "$CONTAINER_GREEN" \
        --network app-network \
        -p "$PORT_GREEN:8000" \
        --env-file "$DEPLOY_DIR/.env" \
        --restart unless-stopped \
        "$IMAGE_NAME"; then
        error_exit "Failed to start green container"
    fi
    
    log_success "Green container started"
    
    # Health check
    if ! health_check "$CONTAINER_GREEN" "$PORT_GREEN"; then
        log_error "Green container failed health check"
        log_step "Viewing green container logs:"
        docker logs --tail 50 "$CONTAINER_GREEN"
        
        # Rollback - remove failed green
        remove_container "$CONTAINER_GREEN"
        error_exit "Deployment failed - green container unhealthy"
    fi
    
    log_success "Green container is healthy and serving traffic"
}

# Cleanup blue container
cleanup_blue() {
    log_header "Cleanup"
    
    log_step "Removing blue container"
    remove_container "$CONTAINER_BLUE"
    
    log_step "Cleaning up old images"
    docker image prune -f > /dev/null 2>&1 || true
    
    log_success "Cleanup completed"
}

# Deployment summary
deployment_summary() {
    log_header "Deployment Summary"
    
    echo -e "${GREEN}✔ Deployment successful!${NC}"
    echo ""
    echo -e "${CYAN}Container Status:${NC}"
    docker ps --filter "name=streamflix" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo -e "${CYAN}Image:${NC} $IMAGE_NAME"
    echo -e "${CYAN}Production URL:${NC} http://localhost:$PORT_GREEN"
    echo ""
    
    # Get container stats
    log_info "Container resource usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" "$CONTAINER_GREEN"
}

# Main deployment flow
main() {
    log_header "StreamFlix Blue-Green Deployment"
    
    echo -e "${BLUE}Started at: $(date)${NC}"
    echo -e "${BLUE}Image: $IMAGE_NAME${NC}"
    echo ""
    
    # Step 1: Pre-deployment checks
    log_step "Running pre-deployment checks"
    check_deploy_dir
    check_env_file
    
    # Step 2: Setup PostgreSQL database
    setup_postgres
    
    # Step 3: Pull latest image
    pull_image
    
    # Step 4: Deploy to blue (staging)
    start_blue_container
    
    # Step 5: Deploy to green (production)
    deploy_green_container
    
    # Step 6: Cleanup
    cleanup_blue
    
    # Step 7: Summary
    deployment_summary
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  Deployment completed successfully at $(date)${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Run main deployment
main
