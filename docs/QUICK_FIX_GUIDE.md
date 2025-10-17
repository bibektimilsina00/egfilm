# 🚀 Action Plan: Fix WebRTC on Your VPS

## Problem Diagnosed
Your DigitalOcean VPS blocks all WebRTC-related traffic:
- ❌ UDP 19302 (Google STUN)
- ❌ UDP 3478 (Mozilla STUN)  
- ❌ TCP 443 to external TURN

**Root Cause**: Hosting provider network restrictions (common with shared VPS)

**Solution**: Deploy self-hosted TURN server on your VPS

---

## Quick Start (5 minutes)

### Step 1: Setup TURN Server on VPS
```bash
# SSH to your VPS
ssh root@128.199.195.107

# Download and run the setup script
cd /root
wget https://raw.githubusercontent.com/bibektimilsina00/stream-flix/main/setup-turn-server.sh
sudo bash setup-turn-server.sh

# Verify it's running
sudo systemctl status coturn
```

Expected output:
```
✅ coturn installed
✅ Configuration created
✅ TURN server started and enabled
✅ TURN server listening on port 3478
```

### Step 2: Update GitHub Actions Secrets

Go to: **GitHub → Your Repo → Settings → Secrets and variables → Actions**

Add these **Repository variables** (public):
```
TURN_SERVER = 128.199.195.107
TURN_USERNAME = streamflix
```

Add this **Repository secret** (private):
```
TURN_PASSWORD = streamflixpass123
```

(You can change the password - make sure it matches `/etc/coturn/turnserver.conf`)

### Step 3: Test Locally (optional but recommended)
```bash
# In your local development:
npm run dev

# Open two browser windows
# Login and test Watch Together
# Check console for: "relay (TURN)" candidates
```

### Step 4: Push to Deploy
```bash
git push origin main
```

The CI/CD will:
1. ✅ Build Docker image with new TURN config
2. ✅ Push to GHCR
3. ✅ Deploy to VPS
4. ✅ Restart containers with TURN environment variables

### Step 5: Test on Production

After ~2 minutes (deployment time):

1. Go to: `https://your-streamflix-domain.com`
2. Login with test account
3. Open browser DevTools (F12)
4. Go to Console tab
5. Create Watch Together room (2 windows)
6. Look for these success indicators:
   ```
   📤 [ICE CANDIDATE LOCAL] Type: relay (TURN)
   ❄️ [ICE STATE] → connected
   ✅ [PEER CONNECTION ESTABLISHED]
   🎬 [REMOTE TRACK RECEIVED]
   ```

---

## Troubleshooting

### If TURN server fails to start:
```bash
# Check status
sudo systemctl status coturn

# View logs
sudo tail -50 /var/log/coturn/turnserver.log

# Restart
sudo systemctl restart coturn
```

### If ICE candidates still show "host" only:
- TURN server started but not receiving traffic
- Check credentials match in 2 places:
  1. `/etc/coturn/turnserver.conf`
  2. GitHub Actions secrets/variables

### If connection still fails after 5 minutes:
Run diagnostic again:
```bash
sudo ./firewall-test.sh
```

Should now show:
```
  Testing stun.l.google.com:19302 ... ❌ BLOCKED (still ok, TURN is primary)
  TURN server local check ... ✅ LISTENING
```

---

## Expected Console Output (Success)

```
🔗 [PEER CONNECTION] Initialized for TkCQjsAK...
📡 [PEER CONFIG] STUN servers configured
📤 [ADDING TRACKS] Total tracks: 2
✅ [TRACKS ADDED] All tracks added to peer connection
📤 [ICE CANDIDATE LOCAL] Type: relay (TURN), Candidate: candidate:...
📤 [ICE CANDIDATE LOCAL] Type: host, Candidate: candidate:...
❄️ [ICE STATE] TkCQjsAK... → checking (connection: new)
🎯 [OFFER] Created and sent
📤 [WEBRTC OFFER] SDP length: 1850
❄️ [ICE CANDIDATE RECEIVED] From: TkCQjsAK..., Type: relay (TURN)
❄️ [ICE CANDIDATE RECEIVED] From: TkCQjsAK..., Type: host
❄️ [ICE STATE] TkCQjsAK... → connected (connection: connecting)
✅ [ICE CONNECTED] P2P connection established
🔌 [CONNECTION STATE] TkCQjsAK... → connected
✅ [PEER CONNECTION ESTABLISHED] Video/audio should now flow
🎬 [REMOTE TRACK RECEIVED] From: TkCQjsAK..., Track: audio
🎬 [REMOTE TRACK RECEIVED] From: TkCQjsAK..., Track: video
✅ [PARTICIPANT UPDATED] Stream assigned
```

---

## If You Get Stuck

1. **Verify TURN is running**: `sudo systemctl status coturn`
2. **Check firewall test**: `sudo ./firewall-test.sh`
3. **View TURN logs**: `sudo tail -100 /var/log/coturn/turnserver.log`
4. **Restart container**: `docker restart streamflix-green`
5. **Check GitHub Actions**: Make sure deployment succeeded

---

## Security Notes

⚠️ **Important**:
- TURN credentials are now in GitHub (encrypted secrets)
- Consider rotating `streamflixpass123` to something stronger
- If credentials leak, just restart coturn with new ones

To change credentials:
```bash
# On VPS:
sudo nano /etc/coturn/turnserver.conf
# Edit: user=streamflix:newpassword

# In GitHub Secrets:
TURN_PASSWORD = newpassword

# Restart:
sudo systemctl restart coturn
```

---

## What Happens After Fix

✅ **Local P2P**: Works when both peers have direct network access
✅ **Relay via TURN**: Works when firewall blocks direct connection
✅ **Fallback STUN**: Attempts if TURN fails (but will be blocked)

Result: **Audio & Video streaming should work in Watch Together**

---

## Timeline

- **Right now**: Setup TURN server (2 min via SSH)
- **In 5 min**: Add GitHub secrets
- **Next commit**: Auto-deploys (2-3 min)
- **After that**: Test and verify (2 min)
- **Total**: ~10 minutes to working WebRTC

🚀 Let's go!
