# WebRTC Firewall Fix for DigitalOcean

## Problem Identified

Your VPS has **hosting provider network restrictions** blocking WebRTC:
- ❌ UDP 19302 (Google STUN) - BLOCKED
- ❌ UDP 3478 (Mozilla STUN) - BLOCKED
- ❌ TCP 443 to TURN server - BLOCKED
- ✅ UFW is disabled (so issue is at provider level)

## Solutions (in order of preference)

### Solution 1: Use DigitalOcean Firewall (RECOMMENDED)
DigitalOcean has a cloud firewall that's separate from UFW. You need to allow outbound traffic:

1. Go to DigitalOcean Dashboard → Networking → Firewalls
2. Click on your existing firewall (or create new one)
3. Under "Outbound Rules", add:
   ```
   Protocol: UDP
   Port Range: 19302
   Destination: 0.0.0.0/0 (All IPv4)
   
   Protocol: UDP
   Port Range: 3478
   Destination: 0.0.0.0/0 (All IPv4)
   
   Protocol: UDP
   Port Range: 50000-60000
   Destination: 0.0.0.0/0 (All IPv4)
   ```

4. Test after 1-2 minutes (DO firewall takes time to apply)

### Solution 2: Use Self-Hosted TURN Server (MOST RELIABLE)
Deploy a TURN server on your VPS (since TCP 443 outbound seems blocked too):

```bash
# SSH to your VPS and run:
sudo apt-get update
sudo apt-get install -y coturn

# Edit config
sudo nano /etc/coturn/turnserver.conf

# Add these lines:
listening-port=3478
listening-ip=0.0.0.0
relay-ip=128.199.195.107
external-ip=128.199.195.107
realm=streamflix.local
username=streamflix
password=your_secure_password_here
log-file=/var/log/coturn/turnserver.log

# Start service
sudo systemctl start coturn
sudo systemctl enable coturn

# Test it's listening
sudo ss -tuln | grep 3478
```

Then update your StreamFlix code to use local TURN:

In `src/app/watch-together/page.tsx`, change:
```typescript
iceServers: [
    // ... STUN servers (may still be blocked)
    {
        urls: ['turn:128.199.195.107:3478'],
        username: 'streamflix',
        credential: 'your_secure_password_here'
    }
]
```

### Solution 3: Use Relay.io TURN Service (PAID but RELIABLE)
If self-hosted TURN doesn't work, use a commercial TURN service:

```bash
# Sign up at relay.io, then update code:
urls: ['turn:your-relay.relay.io:443?transport=tcp'],
username: 'your_username',
credential: 'your_credential'
```

### Solution 4: Contact DigitalOcean Support
Open a ticket asking them to unblock:
- Outbound UDP 19302, 3478, 50000-60000 (STUN/P2P)
- Explain you're running WebRTC application

---

## Immediate Next Steps

1. **Test DigitalOcean Firewall Rules** (5 minutes):
   ```bash
   # After adding firewall rules, run:
   ./firewall-test.sh
   ```
   If STUN shows ✅, redeploy and test Watch Together

2. **If Still Blocked**, deploy TURN server:
   ```bash
   # SSH to VPS
   ssh root@128.199.195.107
   
   # Run coturn setup
   sudo apt-get update
   sudo apt-get install -y coturn
   sudo nano /etc/coturn/turnserver.conf
   # Add config lines above
   sudo systemctl restart coturn
   ```

3. **Update StreamFlix Code**:
   - Replace TURN config in `src/app/watch-together/page.tsx`
   - Commit and push to redeploy

---

## What to Look for in Browser Console

After implementing one of these solutions, when testing Watch Together:

✅ **Success indicators:**
```
📤 [ICE CANDIDATE LOCAL] Type: relay (TURN), Candidate: ...
❄️ [ICE STATE] → connected
✅ [PEER CONNECTION ESTABLISHED] Video/audio should now flow
🎬 [REMOTE TRACK RECEIVED]
```

❌ **Still failing:**
```
❌ [CONNECTION FAILED] - may be firewall/NAT issue
```

If still failing, take screenshot of console and share - we may need commercial TURN service or different approach.

---

## Why This Happened

- **Local testing works**: Both browsers on same machine/network, no internet firewall involved
- **Production fails**: VPS provider blocks UDP ports needed for direct P2P
- **TURN fallback didn't work**: Provider also blocks TCP connections to external TURN servers
- **Solution**: Self-hosted TURN relay on your own VPS that you control

This is common with shared VPS providers. Enterprise/dedicated servers have fewer restrictions.
