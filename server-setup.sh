#!/bin/bash
# StreamFlix Server Setup Script
# Run this on your server for first-time setup

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   StreamFlix Server Setup              ${NC}"
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

# Create streamflix directory
echo -e "\n${BLUE}Creating StreamFlix directory...${NC}"
mkdir -p ~/streamflix
cd ~/streamflix

# Create .env template
echo -e "${BLUE}Creating .env template...${NC}"
cat > .env << 'EOF'
# StreamFlix Production Environment
# Replace these values with your actual credentials

# TMDb API (Get from https://www.themoviedb.org/settings/api)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here

# NextAuth Configuration
# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET=your_nextauth_secret_here

# Your production URL
NEXTAUTH_URL=http://localhost:8000
EOF

echo -e "${GREEN}✅ Environment template created at: ~/streamflix/.env${NC}"
echo -e "${YELLOW}⚠️  Please edit ~/streamflix/.env with your actual values!${NC}"

# Test Docker
echo -e "\n${BLUE}Testing Docker...${NC}"
docker run --rm hello-world > /dev/null 2>&1
echo -e "${GREEN}✅ Docker is working correctly${NC}"

# Pull StreamFlix image (if credentials provided)
read -p "Do you want to pull the StreamFlix image now? (y/n): " PULL_IMAGE
if [ "$PULL_IMAGE" = "y" ] || [ "$PULL_IMAGE" = "Y" ]; then
  echo -e "\n${BLUE}Pulling StreamFlix image from GHCR...${NC}"
  
  read -p "GitHub Username: " GH_USER
  read -sp "GitHub Token (or Personal Access Token): " GH_TOKEN
  echo ""
  
  echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin
  
  docker pull ghcr.io/bibektimilsina00/stream-flix:deploy
  echo -e "${GREEN}✅ StreamFlix image pulled successfully${NC}"
fi

# Create helper scripts
echo -e "\n${BLUE}Creating helper scripts...${NC}"

# Start script
cat > ~/streamflix/start.sh << 'EOF'
#!/bin/bash
# Start StreamFlix container

docker run -d \
  --name streamflix-green \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file ~/streamflix/.env \
  ghcr.io/bibektimilsina00/stream-flix:deploy

echo "✅ StreamFlix started on port 8000"
echo "Access at: http://$(curl -s ifconfig.me):8000"
EOF

# Stop script
cat > ~/streamflix/stop.sh << 'EOF'
#!/bin/bash
# Stop StreamFlix container

docker stop streamflix-green 2>/dev/null || true
docker rm streamflix-green 2>/dev/null || true
echo "✅ StreamFlix stopped"
EOF

# Logs script
cat > ~/streamflix/logs.sh << 'EOF'
#!/bin/bash
# View StreamFlix logs

docker logs -f streamflix-green
EOF

# Restart script
cat > ~/streamflix/restart.sh << 'EOF'
#!/bin/bash
# Restart StreamFlix

./stop.sh
./start.sh
EOF

# Update script
cat > ~/streamflix/update.sh << 'EOF'
#!/bin/bash
# Update to latest StreamFlix version

echo "🔄 Pulling latest image..."
docker pull ghcr.io/bibektimilsina00/stream-flix:deploy

echo "🔄 Restarting container..."
./stop.sh
./start.sh

echo "✅ StreamFlix updated to latest version"
EOF

chmod +x ~/streamflix/*.sh

echo -e "${GREEN}✅ Helper scripts created:${NC}"
echo -e "  - start.sh     : Start StreamFlix"
echo -e "  - stop.sh      : Stop StreamFlix"
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
echo -e "${GREEN}✨ StreamFlix Server Setup Complete! ✨${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Edit your environment file:"
echo -e "   ${YELLOW}nano ~/streamflix/.env${NC}"
echo -e ""
echo -e "2. Start StreamFlix:"
echo -e "   ${YELLOW}cd ~/streamflix && ./start.sh${NC}"
echo -e ""
echo -e "3. View logs:"
echo -e "   ${YELLOW}./logs.sh${NC}"
echo -e ""
echo -e "4. Access StreamFlix:"
echo -e "   ${YELLOW}http://your-server-ip:8000${NC}"
echo -e ""
echo -e "${BLUE}For CI/CD setup, configure GitHub Actions as described in CICD_SETUP.md${NC}"
