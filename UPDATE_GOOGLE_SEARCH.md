# Update Google Search Results for Egfilm

## Current Issue
Google is showing old cached data:
- Title: "StreamFlix - Discover Movies & TV Shows"  
- Description: Old description

## Your Current Correct Metadata
- Title: "Egfilm - Watch Movies & TV Shows Online Free"
- Description: "Watch movies and TV shows online free. Stream unlimited content..."

## Steps to Update Google (In Order)

### 1. Google Search Console - Request Indexing (FASTEST)
1. Go to: https://search.google.com/search-console
2. Select property: `egfilm.xyz`
3. Use **URL Inspection Tool** (top search bar)
4. Enter: `https://egfilm.xyz`
5. Click **"Request Indexing"**
6. Wait 2-24 hours for update

### 2. Submit/Resubmit Sitemap
1. In Google Search Console
2. Go to: **Sitemaps** (left sidebar)
3. Remove old sitemap if exists
4. Add new sitemap: `https://egfilm.xyz/sitemap.xml`
5. Click **Submit**

### 3. Update Structured Data (Already Done)
✅ Your site already has proper structured data in:
- `/src/app/layout.tsx` - OpenGraph, Twitter cards
- `/src/lib/seo.ts` - Site configuration

### 4. Force Cache Refresh (Optional)
Use Google's cache removal tool:
1. Go to: https://search.google.com/search-console
2. Navigate to: **Removals** → **Temporary Removals**
3. Select: **Outdated Content**
4. Enter URL: `https://egfilm.xyz`

### 5. Bing/Other Search Engines
- Bing Webmaster Tools: https://www.bing.com/webmasters
- Submit sitemap: `https://egfilm.xyz/sitemap.xml`

## Timeline
- **Immediate**: Request indexing (takes effect in 2-24 hours)
- **Normal crawl**: 3-7 days without manual request
- **Full update**: Up to 2 weeks for all search results

## Verify Update
Check if Google sees your new title:
```
site:egfilm.xyz
```
Search this in Google to see how your site appears.

## Files Already Updated
✅ `/public/robots.txt` - Sitemap URL updated to egfilm.xyz
✅ `/src/app/layout.tsx` - Proper Egfilm metadata
✅ `/src/lib/seo.ts` - Site config with Egfilm branding

## Pro Tips
1. **Social Media Cards**: Test how your site looks on social:
   - Twitter: https://cards-dev.twitter.com/validator
   - Facebook: https://developers.facebook.com/tools/debug/
   
2. **Rich Results Test**: Verify structured data:
   - https://search.google.com/test/rich-results
   - Enter: https://egfilm.xyz

3. **Monitor Changes**: Use Google Search Console "Performance" tab to see when Google picks up new title/description

## Important Note
If you recently changed your domain from another name to egfilm.xyz, you may need to:
1. Set up 301 redirects from old domain
2. Update all old domain references
3. Submit change of address in Search Console (if applicable)
