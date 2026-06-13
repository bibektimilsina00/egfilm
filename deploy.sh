#!/usr/bin/env bash
set -Eeuo pipefail
# ===================================================================
#  EGFilm + EGSport + EGTV — monorepo zero-downtime remote deployment.
#  Pulls fresh images, runs prisma migrate against shared DB,
#  brings up egfilm (:8000), egsport (:5555) and egtv (:3333).
# ===================================================================

cd ~/egfilm

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'

APPS=("egfilm" "egsport" "egtv")

step() { echo -e "\n${GREEN}▶${NC} $*"; }

trap 'echo -e "${RED}❌ Script failed – dumping logs:${NC}"; for a in "${APPS[@]}"; do docker compose logs "$a" --tail=40 || true; done' ERR

# ---------- load .env ----------------------------------------------
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
  echo -e "${GREEN}✓ Loaded .env${NC}"
  echo "  EGFILM_IMAGE_NAME: ${EGFILM_IMAGE_NAME:-<not set>}"
  echo "  EGSPORT_IMAGE_NAME: ${EGSPORT_IMAGE_NAME:-<not set>}"
  echo "  EGTV_IMAGE_NAME: ${EGTV_IMAGE_NAME:-<not set>}"
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
# Remove orphan containers from previous compose layouts (e.g. egfilm-app-1
# from the single-app era still bound to :8000) so port bindings are free.
# We do NOT call `docker compose down` here because that would also stop
# postgres and force a long re-init cycle below.
ORPHANS="$(docker ps -a --format '{{.Names}}' | grep -E '^egfilm[-_](app|egfilm|egsport|egtv)[-_]?[0-9]*$' | grep -vE '^egfilm-(egfilm|egsport|egtv|postgres)-1$' || true)"
if [[ -n "${ORPHANS:-}" ]]; then
  echo "  Removing orphan containers:"
  while IFS= read -r c; do
    [[ -n "$c" ]] || continue
    echo "    - $c"
    docker rm -f "$c" 2>/dev/null || true
  done <<< "$ORPHANS"
fi
# Free any process holding our published ports (in case a stray container
# was created with --network=host or another compose project).
for port in "${EGFILM_PORT:-8000}" "${EGSPORT_PORT:-5555}" "${EGTV_PORT:-3333}"; do
  cid="$(docker ps --filter "publish=$port" --format '{{.ID}}' | head -n1 || true)"
  if [[ -n "$cid" ]]; then
    name="$(docker inspect -f '{{.Name}}' "$cid" 2>/dev/null | sed 's|^/||' || echo unknown)"
    case "$name" in
      egfilm-egfilm-1|egfilm-egsport-1|egfilm-egtv-1|egfilm-postgres-1) ;;  # keep
      *) echo "  Removing $name (holds :$port)"; docker rm -f "$cid" || true ;;
    esac
  fi
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

# Wait up to 120s for Postgres. Don't let a slow first boot or a transient
# `docker exec` failure kill the whole deploy via set -e.
echo -n "⏳ Waiting for Postgres …"
pg_ready=0
for _ in $(seq 1 60); do
  if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    pg_ready=1
    break
  fi
  echo -n "."
  sleep 2
done
if [[ "$pg_ready" -eq 1 ]]; then
  echo -e " ${GREEN}✅ Postgres ready${NC}"
else
  echo -e " ${RED}❌ Postgres did not become healthy in 120s${NC}"
  echo -e "${YELLOW}── postgres logs ──${NC}"
  docker compose logs --tail=60 postgres || true
  echo -e "${YELLOW}── postgres status ──${NC}"
  docker compose ps postgres || true
  exit 1
fi

# ---------- Prisma migrate (shared DB) ------------------------------
step "Running Prisma migrate (shared DB)"
# Use egfilm image as the runner since all 3 apps share the schema.
# Pin prisma CLI to v6 — Prisma 7 dropped `url = env(...)` syntax in schema.prisma
# which would break our existing migrations. Use --remove-orphans to suppress
# the orphan-container warning that compose now treats as noise.
docker compose run --rm --remove-orphans egfilm sh -c '
  cd packages/db && npx --yes prisma@6.17.1 migrate deploy --schema=./prisma/schema.prisma
' || {
  echo -e "${YELLOW}⚠️  Prisma migration failed – continuing anyway${NC}"
}

# ---------- start apps ----------------------------------------------
step "Starting application containers"
for app in "${APPS[@]}"; do
  docker compose up -d --wait --remove-orphans "$app"
done

# ---------- final smoke test ---------------------------------------
step "Final health checks"
for port in "${EGFILM_PORT:-8000}" "${EGSPORT_PORT:-5555}" "${EGTV_PORT:-3333}"; do
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
