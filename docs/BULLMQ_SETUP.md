# BullMQ Blog Generation System

## Overview
The blog generation system has been completely refactored to use **BullMQ** for background job processing with Redis persistence. This enables:

- ✅ **Persistent job queue** (survives server restarts)
- ✅ **Multiple AI model support** (Gemini, OpenAI GPT, Anthropic Claude)
- ✅ **User-specific API keys** (stored securely in database)
- ✅ **Automatic retries** on failures
- ✅ **Progress tracking** with detailed logs
- ✅ **Scalable workers** (can run multiple workers)

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (API Routes)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BullMQ Queue   │◄─────── Redis (Persistent Storage)
│  (Job Manager)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BullMQ Worker  │
│ (Job Processor) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Providers   │
│ Gemini/GPT/etc  │
└─────────────────┘
```

## Setup Instructions

### 1. Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
Download from https://redis.io/download or use Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 2. Configure Environment Variables

Add to `.env.local`:
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI API Keys (Optional - can be configured per-user)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Run Database Migrations

```bash
npm run db:generate
npm run db:push  # or db:migrate
```

This adds the following fields to the User model:
- `geminiApiKey`
- `openaiApiKey`
- `anthropicApiKey`
- `preferredAiModel`

### 4. Start the Application

**Development Mode:**

Terminal 1 - Next.js Server:
```bash
npm run dev
```

Terminal 2 - BullMQ Worker:
```bash
npm run worker:dev
```

**Production Mode:**
```bash
# Build
npm run build

# Terminal 1 - Next.js
npm start

# Terminal 2 - Worker
npm run worker
```

## User Workflow

### 1. Configure AI Settings

1. Navigate to **Admin → AI Settings** (`/admin/settings/ai`)
2. Select your preferred AI model:
   - **Gemini 1.5 Flash** - Fast and efficient (free tier available)
   - **Gemini 1.5 Pro** - Most capable Google model
   - **GPT-4o** - Latest OpenAI model
   - **GPT-4 Turbo** - Large context window
   - **Claude 3.5 Sonnet** - Latest Anthropic model
3. Enter your API key(s):
   - Gemini: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - OpenAI: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Anthropic: Get from [Anthropic Console](https://console.anthropic.com/settings/keys)
4. Click **Save Settings**

### 2. Generate Blog Posts

1. Navigate to **Admin → Blog → AI Auto-Generate**
2. Configure generation:
   - **AI Model**: Select from dropdown (defaults to your preference)
   - **Generation Mode**: Batch or Continuous
   - **Content Source**: Popular, Top Rated, Trending, etc.
   - **Media Type**: Movies or TV Shows
   - **Count**: 1-50 posts
   - **Advanced Filters**: Rating, year range, adult content
3. Click **Start Generation**
4. Monitor real-time logs and progress

## API Endpoints

### User Settings
- `GET /api/user/ai-settings` - Get user's AI configuration
- `POST /api/user/ai-settings` - Save AI settings and API keys

### Blog Generation
- `POST /api/admin/blog/auto-generate` - Start generation (adds job to queue)
- `GET /api/admin/blog/auto-generate/status` - Get generation status
- `POST /api/admin/blog/auto-generate/stop` - Stop generation

## Available AI Models

### Google Gemini
- `gemini-1.5-flash` - Fast, efficient, 8K tokens
- `gemini-1.5-pro` - Most capable, 8K tokens
- `gemini-2.0-flash-exp` - Experimental, latest features

### OpenAI
- `gpt-4o` - Latest GPT-4 optimized, 16K tokens
- `gpt-4-turbo` - Large context, 128K tokens
- `gpt-4` - Original GPT-4, 8K tokens
- `gpt-3.5-turbo` - Fast and cost-effective, 16K tokens

### Anthropic Claude
- `claude-3-5-sonnet-20241022` - Latest Claude, excellent creative writing
- `claude-3-opus-20240229` - Most powerful Claude
- `claude-3-sonnet-20240229` - Balanced performance

## Job Queue Management

### Monitor Queue Status
```typescript
import { getQueueMetrics } from '@/lib/queue/blogQueue';

const metrics = await getQueueMetrics();
// {
//   waiting: 2,
//   active: 1,
//   completed: 50,
//   failed: 3,
//   delayed: 0
// }
```

### View User's Jobs
```typescript
import { getUserJobs } from '@/lib/queue/blogQueue';

const jobs = await getUserJobs(userId);
```

### Cancel a Job
```typescript
import { cancelJob } from '@/lib/queue/blogQueue';

await cancelJob(jobId);
```

## Monitoring & Debugging

### Worker Logs
The worker outputs detailed logs:
```
🚀 Blog Generation Worker Started
📊 Processing jobs from blog-generation queue
🔌 Connected to Redis at localhost

✅ Worker is ready and waiting for jobs...

🔄 [Worker] Processing job blog-gen-user123-1698765432
✅ [Worker] Completed job blog-gen-user123-1698765432
```

### Job States
- `waiting` - Queued, not yet processed
- `active` - Currently being processed
- `completed` - Successfully finished
- `failed` - Error occurred (will retry)
- `delayed` - Scheduled for future execution

### Error Handling
- Jobs automatically retry up to 3 times with exponential backoff
- Failed jobs are kept for debugging
- Detailed error logs in worker output

## Scaling & Production

### Multiple Workers
Run multiple worker processes for parallel processing:
```bash
# Terminal 1
npm run worker

# Terminal 2  
npm run worker

# Terminal 3
npm run worker
```

Each worker can process 2 jobs concurrently (configurable in `blogWorker.ts`).

### Redis Configuration for Production
```bash
# .env.production
REDIS_HOST=your-redis-server.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
```

### Docker Deployment
```dockerfile
# docker-compose.yml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
  
  nextjs:
    build: .
    depends_on:
      - redis
    environment:
      - REDIS_HOST=redis
  
  worker:
    build: .
    command: npm run worker
    depends_on:
      - redis
    environment:
      - REDIS_HOST=redis

volumes:
  redis-data:
```

## Troubleshooting

### Worker Not Processing Jobs
1. Check Redis is running: `redis-cli ping` (should return `PONG`)
2. Check worker logs for errors
3. Verify environment variables
4. Restart worker: `npm run worker`

### API Key Errors
1. Verify key is saved in **AI Settings**
2. Check key has correct permissions
3. Verify billing is active for paid APIs
4. Check rate limits aren't exceeded

### Job Stuck in "waiting"
1. Ensure worker is running
2. Check worker logs for crashes
3. Verify Redis connection
4. Restart worker if needed

### Generation Failures
1. Check API key is valid
2. Verify rate limits
3. Check TMDb API is accessible
4. Review detailed error logs in worker output

## Migration from Old System

The old in-memory system still works but jobs will be lost on restart. To migrate:

1. **Stop using continuous mode** - Use batch mode with scheduled jobs instead
2. **Configure API keys** - Move from environment variables to user settings
3. **Start the worker** - Run `npm run worker` or `npm run worker:dev`
4. **Monitor jobs** - Check worker logs for successful processing

## Benefits Over Old System

| Feature | Old (In-Memory) | New (BullMQ) |
|---------|----------------|--------------|
| Persistence | ❌ Lost on restart | ✅ Survives restarts |
| Scaling | ❌ Single process | ✅ Multiple workers |
| Monitoring | ⚠️ Basic logs | ✅ Detailed metrics |
| Retries | ❌ Manual | ✅ Automatic |
| AI Models | ⚠️ Gemini only | ✅ Gemini, GPT, Claude |
| API Keys | ⚠️ Environment only | ✅ Per-user database |
| Progress | ⚠️ Polling status | ✅ Real-time updates |

## Advanced Configuration

### Worker Concurrency
Edit `src/lib/queue/blogWorker.ts`:
```typescript
concurrency: 2, // Process 2 jobs at once
```

### Rate Limiting
```typescript
limiter: {
  max: 10,        // Max 10 jobs
  duration: 60000 // Per 1 minute
}
```

### Job Retention
```typescript
removeOnComplete: 100,  // Keep last 100 completed
removeOnFail: false,    // Keep all failed for debugging
```

### Custom Job Priorities
```typescript
await blogQueue.add('generate', data, {
  priority: 1, // Lower number = higher priority
});
```

## Support

For issues or questions:
- Check logs first (worker + Next.js console)
- Verify Redis is running and accessible
- Ensure API keys are configured
- Review this documentation

Happy blogging! 🚀
