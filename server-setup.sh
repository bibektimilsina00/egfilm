#!/bin/bash
# Egfilm Server Setup Script
# Run this on your server for first-time setup

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Egfilm Server Setup              ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: Running as root. Consider using a non-root user.${NC}"
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  
  # Add current user to docker group if not root
  if [ "$EUID" -ne 0 ]; then
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed. Please logout and login again for group changes to take effect.${NC}"
  else
    echo -e "${GREEN}✅ Docker installed.${NC}"
  fi
else
  echo -e "${GREEN}✅ Docker is already installed.${NC}"
fi

# Check Docker version
DOCKER_VERSION=$(docker --version)
echo -e "${BLUE}Docker version: ${DOCKER_VERSION}${NC}"

 # Create egfilm directory
echo -e "\n${BLUE}Creating Egfilm directory...${NC}"
mkdir -p ~/egfilm
cd ~/egfilm

# Create .env template
echo -e "${BLUE}Creating .env template...${NC}"
cat > .env << 'EOF'
# Egfilm Production Environment
# Replace these values with your actual credentials

# TMDb API (Get from https://www.themoviedb.org/settings/api)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here

# NextAuth Configuration
# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here

# Your production URL
NEXTAUTH_URL=http://localhost:8000
EOF

echo -e "${GREEN}✅ Environment template created at: ~/egfilm/.env${NC}"
echo -e "${YELLOW}⚠️  Please edit ~/egfilm/.env with your actual values!${NC}"

# Test Docker
echo -e "\n${BLUE}Testing Docker...${NC}"
docker run --rm hello-world > /dev/null 2>&1
echo -e "${GREEN}✅ Docker is working correctly${NC}"

# Pull Egfilm image (if credentials provided)
read -p "Do you want to pull the Egfilm image now? (y/n): " PULL_IMAGE
if [ "$PULL_IMAGE" = "y" ] || [ "$PULL_IMAGE" = "Y" ]; then
  echo -e "\n${BLUE}Pulling Egfilm image from GHCR...${NC}"
  
  read -p "GitHub Username: " GH_USER
  read -sp "GitHub Token (or Personal Access Token): " GH_TOKEN
  echo ""
  
  echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin
  
  docker pull ghcr.io/bibektimilsina00/egfilm:deploy
  echo -e "${GREEN}✅ Egfilm image pulled successfully${NC}"
fi

# Create helper scripts
echo -e "\n${BLUE}Creating helper scripts...${NC}"

# Start script
cat > ~/egfilm/start.sh << 'EOF'
#!/bin/bash
# Start Egfilm container

docker run -d \
  --name egfilm-green \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file ~/egfilm/.env \
  ghcr.io/bibektimilsina00/egfilm:deploy

echo "✅ Egfilm started on port 8000"
echo "Access at: http://$(curl -s ifconfig.me):8000"
EOF

# Stop script
cat > ~/egfilm/stop.sh << 'EOF'
#!/bin/bash
# Stop Egfilm container

docker stop egfilm-green 2>/dev/null || true
docker rm egfilm-green 2>/dev/null || true
echo "✅ Egfilm stopped"
EOF

# Logs script
cat > ~/egfilm/logs.sh << 'EOF'
#!/bin/bash
# View Egfilm logs

docker logs -f egfilm-green
EOF

# Restart script
cat > ~/egfilm/restart.sh << 'EOF'
#!/bin/bash
# Restart Egfilm

./stop.sh
./start.sh
EOF

# Update script
cat > ~/egfilm/update.sh << 'EOF'
#!/bin/bash
# Update to latest Egfilm version

echo "🔄 Pulling latest image..."
docker pull ghcr.io/bibektimilsina00/egfilm:deploy

echo "🔄 Restarting container..."
./stop.sh
./start.sh

echo "✅ Egfilm updated to latest version"
EOF

chmod +x ~/egfilm/*.sh

echo -e "${GREEN}✅ Helper scripts created:${NC}"
echo -e "  - start.sh     : Start Egfilm"
echo -e "  - stop.sh      : Stop Egfilm"
echo -e "  - logs.sh      : View logs"
echo -e "  - restart.sh   : Restart container"
echo -e "  - update.sh    : Pull and deploy latest version"

# Check firewall
echo -e "\n${BLUE}Checking firewall...${NC}"
if command -v ufw &> /dev/null; then
  UFW_STATUS=$(sudo ufw status | grep "Status:" | awk '{print $2}')
  if [ "$UFW_STATUS" = "active" ]; then
    echo -e "${YELLOW}UFW firewall is active${NC}"
    read -p "Allow port 8000? (y/n): " ALLOW_PORT
    if [ "$ALLOW_PORT" = "y" ] || [ "$ALLOW_PORT" = "Y" ]; then
      sudo ufw allow 8000/tcp
      echo -e "${GREEN}✅ Port 8000 allowed in firewall${NC}"
    fi
  fi
fi

# Summary
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Egfilm Server Setup Complete! ✨${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Edit your environment file:"
echo -e "   ${YELLOW}nano ~/egfilm/.env${NC}"
echo -e ""
echo -e "2. Start Egfilm:"
echo -e "   ${YELLOW}cd ~/egfilm && ./start.sh${NC}"
echo -e ""
echo -e "3. View logs:"
echo -e "   ${YELLOW}./logs.sh${NC}"
echo -e ""
echo -e "4. Access Egfilm:"
echo -e "   ${YELLOW}http://your-server-ip:8000${NC}"
echo -e ""
echo -e "${BLUE}For CI/CD setup, configure GitHub Actions as described in CICD_SETUP.md${NC}"
