# AI Blog Generator - Setup & Usage Guide

## Overview
The AI Blog Generator automatically creates high-quality blog posts by fetching popular movies/TV shows from TMDb and generating engaging content using Google Gemini AI.

## Features
- ✅ Fetch popular content from TMDb (movies or TV shows)
- ✅ AI-generated blog content using Google Gemini 1.5 Flash
- ✅ Automatic duplicate detection (checks by TMDb ID)
- ✅ SEO-optimized titles, meta descriptions, and keywords
- ✅ Cast information and media metadata
- ✅ Featured images from TMDb backdrops
- ✅ Real-time progress tracking
- ✅ Background generation (non-blocking)
- ✅ Start/Stop controls
- ✅ Error handling and retry logic

## Setup Instructions

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add to `.env.local`:

```bash
# Google Gemini API (for AI blog generation)
GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Keep this key secret! Never commit it to version control.

### 2. Verify Dependencies

The required package is already installed:
```bash
npm install @google/generative-ai
```

### 3. Database Schema

The BlogPost model already has all required fields:
- `mediaId` - TMDb ID (for duplicate detection)
- `mediaType` - 'movie' or 'tv'
- `mediaCast` - Array of cast member names
- `mediaTitle`, `mediaPosterPath`, `mediaBackdropPath`, etc.

If you need to update the schema:
```bash
npx prisma db push
```

## Usage

### Accessing the Generator

1. Log in as an admin user
2. Navigate to **Admin → Blog Posts**
3. Click the **"AI Auto-Generate"** button (purple button with lightning icon)

### Generating Blog Posts

1. **Select Media Type:** Choose between Movies or TV Shows
2. **Set Count:** Choose how many posts to generate (1-50)
3. **Click "Start Generation"**

The system will:
- Fetch popular content from TMDb
- Check for duplicates (skip if already exists)
- Generate AI content for each item
- Create and publish blog posts automatically

### Monitoring Progress

The status panel shows:
- **Progress Bar:** Overall completion percentage
- **Current Item:** Which movie/TV show is being processed
- **Statistics:**
  - Total: Number of posts to generate
  - Created: Successfully created posts
  - Skipped: Duplicates that were skipped
  - Failed: Posts that encountered errors
- **Errors:** Detailed error messages if any failures occur

### Stopping Generation

Click the **"Stop Generation"** button to gracefully stop the process after the current item completes.

## How It Works

### 1. Fetch Popular Media
- Calls TMDb API to get popular movies/TV shows
- Uses pagination to fetch enough items
- Gets detailed info including cast, genres, ratings

### 2. Check for Duplicates
- Queries database for existing posts with same `mediaId`
- Skips if duplicate found (prevents creating same post twice)

### 3. Generate Content with AI
- **Main Content:** Gemini generates 800-1200 word review
  - Engaging introduction
  - Plot discussion (no major spoilers)
  - Performance and direction analysis
  - Recommendation and conclusion
  - HTML formatted with proper headings
  
- **Meta Content:** Gemini generates
  - SEO-optimized title (50-60 chars)
  - Meta description (150-160 chars)
  - Excerpt (200-250 chars)
  - 5-7 relevant keywords
  - 3-5 tags

### 4. Create Blog Post
- Calculates reading time
- Generates unique slug
- Sets featured/OG images from TMDb backdrop
- Auto-publishes with current timestamp

## API Endpoints

### Start Generation
```
POST /api/admin/blog/auto-generate
Body: { count: number, type: 'movie' | 'tv' }
Response: { success: true, message: string }
```

### Get Status
```
GET /api/admin/blog/auto-generate/status
Response: { 
  success: true, 
  status: {
    isRunning: boolean,
    total: number,
    completed: number,
    failed: number,
    skipped: number,
    currentMovie?: string,
    errors: string[]
  }
}
```

### Stop Generation
```
POST /api/admin/blog/auto-generate/stop
Response: { success: true, message: string }
```

## Rate Limiting & Performance

### Built-in Delays
- **250ms** between TMDb API calls (fetching media list)
- **2 seconds** between each blog post generation (to respect API limits)

### API Limits
- **TMDb:** 40 requests per 10 seconds (we're well under this)
- **Gemini:** 15 RPM (requests per minute) on free tier
  - With 2-second delays, we make ~20 posts/minute
  - Consider upgrading Gemini API for higher limits

### Background Processing
- Generation runs in background
- You can navigate away and return later
- Progress is maintained in memory (lost on server restart)

## Troubleshooting

### "GEMINI_API_KEY is not set" Error
**Solution:** Add your API key to `.env.local` and restart the dev server:
```bash
GEMINI_API_KEY=your_actual_key_here
npm run dev
```

### "Generation is already running" Error
**Solution:** Wait for current generation to finish or click "Stop Generation" first.

### TMDb API Errors
**Solution:** 
- Check `NEXT_PUBLIC_TMDB_API_KEY` is set correctly
- Verify TMDb API is accessible
- Check if you've hit rate limits (wait a minute and retry)

### Gemini API Errors
**Possible causes:**
- Invalid API key
- Rate limit exceeded (wait and retry)
- API quota exhausted (check Google Cloud Console)

**Solutions:**
- Verify API key is correct
- Reduce count or increase delays
- Upgrade to paid Gemini API tier

### Duplicate Detection Not Working
**Solution:** Verify `mediaId` and `mediaType` are being saved correctly:
```sql
SELECT "mediaId", "mediaType", title FROM "BlogPost" WHERE "mediaId" IS NOT NULL;
```

### Generated Content Quality Issues
**Solution:** The prompt can be adjusted in `/src/lib/services/blogGeneratorService.ts`:
- Modify the `generateBlogContent()` function
- Update the prompt to be more specific
- Change tone, length, or format requirements

## Production Deployment

### Environment Variables
Ensure these are set in production:
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_TMDB_API_KEY=...
GEMINI_API_KEY=...
AUTH_SECRET=...
```

### Considerations
1. **In-memory state:** Current status is lost on server restart
   - For production, consider Redis or database storage
   
2. **Concurrent requests:** Only one generation can run at a time
   - Consider job queue system for multiple admins
   
3. **Long-running processes:** Generation can take several minutes
   - Ensure server timeout settings allow for this
   
4. **API costs:** Monitor Gemini API usage
   - Free tier: 15 RPM, 1500 RPD (requests per day)
   - Paid tier: Higher limits available

## Future Enhancements

### Potential Improvements
- [ ] Save generation state to database (persist across restarts)
- [ ] Queue system for multiple concurrent generations
- [ ] Scheduling (daily auto-generation)
- [ ] Custom prompts per generation
- [ ] Multi-language support
- [ ] A/B testing different AI models
- [ ] Webhook notifications on completion
- [ ] Integration with content calendar
- [ ] Draft mode (review before publishing)
- [ ] Bulk editing of generated posts

### Code Locations
- **Service:** `/src/lib/services/blogGeneratorService.ts`
- **API Routes:** `/src/app/api/admin/blog/auto-generate/`
- **Admin UI:** `/src/app/admin/blog/auto-generate/page.tsx`

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in the status panel
3. Check browser console for client-side errors
4. Check server logs for backend errors
5. Verify all environment variables are set correctly

## Best Practices

1. **Start Small:** Test with 5-10 posts first
2. **Monitor Errors:** Check error panel for issues
3. **Verify Quality:** Review first few generated posts
4. **Check Duplicates:** Ensure duplicate detection works
5. **API Keys:** Keep keys secure, never commit to git
6. **Rate Limits:** Don't generate too many at once
7. **Content Review:** AI-generated content should be reviewed
8. **SEO Check:** Verify meta descriptions and keywords are good

## Example Workflow

1. **First Time Setup:**
   - Get Gemini API key
   - Add to `.env.local`
   - Restart dev server
   - Test with 3 posts

2. **Regular Usage:**
   - Login as admin
   - Go to AI Auto-Generate
   - Select type: Movies
   - Set count: 10
   - Click Start
   - Monitor progress
   - Review generated posts

3. **Content Management:**
   - Check generated posts in blog list
   - Edit if needed (title, excerpt, content)
   - Verify images loaded correctly
   - Check links to movie/TV pages work

Enjoy automated blog generation! 🚀
