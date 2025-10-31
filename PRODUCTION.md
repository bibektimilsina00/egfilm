# Egfilm - Production Deployment Guide

> Optimized Next.js streaming platform with real-time features, built for production with Docker and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- PostgreSQL 16+ (remote or self-hosted)
- Redis 7+ (included in docker-compose)

### Environment Setup

1. **Copy and configure `.env`:**
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_HOST=egfilm-redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# APIs
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_key
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3

# Authentication
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_URL=https://your-domain.com

# Optional: Analytics & Error Tracking
SENTRY_DSN=your_sentry_dsn
```

### Deployment

```bash
# 1. Pull latest image
docker pull ghcr.io/bibektimilsina00/egfilm:deploy

# 2. Set environment variables
export IMAGE_NAME=ghcr.io/bibektimilsina00/egfilm:deploy

# 3. Start services
docker compose up -d

# 4. Check status
docker compose ps
docker compose logs app
```

## 📊 Architecture

```
┌─────────────────┐
│   PostgreSQL    │  (External Database)
│   (Remote)      │
└────────┬────────┘
         │
┌────────┴──────────────┐
│  Docker Network       │
│  (app-network)        │
│                       │
│  ┌──────────────┐    │
│  │  Redis 7.0   │    │  (Caching & Job Queue)
│  └──────────────┘    │
│         │            │
│  ┌──────┴────────┐   │
│  │               │   │
│  │  Egfilm App   │   │  (Next.js 15.5)
│  │   (port 8000) │   │
│  │               │   │
│  └───────────────┘   │
│         │            │
│  ┌──────┴────────┐   │
│  │   BullMQ      │   │  (Background Jobs)
│  │   Worker      │   │
│  └───────────────┘   │
│                       │
└───────────────────────┘
```

## 🔧 Configuration

### Resource Limits (Production)

```yaml
App Container:
  CPU: 2 cores (limit) / 1 core (reserved)
  Memory: 1GB (limit) / 512MB (reserved)

Worker Container:
  CPU: 1 core (limit) / 0.5 core (reserved)
  Memory: 512MB (limit) / 256MB (reserved)

Redis Container:
  CPU: 1 core (limit) / 0.5 core (reserved)
  Memory: 512MB (limit) / 256MB (reserved)
  Max Memory: 512MB with LRU eviction
```

### Health Checks

- **App**: HTTP GET to `http://localhost:8000/` (30s interval, 60s startup delay)
- **Redis**: `redis-cli ping` (10s interval)
- **Database**: Connected during app startup

## 📈 Performance Features

✅ **Image Optimization**
- AVIF and WebP formats with fallbacks
- Responsive device sizes (640px - 3840px)
- Quality optimization (75-100%)
- Lazy loading by default

✅ **Caching Strategy**
- Static assets: 1 year (immutable)
- API responses: Via React Query (5min stale time)
- Redis: LRU eviction at 512MB

✅ **Code Splitting**
- Vendor chunks (node_modules)
- React libraries isolated
- Common modules separated
- Route-based code splitting

✅ **Security**
- Non-root user execution
- Proper signal handling (dumb-init)
- Security headers (X-Frame-Options, CSP-like)
- HTTPS ready

✅ **Database Optimization**
- Automatic migrations on startup
- Connection pooling (50 connections)
- Query optimization via Prisma

## 🐳 Docker Images

### Building Locally

```bash
# Build for development
docker build -t egfilm:dev .

# Build specific target
docker build --target runner -t egfilm:prod .
docker build --target worker -t egfilm:worker .
```

### Image Sizes

- **Runner (App)**: ~250MB (Alpine + Next.js)
- **Worker**: ~280MB (includes tsx runtime)
- **Redis**: ~35MB

## 📝 Database Migrations

Migrations run automatically on app startup via `entrypoint.sh`:

```bash
# Manual migration (if needed)
docker compose exec app npx prisma migrate deploy

# View migration status
docker compose exec app npx prisma migrate status

# Generate new migration
docker compose exec app npx prisma migrate dev --name feature_name
```

## 🔍 Monitoring

### Logs

```bash
# App logs
docker compose logs -f app

# Worker logs
docker compose logs -f worker

# Redis logs
docker compose logs -f redis

# Follow all logs
docker compose logs -f
```

### Stats

```bash
# Resource usage
docker stats

# Container status
docker compose ps

# Disk usage
docker system df
```

## 🚨 Troubleshooting

### App won't start

```bash
# Check database connection
docker compose logs app | grep -i database

# Verify environment variables
docker compose exec app env | grep DATABASE_URL

# Manual migration check
docker compose exec app npx prisma db push --force-reset
```

### High memory usage

```bash
# Check Redis memory
docker compose exec redis redis-cli info memory

# Clear Redis cache
docker compose exec redis redis-cli FLUSHALL

# Check Node process
docker stats
```

### Slow performance

```bash
# Enable query logging
docker compose exec app npx prisma studio

# Check Redis connectivity
docker compose exec redis redis-cli ping

# Monitor network
docker stats --no-stream
```

## 🔐 Security Checklist

- [ ] Environment variables in `.env` (not committed)
- [ ] Database user with minimal privileges
- [ ] Redis password configured
- [ ] HTTPS configured on reverse proxy (nginx/traefik)
- [ ] Firewall rules restrict database access
- [ ] Regular backups of PostgreSQL
- [ ] Monitor error logs via Sentry

## 📦 Backup & Recovery

### Database Backup

```bash
# Backup
docker exec egfilm-app pg_dump -U user dbname > backup.sql

# Restore
docker exec -i egfilm-app psql -U user dbname < backup.sql
```

### Redis Backup

```bash
# Backup RDB file
docker compose cp egfilm-redis:/data/dump.rdb ./redis-backup.rdb

# Check logs
docker compose logs redis | tail -20
```

## 🚀 Deployment Commands

```bash
# Deploy
docker compose up -d

# Restart
docker compose restart

# Stop
docker compose down

# Full cleanup (⚠️ removes volumes)
docker compose down -v

# View running services
docker compose ps

# Execute command in container
docker compose exec app npm run build

# Rebuild image
docker compose build --no-cache
```

## 📊 Useful Docker Compose Options

```bash
# Pull latest images before starting
docker compose up -d --pull always

# Build and start
docker compose up -d --build

# Start specific service
docker compose up -d app

# Stop without removing containers
docker compose stop

# Remove stopped containers
docker compose rm

# View service logs with timestamps
docker compose logs --timestamps -f
```

## 🔗 Useful Links

- [Next.js Deployment](https://nextjs.org/docs/deployment/docker)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Prisma Deployment](https://www.prisma.io/docs/deployment)
- [Redis Production Setup](https://redis.io/docs/management/admin/config/)

## 📞 Support

For issues or questions:
1. Check logs: `docker compose logs app`
2. Review configuration in `.env`
3. Check GitHub Issues
4. Contact: support@egfilm.xyz

---

**Last Updated:** October 23, 2025  
**Version:** 1.0.0  
**Environment:** Production
