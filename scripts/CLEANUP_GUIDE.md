# Egfilm Server Cleanup Guide

This guide helps you transition from the full Egfilm setup (with Redis, worker, admin panel) to a minimal streaming-only setup for your main VPS.

## What Gets Removed

### ❌ Removed Services
- **Redis** - Caching and job queue system
- **BullMQ Worker** - Background job processing
- **Admin Panel** - Separate admin interface
- **Blog Generation** - Automated blog content creation
- **Background Processing** - All async job functionality

### ✅ What Stays
- **PostgreSQL Database** - User data, movie metadata, watchlists
- **Main Streaming App** - Core movie/TV streaming functionality
- **Authentication** - User login and session management
- **TMDB Integration** - Movie and TV show data
- **Watch Together** - Real-time viewing sessions

## Quick Cleanup

Run the automated cleanup script:

```bash
cd /path/to/egfilm
./scripts/cleanup-server.sh
```

This will:
1. Stop and remove unnecessary containers
2. Clean up Docker images and volumes
3. Switch to minimal configuration
4. Preserve your database (with confirmation)

## Manual Cleanup Steps

If you prefer manual control:

### 1. Stop Current Services
```bash
docker compose down --remove-orphans
```

### 2. Remove Specific Containers
```bash
docker rm -f egfilm-worker egfilm-redis egfilm-admin
```

### 3. Remove Redis Data (optional)
```bash
docker volume rm egfilm_redis_data
```

### 4. Switch Configuration
```bash
cp docker-compose.yml docker-compose.full.yml.backup
cp docker-compose.minimal.yml docker-compose.yml
```

### 5. Update Environment
```bash
cp .env .env.backup
cp .env.minimal.example .env
# Edit .env with your actual values
```

### 6. Start Minimal Setup
```bash
docker compose up -d
```

## Resource Savings

The minimal setup uses significantly fewer resources:

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| CPU | ~1.0 cores | ~0.6 cores | 40% |
| RAM | ~1.5GB | ~1GB | 33% |
| Storage | ~2GB | ~1GB | 50% |
| Containers | 4 | 2 | 50% |

## Configuration Changes

### Environment Variables

**No longer needed:**
```bash
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
BULLMQ_REDIS_URL=
WORKER_CONCURRENCY=2
```

**Still required:**
```bash
DATABASE_URL=postgresql://...
TMDB_API_KEY=your_key
AUTH_SECRET=your_secret
```

### Health Checks

The new health check endpoint `/api/health` only tests:
- Database connectivity
- App responsiveness

## Disabled Features

After cleanup, these features will no longer work:
- Automated blog post generation
- Background movie data processing
- Redis-based caching (will use in-memory caching)
- BullMQ job dashboard
- Admin panel functionality

## Rollback

To restore full functionality:

```bash
cp docker-compose.full.yml.backup docker-compose.yml
cp .env.backup .env
docker compose up -d
```

## Monitoring

Monitor the minimal setup:

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f app

# Check health
curl http://localhost:8000/api/health
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker compose logs postgres

# Test connection manually
docker exec egfilm-postgres psql -U egfilm_admin -d egfilm-database -c "SELECT 1;"
```

### App Won't Start
```bash
# Check app logs
docker compose logs app

# Verify environment variables
docker compose config
```

## Performance Tips

1. **Enable PostgreSQL Connection Pooling** in your app configuration
2. **Use CDN** for static assets to reduce server load  
3. **Enable gzip compression** in your reverse proxy
4. **Monitor resource usage** with `docker stats`

## Support

If you need help with the cleanup process:
1. Check the logs: `docker compose logs`
2. Verify your `.env` file has all required variables
3. Ensure your VPS has enough resources for PostgreSQL + App