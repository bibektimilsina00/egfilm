#!/bin/bash

# Setup TURN Server on DigitalOcean VPS for StreamFlix WebRTC
# This allows P2P connections to work when provider blocks UDP

set -e

echo "🚀 StreamFlix TURN Server Setup"
echo "================================"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run with sudo"
   echo "   Usage: sudo bash setup-turn-server.sh"
   exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📍 Server IP: $SERVER_IP"
echo ""

# Install coturn
echo "📦 Installing coturn..."
apt-get update > /dev/null 2>&1
apt-get install -y coturn > /dev/null 2>&1
echo "✅ coturn installed"
echo ""

# Create TURN config
echo "⚙️  Configuring TURN server..."
cat > /etc/coturn/turnserver.conf <<EOF
# StreamFlix TURN Server Configuration
# Generated on $(date)

# Listen on all interfaces
listening-port=3478
listening-ip=0.0.0.0
alt-listening-port=5349

# Use your server's public IP
relay-ip=$SERVER_IP
external-ip=$SERVER_IP
realm=streamflix.local

# Credentials (change these!)
user=streamflix:streamflixpass123

# Performance
max-bps=1000000
bps-capacity=0
log-file=/var/log/coturn/turnserver.log
log-level=info

# Allow verbose logging for debugging
verbose

# Performance tuning
proc-user=coturn
proc-group=coturn
EOF

echo "✅ Configuration created at /etc/coturn/turnserver.conf"
echo ""

# Create log directory
mkdir -p /var/log/coturn
chown coturn:coturn /var/log/coturn
chmod 755 /var/log/coturn

# Start TURN server
echo "🔄 Starting TURN server..."
systemctl restart coturn
systemctl enable coturn
echo "✅ TURN server started and enabled"
echo ""

# Verify it's running
echo "🔍 Verifying TURN server is listening..."
if ss -tuln | grep -q "3478"; then
    echo "✅ TURN server listening on port 3478"
else
    echo "❌ TURN server not listening - checking logs:"
    systemctl status coturn
    exit 1
fi
echo ""

# Show configuration
echo "📋 TURN Server Details:"
echo "  Host: $SERVER_IP"
echo "  Ports: 3478 (UDP/TCP), 5349 (TLS)"
echo "  Username: streamflix"
echo "  Password: streamflixpass123"
echo "  Realm: streamflix.local"
echo ""

# Generate StreamFlix config
echo "📝 Update your StreamFlix code with this config:"
echo ""
echo "In src/app/watch-together/page.tsx, update iceServers to:"
echo ""
cat << 'EOF'
iceServers: [
    // STUN servers (may be blocked by provider)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Your own TURN server (highest priority)
    {
        urls: ['turn:128.199.195.107:3478?transport=udp', 'turn:128.199.195.107:3478?transport=tcp'],
        username: 'streamflix',
        credential: 'streamflixpass123'
    }
]
EOF

echo ""
echo "💡 Next Steps:"
echo "  1. Update StreamFlix code with TURN config above"
echo "  2. Commit and push: git push origin main"
echo "  3. Wait for CI/CD deployment"
echo "  4. Test Watch Together with 2 browsers"
echo "  5. Check browser console for 'relay (TURN)' candidates"
echo ""
echo "🔒 Security Reminder:"
echo "  • Change username and password in /etc/coturn/turnserver.conf"
echo "  • Change credentials in StreamFlix code to match"
echo "  • Consider using firewall to limit TURN access"
echo ""
