# 🎯 Umami Analytics Setup Guide

## What is Umami?

Umami is a **privacy-focused, self-hosted web analytics** alternative to Google Analytics. It doesn't use cookies, is GDPR compliant, and gives you full data ownership.

**Key Features:**
- ✅ No cookies
- ✅ GDPR compliant
- ✅ Privacy-focused
- ✅ Real-time analytics
- ✅ Custom event tracking
- ✅ Self-hosted or cloud option

---

## Option 1: Umami Cloud (Easiest - 5 minutes)

### Step 1: Create Account
1. Go to https://cloud.umami.is
2. Sign up with email
3. Verify email

### Step 2: Create Website
1. Click "Add Website"
2. Enter details:
   - **Name**: StreamFlix
   - **Domain**: your-domain.com (or localhost:8000 for dev)
3. Click "Create"

### Step 3: Get Credentials
1. Click on your website
2. In **Settings** → **Tracking Code**:
   - Copy **Website ID** (looks like: `abc123def456`)
   - Script URL will be: `https://cloud.umami.is/script.js`

### Step 4: Add to Environment
Update `.env.local`:
```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

---

## Option 2: Self-Hosted Umami (More Control - 15 minutes)

### Step 1: Deploy with Docker

On your VPS (128.199.195.107), run:

```bash
# SSH into your server
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
sleep 10

# Check status
docker-compose logs
```

### Step 2: Access Umami
1. Open: http://128.199.195.107:3001
2. Default login:
   - **Username**: admin
   - **Password**: umami

### Step 3: Change Password
1. Click profile icon → Settings
2. Change password to something secure
3. Save

### Step 4: Create Website
1. Click "Websites" → "Add Website"
2. Name: StreamFlix
3. Domain: your-domain.com
4. Copy **Website ID**

### Step 5: Get Script URL
Your script URL will be:
```
https://your-vps-ip:3001/script.js
```

But for SSL (recommended), set up Nginx reverse proxy:

```bash
# Install Nginx
apt-get update && apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/umami << 'EOF'
server {
    listen 80;
    server_name umami.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/umami /etc/nginx/sites-enabled/

# Test and restart
nginx -t
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d umami.yourdomain.com
```

Your script URL becomes:
```
https://umami.yourdomain.com/script.js
```

### Step 6: Add to Environment
Update `.env.local`:
```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://umami.yourdomain.com/script.js
```

---

## Step 5: Test Umami Locally

### Development Testing

1. **Start your app:**
```bash
npm run dev
```

2. **Check browser console:**
Open http://localhost:8000 and open DevTools Console
Look for:
```
✅ [UMAMI] Tracking script loaded
```

3. **Manual test event:**
```javascript
// In browser console
if (window.umami) {
    umami.track('test_event', { test: 'value' });
    console.log('✅ Test event sent');
} else {
    console.log('❌ Umami not loaded');
}
```

4. **Check Umami Dashboard:**
   - Wait 1-2 minutes
   - Open Umami dashboard
   - Go to your website
   - Check **Events** tab
   - You should see `test_event`

---

## Environment Variables Setup

### `.env.local` (Development)
```env
# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

### GitHub Secrets (Production)
1. Go to: Repo → Settings → Secrets and variables → Actions
2. Add 2 secrets:
   - `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
   - `NEXT_PUBLIC_UMAMI_SCRIPT_URL`

### GitHub Actions Workflow
Update `.github/workflows/deploy-production.yml`:
```yaml
env:
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: ${{ secrets.NEXT_PUBLIC_UMAMI_WEBSITE_ID }}
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: ${{ secrets.NEXT_PUBLIC_UMAMI_SCRIPT_URL }}
```

---

## Events Being Tracked

In **Watch Together**, these events are automatically tracked:

| Event | Trigger | Data |
|-------|---------|------|
| `watch_together_room_joined` | User joins room | roomCode, participantCount |
| `watch_together_participant_joined` | Someone joins | participantUsername, totalParticipants |
| `watch_together_participant_left` | Someone leaves | participantUsername, remainingParticipants |
| `message_sent` | Chat message | message_length, participant_count |
| `device_toggled` | Camera/Mic on/off | device_type, enabled |
| `webrtc_connection` | Connection events | status (peer_connected, failed, etc) |
| `webrtc_connection` | ICE candidates | candidateType (host, srflx, relay, prflx) |
| `error_occurred` | Any error | error_message, error_type |

---

## Umami Dashboard Features

### Overview Dashboard
- Real-time visitor count
- Top pages
- Top referrers
- Traffic over time

### Events Page
- All custom events
- Event frequency
- Event properties breakdown

### Pages Analytics
- Page views
- Bounce rate
- Session duration
- Visitor flow

### Settings
- Website management
- Event tracking
- Data retention
- Timezone

---

## Troubleshooting

### Problem: "⚠️ [UMAMI] Missing configuration"
**Solution:**
```bash
# Check .env.local
cat .env.local | grep UMAMI

# Should show:
# NEXT_PUBLIC_UMAMI_WEBSITE_ID=...
# NEXT_PUBLIC_UMAMI_SCRIPT_URL=...

# If missing, add them to .env.local
```

### Problem: Script not loading
```
Check browser Network tab:
- Search for "script.js"
- Should show 200 status
- If 404: URL is wrong
- If CORS error: Check Umami server settings
```

### Problem: No events in dashboard
```
1. Check console for ✅ [UMAMI] message
2. Go to Umami dashboard
3. Check Events tab
4. Wait 1-2 minutes for sync
5. Refresh dashboard
```

### Problem: "Cannot GET /script.js" (self-hosted)
```
1. Umami container might not be running:
   docker-compose ps

2. Check logs:
   docker-compose logs umami

3. Restart:
   docker-compose restart umami

4. Check port 3001 is open:
   curl http://localhost:3001/script.js
```

---

## Performance Monitoring

After setup, you can track:

```typescript
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function Page() {
  const { trackPerformance } = useAnalytics();

  useEffect(() => {
    const startTime = performance.now();
    
    // Your code here
    
    const duration = performance.now() - startTime;
    trackPerformance('custom_operation', duration);
  }, []);
}
```

---

## Best Practices

### 1. Update Sample Rate for Production
In `src/instrumentation-client.ts`:
```typescript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
```

### 2. Set Data Retention
In Umami Settings:
- Keep 90 days of data (free tier)
- Longer retention = more storage needed

### 3. Monitor Key Metrics
Focus on:
- Watch Together room joins
- Video quality metrics
- WebRTC connection success rate
- Error rates

### 4. Set Up Alerts
In Umami Pro:
- Alert on unusual traffic spikes
- Alert on specific events
- Daily/weekly reports

---

## Quick Reference

### Cloud Setup Time: ~5 minutes
```
1. Sign up (1 min)
2. Create website (1 min)
3. Copy credentials (1 min)
4. Add to .env.local (1 min)
5. Test (1 min)
```

### Self-Hosted Setup Time: ~15 minutes
```
1. SSH to VPS (1 min)
2. Create docker-compose.yml (2 min)
3. Start containers (3 min)
4. Access Umami (1 min)
5. Create website (2 min)
6. Set up Nginx/SSL (5 min)
7. Add to .env.local (1 min)
```

---

## Next Steps

1. **Choose option** (Cloud or Self-Hosted)
2. **Set up Umami** (5-15 minutes)
3. **Add env vars** to `.env.local`
4. **Test locally** with `npm run dev`
5. **Add GitHub secrets** for production
6. **Deploy** with `git push origin main`

---

## Useful Links

- **Umami Cloud**: https://cloud.umami.is
- **Umami Docs**: https://umami.is/docs
- **Umami GitHub**: https://github.com/umami-software/umami
- **Docker Hub**: https://hub.docker.com/r/umami-software/umami

---

## Support

- **Issues**: https://github.com/umami-software/umami/issues
- **Discord**: https://discord.gg/umami
- **Docs**: https://umami.is/docs

**Estimated time to production**: 20-30 minutes
