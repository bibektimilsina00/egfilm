# Quick Start Guide - BullMQ Blog Generation

## ✅ What's Been Implemented

### 1. **Complete BullMQ Integration**
   - Queue system for background job processing
   - Worker process for executing jobs
   - Redis-based persistence (jobs survive restarts)
   - Automatic retries with exponential backoff

### 2. **Multi-AI Provider Support**
   - **Google Gemini**: 3 models (Flash, Pro, 2.0 Experimental)
   - **OpenAI**: 4 models (GPT-4o, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo)
   - **Anthropic**: 3 Claude models (3.5 Sonnet, 3 Opus, 3 Sonnet)

### 3. **User-Specific API Keys**
   - Database storage (encrypted, per-user)
   - Settings UI at `/admin/settings/ai`
   - Fallback to environment variables
   - Visual key status indicators

### 4. **Enhanced UI**
   - **AI Settings Page**: Configure API keys and preferred model
   - **Auto-Generate Page**: AI model selector with real-time API key validation
   - Direct links between pages
   - Warning messages for missing API keys

### 5. **Updated Database Schema**
   - Added to User model:
     - `geminiApiKey`
     - `openaiApiKey`  
     - `anthropicApiKey`
     - `preferredAiModel`

## 🚀 Quick Start (Development)

### Step 1: Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Step 2: Update Database

```bash
npm run db:push
```

### Step 3: Start Services

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - BullMQ Worker:**
```bash
npm run worker:dev
```

### Step 4: Configure AI

1. Open http://localhost:8000/admin/settings/ai
2. Get an API key:
   - Gemini (Free): https://makersuite.google.com/app/apikey
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys
3. Paste key and select preferred model
4. Click "Save Settings"

### Step 5: Generate Blogs

1. Go to http://localhost:8000/admin/blog/auto-generate
2. Select AI model (or use your preferred default)
3. Configure generation settings
4. Click "Start Generation"
5. Watch real-time logs!

## 📁 Files Created/Modified

### New Files:
```
src/
├── lib/
│   ├── ai/
│   │   └── aiModels.ts                    # AI model configurations
│   ├── queue/
│   │   ├── blogQueue.ts                   # BullMQ queue setup
│   │   └── blogWorker.ts                  # Worker process
│   └── services/
│       └── blogGeneratorService.ts        # Updated with AI support
├── app/
│   ├── api/
│   │   └── user/
│   │       └── ai-settings/
│   │           └── route.ts               # API for saving/loading settings
│   └── admin/
│       └── settings/
│           └── ai/
│               └── page.tsx               # AI settings UI
worker.ts                                   # Standalone worker script
docs/BULLMQ_SETUP.md                       # Complete documentation
```

### Modified Files:
```
prisma/schema.prisma                        # Added API key fields
src/app/admin/blog/page.tsx                # Added AI Settings button
src/app/admin/blog/auto-generate/page.tsx # Added model selector
src/app/api/admin/blog/auto-generate/route.ts # Uses BullMQ
package.json                                # Added worker scripts
.env.local                                  # Added Redis config
```

## 🎯 How It Works

```
User Action
    ↓
[Next.js API] → Adds job to queue
    ↓
[BullMQ Queue] ← Redis (persists job)
    ↓
[Worker Process] → Picks up job
    ↓
[AI Provider] → Generates content
    ↓
[Database] → Saves blog post
    ↓
[Status API] → Updates UI
```

## 🧪 Testing

### 1. Test AI Settings
```bash
# Should return 401 (not logged in)
curl http://localhost:8000/api/user/ai-settings

# Login as admin first, then:
curl http://localhost:8000/api/user/ai-settings \
  -H "Cookie: your-session-cookie"
```

### 2. Test Job Queue
```bash
# Start generation via UI, then check Redis:
redis-cli
> KEYS *
> HGETALL bull:blog-generation:*
```

### 3. Monitor Worker
Watch Terminal 2 for:
```
🚀 Blog Generation Worker Started
🔄 [Worker] Processing job blog-gen-...
✅ [Worker] Completed job blog-gen-...
```

## 🔧 Environment Variables

### Required:
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_key
```

### Redis (BullMQ):
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=              # Optional
```

### AI Keys (Optional - can be set per-user):
```bash
GEMINI_API_KEY=              # Fallback if user hasn't configured
OPENAI_API_KEY=              # Fallback
ANTHROPIC_API_KEY=           # Fallback
```

## 📊 Monitoring

### Queue Metrics:
```typescript
import { getQueueMetrics } from '@/lib/queue/blogQueue';
const { waiting, active, completed, failed } = await getQueueMetrics();
```

### User Jobs:
```typescript
import { getUserJobs } from '@/lib/queue/blogQueue';
const jobs = await getUserJobs(userId);
```

### Worker Health:
- Check Terminal 2 output
- Should see "Worker is ready and waiting for jobs..."
- Jobs should process with "🔄 Processing" → "✅ Completed"

## 🐛 Common Issues

### Issue: "Cannot connect to Redis"
**Solution:**
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# If not running:
brew services start redis  # macOS
sudo systemctl start redis # Linux
docker start redis         # Docker
```

### Issue: "No API key found"
**Solution:**
1. Go to `/admin/settings/ai`
2. Enter your API key
3. Click Save
4. Try generating again

### Issue: Worker not processing jobs
**Solution:**
```bash
# Restart worker
# Terminal 2: Ctrl+C, then:
npm run worker:dev
```

### Issue: Jobs stuck in "waiting"
**Solution:**
1. Check worker is running (Terminal 2)
2. Check Redis connection
3. Restart worker if needed

## 🎉 Features Completed

✅ BullMQ queue with Redis persistence  
✅ Standalone worker process  
✅ Multiple AI providers (Gemini, OpenAI, Claude)  
✅ User-specific API key storage  
✅ AI Settings UI  
✅ Model selector in generation UI  
✅ Real-time progress tracking  
✅ Automatic retries on failure  
✅ Database migrations  
✅ Scripts in package.json  
✅ Complete documentation  

## 📚 Documentation

- **Complete Guide**: `docs/BULLMQ_SETUP.md`
- **This Quickstart**: `docs/QUICKSTART.md`

## 🚦 Next Steps

1. **Start Redis** (see Step 1 above)
2. **Run migrations** (`npm run db:push`)
3. **Start Next.js** (`npm run dev`)
4. **Start worker** (`npm run worker:dev`)
5. **Configure AI keys** (visit `/admin/settings/ai`)
6. **Generate blogs** (visit `/admin/blog/auto-generate`)

---

**Need Help?**
- Check `docs/BULLMQ_SETUP.md` for detailed info
- Review worker logs in Terminal 2
- Verify Redis is running: `redis-cli ping`
- Ensure API keys are configured

**Ready to go! 🎬**
