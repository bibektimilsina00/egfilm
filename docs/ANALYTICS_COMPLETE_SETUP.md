# Complete Sentry + Umami Analytics Setup Guide

## 🚀 Quick Start

### Step 1: Create Sentry Account
1. Go to https://sentry.io
2. Sign up and create project "StreamFlix"
3. Choose "Next.js" platform
4. Copy your **DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### Step 2: Create/Setup Umami
Choose ONE option:

#### Option A: Self-Hosted Umami (Recommended for production)
```bash
# On your VPS/server
docker run -d --name umami \
  -e DATABASE_URL=postgresql://user:password@postgres:5432/umami \
  -p 3001:3001 \
  ghcr.io/umami-software/umami:latest
```

#### Option B: Umami Cloud (Easiest)
1. Go to https://cloud.umami.is
2. Sign up
3. Create a new website project
4. Copy your Website ID

### Step 3: Environment Variables

**Create `.env.local` (local development):**
```env
# Sentry (Error tracking & performance monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@ingest.sentry.io/project-id
SENTRY_DSN=https://your-sentry-dsn@ingest.sentry.io/project-id
SENTRY_AUTH_TOKEN=your_auth_token_here

# Umami (User behavior analytics)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://umami.example.com/script.js
```

**For production, add to GitHub Secrets:**
- `SENTRY_DSN` (server key)
- `SENTRY_AUTH_TOKEN` (optional)
- `NEXT_PUBLIC_SENTRY_DSN` (client key)
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL`

### Step 4: Install Dependencies (Already Done!)
```bash
npm install @sentry/nextjs @sentry/tracing
```

---

## 📊 What's Already Integrated

### ✅ Sentry (Error Tracking)
- **Auto-captures**: All JavaScript errors, unhandled rejections, performance metrics
- **Configured in**: 
  - `/next.config.ts` - Main config
  - `/src/app/instrumentation.ts` - Server runtime init
  - `/sentry.client.config.ts` - Client-side init
  - `/sentry.server.config.ts` - Server-side init

### ✅ Umami (Behavior Analytics)
- **Tracks**: Page views, custom events, user interactions
- **Configured in**:
  - `/src/components/UmamiTracker.tsx` - Loads tracking script
  - `/src/app/layout.tsx` - Injected in root layout
  - `/src/lib/hooks/useAnalytics.ts` - Custom tracking hook

---

## 🎯 Complete Analytics Hook Methods

The `useAnalytics()` hook provides 14 tracking methods:

### Basic Tracking
```typescript
import { useAnalytics } from '@/lib/hooks/useAnalytics';

const { 
  trackEvent,           // Generic event with properties
  trackPageView,        // Track page visits
  trackError,           // Track errors
} = useAnalytics();
```

### Watch Together Events
```typescript
const { trackWatchTogetherEvent } = useAnalytics();

// Room management
trackWatchTogetherEvent('room_joined', { 
  roomCode: 'ABC123',
  participantCount: 2,
});

trackWatchTogetherEvent('room_left', { 
  duration: 3600,  // seconds
});

// Participants
trackWatchTogetherEvent('participant_joined', { 
  userId: 'user123',
});
```

### Media & WebRTC
```typescript
const { 
  trackVideoQuality,
  trackConnectionEvent,
  trackPermission,
  trackDeviceToggle,
} = useAnalytics();

// Video quality
trackVideoQuality('high', 120, '1280x720');

// WebRTC connection
trackConnectionEvent('ice_candidate', { 
  type: 'relay',  // host, srflx, relay
  protocol: 'tcp',
});

trackConnectionEvent('peer_connected', { 
  iceState: 'connected',
  duration: 5000,
});

// Device permissions
trackPermission('camera', true);
trackPermission('microphone', false);

// Toggle actions
trackDeviceToggle('camera', true);  // Camera enabled
trackDeviceToggle('microphone', false);  // Mic disabled
```

### User Engagement
```typescript
const { 
  trackMessage,
  trackSession,
  trackSearch,
  trackContent,
  trackPlayerEvent,
  trackPerformance,
} = useAnalytics();

// Chat
trackMessage(150, 4);  // 150 char message, 4 participants

// Session
trackSession('login', { provider: 'nextauth' });
trackSession('logout');

// Search
trackSearch('Inception', 45);  // Query, results count

// Content
trackContent('movie', 'viewed', 'tt1375666');
trackContent('watchlist', 'added', 'tt1375666');

// Video player
trackPlayerEvent('play', { 
  source: 'VidSrc Pro',
  quality: 'high',
});

trackPlayerEvent('seek', { 
  from: 1200,
  to: 3600,
});

// Performance
trackPerformance('page_load', 2500);  // 2.5 seconds
trackPerformance('webrtc_connect', 3200);  // 3.2 seconds
```

---

## 📱 Integration Examples

### In Watch Together Page
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function WatchTogether() {
  const { trackWatchTogetherEvent, trackConnectionEvent } = useAnalytics();

  const handleRoomJoin = async (roomCode: string) => {
    try {
      // ... join logic
      trackWatchTogetherEvent('room_joined', {
        roomCode,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      trackError(error as Error, { context: 'room_join' });
    }
  };

  return (
    // Your component
  );
}
```

### In Movie/TV Pages
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useEffect } from 'react';

export default function MoviePage() {
  const { trackPageView, trackContent, trackPlayerEvent } = useAnalytics();

  useEffect(() => {
    trackPageView('movie_details', {
      movieId: 'tt1375666',
      title: 'Inception',
    });
  }, []);

  const handlePlay = () => {
    trackPlayerEvent('play', {
      source: 'VidSrc',
      quality: 'high',
    });
  };

  return (
    // Your component
  );
}
```

### In Search
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function SearchPage() {
  const { trackSearch, trackContent } = useAnalytics();

  const handleSearch = (query: string) => {
    const results = performSearch(query);
    trackSearch(query, results.length);
  };

  return (
    // Your component
  );
}
```

---

## 🔍 Viewing Analytics

### Sentry Dashboard
1. Go to https://sentry.io
2. View **Issues** tab for errors
3. View **Performance** tab for slow operations
4. View **Replays** tab to see user sessions (with errors)
5. View **Releases** to track errors per deployment

**Key features:**
- Stack traces with source maps
- Session replays (see exactly what happened)
- Performance metrics (page load, API response time)
- Alert notifications (Slack, email)

### Umami Dashboard
1. Go to your Umami instance/cloud
2. View **Overview** for traffic
3. View **Events** for custom events
4. View **Pages** for page view analytics
5. View **Properties** for detailed event data

**Key features:**
- Real-time visitor tracking
- Event breakdown by properties
- Visitor geography
- Device/browser info
- Page performance
- User flow visualization

---

## 🚀 Deployment

### GitHub Actions Setup
Add to `.github/workflows/deploy-production.yml`:

```yaml
env:
  SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: ${{ secrets.NEXT_PUBLIC_UMAMI_WEBSITE_ID }}
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: ${{ secrets.NEXT_PUBLIC_UMAMI_SCRIPT_URL }}
```

### Docker Environment
In `Dockerfile`:
```dockerfile
ARG SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL

ENV SENTRY_DSN=${SENTRY_DSN}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=${NEXT_PUBLIC_UMAMI_WEBSITE_ID}
ENV NEXT_PUBLIC_UMAMI_SCRIPT_URL=${NEXT_PUBLIC_UMAMI_SCRIPT_URL}
```

### VPS Deployment
When deploying via `deploy.sh`, ensure environment variables are set:

```bash
docker run -d \
  -e SENTRY_DSN=$SENTRY_DSN \
  -e NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
  -e NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
  -e NEXT_PUBLIC_UMAMI_SCRIPT_URL=$NEXT_PUBLIC_UMAMI_SCRIPT_URL \
  ghcr.io/bibektimilsina00/stream-flix:latest
```

---

## 📋 Verification Checklist

- [ ] `.env.local` has all environment variables set
- [ ] Sentry project created and DSN copied
- [ ] Umami project created and Website ID copied
- [ ] `/src/components/UmamiTracker.tsx` added to layout
- [ ] `/src/lib/hooks/useAnalytics.ts` created with all methods
- [ ] `next.config.ts` wrapped with `withSentryConfig`
- [ ] `/src/app/instrumentation.ts` created
- [ ] Sentry and Umami configs exist (sentry.client.config.ts, sentry.server.config.ts)
- [ ] GitHub secrets configured for production
- [ ] Docker environment variables set up
- [ ] Analytics tracking calls added to key pages

---

## 🐛 Troubleshooting

### Umami Script Not Loading
```
Error: ⚠️ [UMAMI] Missing configuration
```
**Fix**: Set `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_UMAMI_SCRIPT_URL` in `.env.local`

### Sentry Not Capturing Errors
```
Error: Cannot initialize Sentry
```
**Fix**: Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`

### Events Not Appearing in Umami
```
✅ [UMAMI] Tracking script loaded
📊 [UMAMI] event_name {...}
```
But no data in dashboard?
- Wait 5-10 minutes for data to sync
- Check Umami website ID is correct
- Verify script URL is accessible
- Check browser console for CORS errors

### Performance Impact
- **Umami**: ~3KB (lightweight)
- **Sentry**: ~100KB (larger, has session replay)
- Both load **after** your page (strategy="afterInteractive")

---

## 🎓 Best Practices

1. **Don't track PII**: Never send personal data (emails, phone numbers)
   - ✅ trackWatchTogetherEvent('room_joined', { roomCode: 'ABC' })
   - ❌ trackEvent('user_login', { email: 'user@example.com' })

2. **Event names max 50 chars**: Umami limit
   - ✅ trackEvent('webrtc_peer_connected')
   - ❌ trackEvent('user_webrtc_peer_connection_established_successfully')

3. **Use consistent naming**:
   - watch_together_* for room events
   - webrtc_* for connection events
   - video_* for video events
   - session_* for auth events

4. **Track performance-critical paths**:
   - Page load time
   - WebRTC connection time
   - Video streaming quality
   - Error rates

5. **Set up alerts**:
   - Sentry: Alert on error spike (e.g., > 10 errors/min)
   - Umami: Monitor key event rates

---

## 📚 Resources

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Umami Docs: https://umami.is/docs
- Umami API: https://umami.is/docs/api
- Next.js Script: https://nextjs.org/docs/app/api-reference/components/script

---

## 🎯 What's Tracked Automatically

### Sentry (Auto)
- ❌ JavaScript errors
- ❌ Unhandled promise rejections
- ✅ HTTP requests (GET, POST, etc)
- ✅ Console errors/warnings
- ✅ Performance metrics

### Umami (Manual)
- ❌ Page views (you track manually)
- ❌ Events (you track manually)
- ✅ Session duration (automatic)
- ✅ Page referrer (automatic)
- ✅ Device/browser info (automatic)

---

## Next Steps

1. ✅ Set environment variables in `.env.local`
2. ✅ Add analytics tracking to Watch Together page
3. ✅ Add tracking to key pages (Movies, TV, Search, Watchlist)
4. ✅ Test in development (check console logs)
5. ✅ Deploy to production
6. ✅ View data in Sentry and Umami dashboards
7. ✅ Set up alerts for key metrics
