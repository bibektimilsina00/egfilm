# StreamFlix - AI Agent Instructions

## Project Overview
StreamFlix is a Next.js 15 streaming platform with embedded video playback, real-time Watch Together features via WebRTC, and NextAuth authentication. Uses TMDb API for metadata, localStorage for client-side persistence, and Socket.IO for real-time sync.

## Architecture & Critical Patterns

### 1. **Dual Routing System**
- **Pages Router**: `/src/pages/api/socketio.ts` - Socket.IO API endpoint only
- **App Router**: Everything else under `/src/app/` 
- Never mix: Socket.IO requires Pages Router, all other routes use App Router

### 2. **Video Playback Architecture**
```typescript
// Pattern: Multi-source embed providers (src/lib/videoSources.ts)
VIDEO_SOURCES = [VidSrc, VidSrc Pro, VidSrc.to, 2Embed, SuperEmbed]
// Movies: /embed/movie/{tmdbId}
// TV: /embed/tv/{tmdbId}/{season}/{episode}
```
- **Never implement custom video players** - uses third-party embeds in iframes
- Server switching handled in `EmbeddedPlayer.tsx` via dropdown (sourceIndex state)
- Embedded players have ads/redirects - this is expected behavior documented in `IFRAME_LIMITATIONS.md`

### 3. **Watch Together System**
Two flows exist (keep separate):
- **Main Flow** (preferred): Movie/TV page → "Watch Together" button → Modal → `/watch-together?room=CODE`
- **Legacy Flow** (redirect only): Direct `/watch-party` access → shows instructions → auto-redirect homepage

```typescript
// Room creation flow:
WatchTogetherModal → localStorage.setItem('room_CODE') → navigate /watch-together
// Socket.IO events: join-watch-together, leave-watch-together, send-chat-message, 
// webrtc-offer, webrtc-answer, webrtc-ice-candidate, update-media-status
```

WebRTC connection pattern in `/src/app/watch-together/page.tsx`:
```typescript
RTCPeerConnection → createOffer/Answer → socket.emit('webrtc-offer') 
→ onicecandidate → socket.emit('webrtc-ice-candidate')
```

### 4. **Authentication Pattern**
```typescript
// In-memory user store (src/lib/auth.ts) - NOT persistent across restarts
// Default test user: demo@example.com / demo123
// Session strategy: JWT (no database)
// Protected routes: Check useSession() status → redirect to /login if 'unauthenticated'
```

Watch Together requires auth - check in movie/TV pages:
```typescript
if (status === 'unauthenticated') router.push('/login');
else setShowWatchTogether(true);
```

### 5. **Data Persistence Strategy**
- **TMDb API**: Movie/TV metadata (read-only, public key in .env.local)
- **localStorage**: Watchlist, continue watching, room codes, usernames
- **Socket.IO in-memory Maps**: Active rooms/participants (lost on restart)
- **No backend database** - intentional architecture choice

### 6. **State Management Patterns**
```typescript
// No Redux/Zustand - uses React hooks + localStorage
// Watchlist: lib/storage.ts → addToWatchlist/removeFromWatchlist
// Continue watching: saveContinueWatching() updates progress %
// Room state: Socket.IO broadcasts to io.to(roomCode)
```

## Development Workflows

### Running the App
```bash
npm run dev          # Runs on port 8000 (not 3000!)
# Socket.IO auto-initializes on first API call to /api/socketio
# TMDb API key required: NEXT_PUBLIC_TMDB_API_KEY in .env.local
```

### Key Environment Variables
```env
NEXT_PUBLIC_TMDB_API_KEY=your_key_here
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3  # Optional, has default
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:8000  # Match dev port!
```

### Testing Watch Together Locally
1. Open two browser windows (or incognito + normal)
2. Login in both (use demo@example.com / demo123)
3. Window 1: Movie page → Watch Together → Create room → copy code
4. Window 2: Same movie page → Watch Together → Join → paste code
5. Both navigate to `/watch-together?room=CODE` with WebRTC connections

## Critical Don'ts

### ❌ Never Do This:
1. **Don't add video.js or custom players** - embedded iframes only
2. **Don't move socketio.ts to App Router** - Socket.IO requires Pages Router
3. **Don't add database migrations** - in-memory auth is intentional
4. **Don't remove localStorage fallbacks** - critical for username/watchlist persistence
5. **Don't create new Watch Together flows** - two systems already exist (keep separate)
6. **Don't create .md documentation files** - No GUIDE.md, SETUP.md, SUMMARY.md, or similar docs

### ❌ Common Anti-Patterns:
```typescript
// Wrong: Trying to sync video playback between embedded iframes
// Right: WebRTC peer connections for video calling, embeds play independently

// Wrong: useEffect(() => { socket.emit() }, [dependency])
// Right: User action → socket.emit() (avoid infinite loops)

// Wrong: await fetch('/api/socketio') in App Router components
// Right: Socket initialization happens in pages/api/socketio.ts automatically

// Wrong: Creating documentation files like FEATURE_GUIDE.md, SETUP.md
// Right: Code should be self-explanatory, use comments and this file only
```

## Component Patterns

### Modal System
```typescript
// Pattern: Modal state in parent, render conditionally
const [showWatchTogether, setShowWatchTogether] = useState(false);
{showWatchTogether && <WatchTogetherModal onClose={() => setShowWatchTogether(false)} />}
// Never use portal-based modals (react-modal, @radix-ui/dialog)
```

### TMDb API Calls
```typescript
// All in src/lib/tmdb.ts - reuse existing functions
getTrending('movie', 'week') // returns MediaItem[]
getMovieDetails(id) // includes cast, trailers, similar
// API key auto-injected via axios interceptor
```

### Navigation Component
Location: `src/components/Navigation.tsx`
- Sticky header with search, auth dropdown
- navLinks array: Home, Movies, TV Shows, Watchlist (NOT Watch Together - removed from navbar)
- Mobile menu with hamburger icon

## File Structure Conventions
```
src/
├── app/                    # App Router (pages, layouts)
│   ├── movie/[id]/        # Dynamic movie details
│   ├── tv/[id]/           # Dynamic TV show details  
│   ├── watch-together/    # WebRTC watch party room
│   └── watch-party/       # Legacy redirect page
├── pages/api/             # Pages Router (Socket.IO only)
├── components/            # React components
│   ├── ui/               # Reusable UI primitives (Button, etc.)
│   └── catalog/          # Content-specific (MediaCard, etc.)
├── lib/                   # Utilities
│   ├── tmdb.ts           # TMDb API client
│   ├── videoSources.ts   # Embed provider configs
│   ├── storage.ts        # localStorage helpers
│   └── auth.ts           # NextAuth config + in-memory store
└── types/                 # TypeScript definitions
```

## Common Tasks

### Adding a New Video Source
1. Add to `VIDEO_SOURCES` array in `src/lib/videoSources.ts`
2. Follow pattern: `{ name, quality, embed: (tmdbId, type, season?, episode?) => url }`
3. Test with movie AND TV show (different URL patterns)

### Modifying Socket.IO Events
1. Edit `src/pages/api/socketio.ts` (server-side)
2. Update listener in consuming component (usually `/watch-together/page.tsx`)
3. Pattern: `socket.on('event-name', (data) => { ... })` + corresponding `socket.emit()`

### Adding Authentication to a Page
```typescript
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const { data: session, status } = useSession();
useEffect(() => {
  if (status === 'unauthenticated') router.push('/login');
}, [status, router]);
```

### Debugging WebRTC Issues
1. Open browser DevTools → Console in both peers
2. Check ICE candidate exchange logs: "New ICE candidate" messages
3. Verify STUN server connectivity (Google STUN server by default)
4. Common issue: Firewall blocking UDP - test on same network first

## Styling Conventions
- **Tailwind CSS 4** - utility classes only, no custom CSS files
- Dark theme colors: `bg-gray-950`, `text-white`, `border-gray-800`
- Gradients for CTAs: `bg-gradient-to-r from-blue-600 to-blue-500`
- Responsive: `md:` prefix for desktop, mobile-first base classes
- Icons: Lucide React (`<Play />`, `<Users />`, etc.)

## Testing Strategy
- No automated tests currently - manual QA only
- Test matrix: Movie details, TV episode selection, Watch Together (2 browsers), Search, Watchlist persistence
- Always test in incognito to verify localStorage behavior

## Known Limitations (Document, Don't Fix)
1. Embedded video ads/redirects - third-party provider behavior
2. Room codes lost on server restart - in-memory storage
3. WebRTC requires STUN/TURN for complex NAT - may fail on restricted networks
4. User registration not persistent - in-memory auth store

## Quick Reference

### Port Configuration
Default: `8000` (set in package.json: `next dev --port 8000`)

### Key Dependencies
- `next@15.5.4` - App Router + Pages Router hybrid
- `socket.io@^4.8.1` + `socket.io-client` - Real-time sync
- `next-auth@^5.0.0-beta.29` - JWT-based auth (beta version!)
- `lucide-react` - Icon library
- `tailwindcss@^4` - Styling (v4, not v3!)

### Useful localStorage Keys
- `watchlist` - JSON array of saved content
- `continueWatching` - JSON array with progress %
- `room_{CODE}` - Room metadata for Watch Together
- `watchTogether_username` - Cached username

### Common Socket.IO Events
**Watch Together:**
- `join-watch-together` / `leave-watch-together` - Room management
- `send-chat-message` / `chat-message` - Messaging
- `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate` - WebRTC signaling
- `update-media-status` - Video/audio toggle state

**Watch Party (legacy):**
- `create-party` / `join-party` - Old system (avoid using)

---

## Emergency Fixes

**Socket.IO not connecting:** Check `/api/socketio` returns 200, inspect Network tab for upgrade to WebSocket

**Watch Together modal doesn't open:** Verify login status (`useSession()`), check console for auth redirect

**Video not loading:** Try different server (dropdown in player), check browser console for iframe errors

**WebRTC connection fails:** Check both peers see "Connected to socket", verify ICE candidates exchanged, test on same WiFi network
