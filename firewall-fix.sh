#!/bin/bash

# Quick Firewall Fix for StreamFlix WebRTC
# Run this on your VPS to fix common WebRTC issues

echo "🔧 StreamFlix WebRTC Firewall Fix"
echo "=================================="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run with sudo"
   exit 1
fi

# Detect firewall type
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    echo "📋 UFW Firewall detected"
    echo ""
    
    echo "🔓 Adding WebRTC firewall rules..."
    echo ""
    
    # Outbound rules for STUN/TURN
    echo "  • Allowing outbound UDP 19302 (Google STUN)..."
    ufw allow out 19302/udp comment "STUN - Google"
    
    echo "  • Allowing outbound UDP 3478 (Mozilla STUN)..."
    ufw allow out 3478/udp comment "STUN - Mozilla"
    
    echo "  • Allowing outbound TCP 443 (TURN/HTTPS)..."
    ufw allow out 443/tcp comment "TURN/HTTPS"
    
    echo "  • Allowing outbound UDP ephemeral ports (P2P)..."
    ufw allow out 50000:60000/udp comment "P2P Media"
    
    # Inbound for streaming port
    echo "  • Allowing inbound TCP 8000 (StreamFlix)..."
    ufw allow 8000/tcp comment "StreamFlix"
    
    echo ""
    echo "✅ Firewall rules updated!"
    echo ""
    echo "Current UFW status:"
    ufw status numbered | grep -E "(8000|19302|3478|443|50000)"
    echo ""
    
elif command -v firewall-cmd &> /dev/null && firewall-cmd --state 2>/dev/null | grep -q "running"; then
    echo "📋 FirewallD detected"
    echo ""
    
    echo "🔓 Adding WebRTC firewall rules..."
    echo ""
    
    firewall-cmd --permanent --add-port=8000/tcp
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-protocol=udp
    
    echo "  • Reloading firewall..."
    firewall-cmd --reload
    
    echo "✅ Firewall rules updated!"
    echo ""
    
else
    echo "⚠️  No supported firewall found"
    echo ""
    echo "If you have iptables configured directly, add these rules:"
    echo ""
    echo "  sudo iptables -A OUTPUT -p udp --dport 19302 -j ACCEPT"
    echo "  sudo iptables -A OUTPUT -p udp --dport 3478 -j ACCEPT"
    echo "  sudo iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT"
    echo "  sudo iptables -A OUTPUT -p udp --match multiport --dports 50000:60000 -j ACCEPT"
    echo ""
fi

echo ""
echo "✨ Next steps:"
echo "  1. Restart your StreamFlix container: docker restart streamflix-green"
echo "  2. Open 2 browser windows and test Watch Together"
echo "  3. Check console for ICE candidate types:"
echo "     - Should see 'host', 'srflx (STUN)', or 'relay (TURN)' candidates"
echo "     - Connection should reach 'connected' state"
echo ""
