# EGFilm - Modern Movie & TV Streaming Platform

<div align="center">

![EGFilm Logo](public/icon.svg)

**A Next.js-powered streaming platform with real-time features, social watching, and comprehensive movie/TV show discovery**

[Live Site](https://egfilm.xyz) • [Blog](https://blog.egfilm.xyz) • [Report Bug](https://github.com/bibektimilsina00/egfilm/issues) • [Request Feature](https://github.com/bibektimilsina00/egfilm/issues)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎬 About

EGFilm is a modern, full-featured streaming platform built with Next.js 15 that provides:
- **Extensive Content Library**: Browse thousands of movies and TV shows powered by TMDB API
- **Real-time Social Features**: Watch together with friends using synchronized playback
- **Personalized Experience**: Custom watchlists, viewing history, and AI-powered recommendations
- **Advanced Search & Discovery**: Filter by genre, year, rating, and more
- **SEO Optimized**: Dynamic sitemaps, structured data, and optimized metadata
- **PWA Support**: Install as a progressive web app for offline access

---

## ✨ Features

### 🎥 Content Discovery
- **Advanced Search**: Full-text search with filters (genre, year, rating, popularity)
- **Dynamic Sitemaps**: Auto-generated XML sitemaps for movies, TV shows, and blog posts
- **Rich Media Cards**: Lazy-loaded images with optimized thumbnails
- **Detailed Information**: Cast, crew, ratings, reviews, trailers, and more
- **Multi-Provider Video Sources**: Automatic failover between video providers

### 👥 Social Features
- **Watch Together**: Synchronized video playback with friends
- **Real-time Chat**: Socket.io-powered chat rooms during watch parties
- **User Profiles**: Customizable profiles with viewing statistics
- **Watchlist Management**: Save and organize favorite content
- **Session Sharing**: Share watch sessions via unique links

### 🔐 Authentication & Security
- **NextAuth.js Integration**: Secure authentication with session management
- **Role-Based Access Control**: User, moderator, and admin roles
- **Password Encryption**: bcrypt-powered secure password storage
- **Session Persistence**: Automatic session refresh and management

### 📊 Analytics & Monitoring
- **Google Analytics 4**: Comprehensive tracking and user insights
- **Performance Monitoring**: Web Vitals tracking with real-time metrics
- **Error Tracking**: Integrated error logging and monitoring
- **Health Checks**: Video provider health monitoring and automatic failover

### 🎨 User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode**: Eye-friendly dark theme
- **Lazy Loading**: Intersection Observer-based lazy loading for images and content
- **Infinite Scroll**: Seamless content browsing experience
- **Service Worker**: Offline support and background sync

### 🚀 Performance
- **Next.js 15**: Latest features including Turbopack for faster builds
- **React 19**: Concurrent features and optimized rendering
- **Image Optimization**: Next.js Image component with WebP support
- **Code Splitting**: Automatic code splitting for optimal load times
- **CDN Integration**: Static assets served via CDN

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **React**: 19.1.0 with Server Components
- **Styling**: Tailwind CSS 3.4 + CSS Modules
- **UI Components**: Radix UI + Custom Components
- **State Management**: TanStack Query (React Query) v5
- **Real-time**: Socket.io Client v4.8
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
- **Real-time Server**: Socket.io v4.8
- **API Integration**: Axios + TMDB API
- **Caching**: Redis for session storage

### DevOps & Deployment
- **CI/CD**: GitHub Actions (parallel jobs for 40-50% faster deploys)
- **Containerization**: Docker + Docker Compose
- **Hosting**: Self-hosted on Ubuntu VPS
- **Database**: PostgreSQL (production + separate admin DB)
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

### Development Tools
- **TypeScript**: 5.6+ with strict mode
- **Linting**: ESLint with Next.js config
- **Git Hooks**: Husky + lint-staged
- **Testing**: Jest + React Testing Library (configured)
- **Package Manager**: npm

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (optional, for caching)
- **TMDB API Key**: [Get one here](https://www.themoviedb.org/settings/api)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bibektimilsina00/egfilm.git
   cd egfilm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:8000](http://localhost:8000)

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/egfilm"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:8000"

# TMDB API
TMDB_API_KEY="your-tmdb-api-key"
TMDB_BASE_URL="https://api.themoviedb.org/3"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:8000"
NEXT_PUBLIC_BASE_URL="http://localhost:8000"

# Google Analytics (Production)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Video Provider Configuration
VIDSRC_API_URL="https://vidsrc.xyz/embed"
VIDSRC_PRO_API_URL="https://vidsrc.pro/embed"

# Sentry (Optional)
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-public-sentry-dsn"
```

### Environment Variable Details

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | ✅ Yes |
| `NEXTAUTH_URL` | Base URL of your application | ✅ Yes |
| `TMDB_API_KEY` | The Movie Database API key | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (for sitemaps, SEO) | ✅ Yes |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID | ⚪ Optional |
| `REDIS_URL` | Redis connection string for caching | ⚪ Optional |
| `SENTRY_DSN` | Sentry error tracking DSN | ⚪ Optional |

---

## 🗄️ Database Setup

### Using Prisma

The project uses Prisma as the ORM for database management.

#### Available Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Open Prisma Studio (GUI for database)
npm run db:studio

# Seed the database with initial data
npm run db:seed

# Reset database (development only)
npm run db:reset
```

### Database Schema

The database includes the following main models:

- **User**: User accounts with authentication
- **Watchlist**: User's saved movies and TV shows
- **WatchHistory**: Viewing history tracking
- **WatchParty**: Watch together sessions
- **Notification**: User notifications
- **VideoProvider**: Video source providers
- **ProviderHealthLog**: Provider uptime monitoring
- **BlogPost**: Blog posts (shared with admin app)

For the complete schema, see [`prisma/schema.prisma`](./prisma/schema.prisma).

---

## 💻 Development

### Development Scripts

```bash
# Start development server with Turbopack
npm run dev

# Start with Webpack (fallback)
npm run dev:webpack

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm test
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript best practices
   - Use existing UI components from `src/components/ui/`
   - Update types in `src/types/` as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: ESLint with Next.js config
- **Component Structure**: Use Server Components by default, Client Components when needed
- **File Naming**: kebab-case for files, PascalCase for components
- **CSS**: Tailwind utility classes with CSS modules for complex styles

---

## 🚀 Deployment

### Production Deployment with Docker

1. **Build the Docker image**
   ```bash
   docker build -t egfilm:latest .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### GitHub Actions CI/CD

The project includes automated deployment via GitHub Actions:

- **Parallel Jobs**: Lint, test, audit, and security scan run in parallel (40-50% faster)
- **Automated Builds**: Docker images built and pushed to GitHub Container Registry
- **Zero-Downtime Deployment**: Automated deployment to production server
- **Health Checks**: Post-deployment health verification

#### Required GitHub Secrets

Set these in your repository settings (Settings → Secrets and variables → Actions):

**Secrets:**
- `SSH_PRIVATE_KEY`: SSH key for server access
- `REGISTRY_TOKEN`: GitHub Container Registry token
- `NEXTAUTH_SECRET`: NextAuth secret key
- `TMDB_API_KEY`: TMDB API key
- `SENTRY_DSN`: Sentry DSN (optional)

**Variables:**
- `SERVER_HOST`: Production server IP/domain
- `SERVER_USER`: SSH username (e.g., ubuntu)
- `APP_URL`: Production URL (e.g., https://egfilm.xyz)
- `GA_MEASUREMENT_ID_MAIN`: Google Analytics ID

For detailed deployment optimization guide, see [DEPLOYMENT_OPTIMIZATION.md](./DEPLOYMENT_OPTIMIZATION.md).

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

3. **Set up Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name egfilm.xyz;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Set up SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d egfilm.xyz
   ```

---

## 📁 Project Structure

```
egfilm/
├── .github/
│   └── workflows/              # CI/CD workflows
│       └── deploy-production.yml
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed-video-providers.ts # Database seeding
├── public/
│   ├── icon.svg                # App icon
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── robots.txt              # SEO robots file
│   └── ads.txt                 # Ads configuration
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   ├── api/                # API routes
│   │   ├── movie/              # Movie pages
│   │   ├── tv/                 # TV show pages
│   │   ├── search/             # Search page
│   │   ├── watchlist/          # Watchlist page
│   │   ├── watch-together/     # Watch party feature
│   │   ├── sitemap-*.xml/      # Dynamic sitemaps
│   │   └── robots.ts           # Dynamic robots.txt
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── catalog/            # Content catalog components
│   │   ├── player/             # Video player components
│   │   ├── Navigation.tsx      # Main navigation
│   │   ├── Footer.tsx          # Site footer
│   │   ├── media-card.tsx      # Movie/TV card component
│   │   └── ...
│   ├── lib/                    # Utility libraries
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── prisma.ts           # Prisma client
│   │   ├── tmdb.ts             # TMDB API client
│   │   ├── seo.ts              # SEO utilities
│   │   ├── videoSources.ts     # Video provider logic
│   │   ├── utils.ts            # Utility functions
│   │   ├── api/                # API helpers
│   │   └── hooks/              # Custom React hooks
│   └── types/                  # TypeScript type definitions
├── scripts/                    # Deployment scripts
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose setup
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 📚 API Documentation

### Internal API Routes

The application exposes several API endpoints:

#### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - User logout

#### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/[id]` - Remove from watchlist

#### Watch History
- `GET /api/history` - Get watch history
- `POST /api/history` - Add to history
- `DELETE /api/history/[id]` - Remove from history

#### Watch Together
- `POST /api/watch-party/create` - Create watch party
- `GET /api/watch-party/[id]` - Get party details
- `POST /api/watch-party/[id]/join` - Join watch party

#### Video Providers
- `GET /api/video-providers` - Get available providers
- `GET /api/video-providers/health` - Check provider health

### External APIs

The application integrates with:

- **TMDB API**: Movie and TV show data
  - Base URL: `https://api.themoviedb.org/3`
  - [Documentation](https://developers.themoviedb.org/3)

- **Video Providers**: Multiple video sources
  - VidSrc, VidSrc Pro, and others
  - Automatic failover on provider failure

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **TMDB**: Movie and TV show data
- **Next.js**: The React framework
- **Vercel**: Next.js creators and contributors
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Prisma**: Next-generation ORM

---

## 📞 Support

- **Website**: [egfilm.xyz](https://egfilm.xyz)
- **Blog**: [blog.egfilm.xyz](https://blog.egfilm.xyz)
- **Issues**: [GitHub Issues](https://github.com/bibektimilsina00/egfilm/issues)
- **Email**: [support@egfilm.xyz](mailto:support@egfilm.xyz)

---

<div align="center">

**Made with ❤️ by EgFilm Team**

[⬆ Back to Top](#egfilm---modern-movie--tv-streaming-platform)

</div>
