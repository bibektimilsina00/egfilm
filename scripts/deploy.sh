#!/usr/bin/env bash
set -euo pipefail

# Remote deployment script executed on the production server.
# This script assumes the following are present in ~/egfilm:
# - .env (copied from CI as production.env)
# - docker-compose.yml

cd ~/egfilm

# Load environment variables from .env into the shell
if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a
  # Use bash source to preserve exported vars
  . ./.env
  set +a
else
  echo "❌ .env file not found in ~/egfilm. Aborting."
  exit 1
fi

echo "🧹 Pre-deployment cleanup to prevent port conflicts..."
# Stop and remove only app containers (keep database running)
docker compose stop app || true
docker compose rm -f app || true

# Remove any orphaned containers that might be using port 8000 (but not database)
docker ps -a --filter "expose=8000" --filter "name!=postgres" --format "{{.ID}}" | xargs -r docker rm -f || true

# Remove old app images to save space (keep database images)
docker images | grep egfilm | grep -v latest | awk '{print $3}' | xargs -r docker rmi || true

echo "🔐 Logging into container registry..."
if [ -n "${REGISTRY_TOKEN:-}" ]; then
  echo "${REGISTRY_TOKEN}" | docker login "${REGISTRY:-ghcr.io}" -u "${DEPLOY_USER:-deploy}" --password-stdin || true
else
  echo "⚠️ REGISTRY_TOKEN not set; skipping docker login (will rely on public image or existing auth)"
fi

echo "📥 Pulling new image..."
docker compose pull app || true

echo "🗄️ Ensuring database is running and healthy..."
# Start postgres service if not running
docker compose up -d postgres || true

echo "⏳ Waiting for database to be ready..."
timeout 60 bash -c "until docker compose exec postgres pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; do sleep 2; echo -n .; done" || {
  echo "❌ Database failed to start, attempting recovery..."
  docker compose logs postgres || true

  echo "🔧 Stopping postgres and cleaning corrupted data..."
  docker compose stop postgres || true
  docker compose rm -f postgres || true

  echo "🗑️ Removing corrupted database volume..."
  docker volume rm egfilm_postgres_data || true

  echo "🔄 Restarting postgres with fresh data..."
  docker compose up -d postgres || true

  echo "⏳ Waiting for fresh database to initialize..."
  timeout 120 bash -c "until docker compose exec postgres pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; do sleep 3; echo -n .; done" || {
    echo "❌ Database recovery failed, showing logs..."
    docker compose logs postgres || true
    exit 1
  }

  echo "✅ Database recovered successfully!"
}

echo "🔄 Running database setup..."
echo "⏳ Ensuring database is fully ready for Prisma..."
timeout 30 bash -c "until docker compose exec postgres pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} > /dev/null 2>&1; do sleep 1; echo -n .; done" || {
  echo "❌ Database not ready for Prisma setup"
  exit 1
}

echo "🔧 Generate Prisma client and apply migrations"
docker compose run --rm app sh -c "npx prisma generate && npx prisma migrate deploy" || {
  echo "⚠️ Database setup (prisma migrate) failed, but continuing deployment..."
  echo "This might cause runtime errors - check Prisma configuration"
}

echo "🚀 Starting application container..."
docker compose up -d app

echo "⏳ Waiting for container to initialize..."
sleep 10

if ! docker compose ps app | grep -q "Up"; then
  echo "❌ App container failed to start, checking logs..."
  docker compose logs app || true
  exit 1
fi

echo "⏳ Waiting for application to be ready via /api/health..."
timeout 120 bash -c "until curl -sf http://localhost:8000/api/health > /dev/null; do sleep 2; echo -n .; done" || {
  echo "❌ Health check failed, showing app logs..."
  docker compose logs app --tail=50 || true
  exit 1
}

echo "✅ Container is healthy and ready!"

echo "🧹 Post-deploy cleanup"
docker container prune -f || true
docker image prune -af --filter "until=24h" || true
docker network prune -f || true
docker volume prune -f --filter "label!=keep" || true
docker builder prune -af --filter "until=24h" || true

echo "📊 Deployment completed"

exit 0
