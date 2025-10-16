#!/bin/bash

# Minimal TURN Server Setup for StreamFlix
# Run with: sudo bash setup-turn-server-minimal.sh

set -e

if [[ $EUID -ne 0 ]]; then
   echo "❌ Must run with sudo"
   exit 1
fi

echo "🚀 Installing TURN Server..."
echo ""

# Step 1: Install
echo "📦 Step 1: Installing coturn..."
apt-get update
apt-get install -y coturn
echo "✅ Installed"
echo ""

# Step 2: Get IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📍 Step 2: Server IP = $SERVER_IP"
echo ""

# Step 3: Configure
echo "⚙️  Step 3: Creating configuration..."

# Backup existing config if it exists
[[ -f /etc/coturn/turnserver.conf ]] && cp /etc/coturn/turnserver.conf /etc/coturn/turnserver.conf.bak

cat > /etc/coturn/turnserver.conf <<'TURNCONF'
# StreamFlix TURN Server
listening-port=3478
listening-ip=0.0.0.0
alt-listening-port=5349
realm=streamflix.local
user=streamflix:streamflixpass123
max-bps=1000000
log-file=/var/log/coturn/turnserver.log
log-level=info
verbose
proc-user=coturn
proc-group=coturn
TURNCONF

# Replace IP in config
sed -i "s/relay-ip=.*/relay-ip=$SERVER_IP/" /etc/coturn/turnserver.conf 2>/dev/null || echo "relay-ip=$SERVER_IP" >> /etc/coturn/turnserver.conf
sed -i "s/external-ip=.*/external-ip=$SERVER_IP/" /etc/coturn/turnserver.conf 2>/dev/null || echo "external-ip=$SERVER_IP" >> /etc/coturn/turnserver.conf

echo "✅ Configuration created"
echo ""

# Step 4: Create log directory
echo "📁 Step 4: Creating log directory..."
mkdir -p /var/log/coturn
chown coturn:coturn /var/log/coturn 2>/dev/null || true
chmod 755 /var/log/coturn
echo "✅ Log directory ready"
echo ""

# Step 5: Start service
echo "🔄 Step 5: Starting service..."
systemctl restart coturn
systemctl enable coturn
sleep 2

if systemctl is-active --quiet coturn; then
    echo "✅ Service started"
else
    echo "❌ Service failed to start"
    systemctl status coturn --no-pager
    journalctl -u coturn -n 20 --no-pager
    exit 1
fi
echo ""

# Step 6: Verify
echo "🔍 Step 6: Verifying..."
if ss -tuln 2>/dev/null | grep -q "3478"; then
    echo "✅ Listening on port 3478"
else
    echo "⚠️  Not detecting port 3478 in ss output, but service is running"
fi
echo ""

echo "📋 Configuration Summary:"
echo "  Host: $SERVER_IP"
echo "  Port: 3478 (UDP/TCP)"
echo "  User: streamflix"
echo "  Pass: streamflixpass123"
echo ""
echo "✨ Setup complete!"
