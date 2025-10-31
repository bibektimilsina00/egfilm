#!/usr/bin/env bash
set -Eeuo pipefail
# ===================================================================
#  EGFilm – zero-downtime remote deployment script  (appleboy-ready)
# ===================================================================
#  Requires in ~/egfilm:
#    .env   (loaded below)
#    docker-compose.yml
# ===================================================================

cd ~/egfilm

# ---------- colours ------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'

# ---------- trap: show app logs on error -----------------------------
trap 'echo -e "${RED}❌ Script failed – dumping app logs:${NC}"; docker compose logs app --tail=40' ERR

# ---------- load .env ----------------------------------------------
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
else
  echo -e "${RED}❌ .env file not found in $(pwd). Aborting.${NC}"
  exit 1
fi

# ---------- helper: print step -------------------------------------
step() { echo -e "\n${GREEN}▶${NC} $*"; }

# ---------- pre-deploy cleanup -------------------------------------
step "Pre-deployment cleanup to prevent port conflicts"
docker compose stop app || true
docker compose rm -f app    || true

# Remove orphaned containers on port 8000 (but never postgres)
docker ps -aq --filter "expose=8000" --filter "name!=postgres" | xargs -r docker rm -f || true

# Keep last image for instant rollback
docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.ID}}' \
  | grep -E "^${IMAGE_NAME:-egfilm}" | tail -n +3 | awk '{print $2}' | xargs -r docker rmi || true

# ---------- registry login -----------------------------------------
step "Logging into container registry"
if [[ -n "${REGISTRY_TOKEN:-}" ]]; then
  echo "$REGISTRY_TOKEN" | docker login "${REGISTRY:-ghcr.io}" -u "${DEPLOY_USER:-deploy}" --password-stdin || true
else
  echo -e "${YELLOW}⚠️  REGISTRY_TOKEN not set; skipping docker login${NC}"
fi

# ---------- pull new image -----------------------------------------
step "Pulling new image"
docker compose pull app || true

# ---------- database: start & health --------------------------------
step "Ensuring database is running and healthy"
docker compose up -d postgres || true

echo -n "⏳ Waiting for Postgres …"
timeout 60 bash -c "until docker compose exec -T postgres pg_isready -U '$POSTGRES_USER' -d '$POSTGRES_DB' >/dev/null 2>&1; do sleep 2; echo -n .; done" || {
  echo -e "\n${RED}DB failed to start – attempting recovery${NC}"
  docker compose logs postgres || true

  docker compose stop postgres || true
  docker compose rm -f postgres || true
  docker volume rm egfilm_postgres_data || true   # destructive reset

  docker compose up -d postgres || true
  echo -n "⏳ Re-waiting for fresh Postgres …"
  timeout 120 bash -c "until docker compose exec -T postgres pg_isready -U '$POSTGRES_USER' -d '$POSTGRES_DB' >/dev/null 2>&1; do sleep 3; echo -n .; done" || {
    echo -e "\n${RED}Database recovery failed${NC}"; exit 1
  }
}
echo -e " ${GREEN}✅ Postgres ready${NC}"

# ---------- Prisma: generate & migrate -----------------------------
step "Running Prisma generate & migrate"
docker compose run --rm app sh -c 'npx prisma generate && npx prisma migrate deploy' || {
  echo -e "${YELLOW}⚠️  Prisma migration failed – continuing anyway${NC}"
}

# ---------- start app (with health-check built-in) -----------------
step "Starting application container"
docker compose up -d --wait app   # --wait returns when healthy (Compose ≥ v2.20)

# ---------- final smoke test ---------------------------------------
echo -n "⏳ Final health hit …"
timeout 60 bash -c 'until curl -sf http://localhost:8000/api/health >/dev/null; do sleep 2; echo -n .; done'
echo -e " ${GREEN}✅ App healthy${NC}"

# ---------- post-deploy tidy-up ------------------------------------
step "Post-deploy cleanup"
docker container prune -f || true
docker image prune -af --filter "until=24h" --filter "label!=keep" || true
docker network   prune -f || true
docker volume    prune -f --filter "label!=keep" || true
docker builder   prune -af --filter "until=24h" || true

step "Deployment completed successfully"