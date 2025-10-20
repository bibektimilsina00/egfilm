# Egfilm CI/CD & Deployment

Complete CI/CD pipeline for Egfilm using GitHub Actions, GHCR, and automated server deployment.

## 🏗️ Architecture

```
GitHub Push → Build Docker Image → Push to GHCR → Deploy to Server
     ↓              ↓                    ↓              ↓
   main         Build with           Tag as        Blue-Green
   branch      Next.js 15          :deploy        Deployment
```

## 📋 Prerequisites

### 1. GitHub Repository Secrets

Go to **Settings → Secrets and variables → Actions** and add:

#### Required Secrets:
GITHUB_TOKEN           # Auto-provided by GitHub (no action needed)
SSH_PRIVATE_KEY        # SSH key to access your server
TMDB_API_KEY          # Your TMDb API key
NEXTAUTH_SECRET       # Generate: openssl rand -base64 32
NEXTAUTH_URL          # Your production URL (e.g., https://egfilm.example.com)
NEXTAUTH_URL          # Your production URL (e.g., https://egfilm.example.com)
```

### 2. GitHub Repository Variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

```bash
SERVER_HOST           # Your server IP or domain (e.g., 192.168.1.100)
SERVER_USER           # SSH username (e.g., root or ubuntu)
SSH_PORT             # SSH port (default: 22)
```

### 3. Server Requirements

Your server needs:
- **Docker** installed
- **SSH access** configured
- **Port 8000** available
- **GHCR access** (automatic via GitHub token)

#### Install Docker on Server:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

## 🚀 How It Works

### Trigger Deployment

Push to `main` or `production` branch:
```bash
git add .
git commit -m "Deploy new feature"
git push origin main
```

Or create a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### CI/CD Pipeline Steps

#### **Job 1: Build and Push** (runs on GitHub)
1. ✅ Checkout code
2. ✅ Set version and environment
3. ✅ Login to GHCR
4. ✅ Generate .env file
5. ✅ Build Docker image with Next.js
6. ✅ Push to GHCR with tags:
   - `{version}-{env}` (e.g., `latest-production`)
   - `:deploy` (used by server)
   - `:latest` (for production only)

#### **Job 2: Deploy to Server** (runs on your server via SSH)
1. ✅ Login to GHCR
2. ✅ Create .env file on server
3. ✅ **Execute deploy.sh script** which handles:
   - Start `egfilm-blue` on port 8001
   - Health check blue container
   - If healthy → deploy `egfilm-green` on port 8000
   - If green healthy → remove blue container
   - Cleanup old images
   - Cleanup old images

**Note:** The `deploy.sh` script must be placed on your server at `~/egfilm/deploy.sh`

### Blue-Green Deployment

Ensures **zero downtime**:
```
Current Production (Green:8000)
           ↓
New Version (Blue:8001) → Test
           ↓
       Health Check Pass?
           ↓
      Yes → Switch to Production
           ↓
New Production (Green:8000)
           ↓
  Cleanup Old Blue Container
```

## 📁 Files Structure

```
.github/
  └── workflows/
      └── deploy-production.yml    # Main CI/CD workflow
build.sh                           # Build script (can run locally)
Dockerfile                         # Multi-stage production build
docker-compose.yml                 # Local development (optional)
.dockerignore                      # Exclude files from image
```

## 🔧 Local Build & Test

Test the build locally before pushing:

```bash
# Build locally
./build.sh --env production --version test-v1

# Build and push to GHCR
./build.sh --env production --version v1.0.0 --push

# Build with custom registry
./build.sh \
  --env production \
  --version v1.0.0 \
  --push \
  --registry ghcr.io \
  --name yourusername/egfilm
```

## 🐳 Manual Deployment

If you need to deploy manually on your server:

```bash
# SSH into your server
ssh user@your-server

# Login to GHCR
echo $YOUR_GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

docker pull ghcr.io/bibektimilsina00/egfilm:deploy

# Create .env file
cat > ~/egfilm/.env << EOF
NEXT_PUBLIC_TMDB_API_KEY=your_key
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-domain.com
EOF

# Run container
docker run -d \
  --name egfilm-green \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file ~/egfilm/.env \
  ghcr.io/bibektimilsina00/egfilm:deploy

# Check logs
docker logs -f egfilm-green
```

## 🔍 Troubleshooting

### Build Fails

**Error:** "Failed to build Docker image"
```bash
# Check Dockerfile syntax
docker build -t test .

# Check .env.production exists during build
cat .env.production
```

### Deployment Fails

**Error:** "SSH connection refused"
```bash
# Verify SSH key is correct
ssh -i ~/.ssh/your_key user@server

# Check SSH_PRIVATE_KEY in GitHub secrets matches
```

**Error:** "Container health check failed"
```bash
# SSH into server and check logs
ssh user@server
docker logs egfilm-blue --tail 50

# Common issues:
# - Missing environment variables
# - Port already in use
# - TMDb API key invalid
```

**Error:** "Port 8000 already in use"
```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill existing container
docker stop egfilm-green
docker rm egfilm-green
```

### Image Not Updating

**Issue:** Server pulls old image
```bash
# Force pull new image on server
docker pull ghcr.io/bibektimilsina00/egfilm:deploy --no-cache

# Remove all local images
docker rmi $(docker images 'ghcr.io/bibektimilsina00/egfilm' -q)
```

## 📊 Monitoring Deployment

### GitHub Actions
1. Go to **Actions** tab in GitHub
2. Click on latest workflow run
3. View logs for each step

### Server Status
```bash
# SSH into server
ssh user@server

# Check running containers
docker ps

# Check container logs
docker logs -f egfilm-green

# Check container health
docker inspect egfilm-green | grep -A 5 Health
```

## 🔐 Security Best Practices

1. ✅ **Never commit .env files** - use GitHub Secrets
2. ✅ **Rotate SSH keys** regularly
3. ✅ **Use non-root user** on server
4. ✅ **Enable firewall** on server
5. ✅ **Use HTTPS** in production (add Nginx/Caddy)

## 🌐 Production Setup with Reverse Proxy

Add Nginx for HTTPS:

```nginx
# /etc/nginx/sites-available/egfilm
server {
    listen 80;
  server_name egfilm.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
  server_name egfilm.example.com;

  ssl_certificate /etc/letsencrypt/live/egfilm.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/egfilm.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Scaling

For high traffic:
1. **Load Balancer**: Run multiple containers on different ports
2. **Database**: Add PostgreSQL for persistent storage
3. **CDN**: Use Cloudflare for static assets
4. **Container Orchestration**: Consider Docker Swarm or Kubernetes

## 🆘 Support

If deployment fails:
1. Check GitHub Actions logs
2. Check server container logs: `docker logs egfilm-green`
3. Verify all secrets are set correctly
4. Test SSH connection manually
5. Ensure Docker is running on server

## 📝 Notes

- **No codebase on server** - Everything runs from Docker image
- **Blue-Green deployment** - Zero downtime updates
- **Automatic rollback** - Failed deployments don't affect production
- **Version tags** - All builds are versioned and traceable
- **GHCR registry** - Free private registry with GitHub

---

**✨ Your Egfilm deployment is now fully automated! ✨**
