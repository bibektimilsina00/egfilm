# ✅ Sentry + Umami Analytics Integration Verification

## 📋 Integration Checklist

### ✅ Package Installation
- [x] `@sentry/nextjs` - Installed (^10.20.0)
- [x] `@sentry/tracing` - Installed (^7.120.4)
- [x] No npm packages needed for Umami (uses script injection)

### ✅ Sentry Configuration Files
- [x] `next.config.ts` - Wrapped with `withSentryConfig`
- [x] `/src/app/instrumentation.ts` - Server runtime initialization
- [x] `sentry.client.config.ts` - Client-side configuration
- [x] `sentry.server.config.ts` - Server-side configuration

### ✅ Umami Setup
- [x] `UmamiTracker.tsx` - Script injector component created
- [x] Root `layout.tsx` - UmamiTracker imported and added to `<head>`
- [x] `/src/lib/hooks/useAnalytics.ts` - Complete analytics hook with 14 methods

### ✅ Watch Together Analytics
- [x] Analytics hook imported in `watch-together/page.tsx`
- [x] Room joined event tracked
- [x] Participant joined event tracked
- [x] Participant left event tracked
- [x] Message sent event tracked (with length and participant count)
- [x] Camera toggle tracked (device_toggle)
- [x] Microphone toggle tracked (device_toggle)
- [x] WebRTC peer_connected tracked
- [x] WebRTC peer_connection_failed tracked
- [x] WebRTC peer_disconnected tracked
- [x] ICE candidate gathered tracked (with type)
- [x] Errors caught and tracked

### ✅ Environment Configuration
- [x] `.env.example` updated with all Sentry + Umami variables

### ⏳ Pending (Before Production)

#### GitHub Secrets Setup
- [ ] Add `SENTRY_DSN` (server key from Sentry)
- [ ] Add `SENTRY_AUTH_TOKEN` (for source maps - optional)
- [ ] Add `NEXT_PUBLIC_SENTRY_DSN` (client key from Sentry)
- [ ] Add `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (from Umami dashboard)
- [ ] Add `NEXT_PUBLIC_UMAMI_SCRIPT_URL` (Umami script URL)

#### Local Testing (.env.local)
```env
SENTRY_DSN=https://your-sentry-dsn@ingest.sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@ingest.sentry.io/project-id
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

#### GitHub Actions Workflow
- [ ] Update `.github/workflows/deploy-production.yml` to include env vars
- [ ] Example section to add:
```yaml
env:
  SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
  NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: ${{ secrets.NEXT_PUBLIC_UMAMI_WEBSITE_ID }}
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: ${{ secrets.NEXT_PUBLIC_UMAMI_SCRIPT_URL }}
```

---

## 📊 What Gets Tracked

### Sentry Automatic Tracking
```
✅ JavaScript errors (with stack traces)
✅ Unhandled promise rejections
✅ HTTP requests (GET, POST, etc)
✅ Console errors/warnings
✅ Performance metrics (Core Web Vitals)
✅ User sessions
```

### Umami Manual Events (Implemented in Watch Together)
```
✅ page_view - Page views with metadata
✅ watch_together_room_joined - User joined room
✅ watch_together_participant_joined - Another user joined
✅ watch_together_participant_left - User left
✅ message_sent - Chat message sent
✅ device_toggled - Camera/Microphone enable/disable
✅ webrtc_connection (peer_connected) - P2P connection established
✅ webrtc_connection (peer_connection_failed) - Connection failed
✅ webrtc_connection (peer_disconnected) - Connection dropped
✅ webrtc_connection (ice_candidate_gathered) - ICE candidate found (type: host/srflx/relay/prflx)
✅ error_occurred - Any caught error
```

---

## 🧪 Testing Checklist

### Local Testing (npm run dev)
```bash
# 1. Check console for startup messages
# Expected: ✅ [UMAMI] Tracking script loaded
#           (No SENTRY_DSN warnings if env vars set)

# 2. Open Watch Together
# Expected: Events logged in console with 📊 [UMAMI] prefix

# 3. Open Sentry dashboard
# Expected: No errors (or same errors as before)
```

### Production Testing (After deployment)
```
✅ 1. Deploy to VPS
✅ 2. Wait 5 minutes for data sync
✅ 3. Open Sentry dashboard → Issues (should be empty or see real errors)
✅ 4. Open Umami dashboard → Events (should see page_view events)
✅ 5. Join Watch Together room
✅ 6. Check Umami for watch_together_room_joined event
✅ 7. Toggle camera → check device_toggled event in Umami
✅ 8. Send message → check message_sent event in Umami
✅ 9. Trigger error intentionally → check Sentry Issues tab
```

---

## 🔍 Verification Script

Run this in your browser console to verify analytics:

```javascript
// Check if Umami is loaded
if (window.umami) {
    console.log('✅ Umami loaded');
    // Send test event
    umami.track('test_event', { test: 'value' });
    console.log('✅ Test event sent');
} else {
    console.error('❌ Umami not loaded. Check NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_SCRIPT_URL');
}

// Check if Sentry is loaded
if (window.__SENTRY__) {
    console.log('✅ Sentry loaded');
    // Send test error
    Sentry.captureException(new Error('Test error'));
    console.log('✅ Test error sent');
} else {
    console.error('❌ Sentry not loaded');
}
```

---

## 📈 Analytics Methods Available

The `useAnalytics()` hook includes:

### Core Methods
```typescript
trackEvent(eventName, properties)              // Generic event
trackPageView(pageName, properties)            // Page view
trackError(error, context)                     // Error tracking
```

### Watch Together Specific
```typescript
trackWatchTogetherEvent(eventName, properties)  // room_joined, room_left, participant_joined, etc
trackConnectionEvent(status, details)           // WebRTC events
trackDeviceToggle(deviceType, enabled)          // camera/microphone on/off
trackMessage(messageLength, participantCount)   // Chat messages
```

### Extended Methods
```typescript
trackVideoQuality(quality, duration, resolution)  // Video stats
trackPermission(deviceType, granted)              // Permission grants
trackSession(eventName, properties)               // login, logout, etc
trackSearch(query, results)                       // Search tracking
trackContent(type, action, contentId)             // Content interactions
trackPlayerEvent(action, properties)              // Video player events
trackPerformance(metricName, duration)            // Performance metrics
```

---

## 🚀 Deployment Steps

### Step 1: Set up Sentry Project
1. Go to https://sentry.io
2. Create project "StreamFlix"
3. Copy DSN (two versions needed):
   - **Server DSN** (full key) → `SENTRY_DSN`
   - **Client DSN** → `NEXT_PUBLIC_SENTRY_DSN`

### Step 2: Set up Umami
Choose one:
- **Cloud**: https://cloud.umami.is → Create website project → Copy Website ID
- **Self-hosted**: Deploy Umami Docker → Get script URL

### Step 3: Add to GitHub Secrets
1. Repo → Settings → Secrets and variables → Actions
2. Add 5 secrets:
   - `SENTRY_DSN`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN` (optional, for source maps)
   - `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
   - `NEXT_PUBLIC_UMAMI_SCRIPT_URL`

### Step 4: Update Workflow
Edit `.github/workflows/deploy-production.yml`:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
      NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}
      SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: ${{ secrets.NEXT_PUBLIC_UMAMI_WEBSITE_ID }}
      NEXT_PUBLIC_UMAMI_SCRIPT_URL: ${{ secrets.NEXT_PUBLIC_UMAMI_SCRIPT_URL }}
```

### Step 5: Deploy
```bash
git push origin main  # Triggers CI/CD
```

### Step 6: Verify
- Sentry: https://sentry.io → Your Project → Issues
- Umami: https://cloud.umami.is or your self-hosted URL → Dashboard

---

## 📚 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `next.config.ts` | Sentry config | ✅ Updated |
| `src/app/instrumentation.ts` | Server init | ✅ Created |
| `sentry.client.config.ts` | Client config | ✅ Created |
| `sentry.server.config.ts` | Server config | ✅ Created |
| `src/components/UmamiTracker.tsx` | Umami injector | ✅ Created |
| `src/app/layout.tsx` | Root layout | ✅ Updated |
| `src/lib/hooks/useAnalytics.ts` | Analytics hook | ✅ Created |
| `src/app/watch-together/page.tsx` | Integration | ✅ Updated |
| `.env.example` | Env template | ✅ Updated |
| `ANALYTICS_COMPLETE_SETUP.md` | Setup guide | ✅ Created |

---

## 🎯 Quick Start (For You)

1. **Create Sentry account**: https://sentry.io
2. **Create Umami account**: https://cloud.umami.is or deploy self-hosted
3. **Get your DSNs and Website ID**
4. **Add to GitHub Secrets** (5 secrets)
5. **Update workflow file** with env vars
6. **Push to main** → Deploy automatically
7. **View data** in Sentry and Umami dashboards

---

## ❓ FAQ

**Q: Why both Sentry and Umami?**
A: Sentry = Error tracking & performance. Umami = User behavior analytics (privacy-focused).

**Q: Do I need both?**
A: No, but they serve different purposes. Sentry catches crashes; Umami tracks engagement.

**Q: Is my data safe?**
A: Yes - Umami is GDPR compliant (no cookies), Sentry masks sensitive data.

**Q: What if I don't set env vars?**
A: App still works. Umami will warn in console. Sentry won't capture data.

**Q: How much does this cost?**
A: Both have free tiers. Sentry: 5K errors/month free. Umami Cloud: Free tier available.

---

## 🆘 Troubleshooting

### Umami not tracking
```
Error: ⚠️ [UMAMI] Missing configuration
Fix: Set NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_SCRIPT_URL
```

### Sentry not tracking
```
Error: Cannot initialize Sentry
Fix: Set SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN
```

### Analytics hook import error
```
Error: Cannot find module '@sentry/nextjs'
Fix: Run npm install @sentry/nextjs @sentry/tracing
```

### Events not appearing
```
Wait 5-10 minutes for sync (both services batch process)
Check: browser console for 📊 [UMAMI] logs
Check: CORS headers if self-hosted Umami
```

---

**Status**: ✅ 100% Complete (Pending env var configuration & deployment)

**Ready to deploy**: Yes! Follow "🚀 Deployment Steps" above.
