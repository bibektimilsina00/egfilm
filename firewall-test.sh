#!/bin/bash

# Egfilm WebRTC Firewall Diagnostic Script
# Run this on your VPS to test network connectivity

echo "🔍 Egfilm WebRTC Firewall & Network Diagnostics"
echo "=================================================="
echo ""

# Check if running on VPS
echo "📍 Server Information:"
echo "  Hostname: $(hostname)"
echo "  Public IP: $(curl -s https://ifconfig.me || echo 'Could not determine')"
echo "  OS: $(uname -s)"
echo ""

# Test STUN Server Connectivity (UDP port 19302)
echo "🎯 Testing STUN Servers (UDP/19302):"
echo ""

test_stun() {
    local server=$1
    local port=$2
    echo -n "  Testing $server:$port ... "
    
    # Try different methods based on available tools
    if command -v nc &> /dev/null; then
        if timeout 3 nc -zu "$server" "$port" 2>/dev/null; then
            echo "✅ OPEN"
        else
            echo "❌ BLOCKED or NO RESPONSE"
        fi
    elif command -v nmap &> /dev/null; then
        if nmap -sU -p "$port" "$server" 2>/dev/null | grep -q "open"; then
            echo "✅ OPEN"
        else
            echo "❌ BLOCKED or NO RESPONSE"
        fi
    else
        echo "⚠️  (nc/nmap not installed - cannot test)"
    fi
}

test_stun "stun.l.google.com" "19302"
test_stun "stun1.l.google.com" "19302"
test_stun "stun.services.mozilla.com" "3478"
echo ""

# Test TURN Server Connectivity
echo "🎯 Testing TURN Server (TCP/UDP 443):"
echo ""

if command -v nc &> /dev/null; then
    echo -n "  Testing openrelay.metered.ca:443 (TCP) ... "
    if timeout 3 nc -zv openrelay.metered.ca 443 2>/dev/null; then
        echo "✅ OPEN"
    else
        echo "❌ BLOCKED"
    fi
else
    echo "  ⚠️  (nc not installed - cannot test)"
fi
echo ""

# Test DNS resolution
echo "🌐 DNS Resolution:"
echo ""
for domain in "stun.l.google.com" "stun.services.mozilla.com" "openrelay.metered.ca"; do
    echo -n "  $domain ... "
    if dig +short "$domain" @8.8.8.8 | grep -q .; then
        echo "✅ $(dig +short $domain @8.8.8.8 | head -1)"
    else
        echo "❌ FAILED"
    fi
done
echo ""

# Check firewall rules
echo "🔥 Firewall Status:"
echo ""

if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo "  ✅ UFW is active"
        echo ""
        echo "  Current UFW rules:"
        ufw status | grep -E "^\s*(8000|443|19302|3478|STUN|TURN)" || echo "    No explicit WebRTC rules found"
    else
        echo "  ⚠️  UFW is disabled"
    fi
elif command -v firewall-cmd &> /dev/null; then
    if firewall-cmd --state 2>/dev/null | grep -q "running"; then
        echo "  ✅ FirewallD is active"
        echo ""
        echo "  Open ports:"
        firewall-cmd --list-ports
    else
        echo "  ⚠️  FirewallD is not running"
    fi
else
    echo "  ⚠️  Could not detect firewall (ufw/firewall-cmd not found)"
fi
echo ""

# Check iptables rules
echo "📋 IPTables Rules (sample):"
echo ""
if command -v iptables &> /dev/null; then
    echo "  INPUT chain summary:"
    sudo iptables -L INPUT -n 2>/dev/null | head -20 || echo "    (Run with sudo for full output)"
else
    echo "  ⚠️  iptables not available"
fi
echo ""

# Port listening status
echo "🔌 Ports in Use:"
echo ""
if command -v ss &> /dev/null; then
    echo "  Listening ports:"
    ss -tuln | grep -E ":(8000|443|19302|3478|LISTEN)" || echo "    No WebRTC ports listening"
elif command -v netstat &> /dev/null; then
    echo "  Listening ports:"
    netstat -tuln | grep -E ":(8000|443|19302|3478|LISTEN)" || echo "    No WebRTC ports listening"
else
    echo "  ⚠️  ss/netstat not available"
fi
echo ""

# Network interfaces
echo "🖧 Network Interfaces:"
echo ""
if command -v ip &> /dev/null; then
    ip addr show | grep -E "inet " | head -10
else
    ifconfig 2>/dev/null | grep "inet " | head -10
fi
echo ""

# MTU and packet fragmentation
echo "📦 Network Configuration:"
echo ""
if command -v ip &> /dev/null; then
    ip link show | grep -E "mtu " | head -5
else
    echo "  ⚠️  Could not check MTU"
fi
echo ""

# Recommendations
echo "💡 Recommendations:"
echo "=================================================="
echo ""
echo "If STUN servers show ❌ BLOCKED:"
echo "  1. Check firewall rules allow UDP 19302 outbound"
echo "  2. Check ISP/hosting provider doesn't block STUN"
echo "  3. Add UFW rule: ufw allow out 19302/udp"
echo ""
echo "If TURN server shows ❌ BLOCKED:"
echo "  1. TURN requires TCP 443 (usually open for HTTPS)"
echo "  2. If blocked, may need custom TURN server"
echo ""
echo "General WebRTC firewall rules needed:"
echo "  • Allow UDP 50000-60000 (ephemeral ports for P2P)"
echo "  • Allow UDP 19302,3478 (STUN servers)"
echo "  • Allow TCP 443 (TURN fallback)"
echo ""
echo "To add UFW rules:"
echo "  sudo ufw allow 8000/tcp                  # Egfilm app"
echo "  sudo ufw allow out 19302/udp             # STUN"
echo "  sudo ufw allow out 3478/udp              # STUN"
echo "  sudo ufw allow out 443/tcp               # TURN (usually already open)"
echo "  sudo ufw allow out 50000:60000/udp       # P2P data"
echo ""
