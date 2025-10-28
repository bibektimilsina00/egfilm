#!/bin/bash

# TMDB API Key Validation Script
# This script helps validate your TMDB API configuration

set -e

echo "🔑 TMDB API Key Validation"
echo "=========================="
echo ""

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_error ".env file not found"
    log_info "Please create a .env file based on .env.minimal.example"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check TMDB API Key variables
log_info "Checking TMDB API Key configuration..."

if [ -z "$TMDB_API_KEY" ]; then
    log_error "TMDB_API_KEY is not set in .env file"
    TMDB_SERVER_MISSING=true
else
    log_success "TMDB_API_KEY is set"
    TMDB_SERVER_MISSING=false
fi

if [ -z "$NEXT_PUBLIC_TMDB_API_KEY" ]; then
    log_error "NEXT_PUBLIC_TMDB_API_KEY is not set in .env file"
    TMDB_CLIENT_MISSING=true
else
    log_success "NEXT_PUBLIC_TMDB_API_KEY is set"
    TMDB_CLIENT_MISSING=false
fi

# Check if both keys match
if [ "$TMDB_API_KEY" != "$NEXT_PUBLIC_TMDB_API_KEY" ] && [ ! -z "$TMDB_API_KEY" ] && [ ! -z "$NEXT_PUBLIC_TMDB_API_KEY" ]; then
    log_warning "TMDB_API_KEY and NEXT_PUBLIC_TMDB_API_KEY have different values"
    log_info "They should typically be the same for this application"
fi

# Test TMDB API connectivity (if key is available)
if [ ! -z "$NEXT_PUBLIC_TMDB_API_KEY" ] && [ "$TMDB_CLIENT_MISSING" = false ]; then
    log_info "Testing TMDB API connectivity..."
    
    # Test with a simple API call
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://api.themoviedb.org/3/movie/popular?api_key=$NEXT_PUBLIC_TMDB_API_KEY&page=1" \
        || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        log_success "TMDB API key is valid and working"
    elif [ "$RESPONSE" = "401" ]; then
        log_error "TMDB API key is invalid (HTTP 401)"
        log_info "Please check your API key at https://www.themoviedb.org/settings/api"
    elif [ "$RESPONSE" = "000" ]; then
        log_error "Could not connect to TMDB API (network issue)"
    else
        log_error "TMDB API returned HTTP $RESPONSE"
    fi
else
    log_warning "Skipping API connectivity test (no valid key available)"
fi

echo ""
echo "📋 Configuration Summary:"
echo "========================"

if [ "$TMDB_SERVER_MISSING" = true ] || [ "$TMDB_CLIENT_MISSING" = true ]; then
    log_error "TMDB API configuration is incomplete"
    echo ""
    log_info "To fix this:"
    echo "1. Get your TMDB API key from: https://www.themoviedb.org/settings/api"
    echo "2. Add both variables to your .env file:"
    echo "   TMDB_API_KEY=your_api_key_here"
    echo "   NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here"
    echo ""
    exit 1
else
    log_success "TMDB API configuration looks good"
    echo ""
    log_info "Environment variables properly set:"
    echo "   ✓ TMDB_API_KEY (server-side)"
    echo "   ✓ NEXT_PUBLIC_TMDB_API_KEY (client-side)"
    echo ""
fi