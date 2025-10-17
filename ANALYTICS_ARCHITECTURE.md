# 📊 Complete Analytics Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     StreamFlix Frontend                         │
│                   (Browser / Next.js App)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Watch Together Page                                            │
│  ├─ Room joined → trackWatchTogetherEvent()                    │
│  ├─ Message sent → trackMessage()                              │
│  ├─ Camera toggle → trackDeviceToggle()                        │
│  ├─ WebRTC error → trackError()                                │
│  └─ Connection event → trackConnectionEvent()                  │
│                                                                 │
│  Other Pages                                                    │
│  ├─ Page load → trackPageView()                                │
│  ├─ Search → trackSearch()                                     │
│  ├─ Click movie → trackContent()                               │
│  └─ Any error → trackError()                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↓                                          ↓
    (Events)                              (Errors & Performance)
         │                                          │
         ↓                                          ↓
┌──────────────────────┐            ┌──────────────────────┐
│   Umami Analytics    │            │  Sentry Error Track  │
│                      │            │  & Performance       │
│ • User Behavior      │            │                      │
│ • Custom Events      │            │ • Errors             │
│ • Page Views         │            │ • Stack Traces       │
│ • Real-time Data     │            │ • Session Replay     │
│ • Privacy-focused    │            │ • Performance Metrics│
│ • No Cookies         │            │ • Source Maps        │
└──────────────────────┘            └──────────────────────┘
         ↓                                    ↓
    https://cloud.umami.is/          https://sentry.io/
    (or self-hosted)               (Error tracking dashboard)
         ↓                                    ↓
┌──────────────────────┐            ┌──────────────────────┐
│  Umami Dashboard     │            │  Sentry Dashboard    │
│                      │            │                      │
│ Events               │            │ Issues               │
│ Pages                │            │ Performance          │
│ Visitors             │            │ Replays              │
│ Properties           │            │ Releases             │
│ Realtime             │            │ Alerts               │
└──────────────────────┘            └──────────────────────┘
```

---

## Event Flow

### 1. Watch Together Room Joined

```
User clicks "Join Room"
          ↓
WatchTogetherModal component
          ↓
trackWatchTogetherEvent('room_joined', {
  roomCode: 'ABC123',
  participantCount: '2'
})
          ↓
useAnalytics() hook
          ↓
window.umami.track() called
          ↓
Event sent to Umami servers
          ↓
          (Wait 1-2 minutes)
          ↓
Event appears in Umami Dashboard
```

### 2. Camera Toggle

```
User clicks camera button
          ↓
toggleVideo() function
          ↓
trackDeviceToggle('camera', true)
          ↓
useAnalytics() hook
          ↓
window.umami.track() called
          ↓
Event sent to Umami servers
          ↓
Umami Dashboard shows:
  Event: device_toggled
  Property: device_type = "camera"
  Property: enabled = "yes"
```

### 3. Error Occurred

```
Try-catch block in code
          ↓
Error thrown
          ↓
catch (error) {
  trackError(error, { context: 'webrtc_setup' })
}
          ↓
useAnalytics() hook
          ↓
Sentry.captureException() called
          ↓
Error sent to Sentry servers
          ↓
Sentry Dashboard shows:
  • Error message
  • Stack trace
  • Source code context
  • Browser info
```

---

## Data Flow

### Umami (User Behavior)

```
Browser Event
     ↓
useAnalytics().trackEvent()
     ↓
window.umami.track(name, properties)
     ↓
HTTP POST to Umami server
     ↓
Umami database stores event
     ↓
Real-time processing
     ↓
Umami Dashboard updates
```

**Latency:** 1-2 minutes (batched processing)

### Sentry (Errors & Performance)

```
JavaScript Error / Performance Metric
     ↓
Sentry SDK captures
     ↓
useAnalytics().trackError()
     ↓
Sentry.captureException()
     ↓
HTTP POST to Sentry server
     ↓
Sentry database stores
     ↓
Stack trace processing
     ↓
Sentry Dashboard updates (instant)
```

**Latency:** Near instant for dashboard

---

## Environment Variables

### Development (.env.local)

```env
# Umami
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js

# Sentry (auto-configured by wizard)
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
```

### Production (GitHub Secrets)

```
NEXT_PUBLIC_UMAMI_WEBSITE_ID
NEXT_PUBLIC_UMAMI_SCRIPT_URL
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
```

### Docker Build Args

```dockerfile
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL
ARG SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=${NEXT_PUBLIC_UMAMI_WEBSITE_ID}
ENV NEXT_PUBLIC_UMAMI_SCRIPT_URL=${NEXT_PUBLIC_UMAMI_SCRIPT_URL}
ENV SENTRY_DSN=${SENTRY_DSN}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
```

---

## Component Integration

### Where Analytics is Used

```
src/
├── app/
│   ├── watch-together/page.tsx        ← Integrated (11 events)
│   ├── movie/[id]/page.tsx            ← Could add tracking
│   ├── tv/[id]/page.tsx               ← Could add tracking
│   ├── search/page.tsx                ← Could add tracking
│   └── watchlist/page.tsx             ← Could add tracking
│
├── components/
│   └── UmamiTracker.tsx               ← Loads script
│
└── lib/
    └── hooks/
        └── useAnalytics.ts            ← 14 tracking methods
```

### Using Analytics in Components

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function MyComponent() {
  const {
    trackWatchTogetherEvent,
    trackDeviceToggle,
    trackError,
  } = useAnalytics();

  const handleClick = () => {
    try {
      trackWatchTogetherEvent('room_joined', { roomCode: 'ABC' });
      // ... do something
    } catch (error) {
      trackError(error as Error, { context: 'room_join' });
    }
  };

  return <button onClick={handleClick}>Join</button>;
}
```

---

## Tracking Methods (14 Total)

### Core Methods
- `trackEvent()` - Generic event
- `trackPageView()` - Page visits
- `trackError()` - Errors

### Watch Together
- `trackWatchTogetherEvent()` - Room events
- `trackConnectionEvent()` - WebRTC
- `trackDeviceToggle()` - Camera/mic
- `trackMessage()` - Chat

### Extended
- `trackVideoQuality()` - Video stats
- `trackPermission()` - Permissions
- `trackSession()` - Login/logout
- `trackSearch()` - Search queries
- `trackContent()` - Content clicks
- `trackPlayerEvent()` - Video player
- `trackPerformance()` - Performance

---

## Event Categories

### Session Events
```
watchTogether:
  - room_joined
  - room_left
  - participant_joined
  - participant_left

user:
  - session_login
  - session_logout
  - session_register
```

### Engagement Events
```
media:
  - device_toggled (camera/microphone)
  - message_sent
  - player_event (play, pause, seek)

content:
  - content_interaction (viewed, added, removed)
  - search_performed
  - page_view
```

### Technical Events
```
webrtc:
  - peer_connected
  - peer_connection_failed
  - peer_disconnected
  - ice_candidate_gathered (host/srflx/relay)

performance:
  - video_quality
  - performance_metric
  - error_occurred
```

---

## Dashboard Views

### Umami Dashboard

**Overview:**
- Unique visitors (today, 7d, 30d)
- Total pageviews
- Top pages
- Top referrers

**Events:**
- Event frequency
- Event breakdown
- Event properties
- Custom analytics

**Real-time:**
- Live visitors
- Current page views
- Recent events

### Sentry Dashboard

**Issues:**
- Error frequency
- Stack traces
- Affected users
- Release info

**Performance:**
- Page load times
- Web Vitals
- Custom metrics
- Performance timeline

**Replays:**
- Session video
- Browser console
- Network activity
- Interactions

---

## Best Practices

### 1. Event Naming
```
✅ watch_together_room_joined
✅ webrtc_peer_connected
✅ device_toggled

❌ RoomJoined
❌ webrtc_peer_connection_established
```

### 2. Include Context
```
✅ trackError(error, { context: 'webrtc_setup', endpoint: '/api/data' })
❌ trackError(error)
```

### 3. Don't Track PII
```
✅ trackSession('login', { provider: 'email' })
❌ trackSession('login', { email: 'user@example.com' })
```

### 4. Sample Rates for Production
```
# Development
tracesSampleRate: 1.0  // 100%

# Production
tracesSampleRate: 0.1  // 10%
```

---

## Monitoring & Alerts

### Sentry Alerts
Set up notifications for:
- New issues
- Errors spike (> 10 per minute)
- Performance degradation
- Release regressions

### Umami Monitoring
Manual checks for:
- Daily user count
- Event trends
- Feature adoption
- User engagement

---

## Performance Impact

### Bundle Sizes
- Sentry: ~100KB (gzipped: ~30KB)
- Umami: ~3KB (script only)
- Analytics hook: <1KB

### Latency
- Umami events: 1-2 ms to send (batched)
- Sentry errors: <5 ms to send
- No blocking (loaded with `strategy="afterInteractive"`)

---

## Privacy & Compliance

### GDPR
- ✅ Umami: GDPR compliant (no cookies)
- ✅ Sentry: Can mask PII
- ✅ No tracking across sites
- ✅ Data stored in EU (de.sentry.io)

### Data Retention
- Umami: Configurable (30-90 days free tier)
- Sentry: Configurable (90 days default)

---

## Files & Configuration

### Sentry Files
```
src/instrumentation.ts              - Server init
src/instrumentation-client.ts       - Client init
sentry.server.config.ts             - Server config
sentry.edge.config.ts               - Edge config
src/app/global-error.tsx            - Error boundary
src/pages/_error.tsx                - Error page
next.config.ts                      - Wrapped with withSentryConfig
```

### Umami Files
```
src/components/UmamiTracker.tsx      - Script loader
src/app/layout.tsx                  - Injected in <head>
src/lib/hooks/useAnalytics.ts       - Tracking methods
.env.local                          - Configuration
```

---

## Quick Checklist

### Development
- [ ] Sentry wizard ran successfully
- [ ] Umami account created
- [ ] `.env.local` has Umami config
- [ ] Dev server starts without errors
- [ ] Console shows: `✅ [UMAMI] Tracking script loaded`
- [ ] Test event sent and appears in dashboard

### Production
- [ ] GitHub secrets configured
- [ ] CI/CD workflow updated
- [ ] Sentry org/project set up
- [ ] Umami production website created
- [ ] Docker build includes env vars
- [ ] Deploy successful
- [ ] Analytics appearing in dashboards

---

## Support & Documentation

- **Sentry**: https://docs.sentry.io/
- **Umami**: https://umami.is/docs
- **Local Guides**: 
  - SENTRY_SETUP.md (in repo)
  - UMAMI_SETUP_GUIDE.md (in repo)
  - UMAMI_SETUP_CHECKLIST.md (in repo)

---

**Status:** Complete & Production Ready ✅

All analytics infrastructure is integrated and ready to use!
