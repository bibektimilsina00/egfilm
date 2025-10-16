#!/bin/bash

# Quick diagnostic for TURN server setup issues

echo "🔍 TURN Server Setup Diagnostic"
echo "==============================="
echo ""

echo "1. Checking if coturn is installed..."
if command -v turnserver &> /dev/null; then
    echo "   ✅ turnserver command found"
    turnserver -v 2>/dev/null | head -1
else
    echo "   ❌ turnserver NOT found"
    echo "   Try: sudo apt-get install -y coturn"
fi
echo ""

echo "2. Checking if coturn package exists..."
dpkg -l | grep coturn && echo "   ✅ coturn package installed" || echo "   ❌ coturn package not installed"
echo ""

echo "3. Checking apt cache..."
apt-cache search coturn | head -3
echo ""

echo "4. Checking systemd service..."
if systemctl list-unit-files | grep coturn &> /dev/null; then
    echo "   ✅ coturn service found"
    systemctl status coturn --no-pager 2>&1 | head -5
else
    echo "   ❌ coturn service not found"
fi
echo ""

echo "5. Current user: $(whoami)"
if [[ $EUID -ne 0 ]]; then
   echo "   ⚠️  NOT running as root - some commands may fail"
fi
echo ""

echo "6. Quick install attempt:"
echo "   Running: sudo apt-get update && sudo apt-get install -y coturn"
echo ""
