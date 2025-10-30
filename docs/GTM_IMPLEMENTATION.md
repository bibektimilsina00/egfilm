# Google Tag Manager Integration

## Overview

Google Tag Manager (GTM) has been successfully installed on both your main streaming app and blog/admin app with the container ID: `GTM-NNJD2J44`.

## Installation Details

### Code Placement
1. **Head Script**: Added to `<head>` section of both layout.tsx files
2. **Noscript Fallback**: Added immediately after `<body>` opening tag
3. **GTM Components**: Created for advanced tracking capabilities

### Files Modified
- `/egfilm/src/app/layout.tsx` - Main app GTM integration
- `/egfilm-admin/src/app/layout.tsx` - Blog/admin app GTM integration
- `/egfilm/src/components/GoogleTagManager.tsx` - Main app GTM component
- `/egfilm-admin/src/components/GoogleTagManager.tsx` - Blog app GTM component

## Features

### Automatic Tracking
- **Page Views**: Automatically tracked on route changes
- **Enhanced Data Layer**: Includes page_location, page_path, and page_title
- **Cross-App Tracking**: Unified tracking across main and blog apps

### Custom Event Tracking

#### Main App (egfilm)
```typescript
import { gtm } from '@/components/GoogleTagManager';

// Track video interactions
gtm.trackVideo('play', 'Movie Title', 'movie_123');
gtm.trackVideo('pause', 'Movie Title', 'movie_123');

// Track search events
gtm.trackSearch('action movies', 25);

// Track content engagement
gtm.trackContentEngagement('movie', 'movie_123', 'add_to_watchlist');

// Track custom events
gtm.trackEvent('watch_party_created', {
  participant_count: 4,
  content_type: 'movie',
  content_id: 'movie_123'
});
```

#### Blog App (egfilm-admin)
```typescript
import { gtm } from '@/components/GoogleTagManager';

// Track blog engagement
gtm.trackBlogEngagement('read', 'blog_123', 'Movie Review Title');

// Track reading progress
gtm.trackReadingProgress('blog_123', 75);

// Track blog sharing
gtm.trackBlogShare('twitter', 'blog_123', 'Movie Review Title');

// Track admin actions
gtm.trackAdminAction('publish', 'blog_post', 'blog_123');

// Track content generation
gtm.trackContentGeneration('blog_post', true, 45000);
```

## Integration with Google Analytics

GTM works seamlessly with your existing Google Analytics setup:
- **Google Analytics**: Direct GA4 tracking for core metrics
- **Google Tag Manager**: Advanced event tracking and custom dimensions
- **Unified Data**: Both systems share the same dataLayer

## Testing

### Verification Steps
1. Open your website in a browser
2. Open Developer Tools (F12)
3. Check Network tab for GTM requests to `googletagmanager.com`
4. Verify dataLayer in Console: `console.log(window.dataLayer)`

### GTM Preview Mode
1. Log into [Google Tag Manager](https://tagmanager.google.com)
2. Select container GTM-NNJD2J44
3. Click "Preview" to enable debug mode
4. Navigate your site to see real-time event firing

## Next Steps

### Recommended GTM Configuration
1. **Enhanced Ecommerce**: Set up for premium subscriptions
2. **Custom Dimensions**: Track user types, content categories
3. **Conversion Tracking**: Monitor key actions (sign-ups, watchlist adds)
4. **Audience Building**: Create segments for retargeting

### Event Monitoring
Monitor these key events in GTM:
- `page_view` - All page navigation
- `video_engagement` - Play, pause, seek actions
- `search` - Content search behavior
- `content_engagement` - Watchlist, favorites, shares
- `blog_engagement` - Reading time, scroll depth
- `user_interaction` - Button clicks, form submissions

## Benefits

1. **Unified Tracking**: Single container for both apps
2. **No Code Deployments**: Update tracking without code changes
3. **Advanced Segmentation**: Better audience insights
4. **Third-party Integration**: Easy Facebook Pixel, etc. setup
5. **A/B Testing**: Support for testing frameworks
6. **Performance**: Async loading doesn't block page render

The installation is complete and ready for use! 🚀