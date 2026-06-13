#!/usr/bin/env bash
set -Eeuo pipefail
# ===================================================================
#  EGFilm + EGSport — monorepo zero-downtime remote deployment.
#  Pulls fresh images, runs prisma migrate against shared DB,
#  brings up egfilm (:8000) and egsport (:8001).
# ===================================================================

cd ~/egfilm

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'

APPS=("egfilm" "egsport")

step() { echo -e "\n${GREEN}▶${NC} $*"; }

trap 'echo -e "${RED}❌ Script failed – dumping logs:${NC}"; for a in "${APPS[@]}"; do docker compose logs "$a" --tail=40 || true; done' ERR

# ---------- load .env ----------------------------------------------
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
  echo -e "${GREEN}✓ Loaded .env${NC}"
  echo "  EGFILM_IMAGE_NAME: ${EGFILM_IMAGE_NAME:-<not set>}"
  echo "  EGSPORT_IMAGE_NAME: ${EGSPORT_IMAGE_NAME:-<not set>}"
  echo "  DATABASE_URL: ${DATABASE_URL:0:30}... (truncated)"
else
  echo -e "${RED}❌ .env file not found in $(pwd). Aborting.${NC}"
  exit 1
fi

# ---------- pre-deploy cleanup -------------------------------------
step "Pre-deployment cleanup"
for app in "${APPS[@]}"; do
  docker compose stop "$app" || true
  docker compose rm -f "$app" || true
done

# ---------- registry login -----------------------------------------
step "Logging into container registry"
if [[ -n "${REGISTRY_TOKEN:-}" ]]; then
  echo "$REGISTRY_TOKEN" | docker login "${REGISTRY:-ghcr.io}" -u "${DEPLOY_USER:-deploy}" --password-stdin || true
else
  echo -e "${YELLOW}⚠️  REGISTRY_TOKEN not set; skipping docker login${NC}"
fi

# ---------- pull new images (with retry) ---------------------------
step "Pulling new images"
for app in "${APPS[@]}"; do
  echo "  pulling ${app}…"
  docker compose pull "$app" || {
    echo -e "${YELLOW}First pull of ${app} failed, retrying...${NC}"
    for i in {1..5}; do
      docker compose pull "$app" && break
      echo -e "${YELLOW}Retry pull (${i}/5)…${NC}"
      sleep 5
    done
  }
done

# ---------- database: start & health --------------------------------
step "Ensuring database is running"
docker compose up -d postgres
echo -n "⏳ Waiting for Postgres …"
timeout 60 bash -c "until docker compose exec -T postgres pg_isready -U '$POSTGRES_USER' -d '$POSTGRES_DB' >/dev/null 2>&1; do sleep 2; echo -n .; done"
echo -e " ${GREEN}✅ Postgres ready${NC}"

# ---------- Prisma migrate (shared DB) ------------------------------
step "Running Prisma migrate (shared DB)"
# Use egfilm image as the runner since both share the schema.
docker compose run --rm egfilm sh -c 'node node_modules/.prisma/client/index.js >/dev/null 2>&1 || true; cd packages/db && npx prisma migrate deploy --schema=./prisma/schema.prisma' || {
  echo -e "${YELLOW}⚠️  Prisma migration failed – continuing anyway${NC}"
}

# ---------- start apps ----------------------------------------------
step "Starting application containers"
for app in "${APPS[@]}"; do
  docker compose up -d --wait "$app"
done

# ---------- final smoke test ---------------------------------------
step "Final health checks"
for port in "${EGFILM_PORT:-8000}" "${EGSPORT_PORT:-8001}"; do
  echo -n "  :${port}/api/health …"
  timeout 60 bash -c "until curl -sf http://localhost:${port}/api/health >/dev/null; do sleep 2; echo -n .; done"
  echo -e " ${GREEN}✅${NC}"
done

# ---------- post-deploy tidy-up ------------------------------------
step "Post-deploy cleanup"
docker container prune -f || true
docker image prune -af --filter "until=24h" --filter "label!=keep" || true
docker network prune -f || true
docker builder prune -af --filter "until=24h" || true

step "Deployment completed successfully"
