#!/usr/bin/env bash
# ===================================================================
#   EGFilm monorepo deploy — egfilm + egsport + egtv on shared Postgres.
#   Pulls fresh images, runs prisma migrate, brings up all apps,
#   smoke-tests /api/health. Postgres volume is preserved.
# ===================================================================
set -Eeuo pipefail

cd ~/egfilm

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
APPS=(egfilm egsport egtv)

log()  { echo -e "\n${GREEN}▶${NC} $*"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
fail() { echo -e "${RED}✗ $*${NC}"; exit 1; }

trap 'echo -e "\n${RED}✗ deploy failed — dumping logs${NC}"; docker compose logs --tail=40 "${APPS[@]}" 2>/dev/null || true' ERR

# ---------- load .env ----------------------------------------------
[[ -f .env ]] || fail ".env not found in $(pwd)"
set -a; source .env; set +a
log "Loaded .env"
echo "  egfilm  → ${EGFILM_IMAGE_NAME:-<unset>}"
echo "  egsport → ${EGSPORT_IMAGE_NAME:-<unset>}"
echo "  egtv    → ${EGTV_IMAGE_NAME:-<unset>}"

# ---------- stop previous app containers ---------------------------
# rm -fs = force + stop. Postgres untouched.
log "Stopping previous app containers"
docker compose rm -fs "${APPS[@]}" 2>/dev/null || true

# ---------- disk hygiene -------------------------------------------
# Free space BEFORE pulling so registry pull doesn't run out of disk.
# Volumes (postgres data) never touched.
log "Disk hygiene (volumes preserved)"
df -h / | awk 'NR==2 {printf "  before: %s used of %s (%s)\n", $3, $2, $5}'
docker image prune -af     >/dev/null 2>&1 || true
docker container prune -f  >/dev/null 2>&1 || true
docker network prune -f    >/dev/null 2>&1 || true
docker builder prune -af   >/dev/null 2>&1 || true
docker buildx prune -af    >/dev/null 2>&1 || true
command -v journalctl >/dev/null && journalctl --vacuum-size=200M >/dev/null 2>&1 || true
df -h / | awk 'NR==2 {printf "  after:  %s used of %s (%s)\n", $3, $2, $5}'

# ---------- registry login -----------------------------------------
if [[ -n "${REGISTRY_TOKEN:-}" ]]; then
    log "Logging into ${REGISTRY:-ghcr.io}"
    echo "$REGISTRY_TOKEN" \
        | docker login "${REGISTRY:-ghcr.io}" -u "${DEPLOY_USER:-deploy}" --password-stdin >/dev/null \
        || warn "docker login failed — falling back to cached creds"
else
    warn "REGISTRY_TOKEN unset — falling back to cached creds"
fi

# ---------- pull images (with retry) -------------------------------
pull_with_retry() {
    local app=$1
    for i in 1 2 3 4 5; do
        docker compose pull "$app" && return 0
        warn "pull ${app} failed (${i}/5) — retry in 5s"
        sleep 5
    done
    fail "could not pull image for ${app}"
}
log "Pulling images"
for app in "${APPS[@]}"; do pull_with_retry "$app"; done

# ---------- postgres ready -----------------------------------------
log "Starting postgres"
docker compose up -d postgres

echo -n "  waiting for postgres "
pg_ready=0
for _ in $(seq 1 60); do
    if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
        pg_ready=1; break
    fi
    echo -n .
    sleep 2
done
if [[ $pg_ready -eq 1 ]]; then
    echo -e " ${GREEN}ready${NC}"
else
    echo
    docker compose logs --tail=60 postgres || true
    fail "postgres did not become healthy in 120s"
fi

# ---------- prisma migrate (shared schema) -------------------------
# Use egfilm image as runner. Pin prisma@6 — Prisma 7 dropped env() syntax.
log "Running prisma migrate deploy"
docker compose run --rm --remove-orphans egfilm sh -c \
    'cd packages/db && npx --yes prisma@6.17.1 migrate deploy --schema=./prisma/schema.prisma' \
    || warn "prisma migrate failed — continuing (manual fix may be needed)"

# ---------- start apps ---------------------------------------------
log "Starting app containers"
for app in "${APPS[@]}"; do
    docker compose up -d --wait --remove-orphans "$app"
done

# ---------- health checks ------------------------------------------
log "Health checks"
check_health() {
    local port=$1 name=$2
    echo -n "  ${name} :${port}/api/health "
    if timeout 60 bash -c "until curl -sf http://localhost:${port}/api/health >/dev/null; do sleep 2; done"; then
        echo -e "${GREEN}✓${NC}"
    else
        fail "${name} health check failed on :${port}"
    fi
}
check_health "${EGFILM_PORT:-8000}"  egfilm
check_health "${EGSPORT_PORT:-5555}" egsport
check_health "${EGTV_PORT:-3333}"    egtv

log "Deploy complete"
