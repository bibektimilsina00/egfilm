# StreamFlix Deployment Quick Reference

## 🚀 First Time Setup

### 1. Configure GitHub Repository

**Secrets** (Settings → Secrets and variables → Actions → New repository secret):
```
TMDB_API_KEY          # Your TMDb API key
NEXTAUTH_SECRET       # Generate: openssl rand -base64 32
NEXTAUTH_URL          # Production URL (e.g., http://your-server-ip:8000)
SSH_PRIVATE_KEY       # Your SSH private key for server access
```

**Variables** (Settings → Secrets and variables → Actions → New repository variable):
```
SERVER_HOST           # Your server IP or domain
SERVER_USER           # SSH user (e.g., ubuntu, root, your-username)
SSH_PORT              # SSH port (default: 22)
```

### 2. Setup Server (REQUIRED BEFORE FIRST DEPLOYMENT)

**⚠️ Important:** You MUST run this setup on your server before the first deployment, otherwise GitHub Actions will fail with "docker: command not found".

SSH into your server and run:

```bash
# Method 1: Download and run setup script (Recommended)
curl -O https://raw.githubusercontent.com/bibektimilsina00/stream-flix/main/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh

# Download deploy script
cd ~/streamflix
curl -O https://raw.githubusercontent.com/bibektimilsina00/stream-flix/main/deploy.sh
chmod +x deploy.sh
```

**Method 2: Manual setup:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Logout and login again for docker group to take effect
exit
# SSH back in

# Verify Docker is installed
docker --version

# Create directories and copy scripts
mkdir -p ~/streamflix
cd ~/streamflix
# Copy deploy.sh to ~/streamflix/deploy.sh
# Copy .env file with your production values
```

**After setup, test Docker:**
```bash
docker ps
# Should show empty list or running containers, not "command not found"
```

### 3. Deploy

```bash
git push origin main
```

That's it! GitHub Actions will:
- ✅ Build Docker image
- ✅ Push to GHCR
- ✅ Deploy to your server with zero downtime

---

## 🔄 Common Tasks

### Deploy to Production
```bash
git push origin main
# or
git push origin production
```

### Deploy Specific Version
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Local Build & Test
```bash
# Development build
./build.sh --env development --version dev

# Production build (without push)
./build.sh --env production --version v1.0.0

# Build and push to GHCR
./build.sh --env production --version v1.0.0 --push
```

### Server Management (on server)

```bash
cd ~/streamflix

# View logs
./logs.sh

# Restart container
./restart.sh

# Pull latest and restart
./update.sh

# Stop container
./stop.sh

# Start container
./start.sh
```

### Manual Deployment (Fallback)

If CI/CD fails, deploy manually:

```bash
# On your local machine
./build.sh --env production --version v1.0.0 --push

# On your server
cd ~/streamflix
docker pull ghcr.io/YOUR_USERNAME/torrent-streamer:deploy
docker stop streamflix-green || true
docker rm streamflix-green || true
docker run -d \
  --name streamflix-green \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  ghcr.io/YOUR_USERNAME/torrent-streamer:deploy
```

---

## 📊 Monitoring

### Check Deployment Status
- Go to **GitHub** → **Actions** tab
- View workflow runs and logs

### Check Container Status
```bash
# On server
docker ps -a | grep streamflix
docker logs -f streamflix-green

# Check health
curl http://localhost:8000
```

### View Container Stats
```bash
docker stats streamflix-green
```

---

## 🐛 Troubleshooting

### Build Fails on GitHub Actions

**Check logs:**
- Go to Actions tab → Click failed workflow → View logs

**Common issues:**
- Missing secrets (TMDB_API_KEY, NEXTAUTH_SECRET)
- Dockerfile syntax error
- npm dependency issue

**Fix:**
```bash
# Test build locally
./build.sh --env production --version test
```

### Deployment Fails

**Check SSH connection:**
```bash
# From your machine
ssh -i ~/.ssh/your_key $SERVER_USER@$SERVER_HOST -p $SSH_PORT
```

**Check GitHub Actions logs:**
- Look for SSH connection errors
- Verify SERVER_HOST, SERVER_USER, SSH_PORT, SSH_PRIVATE_KEY

**Check container health:**
```bash
# On server
docker logs streamflix-blue
docker logs streamflix-green
```

### Container Won't Start

**View logs:**
```bash
docker logs streamflix-green
```

**Common issues:**
- Port 8000 already in use: `lsof -i :8000` or `netstat -tlnp | grep 8000`
- Missing environment variables in ~/streamflix/.env
- Incorrect .env values (check NEXTAUTH_URL matches deployment URL)

**Fix:**
```bash
# Stop conflicting process
sudo kill <PID>

# Or use different port
docker run -d --name streamflix-green -p 8080:8000 ...

# Verify .env file
cat ~/streamflix/.env
nano ~/streamflix/.env  # Edit if needed
```

### Image Not Updating

**Force pull:**
```bash
cd ~/streamflix
docker pull ghcr.io/YOUR_USERNAME/torrent-streamer:deploy
./restart.sh
```

**Clear old images:**
```bash
docker image prune -a
```

---

## 🔐 Security Checklist

- ✅ Never commit `.env` files
- ✅ Rotate SSH keys regularly
- ✅ Use non-root user on server
- ✅ Enable firewall (UFW): `sudo ufw allow 8000/tcp`
- ✅ Set up HTTPS with Nginx + Let's Encrypt
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Use strong NEXTAUTH_SECRET (32+ characters)

---

## 🌐 Production Setup (HTTPS)

### Install Nginx
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/streamflix

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/streamflix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

### Update NEXTAUTH_URL
```bash
# Update in GitHub secrets
NEXTAUTH_URL=https://your-domain.com

# Update on server
nano ~/streamflix/.env
# Change NEXTAUTH_URL to https://your-domain.com
./restart.sh
```

---

## 📈 Scaling

### Multiple Servers (Load Balancing)

**Update workflow** (.github/workflows/deploy-production.yml):
```yaml
deploy-to-servers:
  strategy:
    matrix:
      server: [server1, server2, server3]
  steps:
    - name: Deploy to ${{ matrix.server }}
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets[format('SERVER_HOST_{0}', matrix.server)] }}
        # ... rest of SSH config
```

### Database for Persistent Auth

Currently uses in-memory auth. To add persistent database:
1. Add PostgreSQL or MongoDB to Docker Compose
2. Update NextAuth adapter in `src/lib/auth.ts`
3. Add database connection to .env
4. Update health checks to include database

---

## 🎯 Quick Links

- **Workflow file:** `.github/workflows/deploy-production.yml`
- **Build script:** `build.sh`
- **Server setup:** `server-setup.sh`
- **Full documentation:** `CICD_SETUP.md`
- **AI instructions:** `.github/copilot-instructions.md`

---

## 💡 Tips

1. **Always test locally first:** Run `./build.sh` before pushing
2. **Use version tags:** Tag releases with semantic versioning (v1.0.0, v1.1.0)
3. **Monitor GitHub Actions:** Check build/deploy status after each push
4. **Keep logs:** Use `./logs.sh` to debug container issues
5. **Backup .env:** Keep secure backup of production .env file
6. **Test in staging:** Use different branch/server for testing before production

---

## 🆘 Need Help?

**Documentation:**
- Full CI/CD guide: `CICD_SETUP.md`
- AI instructions: `.github/copilot-instructions.md`
- Docker compose: `docker-compose.yml`

**Check logs:**
1. GitHub Actions logs (build/deploy errors)
2. Server container logs: `./logs.sh`
3. Nginx logs: `/var/log/nginx/error.log`

**Common commands:**
```bash
# Check container status
docker ps -a

# View container logs
docker logs -f streamflix-green

# Check port usage
lsof -i :8000

# Check disk space
df -h

# Check memory
free -h

# Restart everything
./restart.sh
```
