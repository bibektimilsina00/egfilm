Perfect ✅ — skipping **Auth** and **Addon System** simplifies the first phase a lot while keeping the rest of the project solid.

Below is your **updated, complete, production-ready `requirements.md`** for **Stremio Web Clone (Phase 1)** — focused on **core browsing, playback, live TV, and offline/PWA experience**, without authentication or addon systems.

It’s structured for direct inclusion in a GitHub repository (clean Markdown, headings, and dev-friendly formatting).

---

# 📺 Stremio Web Clone — Requirements Specification (Phase 1)

**Version:** 1.0
**Date:** October 2025
**Author:** Bibek Timilsina & Contributors
**License:** MIT

---

## ⚠️ Legal Disclaimer

This project is for **educational and personal use only**.
It **must not host or distribute copyrighted material**.
Use only **public-domain, licensed, or user-owned** content.
Comply with all **DMCA** and **local laws**.

---

## 🧭 Table of Contents

1. [Overview](#overview)
2. [Goals & Scope](#goals--scope)
3. [System Architecture](#system-architecture)
4. [Core Features](#core-features)
5. [Extended Features](#extended-features)
6. [Streaming Engine](#streaming-engine)
7. [Offline & PWA Capabilities](#offline--pwa-capabilities)
8. [Security Requirements](#security-requirements)
9. [Performance Requirements](#performance-requirements)
10. [Accessibility](#accessibility)
11. [Testing](#testing)
12. [Deployment & CI/CD](#deployment--cicd)
13. [Project Structure](#project-structure)
14. [API Integrations](#api-integrations)
15. [Database & Storage](#database--storage)
16. [Milestones](#milestones)
17. [Future Extensions](#future-extensions)
18. [Contributing](#contributing)

---

## 1. 🧩 Overview

**Stremio Web Clone** is a **browser-based media streaming platform** inspired by Stremio, built using **Next.js 14**, **Tailwind CSS**, and **TypeScript**.
It lets users **discover**, **organize**, and **stream** media directly from their browsers — no addons or accounts required in this phase.

---

## 2. 🎯 Goals & Scope

| Goal                         | Description                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| Web-only platform            | Works in modern browsers with no installation.                             |
| Public-domain content        | Uses TMDb metadata with legal public video sources (YouTube, Vimeo, etc.). |
| Smooth streaming             | Adaptive streaming via HLS/DASH or WebTorrent.                             |
| Responsive, offline-ready UI | Works seamlessly on desktop & mobile with PWA caching.                     |
| Extensible foundation        | Modular architecture ready for future addons and auth systems.             |

**Out of scope for Phase 1:**

* User authentication / profiles
* Addon discovery and management

---

## 3. 🏗 System Architecture

```
Browser (Client)
│
├── Next.js Frontend (React + TypeScript)
│     ├── Pages: /, /catalog, /player, /live
│     ├── Components: CatalogGrid, Player, Filters
│     ├── Service Worker (offline caching)
│
├── API Layer (Next.js API Routes)
│     ├── TMDb wrapper (metadata)
│     ├── Stream proxy (HLS/MP4 links)
│
└── External Services
      ├── TMDb API  (metadata)
      ├── Public video sources (e.g., YouTube embeds)
      └── IndexedDB/PouchDB (local data cache)
```

---

## 4. 🎬 Core Features

### 4.1 Unified Media Catalog

* Fetch movie & TV data from **TMDb API**.
* Infinite scroll using Intersection Observer.
* Filters: genre / year / rating / popularity / trending.
* Sorting: alphabetical, newest, top-rated.
* Detail page with:

  * Poster / trailer / cast / overview
  * “Play” button launching player
* Lazy-load images via Next.js `<Image>`.

### 4.2 Progressive Streaming Player

* Built with **Video.js** or **Shaka Player**.
* Supports:

  * HLS/DASH via MSE
  * MP4 links
  * Optional WebTorrent (.mp4/.mkv) playback
* Features:

  * Play/Pause / Seek / Volume / Quality switcher
  * Fullscreen + PiP
  * Subtitles (.vtt, .srt)
  * Buffer indicator
  * Auto-resume progress (local cache)

### 4.3 Live TV

* Support for M3U playlist parsing.
* EPG (Electronic Program Guide) with current & upcoming shows.
* Channel filter and favourite list.

### 4.4 UI / UX

* Responsive design with Tailwind.
* Dark / Light mode (auto detect).
* Keyboard shortcuts:

  * Space → Play/Pause
  * ←/→ → Seek
  * F → Fullscreen
* Minimalistic card design for catalog items.

---

## 5. 🌟 Extended Features

| Feature                  | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| **Recommendations**      | Suggest related titles from TMDb (similar movies API). |
| **Multi-Language UI**    | i18next + auto locale detection.                       |
| **Subtitles**            | Fetch from OpenSubtitles API.                          |
| **Analytics (Optional)** | Local stats (hours watched, top genres).               |
| **PWA Installability**   | Add to Home Screen support with manifest + SW.         |

---

## 6. 🎥 Streaming Engine

### Supported Protocols

| Protocol                | Technology    | Use Case            |
| ----------------------- | ------------- | ------------------- |
| **HLS (.m3u8)**         | Shaka Player  | Adaptive streaming  |
| **DASH (.mpd)**         | Shaka Player  | 4K or multi-bitrate |
| **WebTorrent (magnet)** | WebTorrent.js | Peer-to-peer video  |
| **MP4/WebM**            | Native HTML5  | Direct playback     |

### Engine Features

* Auto-quality selection & manual override.
* Real-time buffer percentage.
* Automatic fallback from torrent to HLS on failure.
* Subtitles overlay with font size controls.

---

## 7. 🔄 Offline & PWA Capabilities

* **Service Worker** handles:

  * Caching of TMDb metadata requests.
  * Poster thumbnails & static assets.
  * “Continue Watching” list in IndexedDB.
* **Offline Mode:**

  * Show cached titles + allow resumed streams if locally stored.
* **Storage Limits:**

  * Max 500 MB per user (IndexedDB).

---

## 8. 🛡 Security Requirements

| Area               | Implementation                          |
| ------------------ | --------------------------------------- |
| Input Sanitization | DOMPurify + Escape HTML in descriptions |
| HTTPS Enforcement  | HSTS + redirects                        |
| CSP                | Allow scripts only from trusted CDNs    |
| TMDb API Key       | Stored server-side (.env) never exposed |
| Content Filtering  | Only public/legal sources allowed       |
| Error Handling     | Graceful error messages (no stack leak) |

---

## 9. ⚡ Performance Requirements

* **LCP:** < 2.5 s
* **CLS:** < 0.1
* **TTI:** < 3 s
* **Image Optimization:** Next.js Image component
* **Lazy Loading:** Catalog cards + components
* **Prefetching:** Next.js route prefetch
* **Caching:** Static assets via SW + CDN

---

## 10. ♿ Accessibility

* WCAG 2.1 AA compliance.
* Proper ARIA roles for controls.
* Focus traps in modals.
* Keyboard-only navigation.
* Subtitle color/size contrast options.

---

## 11. 🧪 Testing

| Type        | Tool                         | Target                |
| ----------- | ---------------------------- | --------------------- |
| Unit        | Jest + React Testing Library | Components, helpers   |
| Integration | Playwright / Cypress         | Catalog → Player flow |
| Performance | Lighthouse                   | LCP / TTI / PWA       |
| Security    | OWASP ZAP                    | CSP, XSS checks       |
| Linting     | ESLint + Prettier            | Consistency check     |

---

## 12. 🚀 Deployment & CI/CD

* **CI:** GitHub Actions

  * Lint → Test → Build
* **CD:** Vercel / Netlify (auto deploy on main)
* **Monitoring:** Sentry (frontend errors)
* **Environment Vars:** `.env.local` (TMDB_KEY, BASE_URL)

---

## 13. 🗂 Project Structure

```
stremio-web-clone/
├── app/
│   ├── catalog/
│   ├── player/
│   ├── live/
│   ├── layout/
│   └── api/
├── components/
│   ├── ui/
│   ├── catalog/
│   └── player/
├── lib/
│   ├── api/
│   ├── hooks/
│   └── utils/
├── public/
│   ├── icons/
│   └── manifest.json
├── tests/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 14. 🔑 API Integrations

| API               | Use                                 | Docs                                                                           |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| **TMDb**          | Metadata (search, details, similar) | [https://developer.themoviedb.org](https://developer.themoviedb.org)           |
| **OpenSubtitles** | Subtitles                           | [https://www.opensubtitles.com/docs](https://www.opensubtitles.com/docs)       |
| **YouTube/Vimeo** | Public trailers and streams         | [https://developers.google.com/youtube](https://developers.google.com/youtube) |

---

## 15. 🗄 Database & Storage

### IndexedDB (PouchDB)

* **Tables:**

  * `cache_media`: Metadata cache.
  * `watch_progress`: Movie ID, position, duration.
  * `live_channels`: Parsed M3U data.
* **Retention:** Auto-purge old entries > 30 days.

---

## 16. 🧱 Milestones

| Phase | Tasks                                       | Duration |
| ----- | ------------------------------------------- | -------- |
| 1     | Setup Next.js + Tailwind + TMDb integration | 1 week   |
| 2     | Catalog page + infinite scroll + filters    | 2 weeks  |
| 3     | Video player + HLS/WebTorrent support       | 3 weeks  |
| 4     | Live TV + EPG                               | 2 weeks  |
| 5     | PWA + offline cache + subtitles             | 2 weeks  |
| 6     | Testing + deployment                        | 1 week   |

---

## 17. 🔮 Future Extensions

* Addon system (JSON manifests & proxy validation).
* Authentication (Supabase / Firebase OAuth).
* User profiles + sync.
* Watch party mode via WebRTC.
* AI-based recommendations (TensorFlow.js).
* Admin panel for content curation.

---

## 18. 🤝 Contributing

1. Fork → Create feature branch
2. Follow **Conventional Commits** format
3. Run `npm run lint && npm test` before PR
4. All contributions must respect legal and ethical guidelines

---

***Built for the web — ethical, modular, and blazing fast.***

---

Would you like me to make this version **PWA-first and offline-centric**, meaning I expand section 7 with more detailed caching logic (asset manifest, runtime caching, expiration policies)?
That would make it ideal for your **first public release (v0.1 “Offline Core”)** before adding addons and accounts later.
