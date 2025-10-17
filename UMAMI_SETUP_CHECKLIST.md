# ✅ Umami Setup Checklist

## Quick Setup (Choose One)

### ☐ Option 1: Umami Cloud (5 minutes - RECOMMENDED FOR QUICK START)

- [ ] Go to https://cloud.umami.is
- [ ] Click "Sign up"
- [ ] Enter email and password
- [ ] Verify email
- [ ] Click "Add Website"
- [ ] Enter:
  - Name: `StreamFlix`
  - Domain: `localhost:8000` (for development)
- [ ] Click "Create"
- [ ] Copy your **Website ID** (e.g., `abc123def456`)
- [ ] Note Script URL: `https://cloud.umami.is/script.js`

**Next:** Go to "Add to .env.local" section below

---

### ☐ Option 2: Self-Hosted on Your VPS (15 minutes)

#### On Your VPS (128.199.195.107):

```bash
# SSH to server
ssh root@128.199.195.107

# Create Umami directory
mkdir -p /opt/umami
cd /opt/umami

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  umami:
    image: ghcr.io/umami-software/umami:latest
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://umami:umami@db:5432/umami
      DATABASE_TYPE: postgresql
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    volumes:
      - ./db:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: umami
      POSTGRES_DB: umami
    restart: unless-stopped
EOF

# Start services
docker-compose up -d

# Wait for startup
sleep 15
```

#### Access Umami:

- [ ] Open browser: http://128.199.195.107:3001
- [ ] Login with:
  - Username: `admin`
  - Password: `umami`
- [ ] Click profile → Settings
- [ ] Change password to something secure
- [ ] Click "Websites"
- [ ] Click "Add Website"
- [ ] Enter:
  - Name: `StreamFlix`
  - Domain: `localhost:8000`
- [ ] Copy your **Website ID**
- [ ] Script URL: `http://128.199.195.107:3001/script.js`

**Note:** For production, set up SSL with Nginx (see UMAMI_SETUP_GUIDE.md)

**Next:** Go to "Add to .env.local" section below

---

## Add to .env.local

- [ ] Copy `.env.local.template` content to `.env.local`
- [ ] Update with your Umami credentials:

```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

---

## Test Umami Locally

- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:8000
- [ ] Open DevTools Console (F12)
- [ ] Look for message: `✅ [UMAMI] Tracking script loaded`
- [ ] If you see warning: `⚠️ [UMAMI] Missing configuration`
  - Check your `.env.local` has both variables
  - Restart dev server: `npm run dev`

---

## Verify Analytics Working

### Test Event Tracking:

1. Open browser console (F12)
2. Paste this code:
```javascript
if (window.umami) {
    umami.track('test_event', { test: 'value' });
    console.log('✅ Test event sent to Umami');
} else {
    console.error('❌ Umami not loaded');
}
```
3. Press Enter

### Check Umami Dashboard:

- [ ] Open Umami dashboard (cloud or self-hosted)
- [ ] Wait 1-2 minutes
- [ ] Go to your website
- [ ] Click "Events" tab
- [ ] You should see `test_event` appear

---

## Watch Together Events

Once running, these events are automatically tracked:

- [ ] `watch_together_room_joined` - User joins room
- [ ] `watch_together_participant_joined` - Someone joins
- [ ] `watch_together_participant_left` - Someone leaves
- [ ] `message_sent` - Chat message
- [ ] `device_toggled` - Camera/mic on/off
- [ ] `webrtc_connection` - Connection events

---

## Production Deployment

### Add GitHub Secrets:

- [ ] Go to Repo → Settings → Secrets and variables → Actions
- [ ] Click "New repository secret"
- [ ] Add: `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- [ ] Value: Your Umami Website ID
- [ ] Click "New repository secret"
- [ ] Add: `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
- [ ] Value: Your Umami script URL

### Update GitHub Actions:

- [ ] Edit `.github/workflows/deploy-production.yml`
- [ ] Add to `env` section:
```yaml
env:
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: ${{ secrets.NEXT_PUBLIC_UMAMI_WEBSITE_ID }}
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: ${{ secrets.NEXT_PUBLIC_UMAMI_SCRIPT_URL }}
```

### Deploy:

- [ ] Commit changes: `git add .`
- [ ] Commit: `git commit -m "Setup Umami analytics"`
- [ ] Push: `git push origin main`
- [ ] GitHub Actions automatically deploys
- [ ] Check Umami dashboard for events

---

## Troubleshooting

### Problem: "⚠️ [UMAMI] Missing configuration"
**Solution:** 
- Check `.env.local` has both variables
- Restart dev server
- Hard refresh browser (Cmd+Shift+R)

### Problem: Script loads but no events
**Restart dev server and hard refresh browser**

### Problem: Self-hosted dashboard won't load
```bash
# Check containers are running
docker-compose ps

# View logs
docker-compose logs umami

# Restart if needed
docker-compose restart umami
```

### Problem: Can't reach self-hosted on VPS
```bash
# Check if port 3001 is open
curl http://128.199.195.107:3001/script.js

# If connection refused:
ssh root@128.199.195.107
cd /opt/umami
docker-compose logs
```

---

## Umami Dashboard Guide

### Overview Tab
- Real-time visitor count
- Top pages
- Top referrers
- Traffic graph

### Events Tab
- Custom events (watch_together_room_joined, etc.)
- Event frequency
- Event properties

### Pages Tab
- Page views
- Bounce rate
- Session duration
- User flow

### Settings Tab
- Website management
- Event tracking configuration
- Data retention
- Timezone

---

## Resources

- **Umami Cloud**: https://cloud.umami.is
- **Setup Guide**: UMAMI_SETUP_GUIDE.md (in repo)
- **Docs**: https://umami.is/docs
- **GitHub**: https://github.com/umami-software/umami
- **Discord**: https://discord.gg/umami

---

## Summary

**Total setup time:** 5-15 minutes

**What you get:**
- ✅ Real-time analytics dashboard
- ✅ User behavior tracking
- ✅ Custom event tracking
- ✅ Privacy-focused (no cookies)
- ✅ GDPR compliant

**Next step after setup:**
1. Verify analytics working (test event)
2. Add GitHub secrets
3. Deploy to production
4. Monitor Umami dashboard

---

**Status:** Ready to set up! ✅

Choose your option above and follow the steps.
