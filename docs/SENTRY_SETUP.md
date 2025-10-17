# Sentry & Analytics Setup Guide

## Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Sign up (or login if you have account)
3. Create a new project:
   - Project name: `StreamFlix`
   - Platform: `Next.js`
   - Alert frequency: `As it happens`
4. Copy your **DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

---

## Step 2: Install Sentry SDK

```bash
npm install @sentry/nextjs @sentry/tracing
```

---

## Step 3: Add Environment Variables

**In `.env.local` (local development):**
```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn-here@ingest.sentry.io/project-id
SENTRY_DSN=https://your-sentry-dsn-here@ingest.sentry.io/project-id
SENTRY_AUTH_TOKEN=your_auth_token_here
```

**In GitHub Secrets:**
- Go to: Repo → Settings → Secrets and variables → Actions
- Add Secret: `SENTRY_DSN` (same as above)
- Add Secret: `SENTRY_AUTH_TOKEN` (optional, for source maps)

---

## Step 4: Initialize Sentry in Next.js

**Update `next.config.ts`:**
```typescript
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // ... your existing config
};

export default withSentryConfig(nextConfig, {
  org: "your-sentry-org",
  project: "streamflix",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  autoInstrumentServerFunctions: true,
});
```

---

## Step 5: Update GitHub Actions Workflow

In `.github/workflows/deploy-production.yml`, add to env section:

```yaml
env:
  SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

---

## Step 6: Use Analytics in Your Code

### Track Page Views:
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useEffect } from 'react';

export default function Page() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('watch_together', {
      roomCode: 'ABC123',
    });
  }, []);

  return <div>Content</div>;
}
```

### Track WebRTC Events:
```typescript
const { trackConnectionEvent } = useAnalytics();

// In your WebRTC code:
trackConnectionEvent('peer_connected', {
  peerId: 'xyz123',
  iceState: 'connected',
  duration: 5000,
});

trackConnectionEvent('webrtc_error', {
  error: 'ICE failed',
  candidate_type: 'relay',
});
```

### Track Watch Together Events:
```typescript
const { trackWatchTogetherEvent } = useAnalytics();

// User joined room
trackWatchTogetherEvent('room_joined', {
  roomCode: 'ABC123',
  participantCount: 2,
});

// Media toggle
trackWatchTogetherEvent('camera_enabled', {
  duration: 120, // seconds
});

trackWatchTogetherEvent('message_sent', {
  length: 50,
});
```

### Track Errors:
```typescript
const { trackError } = useAnalytics();

try {
  // some code
} catch (error) {
  trackError(error as Error, {
    context: 'media_setup',
    action: 'get_user_media',
  });
}
```

---

## What Gets Tracked Automatically

Sentry tracks automatically:
- ❌ All JavaScript errors
- ❌ Unhandled promise rejections
- ❌ Performance metrics (page load time, etc)
- ❌ User sessions
- ❌ Network requests
- ❌ Console errors

You get:
- 📊 Error reports with stack traces
- 📈 Performance monitoring dashboard
- 🔍 Session replay (see exactly what happened)
- 🚨 Real-time alerts (configurable)

---

## Custom Metrics You Can Track

### WebRTC Quality:
```typescript
const { trackVideoQuality } = useAnalytics();

trackVideoQuality('high', 120, '1280x720');
trackVideoQuality('low', 45, '640x480');
```

### User Engagement:
```typescript
const { trackEvent } = useAnalytics();

trackEvent({
  name: 'watch_together_duration',
  properties: {
    seconds: 3600,
    participants: 2,
    ended_by: 'user_disconnect',
  },
});
```

---

## Sentry Dashboard Features

After events are sent, visit dashboard to see:

1. **Issues Page**: All errors grouped by type
   - Error frequency
   - Affected users
   - Stack traces
   - Session replays

2. **Performance**: Track slow operations
   - Page load times
   - API response times
   - Custom measurements

3. **Releases**: Track errors per deployment
   - Compare versions
   - Track regressions

4. **Alerts**: Get notified of new issues
   - Slack integration
   - Email alerts
   - Custom triggers

---

## Example: Full Watch Together Analytics

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function WatchTogether() {
  const { 
    trackWatchTogetherEvent, 
    trackConnectionEvent, 
    trackError 
  } = useAnalytics();

  const handleRoomJoin = (roomCode: string) => {
    trackWatchTogetherEvent('room_joined', {
      roomCode,
      timestamp: new Date().toISOString(),
    });
  };

  const handleVideoToggle = (enabled: boolean) => {
    trackWatchTogetherEvent('video_toggled', {
      enabled,
      timestamp: new Date().toISOString(),
    });
  };

  const handleICECandidate = (type: string) => {
    trackConnectionEvent('ice_candidate', {
      type, // 'host', 'srflx', 'relay'
      timestamp: new Date().toISOString(),
    });
  };

  const handleError = (error: Error) => {
    trackError(error, {
      context: 'watch_together',
      severity: 'error',
    });
  };

  return (
    // Your component
  );
}
```

---

## Testing Locally

Send a test error:
```typescript
Sentry.captureException(new Error('Test error from StreamFlix'));
```

Check Sentry dashboard - you should see it in Issues page!

---

## Production Deployment

When you push to main:
1. GitHub Actions builds image with SENTRY_DSN env var
2. Container starts with Sentry initialized
3. All errors automatically reported
4. Check Sentry dashboard for real-time updates

---

## Pricing

Free plan includes:
- ✅ 5,000 errors/month
- ✅ 1 user (you)
- ✅ 24-hour event history

Perfect for starting! Upgrade as you grow.

---

## Next Steps

1. ✅ Create Sentry account
2. ✅ Copy DSN
3. ✅ Add to GitHub Secrets
4. ✅ Install packages: `npm install @sentry/nextjs @sentry/tracing`
5. ✅ Update `next.config.ts`
6. ✅ Add env vars
7. ✅ Push to deploy
8. ✅ View dashboard
