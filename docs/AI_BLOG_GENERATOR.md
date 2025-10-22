# AI Blog Generator System - Implementation Guide

This system automatically generates movie/TV blog posts using TMDb + Google Gemini AI.

## Features

✅ Fetch popular movies/TV shows from TMDb  
✅ Generate high-quality blog content using Gemini AI  
✅ Include cast, poster, genres, ratings automatically  
✅ Duplicate detection (checks existing blog posts)  
✅ Customizable number of posts to generate  
✅ Start/Stop control from admin panel  
✅ Production-ready with error handling  

## Architecture

```
┌─────────────────┐
│  Admin Panel    │  Start/Stop controls
│  /admin/blog    │  Configure settings
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js API    │  /api/admin/blog/auto-generate
│  Route Handler  │  Controls Python script
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Python Script  │  blog-generator.py
│  Main Logic     │  - Fetch from TMDb
└────────┬────────┘  - Generate with Gemini
         │           - Post via API
         ▼
┌─────────────────┐
│  TMDb API       │  Movie/TV data
│  Gemini API     │  AI content generation
└─────────────────┘
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd /Users/bibektimilsina/projects/next/egfilm
pip install requests google-generativeai python-dotenv
```

### 2. Add Environment Variables

Add to `.env.local`:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Blog Generator Settings
BLOG_GENERATOR_ADMIN_EMAIL=bibektimilsina000@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:8000
```

Get Gemini API key from: https://aistudio.google.com/app/apikey

### 3. Create Python Script

File: `scripts/blog-generator.py` (see separate file)

### 4. Create API Endpoints

Files:
- `src/app/api/admin/blog/auto-generate/route.ts`
- `src/app/api/admin/blog/auto-generate/status/route.ts`
- `src/app/api/admin/blog/auto-generate/stop/route.ts`

### 5. Create Admin UI Component

File: `src/app/admin/blog/auto-generate/page.tsx`

### 6. Update Admin Sidebar

Add link to Auto-Generate in sidebar navigation

## Usage

### From Admin Panel

1. Navigate to `/admin/blog/auto-generate`
2. Configure settings:
   - Number of posts to generate (1-50)
   - Media type (movies/tv shows)
   - Language preference
3. Click "Start Generating"
4. Monitor progress in real-time
5. Stop anytime with "Stop Generation" button

### Programmatically

```bash
# Manual run
cd scripts
python blog-generator.py --count 10 --type movie

# With custom settings
python blog-generator.py \
  --count 20 \
  --type tv \
  --admin-email your@email.com \
  --api-url http://localhost:8000
```

## How It Works

### 1. Duplicate Detection

```python
# Checks if blog post already exists for this media
existing_posts = requests.get(f"{API_URL}/api/admin/blog?mediaId={movie_id}")
if existing_posts:
    print(f"Skipping {title} - already exists")
    continue
```

### 2. Content Generation

Gemini AI generates:
- SEO-optimized title (50-60 chars)
- Meta description (150-160 chars)
- Engaging excerpt (200-250 chars)
- Full HTML article (1500+ words)
- Relevant keywords and tags
- Category selection

### 3. Data Enrichment

From TMDb:
- Cast members (top 10)
- Genres
- Release dates
- Ratings
- Posters & backdrops
- Overview

### 4. Publication

- Posts to `/api/admin/blog` (CREATE)
- Auto-publishes or saves as draft
- Generates unique slugs
- Calculates reading time

## Safety Features

### Rate Limiting
- Delay between API calls (2-3 seconds)
- Respects TMDb rate limits (40 req/10s)
- Gemini API quota management

### Error Handling
- Retries on failure (max 3 attempts)
- Logs all errors to file
- Continues on single failure
- Graceful shutdown on stop signal

### Data Validation
- Checks required fields before posting
- Validates image URLs
- Sanitizes HTML content
- Ensures unique slugs

## File Structure

```
egfilm/
├── scripts/
│   ├── blog-generator.py          # Main Python script
│   ├── blog-generator.log         # Generated logs
│   └── blog-generator.pid         # Process ID file
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       └── blog/
│   │   │           ├── auto-generate/
│   │   │           │   ├── route.ts      # Start generation
│   │   │           │   ├── status/
│   │   │           │   │   └── route.ts  # Check status
│   │   │           │   └── stop/
│   │   │           │       └── route.ts  # Stop generation
│   │   └── admin/
│   │       └── blog/
│   │           └── auto-generate/
│   │               └── page.tsx          # Admin UI
└── .env.local                            # Environment variables
```

## Monitoring

### Real-time Status

The admin UI shows:
- Current progress (X of Y posts)
- Posts generated successfully
- Posts skipped (duplicates)
- Errors encountered
- Estimated time remaining

### Logs

Check `scripts/blog-generator.log` for detailed logs:
```bash
tail -f scripts/blog-generator.log
```

## Best Practices

### Content Quality

1. **Review Generated Content**: Always review AI-generated posts before publishing
2. **Edit for Brand Voice**: Adjust tone to match your site's style
3. **Add Personal Touch**: Include your own insights or opinions
4. **Verify Facts**: Double-check release dates, cast info, etc.

### SEO Optimization

1. **Unique Titles**: AI generates unique, engaging titles
2. **Meta Tags**: Automatically optimized for search engines
3. **Structured Data**: JSON-LD schemas included
4. **Internal Linking**: Links to movie/TV pages automatically

### Performance

1. **Batch Generation**: Generate during off-peak hours
2. **Limit Frequency**: Don't overwhelm your site with too many posts
3. **Monitor Resources**: Check CPU/memory usage during generation
4. **Database Indexes**: Ensure mediaId, mediaType indexed

## Troubleshooting

### Common Issues

**"Gemini API key invalid"**
- Check your `.env.local` file
- Verify key at https://aistudio.google.com/app/apikey
- Ensure no trailing spaces

**"TMDb rate limit exceeded"**
- Increase delay between requests
- Wait 10 seconds before retrying
- Check your TMDb API usage

**"Script won't stop"**
- Check PID file: `cat scripts/blog-generator.pid`
- Kill manually: `kill $(cat scripts/blog-generator.pid)`
- Remove PID file: `rm scripts/blog-generator.pid`

**"Posts marked as duplicates incorrectly"**
- Clear blog cache: Restart Next.js server
- Check database: `npm run db:studio`
- Verify mediaId matching logic

## Security Considerations

1. **Admin-Only Access**: All endpoints protected with `requireAdminAuth()`
2. **API Key Protection**: Never expose Gemini API key client-side
3. **Rate Limiting**: Prevent abuse with request throttling
4. **Input Validation**: Sanitize all user inputs
5. **Content Moderation**: Review generated content before publishing

## Performance Metrics

Expected generation times (per post):
- TMDb data fetch: ~500ms
- Gemini content generation: ~3-5s
- Blog post creation: ~200ms
- **Total per post**: ~4-6 seconds

For 10 posts: ~1-2 minutes  
For 50 posts: ~5-8 minutes  

## Future Enhancements

- [ ] Schedule automated generation (cron jobs)
- [ ] Multiple AI providers (OpenAI, Claude, etc.)
- [ ] Custom content templates
- [ ] Image generation for featured images
- [ ] Multilingual support
- [ ] Content quality scoring
- [ ] A/B testing different styles
- [ ] Automatic social media posting

## Support

For issues or questions:
1. Check logs: `scripts/blog-generator.log`
2. Review admin panel status
3. Test API endpoints manually
4. Check database for duplicates

## License

Part of Egfilm project. See main README for license info.
