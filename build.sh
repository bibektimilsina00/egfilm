#!/bin/bash
set -e

# ════════════════════════════════════════════════
# ║       STREAMFLIX DOCKER BUILD SCRIPT         ║
# ════════════════════════════════════════════════

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Logging functions
log_header() {
  echo -e "\n${BOLD}${BLUE}═════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${BLUE}   ${1}${NC}"
  echo -e "${BOLD}${BLUE}═════════════════════════════════════════════════${NC}\n"
}

log_info() {
  echo -e "${CYAN}[$(date "+%H:%M:%S")]${NC} ${1}"
}

log_success() {
  echo -e "${GREEN}[$(date "+%H:%M:%S")]${NC} ✅ ${GREEN}${1}${NC}"
}

log_error() {
  echo -e "${RED}[$(date "+%H:%M:%S")]${NC} ❌ ${RED}${1}${NC}"
}

log_step() {
  echo -e "${PURPLE}[$(date "+%H:%M:%S")]${NC} 🔹 ${1}"
}

# Default values
ENV="production"
APP_VERSION="latest"
PUSH=false
REGISTRY="ghcr.io"
IMAGE_NAME="bibektimilsina00/stream-flix"
BRANCH=""
DEPLOY_TAG=""

# Print usage
usage() {
  echo -e "${BOLD}Usage:${NC}"
  echo -e "  $0 [options]"
  echo -e ""
  echo -e "${BOLD}Options:${NC}"
  echo -e "  -e, --env ENV          Set environment (production, staging, development)"
  echo -e "  -v, --version VERSION  Set application version"
  echo -e "  -p, --push             Push image to registry after build"
  echo -e "  -r, --registry NAME    Docker registry name (default: ghcr.io)"
  echo -e "  -n, --name NAME        Image name (default: bibektimilsina00/stream-flix)"
  echo -e "  -b, --branch BRANCH    Git branch to build from (auto-detected if not specified)"
  echo -e "  --deploy-tag TAG       Optional deploy tag to apply (example: 'deploy')"
  echo -e "  -h, --help             Show this help message"
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)
      ENV="$2"
      if [[ ! "$ENV" =~ ^(production|staging|development)$ ]]; then
        log_error "Invalid environment: $ENV"
        exit 1
      fi
      shift 2
      ;;
    -v|--version)
      APP_VERSION="$2"
      shift 2
      ;;
    -p|--push)
      PUSH=true
      shift
      ;;
    -r|--registry)
      REGISTRY="$2"
      shift 2
      ;;
    -n|--name)
      IMAGE_NAME="$2"
      shift 2
      ;;
    -b|--branch)
      BRANCH="$2"
      shift 2
      ;;
    --deploy-tag)
      DEPLOY_TAG="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Auto-detect branch if not specified
if [[ -z "$BRANCH" ]]; then
  if [[ -d ".git" ]]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    log_info "Auto-detected branch: ${BOLD}${BRANCH}${NC}"
  else
    BRANCH="unknown"
  fi
fi

# Start build
log_header "BUILDING STREAMFLIX DOCKER IMAGE"

log_info "Environment: ${BOLD}${ENV}${NC}"
log_info "Version: ${BOLD}${APP_VERSION}${NC}"
log_info "Branch: ${BOLD}${BRANCH}${NC}"
log_info "Registry: ${BOLD}${REGISTRY}${NC}"
log_info "Image name: ${BOLD}${IMAGE_NAME}${NC}"

# Normalize image name (lowercase for GHCR)
IMAGE_NAME=$(echo "$IMAGE_NAME" | tr '[:upper:]' '[:lower:]')

# Set image tags
FULL_TAG="${REGISTRY}/${IMAGE_NAME}:${APP_VERSION}-${ENV}"
log_info "Primary tag: ${BOLD}${FULL_TAG}${NC}"

if [[ "$ENV" == "production" ]]; then
  LATEST_TAG="${REGISTRY}/${IMAGE_NAME}:latest"
  log_info "Will also tag as: ${BOLD}${LATEST_TAG}${NC}"
fi

# Build image
log_step "Building Docker image..."

DOCKER_BUILDKIT=1 docker build \
  --build-arg NODE_ENV="${ENV}" \
  --build-arg APP_VERSION="${APP_VERSION}" \
  --build-arg GIT_BRANCH="${BRANCH}" \
  -t "${FULL_TAG}" \
  .

log_success "Docker image built: ${BOLD}${FULL_TAG}${NC}"

# Tag additional versions
if [[ "$ENV" == "production" ]]; then
  docker tag "${FULL_TAG}" "${LATEST_TAG}"
  log_success "Tagged as: ${BOLD}${LATEST_TAG}${NC}"
fi

# Push if requested
if [[ "$PUSH" == true ]]; then
  log_header "PUSHING IMAGES TO REGISTRY"

  log_step "Pushing ${FULL_TAG}..."
  docker push "${FULL_TAG}"
  log_success "${FULL_TAG} pushed"

  if [[ -n "$DEPLOY_TAG" ]]; then
    DEPLOY_FULL_TAG="${REGISTRY}/${IMAGE_NAME}:${DEPLOY_TAG}"
    log_step "Tagging as ${DEPLOY_FULL_TAG}..."
    docker tag "${FULL_TAG}" "${DEPLOY_FULL_TAG}"
    log_step "Pushing ${DEPLOY_FULL_TAG}..."
    docker push "${DEPLOY_FULL_TAG}"
    log_success "${DEPLOY_FULL_TAG} pushed"
  fi

  if [[ "$ENV" == "production" ]]; then
    log_step "Pushing ${LATEST_TAG}..."
    docker push "${LATEST_TAG}"
    log_success "${LATEST_TAG} pushed"
  fi

  log_success "All images pushed successfully!"
fi

# Summary
log_header "BUILD SUMMARY"
echo -e "${BOLD}${GREEN}✨ Docker image build completed ✨${NC}"
echo -e "${BOLD}Environment:${NC} ${ENV}"
echo -e "${BOLD}Branch:${NC} ${BRANCH}"
echo -e "${BOLD}Version:${NC} ${APP_VERSION}"
echo -e "${BOLD}Image:${NC} ${FULL_TAG}"

if [[ "$PUSH" == true ]]; then
  echo -e "${BOLD}Status:${NC} Built and pushed to registry"
else
  echo -e "${BOLD}Status:${NC} Built locally only"
  echo -e "\nTo push to registry later, run:"
  echo -e "  docker push ${FULL_TAG}"
fi

echo -e "\n${BOLD}${GREEN}Done!${NC}"
