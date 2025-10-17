# 🎯 Sentry + Umami Integration - COMPLETE

## ✨ What's Been Integrated

### Sentry (Error Tracking & Performance)
- ✅ Auto-captures JavaScript errors
- ✅ Auto-captures unhandled rejections
- ✅ Performance monitoring (10% sample in prod, 100% in dev)
- ✅ Session replay (100% on errors, 10% on normal sessions)
- ✅ Source map support
- ✅ Release tracking

### Umami (User Behavior Analytics)
- ✅ Privacy-focused (no cookies, GDPR compliant)
- ✅ 14 custom tracking methods
- ✅ Automatic pageview tracking
- ✅ Event tracking with properties
- ✅ Real-time dashboard

### Watch Together Analytics (Implemented)
- ✅ Room joined/left tracking
- ✅ Participant join/leave tracking
- ✅ Camera/Microphone toggle tracking
- ✅ Chat message tracking (with length & participant count)
- ✅ WebRTC connection events:
  - Peer connected
  - Connection failed
  - Connection disconnected
  - ICE candidates (with type: host/srflx/relay/prflx)
- ✅ Error tracking with context

---

## 📁 Files Created/Updated

### Created Files
```
src/components/UmamiTracker.tsx           # Loads Umami tracking script
src/app/instrumentation.ts                # Sentry server initialization
sentry.client.config.ts                   # Client-side Sentry config
sentry.server.config.ts                   # Server-side Sentry config
src/lib/hooks/useAnalytics.ts             # Complete analytics hook
ANALYTICS_COMPLETE_SETUP.md               # Full setup guide
ANALYTICS_INTEGRATION_VERIFIED.md         # Verification & checklist
```

### Updated Files
```
next.config.ts                            # Wrapped with withSentryConfig
src/app/layout.tsx                        # Added UmamiTracker component
src/app/watch-together/page.tsx           # Added analytics tracking
.env.example                              # Added all env variables
package.json                              # Sentry packages installed
```

---

## 🚀 Quick Start (Next Steps)

### 1. Create Sentry Account
```
Go to: https://sentry.io
Create project: StreamFlix
Platform: Next.js
Copy DSNs (both server and client keys)
```

### 2. Create Umami Account
```
Option A: https://cloud.umami.is (easiest)
Option B: Self-hosted Docker (more control)

Copy: Website ID and Script URL
```

### 3. Add GitHub Secrets
```
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN (optional)
NEXT_PUBLIC_UMAMI_WEBSITE_ID
NEXT_PUBLIC_UMAMI_SCRIPT_URL
```

### 4. Update Local `.env.local`
```env
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=your_url
```

### 5. Test Locally
```bash
npm run dev
# Check console for: ✅ [UMAMI] Tracking script loaded
```

### 6. Deploy
```bash
git push origin main
# GitHub Actions will use env vars from secrets
```

### 7. View Analytics
- **Sentry**: https://sentry.io → Your Project
- **Umami**: Your Umami dashboard

---

## 📊 Analytics Hook Usage

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function MyComponent() {
  const {
    trackEvent,              // Generic event
    trackPageView,           // Page visit
    trackError,              // Error occurred
    trackWatchTogetherEvent, // Room/participant events
    trackConnectionEvent,    // WebRTC events
    trackDeviceToggle,       // Camera/mic on/off
    trackMessage,            // Chat message
    trackVideoQuality,       // Video stats
    trackPermission,         // Permission grant
    trackSession,            // Login/logout
    trackSearch,             // Search query
    trackContent,            // Content interaction
    trackPlayerEvent,        // Video player action
    trackPerformance,        // Performance metric
  } = useAnalytics();

  // Use them:
  useEffect(() => {
    trackPageView('my_page', { param: 'value' });
  }, []);

  return <div>Your component</div>;
}
```

---

## 📝 Environment Variables Required

```env
# Sentry
SENTRY_DSN=https://your-key@ingest.sentry.io/12345
NEXT_PUBLIC_SENTRY_DSN=https://your-key@ingest.sentry.io/12345
SENTRY_AUTH_TOKEN=optional_for_source_maps

# Umami
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```

---

## ✅ Verification Checklist

Before going to production:

- [ ] Sentry project created
- [ ] Umami account set up
- [ ] GitHub secrets configured (5 total)
- [ ] `.env.local` has all variables
- [ ] `npm run dev` works without errors
- [ ] Console shows "✅ [UMAMI] Tracking script loaded"
- [ ] Watch Together events logged in console
- [ ] Ready to deploy to production

---

## 🎓 What Each Tool Does

### Sentry
**When**: Something goes wrong
**Tracks**: Errors, crashes, performance issues
**Useful for**: Debugging production issues, monitoring app health
**Cost**: Free tier - 5,000 errors/month
**Privacy**: Can mask sensitive data

### Umami
**When**: User interacts with app
**Tracks**: Button clicks, page visits, video plays, etc
**Useful for**: Understanding user behavior, engagement metrics
**Cost**: Free tier available
**Privacy**: GDPR compliant, no cookies, no tracking across sites

---

## 📊 Dashboard Features

### Sentry Dashboard
- Real-time error alerts
- Stack traces with source maps
- Session replays (see user screen during error)
- Performance monitoring (page load time, etc)
- Release tracking (see which version had error)
- Slack/Email notifications

### Umami Dashboard
- Real-time visitor tracking
- Custom event breakdown
- User flow visualization
- Device/browser analytics
- Geographic data
- Page performance stats

---

## 🔧 Configuration Files Explained

| File | Purpose |
|------|---------|
| `next.config.ts` | Wraps Next.js config with Sentry, enables source maps |
| `src/app/instrumentation.ts` | Initializes Sentry on server (Node.js runtime) |
| `sentry.client.config.ts` | Initializes Sentry on client (browser) |
| `sentry.server.config.ts` | Server config (backup, used if client fails) |
| `src/components/UmamiTracker.tsx` | Loads Umami script via Next.js Script component |
| `src/lib/hooks/useAnalytics.ts` | Custom hook with 14 analytics methods |

---

## 🚨 Troubleshooting

### Umami not tracking?
```
✅ Check: NEXT_PUBLIC_UMAMI_WEBSITE_ID is set
✅ Check: NEXT_PUBLIC_UMAMI_SCRIPT_URL is set
✅ Check: Browser console has no CORS errors
✅ Wait: 5-10 minutes for Umami to sync data
```

### Sentry not capturing errors?
```
✅ Check: SENTRY_DSN is set
✅ Check: NEXT_PUBLIC_SENTRY_DSN is set
✅ Check: Build completes without errors
✅ Check: Visit Sentry dashboard
```

### Events appearing 0 count?
```
✅ Wait: Both services batch process every 5-10 minutes
✅ Try: Trigger an event manually (click button, etc)
✅ Refresh: Dashboard might not auto-refresh
```

---

## 📞 Support

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Umami Docs**: https://umami.is/docs
- **Chat**: Both have community support

---

## 🎯 Summary

**Status**: ✅ COMPLETE & READY TO USE

All infrastructure is in place. Just need to:
1. Create accounts (5 mins)
2. Copy keys (2 mins)
3. Add to GitHub secrets (3 mins)
4. Deploy (automatic via CI/CD)

**Time to production**: ~15 minutes

**Questions**: Check ANALYTICS_COMPLETE_SETUP.md for detailed guides
