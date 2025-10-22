# TMDb API Key Security Fix

## Problem
The TMDb API key was exposed in the browser console because it was prefixed with `NEXT_PUBLIC_`, making it visible in all client-side API requests.

## Solution
1. **Created API Proxy Route**: `/api/tmdb/[...path]/route.ts`
   - All TMDb requests now go through this server-side proxy
   - API key is never exposed to the browser
   - Includes caching for better performance

2. **Updated Environment Variable**:
   - **Old**: `NEXT_PUBLIC_TMDB_API_KEY` (exposed to client)
   - **New**: `TMDB_API_KEY` (server-side only)

3. **Updated Client Library**: `src/lib/tmdb.ts`
   - Changed baseURL from TMDb direct to `/api/tmdb`
   - Removed API key parameter (handled by proxy)

## What You Need to Do

### 1. Update Your `.env.local` File
```bash
# OLD (remove this line)
NEXT_PUBLIC_TMDB_API_KEY=your_key_here

# NEW (add this line)
TMDB_API_KEY=your_key_here
```

### 2. Update Server Environment Variables
If deploying, update your production environment variables:
- In GitHub Actions secrets: Change `TMDB_API_KEY` (not `NEXT_PUBLIC_TMDB_API_KEY`)
- In your server `.env`: Use `TMDB_API_KEY`
- In Docker Compose: Update the environment variable name

### 3. Restart Your Development Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Benefits
✅ **Security**: API key is never exposed to browser
✅ **Caching**: Server-side caching improves performance
✅ **Rate Limiting**: Easier to implement rate limiting on proxy
✅ **Monitoring**: Better control over API usage

## Technical Details

### Before (Insecure)
```
Browser → https://api.themoviedb.org/3/movie/popular?api_key=YOUR_KEY_HERE
         ↑ API key visible in browser console ❌
```

### After (Secure)
```
Browser → /api/tmdb/movie/popular (no key)
          ↓
Server Proxy → https://api.themoviedb.org/3/movie/popular?api_key=YOUR_KEY_HERE
                ↑ API key hidden on server ✅
```

## Files Changed
- ✅ `src/app/api/tmdb/[...path]/route.ts` - New API proxy
- ✅ `src/lib/tmdb.ts` - Updated to use proxy
- ✅ `.env.local.example` - Updated variable name
- ✅ `check-env.js` - Updated validation
- ✅ `src/lib/services/blogGeneratorService.ts` - Updated error messages

## Backward Compatibility
⚠️ **Breaking Change**: You must update your environment variables or the app will not work.

The old `NEXT_PUBLIC_TMDB_API_KEY` will no longer work because:
1. Client-side code now uses the proxy
2. Server-side code looks for `TMDB_API_KEY`

## Testing
After updating, verify:
1. Movies and TV shows load correctly
2. Search works
3. Open browser console → Network tab
4. Check TMDb requests → API key should NOT be visible ✅
