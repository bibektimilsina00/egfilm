# 🎬 StreamFlix -## ✨ Features

### 🎯 Core Features
- **🎥 Embedded Video Player** - Stream movies and TV shows with multiple server options
- **🔄 Multi-Server Support** - 5 different video sources for reliability (VidSrc, 2Embed, SuperEmbed, etc.)
- **👥 Watch Together** - Watch with friends in real-time with video/voice calling and chat
- **📺 Episode Selection** - Easy season and episode picker for TV shows
- **🔍 Advanced Search** - Instant search with trending content fallback
- **💝 Watchlist** - Save your favorite movies and TV shows
- **📺 Continue Watching** - Pick up where you left off with progress tracking
- **🎬 Movie Details** - Comprehensive information with cast, trailers, and similar content
- **📺 TV Show Details** - Episode guides, seasons, and cast information
- **🎨 Beautiful UI** - Dark theme with smooth animations and gradients
- **📱 Fully Responsive** - Perfect experience on all devices

### 🎪 Browse & Discover
- **Trending Movies** - See what's hot this week
- **Trending TV Shows** - Popular series trending now
- **Popular Content** - Most viewed movies and shows
- **Top Rated** - Highest rated content of all time
- **Genre Filtering** - Browse by your favorite genres
- **Smart Categories** - Popular, Top Rated, and Trending tabs

### 🎬 Video Player Features
- **Server Switching** - Switch between video sources if one doesn't work
- **Fullscreen Mode** - Immersive viewing experience
- **HD Quality** - High-definition streaming from multiple providers
- **TV Episode Selection** - Pick any season and episode
- **Clean Interface** - Distraction-free player with intuitive controls

### 👥 Watch Together Features
- **Video Calling** - See your friends while watching with WebRTC
- **Voice Chat** - Talk to friends during the movie
- **Real-time Chat** - Text chat with participants
- **Room Codes** - Easy 6-digit codes to join
- **User Invites** - Search and invite specific users
- **Participant List** - See everyone in the room
- **Media Controls** - Toggle video/audio anytime
- **Synchronized Playback** - Everyone watches at the same timeovie & TV Streaming Platform

<div align="center">
  
  ![StreamFlix](https://img.shields.io/badge/StreamFlix-v2.0-blue?style=for-the-badge)
  ![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
  ![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

  **A beautiful, feature-rich streaming platform built with Next.js and TMDb API**

</div>

---

## ✨ Features

### 🎯 Core Features
- **🎥 Embedded Video Player** - Stream movies and TV shows with multiple server options
- **� Multi-Server Support** - 5 different video sources for reliability (VidSrc, 2Embed, SuperEmbed, etc.)
- **📺 Episode Selection** - Easy season and episode picker for TV shows
- **�🔍 Advanced Search** - Instant search with trending content fallback
- **💝 Watchlist** - Save your favorite movies and TV shows
- **📺 Continue Watching** - Pick up where you left off with progress tracking
- **🎬 Movie Details** - Comprehensive information with cast, trailers, and similar content
- **📺 TV Show Details** - Episode guides, seasons, and cast information
- **🎨 Beautiful UI** - Dark theme with smooth animations and gradients
- **📱 Fully Responsive** - Perfect experience on all devices

### 🎪 Browse & Discover
- **Trending Movies** - See what's hot this week
- **Trending TV Shows** - Popular series trending now
- **Popular Content** - Most viewed movies and shows
- **Top Rated** - Highest rated content of all time
- **Genre Filtering** - Browse by your favorite genres
- **Smart Categories** - Popular, Top Rated, and Trending tabs

### 🎬 Video Player Features
- **Server Switching** - Switch between video sources if one doesn't work
- **Fullscreen Mode** - Immersive viewing experience
- **HD Quality** - High-definition streaming from multiple providers
- **TV Episode Selection** - Pick any season and episode
- **Clean Interface** - Distraction-free player with intuitive controls

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here" > .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🔑 Getting TMDb API Key

1. Go to [The Movie Database](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key (it's free!)
5. Copy your API key to `.env.local`

## 📱 Routes

- `/` - Homepage with hero and trending content
- `/movies` - Movies catalog with filters
- `/tv` - TV shows catalog with filters
- `/movie/[id]` - Individual movie details
- `/tv/[id]` - Individual TV show details
- `/search?q=query` - Search results
- `/watchlist` - User's saved content

## 🎯 New Features

### Watchlist System
Save your favorite movies and TV shows for later. Access from any page via the heart button!

### Continue Watching
Automatically tracks what you're watching with progress bars on the homepage.

### Advanced Search
Beautiful search page with trending content shown when idle and instant results as you type.

### Enhanced Details
- Compact cast grid (up to 16 members)
- Watchlist integration
- Share functionality
- Similar content recommendations

## 💾 Data Storage

All data is stored locally in your browser:
- No login required
- No external database
- Privacy-focused
- Works offline (after initial load)

## 🎨 Tech Stack

- **Next.js 15.5.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **TMDb API** - Movie and TV data
- **Socket.IO** - Real-time synchronization for Watch Together
- **localStorage** - Client-side persistence

## 📄 License

MIT License - Free to use for personal or commercial projects

---

<div align="center">
  
  **Built with ❤️ using Next.js and TMDb API**
  
  ⭐ Star this repo if you find it useful!

</div>

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
