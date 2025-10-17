# 🚀 Umami Cloud Setup (5 Minutes)

## Step 1: Create Umami Account

1. Go to **https://cloud.umami.is**
2. Click **"Sign up"**
3. Enter:
   - Email
   - Password
   - Check "I agree to terms"
4. Click **"Create account"**
5. Verify email (check inbox)

---

## Step 2: Create Website

1. Login to **https://cloud.umami.is/dashboard**
2. Click **"Add website"** button (top right)
3. Fill in:
   - **Website name:** `StreamFlix` (or your project name)
   - **Website URL:** `https://your-domain.com` (or `http://localhost:8000` for dev)
   - **Domain name:** `your-domain.com` (or `localhost` for dev)
4. Click **"Save"**

---

## Step 3: Get Tracking Credentials

After creating website:

1. You'll see the website listed
2. Click on **StreamFlix** website
3. Go to **"Tracking code"** tab (or click settings icon)
4. You'll see:
   ```html
   <script async src="https://cloud.umami.is/script.js" 
           data-website-id="your-website-id-here">
   </script>
   ```

5. Copy the `data-website-id` value
   - Example: `a1b2c3d4e5f6g7h8`

---

## Step 4: Configure Your App

### Development (.env.local)

```bash
# Umami Cloud
NEXT_PUBLIC_UMAMI_WEBSITE_ID=a1b2c3d4e5f6g7h8
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

### Production (GitHub Secrets)

1. Go to your GitHub repo
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** twice:

   **Secret 1:**
   - Name: `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
   - Value: `a1b2c3d4e5f6g7h8`
   - Click **"Add secret"**

   **Secret 2:**
   - Name: `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
   - Value: `https://cloud.umami.is/script.js`
   - Click **"Add secret"**

---

## Step 5: Restart Dev Server

```bash
npm run dev
```

Check browser console - you should see:
```
✅ [UMAMI] Tracking script loaded
```

---

## Step 6: Test Tracking

### Manual Test

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Run:
   ```javascript
   umami.track('test_event', { test_property: 'value' })
   ```
4. Should print: `✔ [UMAMI] Event tracked`

### Automatic Test

1. Open your app in browser
2. Navigate to **Watch Together** page
3. Do something:
   - Join/create a room
   - Toggle camera
   - Send a message
4. Wait 1-2 minutes
5. Go to https://cloud.umami.is/dashboard
6. Click on **StreamFlix** website
7. Click **"Realtime"** tab
8. You should see your events appearing!

---

## Step 7: Verify in Dashboard

### Realtime View
- Shows live events as they happen
- Click **"Realtime"** tab
- You should see:
  - Page views
  - Custom events
  - User count

### Events View
- Shows event breakdown
- Click **"Events"** tab
- Filter by event type:
  - `room_joined`
  - `message_sent`
  - `device_toggled`
  - etc.

### Pages View
- Shows page statistics
- Click **"Pages"** tab
- See which pages users visit most

---

## Step 8: Deploy to Production

### Update Deployment

1. SSH to your server:
   ```bash
   ssh user@your-server-ip
   ```

2. Edit `/home/user/streamflix/.env`:
   ```bash
   nano /home/user/streamflix/.env
   ```

3. Add Umami values:
   ```env
   NEXT_PUBLIC_UMAMI_WEBSITE_ID=a1b2c3d4e5f6g7h8
   NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
   ```

4. Save (Ctrl+X, then Y, then Enter)

5. Redeploy:
   ```bash
   IMAGE_NAME=ghcr.io/bibektimilsina00/stream-flix:deploy ./deploy.sh
   ```

### Or Use GitHub Actions

If using CI/CD:
1. Make sure GitHub secrets are set (see Step 4)
2. Push to main:
   ```bash
   git push origin main
   ```
3. GitHub Actions will build & deploy with env vars automatically

---

## Dashboard Features

### Real-time
- Live visitor count
- Current page views
- Recent events
- Browser/device info

### Events
- Custom event tracking
- Event frequency
- Properties breakdown
- Time series charts

### Pages
- Page visits
- Bounce rate
- Avg visit duration
- Top referrers

### Visitors
- Unique visitors
- Return visitors
- New vs returning
- Geographic data

---

## Troubleshooting

### Script not loading?

Check browser console:
```javascript
// Should exist
console.log(typeof umami) // Should be 'object'
console.log(umami.track) // Should be function
```

If undefined, check:
1. ✅ `.env.local` has `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
2. ✅ `.env.local` has `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
3. ✅ Dev server restarted after .env changes
4. ✅ No browser ad-blocker blocking script

### Events not appearing?

1. Wait 1-2 minutes (events are batched)
2. Check Umami dashboard filter (might be filtering by date)
3. Verify event name matches (case-sensitive)
4. Check browser console for errors

### Can't login to Umami Cloud?

1. Check spam folder for verification email
2. Try password reset: https://cloud.umami.is/login
3. Check if account is in multiple organizations

---

## What's Tracked

Your app automatically tracks:

**Page Views:**
- `/` (home)
- `/movie/[id]` (movie pages)
- `/tv/[id]` (TV pages)
- `/watch-together?room=CODE` (watch party)

**Watch Together Events:**
- `room_joined` - User joins room
- `participant_joined` - Someone joins
- `participant_left` - Someone leaves
- `message_sent` - Chat message
- `device_toggled` - Camera/mic toggle
- `peer_connected` - WebRTC connected
- `peer_connection_failed` - WebRTC error

**Other Events:**
- `search_performed` - Search query
- `content_interaction` - Click movie/show
- `session_login` - User login
- `session_logout` - User logout

---

## Security Notes

✅ **Safe:**
- Website ID is public (intentional)
- Script URL is public (standard practice)
- No sensitive data tracked
- GDPR compliant (no cookies)

❌ **Don't share:**
- API key (if using self-hosted)
- Umami password
- API tokens

---

## Quick Reference

| Item | Value |
|------|-------|
| Setup Time | 5 minutes |
| Cost | Free tier (free forever) |
| Data Location | Umami's cloud |
| Privacy | GDPR compliant |
| Tracking | Real-time |
| Dashboard | https://cloud.umami.is |

---

## Next Steps

1. ✅ Create Umami Cloud account
2. ✅ Create website in Umami
3. ✅ Copy Website ID
4. ✅ Update `.env.local` with credentials
5. ✅ Restart dev server
6. ✅ Test tracking (watch console)
7. ✅ Verify in Umami dashboard
8. ✅ Update GitHub secrets
9. ✅ Deploy to production
10. ✅ Monitor analytics in dashboard

---

**All set! Your analytics are now live!** 🎉

For advanced features, see: https://umami.is/docs
