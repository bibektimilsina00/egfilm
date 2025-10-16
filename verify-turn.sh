#!/bin/bash

# Verify TURN Server is working
# Run this to test connectivity to your TURN server

echo "🔍 TURN Server Verification"
echo "============================"
echo ""

TURN_SERVER="128.199.195.107"
TURN_PORT="3478"

echo "Testing TURN Server connectivity..."
echo ""

# Test UDP
echo "1️⃣  Testing UDP port $TURN_PORT..."
if timeout 2 nc -zu "$TURN_SERVER" "$TURN_PORT" 2>/dev/null; then
    echo "   ✅ TURN UDP port is open and responding"
else
    echo "   ❌ TURN UDP port not responding"
    echo "   Note: This is expected if tested from outside your VPS"
fi
echo ""

# Test TCP
echo "2️⃣  Testing TCP port $TURN_PORT..."
if timeout 2 nc -zv "$TURN_SERVER" "$TURN_PORT" 2>/dev/null; then
    echo "   ✅ TURN TCP port is open"
else
    echo "   ❌ TURN TCP port not responding"
    echo "   Note: This is expected if tested from outside your VPS"
fi
echo ""

# Check if service is running on VPS
if [[ -x $(command -v ssh) ]]; then
    echo "3️⃣  Checking service status on VPS..."
    ssh root@"$TURN_SERVER" "systemctl is-active coturn" 2>/dev/null
    if [[ $? -eq 0 ]]; then
        echo "   ✅ TURN service is running on VPS"
    else
        echo "   ⚠️  Could not verify service status"
    fi
else
    echo "3️⃣  SSH not available for remote verification"
fi
echo ""

echo "📋 TURN Server Details:"
echo "  Host: $TURN_SERVER"
echo "  Port: 3478 (UDP/TCP), 5349 (TLS)"
echo "  Username: streamflix"
echo "  Password: streamflixpass123"
echo ""

echo "✨ Next Steps:"
echo "  1. Push code to main branch"
echo "  2. Wait for CI/CD deployment (2-3 minutes)"
echo "  3. Test Watch Together with 2 browsers"
echo "  4. Check console for 'relay (TURN)' candidates"
echo "  5. Verify connection reaches 'connected' state"
echo ""
