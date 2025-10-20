# 🎬 Egfilm -## ✨ Features

- **📺 Continue Watching** - Pick up where you left off with progress tracking

  **A Next.js 15 streaming platform with embedded video playback, real-time Watch Together via WebRTC, and NextAuth authentication**- **🎬 Movie Details** - Comprehensive information with cast, trailers, and similar content

- **📺 TV Show Details** - Episode guides, seasons, and cast information

</div>- **🎨 Beautiful UI** - Dark theme with smooth animations and gradients

- **📱 Fully Responsive** - Perfect experience on all devices

---

### 🎪 Browse & Discover

## ✨ Features- **Trending Movies** - See what's hot this week

- **Trending TV Shows** - Popular series trending now

### 🎯 Core Features- **Popular Content** - Most viewed movies and shows

- **🎥 Multi-Server Embedded Player** - 5 video sources (VidSrc, VidSrc Pro, VidSrc.to, 2Embed, SuperEmbed)- **Top Rated** - Highest rated content of all time

- **👥 Watch Together** - Real-time video/voice calling with WebRTC and Socket.IO- **Genre Filtering** - Browse by your favorite genres

- **🔐 Authentication** - NextAuth v5 with PostgreSQL + Prisma ORM- **Smart Categories** - Popular, Top Rated, and Trending tabs

- **📺 Episode Selection** - Intuitive season/episode picker for TV shows

- **🔍 Advanced Search** - Real-time search with trending fallback### 🎬 Video Player Features

- **💝 Watchlist** - Persistent saved content per user- **Server Switching** - Switch between video sources if one doesn't work

- **📺 Continue Watching** - Resume playback with progress tracking- **Fullscreen Mode** - Immersive viewing experience

- **🎨 Beautiful UI** - Dark theme with smooth animations- **HD Quality** - High-definition streaming from multiple providers

- **📱 Fully Responsive** - Mobile-first design- **TV Episode Selection** - Pick any season and episode

- **Clean Interface** - Distraction-free player with intuitive controls

### 👥 Watch Together Features

- **Video/Voice Calling** - WebRTC peer-to-peer connections### 👥 Watch Together Features

- **Real-time Chat** - Text messaging with participants- **Video Calling** - See your friends while watching with WebRTC

- **Room Codes** - Easy 6-digit join codes- **Voice Chat** - Talk to friends during the movie

- **Media Controls** - Toggle video/audio streams- **Real-time Chat** - Text chat with participants

- **Participant Management** - See and invite users- **Room Codes** - Easy 6-digit codes to join

- **User Invites** - Search and invite specific users

## 🚀 Quick Start- **Participant List** - See everyone in the room

- **Media Controls** - Toggle video/audio anytime

```bash- **Synchronized Playback** - Everyone watches at the same timeovie & TV Streaming Platform

# 1. Clone repository

git clone https://github.com/bibektimilsina00/stream-flix.git<div align="center">

cd stream-flix  

  ![StreamFlix](https://img.shields.io/badge/StreamFlix-v2.0-blue?style=for-the-badge)

# 2. Install dependencies  ![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)

npm install  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

  ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

# 3. Setup environment variables

cp .env.example .env.local  **A beautiful, feature-rich streaming platform built with Next.js and TMDb API**

# Edit .env.local with your keys

</div>

# 4. Setup database

npm run db:generate  # Generate Prisma client---

npm run db:migrate   # Run migrations

## ✨ Features

# 5. Start development server

npm run dev          # Runs on port 8000### 🎯 Core Features

```- **🎥 Embedded Video Player** - Stream movies and TV shows with multiple server options

- **� Multi-Server Support** - 5 different video sources for reliability (VidSrc, 2Embed, SuperEmbed, etc.)

Visit `http://localhost:8000` to see your app!- **📺 Episode Selection** - Easy season and episode picker for TV shows

- **�🔍 Advanced Search** - Instant search with trending content fallback

### Default Credentials- **💝 Watchlist** - Save your favorite movies and TV shows

- **Email:** demo@example.com- **📺 Continue Watching** - Pick up where you left off with progress tracking

- **Password:** demo123- **🎬 Movie Details** - Comprehensive information with cast, trailers, and similar content

- **📺 TV Show Details** - Episode guides, seasons, and cast information

## 🔑 Required Environment Variables- **🎨 Beautiful UI** - Dark theme with smooth animations and gradients

- **📱 Fully Responsive** - Perfect experience on all devices

Create `.env.local` in project root:

### 🎪 Browse & Discover

```env- **Trending Movies** - See what's hot this week

# Database (Required)- **Trending TV Shows** - Popular series trending now

DATABASE_URL=postgresql://user:password@localhost:5432/streamflix- **Popular Content** - Most viewed movies and shows

- **Top Rated** - Highest rated content of all time

# TMDb API (Required)- **Genre Filtering** - Browse by your favorite genres

NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key- **Smart Categories** - Popular, Top Rated, and Trending tabs



# NextAuth (Required)### 🎬 Video Player Features

NEXTAUTH_SECRET=your_secret_here  # Generate: openssl rand -base64 32- **Server Switching** - Switch between video sources if one doesn't work

NEXTAUTH_URL=http://localhost:8000- **Fullscreen Mode** - Immersive viewing experience

- **HD Quality** - High-definition streaming from multiple providers

# Optional Services- **TV Episode Selection** - Pick any season and episode

SENTRY_DSN=your_sentry_dsn                      # Error tracking- **Clean Interface** - Distraction-free player with intuitive controls

NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_id      # Analytics

```## 🚀 Quick Start



### Getting TMDb API Key```bash

# Install dependencies

1. Visit [The Movie Database](https://www.themoviedb.org/)npm install

2. Create free account → Settings → API

3. Request API key (instant approval)# Create .env.local file

4. Copy to `.env.local`echo "NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here" > .env.local



## 🏗️ Architecture# Run development server

npm run dev

### Tech Stack```

- **Next.js 15.5.4** - Hybrid App Router + Pages Router

- **TypeScript 5** - Type-safe developmentVisit `http://localhost:3000` to see your app!

- **Tailwind CSS 4** - Utility-first styling

- **PostgreSQL + Prisma** - Database and ORM## 🔑 Getting TMDb API Key

- **NextAuth v5** - JWT-based authentication

- **Socket.IO** - Real-time WebSocket communication1. Go to [The Movie Database](https://www.themoviedb.org/)

- **WebRTC** - Peer-to-peer video/voice2. Create a free account

3. Go to Settings → API

### Project Structure4. Request an API key (it's free!)

```5. Copy your API key to `.env.local`

src/

├── app/                    # App Router (pages, layouts)## 📱 Routes

│   ├── movie/[id]/        # Dynamic movie details

│   ├── tv/[id]/           # Dynamic TV show details- `/` - Homepage with hero and trending content

│   ├── watch-together/    # WebRTC watch party- `/movies` - Movies catalog with filters

│   └── api/               # App Router API routes- `/tv` - TV shows catalog with filters

├── pages/api/             # Pages Router (Socket.IO only)- `/movie/[id]` - Individual movie details

│   └── socketio.ts        # Socket.IO endpoint- `/tv/[id]` - Individual TV show details

├── components/            # React components- `/search?q=query` - Search results

│   ├── ui/               # Reusable primitives- `/watchlist` - User's saved content

│   └── catalog/          # Content-specific

├── lib/                   # Utilities and services## 🎯 New Features

│   ├── tmdb.ts           # TMDb API client

│   ├── videoSources.ts   # Embed providers### Watchlist System

│   ├── prisma.ts         # Database clientSave your favorite movies and TV shows for later. Access from any page via the heart button!

│   ├── auth.ts           # NextAuth config

│   └── services/         # Business logic### Continue Watching

└── types/                 # TypeScript definitionsAutomatically tracks what you're watching with progress bars on the homepage.

```

### Advanced Search

## 🎯 Key Features ExplainedBeautiful search page with trending content shown when idle and instant results as you type.



### Video Playback### Enhanced Details

- Uses **third-party embed providers** in iframes (no custom player)- Compact cast grid (up to 16 members)

- 5 server options for redundancy- Watchlist integration

- Automatic server switching via dropdown- Share functionality

- Movies: `/embed/movie/{tmdbId}`- Similar content recommendations

- TV: `/embed/tv/{tmdbId}/{season}/{episode}`

## 💾 Data Storage

### Watch Together System

**Main Flow:**All data is stored locally in your browser:

1. Movie/TV page → "Watch Together" button- No login required

2. Modal → Create/Join room- No external database

3. Navigate to `/watch-together?room=CODE`- Privacy-focused

4. WebRTC connections establish- Works offline (after initial load)

5. Video calling + chat + synchronized playback

## 🎨 Tech Stack

**Socket.IO Events:**

- `join-watch-together` / `leave-watch-together`- **Next.js 15.5.4** - React framework with App Router

- `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate`- **TypeScript** - Type-safe development

- `send-chat-message` / `chat-message`- **Tailwind CSS 4** - Utility-first styling

- `update-media-status`- **TMDb API** - Movie and TV data

- **Socket.IO** - Real-time synchronization for Watch Together

### Database Schema- **localStorage** - Client-side persistence

```prisma

model User {## 📄 License

  email        String   @unique

  password     StringMIT License - Free to use for personal or commercial projects

  name         String

  watchlist    Watchlist[]---

  continueWatching ContinueWatching[]

}<div align="center">

  

model Watchlist {  **Built with ❤️ using Next.js and TMDb API**

  user         User  

  mediaId      String  ⭐ Star this repo if you find it useful!

  mediaType    String  // 'movie' or 'tv'

  title        String</div>

  posterPath   String?

}## Getting Started



model ContinueWatching {First, run the development server:

  user         User

  mediaId      String```bash

  progress     Float   // 0-100npm run dev

  lastWatched  DateTime# or

}yarn dev

# or

model WatchRoom {pnpm dev

  roomCode     String   @unique# or

  hostEmail    Stringbun dev

  participants String[]```

  embedUrl     String

  createdAt    DateTimeOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

}

```You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.



## 📱 RoutesThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.



- `/` - Homepage with trending content## Learn More

- `/movies` - Movies catalog with filters

- `/tv` - TV shows catalog with filtersTo learn more about Next.js, take a look at the following resources:

- `/movie/[id]` - Movie details page

- `/tv/[id]` - TV show details page- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- `/search` - Search results- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- `/watchlist` - User's saved content (auth required)

- `/watch-together` - Watch Together room (auth required)You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- `/login` - Login page

- `/register` - Registration page## Deploy on Vercel



## 🐳 Docker DeploymentThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.



### Using Docker Compose (Development)Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```bash
docker-compose up -d
```

### Production Build
```bash
# Build and push to GHCR
./build.sh --env production --version v1.0.0 --push

# Or manual Docker build
docker build -t streamflix:latest .
docker run -p 8000:8000 --env-file .env.local streamflix:latest
```

### CI/CD Pipeline
- **Trigger:** Push to `main` or `production` branch
- **Build:** Automatic Docker build and push to GHCR
- **Deploy:** Blue-green deployment to server
- **Zero Downtime:** Health checks before traffic switch

See `docs/CICD_SETUP.md` for complete CI/CD configuration.

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server on port 8000

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Create/run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:reset         # Reset database (dev only!)

# Build
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
```

## 🚨 Known Limitations

1. **Embedded video ads** - Third-party providers may show ads/redirects
2. **WebRTC connections lost on restart** - Socket.IO uses in-memory storage
3. **NAT traversal issues** - Complex networks may block WebRTC (requires TURN server)
4. **No video synchronization** - Embedded iframes play independently

See `docs/IFRAME_LIMITATIONS.md` for details.

## 📚 Documentation

- `docs/CICD_SETUP.md` - CI/CD pipeline configuration
- `docs/DEPLOYMENT.md` - Production deployment guide
- `docs/IFRAME_LIMITATIONS.md` - Video player constraints
- `.github/copilot-instructions.md` - AI agent development guide

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - Free for personal or commercial use

---

<div align="center">
  
  **Built with ❤️ by [Bibek Timilsina](https://github.com/bibektimilsina00)**
  
  ⭐ Star this repo if you find it useful!

</div>
