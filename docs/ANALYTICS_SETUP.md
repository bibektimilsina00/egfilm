# Sentry & Umami Analytics Setup Guide

## ✅ Current Configuration

### **Umami Analytics**
- ✅ **Installed**: Global script in root layout (`src/app/layout.tsx`)
- ✅ **Auto-tracking**: All page views tracked automatically
- ✅ **Website ID**: `ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53` (Umami Cloud)
- ✅ **Scope**: Entire site (all pages automatically included)

### **Sentry Error Tracking**
- ✅ **Conditionally initialized** (only if DSN environment variable is set)
- ✅ **Server-side**: `SENTRY_DSN` environment variable
- ✅ **Client-side**: `NEXT_PUBLIC_SENTRY_DSN` environment variable
- ✅ **Sample rate**: 10% in production, 100% in development
- ✅ **Privacy**: User PII disabled by default

---

## 📊 What Gets Tracked by Umami (Automatically)

### Page Views
- All page visits across your site
- Movies, TV shows, search results, watchlist, etc.
- Navigation between pages

### User Behavior
- Time spent on each page
- Session duration
- Browser/device information
- Operating system
- Referrer sources
- Geographic location

### View Umami Analytics Dashboard
Login to [Umami Cloud](https://cloud.umami.is) and check your dashboard for:
- Real-time page views
- Popular pages
- Visitor trends
- Device breakdown
- Referrer sources

---

## 🎯 Custom Event Tracking (Optional)

For tracking specific user actions, use the `useUmamiEvents` hook:

### **Example: Track Movie Click**
```tsx
'use client';

import { useUmamiEvents } from '@/lib/hooks/useUmamiEvents';

export function MovieCard({ movie }) {
  const { trackEvent } = useUmamiEvents();

  const handleClick = () => {
    trackEvent('movie_clicked', {
      movieId: movie.id,
      title: movie.title,
      genre: movie.genre
    });
    // Navigate to movie page
  };

  return <div onClick={handleClick}>{movie.title}</div>;
}
```

### **Example: Track Watch Together**
```tsx
import { umamiEvents } from '@/lib/hooks/useUmamiEvents';

// When creating a watch together room
const roomCode = 'ABC123';
umamiEvents.watchTogetherCreated(roomCode);

// When joining a room
umamiEvents.watchTogetherJoined(roomCode);
```

### **Pre-built Events Available**
- `movieViewed(movieId, title)`
- `tvShowViewed(showId, title)`
- `addedToWatchlist(itemId, type)`
- `removedFromWatchlist(itemId, type)`
- `watchTogetherCreated(roomCode)`
- `watchTogetherJoined(roomCode)`
- `searched(query, resultCount)`
- `userSignedUp(method)`
- `userLoggedIn(method)`
- `userLoggedOut()`

---

## 🔧 Fixing Umami Partial Tracking

If Umami is only tracking some pages, check:

### 1. **Browser Console Errors**
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
```
**Solution**: Disable ad blockers or add Umami to whitelist
- Some ad blockers block analytics scripts
- Ask users to whitelist `cloud.umami.is`

### 2. **Check Script is Loading**
Open DevTools → Network tab:
- Should see `script.js` request to `cloud.umami.is`
- Status should be `200 OK`

### 3. **Verify Website ID**
In `src/components/UmamiTracker.tsx`:
```tsx
const websiteId = "ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53"; // Your ID here
```

### 4. **Check if Umami is Disabled**
In development, verify the component loads:
```
console.log(window.umami) // Should show Umami object, not undefined
```

---

## 🔴 Sentry Error Tracking Setup

### **To Enable Sentry:**

1. **Create Sentry Account**
   - Go to [sentry.io](https://sentry.io)
   - Create a new project (Select "Next.js")

2. **Get Your DSN Keys**
   - From Sentry dashboard → Settings → Client Keys (DSN)
   - You'll get two DSNs:
     - **Server DSN** (sensitive, never expose in browser)
     - **Client DSN** (safe for browser)

3. **Set Environment Variables**
   ```bash
   # .env.local (development)
   SENTRY_DSN=https://your-server-dsn@ingest.sentry.io/project-id
   NEXT_PUBLIC_SENTRY_DSN=https://your-client-dsn@ingest.sentry.io/project-id
   
   # .env (production - in GitHub secrets)
   SENTRY_DSN=<secret>
   NEXT_PUBLIC_SENTRY_DSN=<secret>
   ```

4. **Restart dev server**
   ```bash
   npm run dev
   ```

5. **Test Sentry** (Development only)
   ```tsx
   // In a component
   throw new Error("Test Sentry error");
   ```
   Check [sentry.io](https://sentry.io) dashboard → Issues → should see your error

### **Sentry Configuration**
- ✅ Traces sampled at 10% in production (reduces costs)
- ✅ Replays on errors enabled (100% sample rate)
- ✅ Stack traces attached
- ✅ Development mode gets all traces (100% sample rate)

---

## ❌ If Getting 403 Forbidden Errors from Sentry

### **Causes:**
1. Invalid/expired DSN keys
2. Sentry project doesn't exist
3. IP restrictions on Sentry project
4. CORS misconfiguration

### **Solution:**
1. Verify DSN is correct on [sentry.io](https://sentry.io)
2. Try creating a new project in Sentry
3. Check Sentry project settings → Client Keys (DSN)
4. If still failing, disable Sentry temporarily:
   ```bash
   # Comment out or delete SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN
   ```

---

## 📋 Checklist

- [x] Umami installed globally in layout
- [x] Umami automatically tracking all page views
- [x] Sentry conditionally initialized (only if DSN set)
- [x] Custom event tracking available via hook
- [x] Server/client DSNs separated for security
- [x] Privacy settings configured (PII disabled)
- [x] Environment-specific sampling rates

---

## 🚀 What's Working Now

✅ **Umami**: Tracks all pages automatically
✅ **Custom Events**: Available via `useUmamiEvents` hook
✅ **Sentry**: Ready to enable (just add DSN env vars)
✅ **Privacy**: PII disabled, sample rates optimized
✅ **Performance**: Minimal impact on site speed

---

## 📞 Need Help?

- **Umami Dashboard**: https://cloud.umami.is
- **Sentry Dashboard**: https://sentry.io
- **Umami Docs**: https://umami.is/docs
- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
