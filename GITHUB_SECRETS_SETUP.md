# GitHub Secrets Setup Guide

## Quick Instructions

### 1. Go to GitHub Repo Settings
Open your browser and go to:
```
https://github.com/bibektimilsina00/stream-flix/settings/secrets
```

Or manually:
1. Go to: https://github.com/bibektimilsina00/stream-flix
2. Click **Settings** tab
3. Left sidebar: **Secrets and variables** → **Actions**

---

### 2. Add Repository Variables (Public)

Click **"New repository variable"** button

**Variable 1:**
- Name: `TURN_SERVER`
- Value: `128.199.195.107`
- Click **Add secret**

**Variable 2:**
- Name: `TURN_USERNAME`
- Value: `streamflix`
- Click **Add secret**

---

### 3. Add Repository Secret (Private)

Click **"New repository secret"** button

**Secret:**
- Name: `TURN_PASSWORD`
- Value: `streamflixpass123`
- Click **Add secret**

---

### 4. Verify All Added

After adding, you should see 3 items in the Actions secrets page:
```
✅ TURN_PASSWORD (secret)
✅ TURN_SERVER (variable)
✅ TURN_USERNAME (variable)
```

---

### 5. Deploy

Once all 3 are added, run:
```bash
git push origin main
```

CI/CD will automatically:
1. Build Docker image with TURN config
2. Push to GHCR
3. Deploy to VPS
4. Restart containers with new TURN variables

---

## Testing After Deploy (3-5 minutes)

1. Wait for deployment to complete
2. Open 2 browser windows
3. Login to both
4. Go to same movie on both
5. Create/join Watch Together room
6. Open DevTools (F12) → Console
7. Look for:
   ```
   ✅ Success:
   📤 [ICE CANDIDATE LOCAL] Type: relay (TURN)
   ❄️ [ICE STATE] → connected
   🎬 [REMOTE TRACK RECEIVED]
   ```

---

## If Something Goes Wrong

**Check deployment logs:**
```bash
# SSH to VPS
ssh root@128.199.195.107

# View logs
docker logs streamflix-green

# Or check TURN logs
sudo tail -50 /var/log/coturn/turnserver.log
```

**Redeploy:**
```bash
git push origin main
```

---

## Troubleshooting Variables

If CI/CD fails or variables not working:

**Verify they exist:**
```bash
# In workflow logs, you should see something like:
NEXT_PUBLIC_TURN_SERVER=128.199.195.107
NEXT_PUBLIC_TURN_USERNAME=streamflix
NEXT_PUBLIC_TURN_PASSWORD=streamflixpass123
```

**If not showing:**
1. Check you added them to the right place (Actions, not repo secrets)
2. Wait 1-2 minutes for GitHub to sync
3. Try pushing again

---

## Done! ✨

After adding secrets and pushing:
- Automatic build starts
- Auto-deploys to VPS
- Auto-restarts containers
- TURN server now active in production
- WebRTC with relay working

🚀 That's it!
