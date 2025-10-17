# 🎯 Quick Reference: Using Analytics in Your App

## Copy-Paste Templates

### Template 1: Track Page View
```typescript
'use client';
import { useEffect } from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function MyPage() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('page_name', {
      section: 'movies',
      category: 'action',
    });
  }, []);

  return <div>Your page content</div>;
}
```

### Template 2: Track Button Click
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function MyComponent() {
  const { trackContent } = useAnalytics();

  const handleClick = () => {
    trackContent('movie', 'clicked', 'tt1375666');
    // ... do something
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Template 3: Track Search
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function SearchPage() {
  const { trackSearch } = useAnalytics();

  const handleSearch = (query: string) => {
    const results = performSearch(query);
    trackSearch(query, results.length);
  };

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

### Template 4: Track Error
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function DataFetcher() {
  const { trackError } = useAnalytics();

  const fetchData = async () => {
    try {
      const data = await fetch('/api/data');
      if (!data.ok) throw new Error('API failed');
    } catch (error) {
      trackError(error as Error, {
        endpoint: '/api/data',
        method: 'GET',
      });
    }
  };

  return <button onClick={fetchData}>Fetch</button>;
}
```

### Template 5: Track Video Play
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function VideoPlayer() {
  const { trackPlayerEvent, trackVideoQuality } = useAnalytics();

  const handlePlay = () => {
    trackPlayerEvent('play', {
      source: 'VidSrc',
      contentId: 'tt1375666',
    });
  };

  const handleQualityChange = (quality: string) => {
    trackVideoQuality(quality, 120, '1280x720');
  };

  return (
    <div>
      <button onClick={handlePlay}>Play</button>
      <button onClick={() => handleQualityChange('high')}>High Quality</button>
    </div>
  );
}
```

### Template 6: Track Form Submission
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function LoginForm() {
  const { trackSession, trackError } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ... login logic
      trackSession('login', { provider: 'email' });
    } catch (error) {
      trackError(error as Error, { context: 'login_form' });
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## All Available Methods

### `trackEvent(eventName, properties)`
Track any custom event
```typescript
trackEvent('button_clicked', { buttonId: 'submit-btn' });
```

### `trackPageView(pageName, properties)`
Track page views with metadata
```typescript
trackPageView('movie_details', { 
  movieId: 'tt1375666',
  genre: 'sci-fi' 
});
```

### `trackError(error, context)`
Track errors with context
```typescript
trackError(new Error('Network failed'), {
  endpoint: '/api/data',
  retry: true,
});
```

### `trackWatchTogetherEvent(eventName, properties)`
Track Watch Together room events
```typescript
trackWatchTogetherEvent('room_joined', {
  roomCode: 'ABC123',
  participantCount: '2',
});
```

### `trackConnectionEvent(status, details)`
Track WebRTC connection events
```typescript
trackConnectionEvent('peer_connected', {
  peerId: 'abc123',
  iceState: 'connected',
});
```

### `trackDeviceToggle(deviceType, enabled)`
Track camera/microphone toggles
```typescript
trackDeviceToggle('camera', true);
trackDeviceToggle('microphone', false);
```

### `trackMessage(messageLength, participantCount)`
Track chat messages
```typescript
trackMessage(150, 4); // 150 char message, 4 participants
```

### `trackVideoQuality(quality, duration, resolution)`
Track video quality metrics
```typescript
trackVideoQuality('high', 120, '1280x720');
```

### `trackPermission(deviceType, granted)`
Track permission grants
```typescript
trackPermission('camera', true);
trackPermission('microphone', false);
```

### `trackSession(eventName, properties)`
Track session events
```typescript
trackSession('login', { provider: 'nextauth' });
trackSession('logout', { duration: 3600 });
```

### `trackSearch(query, results)`
Track search queries
```typescript
trackSearch('Inception', 45);
```

### `trackContent(type, action, contentId)`
Track content interactions
```typescript
trackContent('movie', 'viewed', 'tt1375666');
trackContent('watchlist', 'added', 'tt1375666');
```

### `trackPlayerEvent(action, properties)`
Track video player events
```typescript
trackPlayerEvent('play', { source: 'VidSrc' });
trackPlayerEvent('seek', { from: 1200, to: 3600 });
trackPlayerEvent('fullscreen', { enabled: true });
```

### `trackPerformance(metricName, duration)`
Track performance metrics
```typescript
trackPerformance('page_load', 2500);
trackPerformance('webrtc_connect', 3200);
```

---

## Real-World Examples

### Movies Page
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useEffect } from 'react';

export default function MoviesPage() {
  const { trackPageView, trackContent } = useAnalytics();

  useEffect(() => {
    trackPageView('movies_browse', { genre: 'action' });
  }, []);

  const handleMovieClick = (movieId: string, title: string) => {
    trackContent('movie', 'clicked', movieId);
    // Navigate to movie details
  };

  return (
    <div>
      {movies.map(movie => (
        <button 
          key={movie.id}
          onClick={() => handleMovieClick(movie.id, movie.title)}
        >
          {movie.title}
        </button>
      ))}
    </div>
  );
}
```

### Search Page
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useState } from 'react';

export default function SearchPage() {
  const { trackSearch } = useAnalytics();
  const [query, setQuery] = useState('');

  const handleSearch = (searchQuery: string) => {
    const results = performSearch(searchQuery);
    trackSearch(searchQuery, results.length);
  };

  return (
    <input
      onChange={(e) => {
        setQuery(e.target.value);
        if (e.target.value.length > 2) {
          handleSearch(e.target.value);
        }
      }}
      placeholder="Search movies..."
    />
  );
}
```

### Watchlist Page
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function WatchlistPage() {
  const { trackPageView, trackContent } = useAnalytics();

  useEffect(() => {
    trackPageView('watchlist_view');
  }, []);

  const handleRemove = (movieId: string) => {
    trackContent('watchlist', 'removed', movieId);
    // Remove from watchlist
  };

  return (
    // Your watchlist JSX
  );
}
```

---

## Best Practices

### 1. Use Consistent Event Names
```typescript
// ✅ Good
trackWatchTogetherEvent('room_joined', {...});
trackWatchTogetherEvent('room_left', {...});

// ❌ Bad
trackEvent('joined_room', {...});
trackEvent('UserExitRoom', {...});
```

### 2. Include Relevant Context
```typescript
// ✅ Good
trackError(error, { 
  endpoint: '/api/data',
  method: 'GET',
  status: 500,
});

// ❌ Bad
trackError(error);
```

### 3. Don't Track PII
```typescript
// ✅ Good
trackSession('login', { provider: 'email' });

// ❌ Bad
trackSession('login', { email: 'user@example.com' });
```

### 4. Use String Values for Properties
```typescript
// ✅ Good
trackContent('movie', 'viewed', 'tt1375666');

// ❌ Bad (number gets converted to string anyway)
trackVideoQuality('high', 120, '1280x720');
```

### 5. Track at Key Points Only
```typescript
// ✅ Good - track important user actions
trackPageView('movies');
trackContent('movie', 'clicked', id);

// ❌ Bad - don't track every render
useEffect(() => {
  trackEvent('component_rendered');
}, []);
```

---

## Integration Checklist for New Pages

When adding analytics to a new page:

- [ ] Import `useAnalytics` hook
- [ ] Call `trackPageView` in `useEffect`
- [ ] Track important user actions (clicks, form submits)
- [ ] Track errors in try-catch blocks
- [ ] Test in browser console (look for `📊 [UMAMI]` logs)
- [ ] Verify data appears in Umami dashboard (5-10 min delay)

---

## Debug Tips

### Check if Umami is Loaded
```javascript
// In browser console
if (window.umami) {
  console.log('✅ Umami is loaded');
  umami.track('test_event');
} else {
  console.log('❌ Umami not loaded');
}
```

### Enable Debug Logging
Already enabled in development! Check browser console for:
```
📊 [UMAMI] event_name {...}
```

### Test Event Submission
```typescript
// In your component
trackEvent('test_event', { test: 'value' });
// Should see console log and data in Umami in 5-10 mins
```

---

## Troubleshooting

### "Cannot find module @sentry/nextjs"
- Run: `npm install @sentry/nextjs @sentry/tracing`

### Analytics hook not importing
- Check file path: `@/lib/hooks/useAnalytics`
- Make sure `tsconfig.json` has `@` alias configured

### Events not appearing
- Check browser console for `📊 [UMAMI]` logs
- Verify `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set
- Wait 5-10 minutes for data sync
- Check Umami dashboard (not console)

---

## Summary

**5-second quick start**:
```typescript
import { useAnalytics } from '@/lib/hooks/useAnalytics';

const { trackPageView } = useAnalytics();
useEffect(() => trackPageView('my_page'), []);
```

**Available methods**: 14 (see "All Available Methods" above)

**Setup time**: 0 minutes (already done!)

**Integration time**: ~2-3 minutes per page

**Go live**: Deploy to main branch → automatic
