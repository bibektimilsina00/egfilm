# Authentication & Watch Together Features

## 🔐 Authentication System

### Features
- **User Registration**: Create new accounts with email and password
- **Login/Logout**: Secure authentication with NextAuth.js
- **Session Management**: JWT-based sessions
- **Protected Routes**: Watchlist and Watch Party require authentication

### Demo Credentials
- **Email**: demo@example.com
- **Password**: demo123

### How to Use

1. **Register a New Account**:
   - Visit `/register`
   - Enter your name, email, and password
   - Click "Sign Up"

2. **Login**:
   - Visit `/login`
   - Enter email and password
   - Click "Sign In"

3. **Logout**:
   - Click the "Sign Out" button in the navigation bar

### Technical Details
- **Provider**: Credentials (email/password)
- **Storage**: In-memory Map (replace with database in production)
- **Password Hashing**: bcryptjs
- **Session Strategy**: JWT

---

## 👥 Watch Together Feature

### Overview
The Watch Together feature allows multiple users to watch movies synchronously in real-time. All viewers see the same content at the same time with synchronized playback controls.

### Features

#### Real-Time Synchronization
- **Play/Pause Sync**: When host plays or pauses, all viewers sync automatically
- **Seek Sync**: Jumping to a specific time syncs for everyone
- **No Lag**: Uses Socket.io for instant communication

#### Video Player
- ▶️ Play/Pause controls
- ⏩ Skip forward/backward 10 seconds  
- 🔊 Volume control
- 📊 Progress bar with click-to-seek
- 🎬 Fullscreen support
- ⚙️ Playback speed (0.5x to 2x)
- 📥 Torrent stats (download speed, peers, progress)

#### Chat System
- Live text chat with all viewers
- See who joined/left the party
- User presence indicators
- Auto-scroll to latest messages

#### Party Management
- Create watch parties with movie title and magnet link
- Share party link with friends
- See all active viewers
- One-click copy party link

### How to Use

#### Create a Watch Party
1. Login to your account
2. Click "Watch Together" in navigation
3. Click "Create Watch Party"
4. Enter movie title
5. Enter magnet link
6. Share the party link with friends

#### Join a Watch Party
1. Login to your account
2. Receive party link from a friend
3. Click the link OR click "Join Watch Party" and enter party ID
4. Start watching together!

#### During the Party
- **Watch**: Video player syncs automatically with all viewers
- **Chat**: Type messages to communicate with other viewers
- **Control**: Any viewer can play/pause/seek (syncs for everyone)
- **Monitor**: See download speed, peers, and buffer progress
- **Toggle Chat**: Hide/show chat sidebar for immersive viewing

### Technical Architecture

#### Backend (Socket.io)
- Real-time WebSocket connections
- Party management (create, join, leave)
- Event broadcasting (play/pause, seek, chat)
- User presence tracking
- Automatic cleanup on disconnect

#### Frontend (React + Socket.io Client)
- WebTorrent integration for P2P streaming
- HTML5 video player with custom controls
- Real-time state synchronization
- Chat interface with message history
- Party link sharing

#### Events
- `create-party`: Host creates a new watch party
- `join-party`: User joins existing party
- `play-pause`: Sync play/pause state
- `seek`: Sync video position
- `chat-message`: Send/receive chat messages
- `user-joined`: Notification when user joins
- `user-left`: Notification when user leaves

---

## 🔒 Security Notes

### Current Implementation (Development)
- In-memory user storage (resets on server restart)
- Basic credential authentication
- Simple JWT sessions

### For Production
⚠️ **IMPORTANT**: Before deploying to production:

1. **Use a Real Database**
   - Replace in-memory Map with PostgreSQL/MySQL/MongoDB
   - Store user data persistently
   - Add proper indexes

2. **Secure Environment Variables**
   ```bash
   # Generate secure secret
   openssl rand -base64 32
   ```
   - Update `AUTH_SECRET` in `.env.local`
   - Never commit secrets to git

3. **Add OAuth Providers**
   - Google OAuth
   - GitHub OAuth
   - Discord OAuth

4. **Rate Limiting**
   - Add rate limiting to auth endpoints
   - Prevent brute force attacks

5. **Email Verification**
   - Verify email addresses
   - Password reset functionality

6. **HTTPS**
   - Always use HTTPS in production
   - Update `AUTH_URL` to https://

---

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts  # NextAuth API route
│   │       └── register/route.ts       # Registration endpoint
│   ├── login/page.tsx                  # Login page
│   ├── register/page.tsx               # Registration page
│   └── watch-party/page.tsx            # Watch Together page
├── components/
│   ├── Navigation.tsx                  # Updated with auth links
│   └── SessionProvider.tsx             # NextAuth session provider
├── lib/
│   ├── auth.ts                         # NextAuth configuration
│   └── auth.config.ts                  # Auth config with callbacks
├── pages/
│   └── api/
│       └── socketio.ts                 # Socket.io server
├── types/
│   └── socket.ts                       # Socket.io types
└── middleware.ts                       # Route protection
```

---

## 🚀 Quick Start

1. **Install Dependencies** (already done)
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Check `.env.local` for `AUTH_SECRET` and `AUTH_URL`

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Try Authentication**
   - Visit http://localhost:8000/login
   - Use demo credentials or register new account

5. **Try Watch Together**
   - Login first
   - Visit http://localhost:8000/watch-party
   - Create a party or join existing one

---

## 🎯 Usage Examples

### Watch Together Workflow
```
1. User A creates party with "Movie Title" and magnet link
   → Gets party ID: "abc123"
   
2. User A shares link: http://localhost:8000/watch-party?id=abc123

3. User B clicks link → Joins party

4. Both users see:
   ✅ Same video
   ✅ Synchronized playback
   ✅ Real-time chat
   ✅ Torrent stats

5. User A pauses video
   → User B's video pauses automatically

6. User B seeks to 5:30
   → User A's video jumps to 5:30
```

### Authentication Workflow
```
Register:
  /register → Enter details → Success → Redirect to /login

Login:
  /login → Enter credentials → Success → Redirect to home

Protected Routes:
  /watchlist → Requires login
  /watch-party → Requires login
  / (home) → Public access
```

---

## 🐛 Troubleshooting

### Authentication Issues
- **Can't login**: Check if email/password are correct
- **Session expires**: JWT tokens expire after 30 days
- **Database reset**: In-memory storage clears on server restart

### Watch Together Issues
- **Video won't load**: Verify magnet link is valid
- **Not syncing**: Check Socket.io connection (F12 console)
- **Chat not working**: Ensure Socket.io server is running
- **No peers**: Wait for WebTorrent to find peers

### Common Errors
```
Error: "Party not found"
→ Solution: Party may have been deleted. Create new one.

Error: "Socket connection failed"
→ Solution: Restart dev server. Check /api/socketio endpoint.

Error: "User already exists"
→ Solution: Use different email or login with existing account.
```

---

## 🌟 Features Summary

### ✅ Implemented
- [x] User registration and login
- [x] JWT session management
- [x] Protected routes
- [x] Watch Together with real-time sync
- [x] Live chat during watch party
- [x] WebTorrent P2P streaming
- [x] Full video player controls
- [x] Party link sharing
- [x] User presence tracking
- [x] Torrent download stats

### 🚧 Future Enhancements
- [ ] OAuth providers (Google, GitHub)
- [ ] Persistent database storage
- [ ] Email verification
- [ ] Password reset
- [ ] User profiles
- [ ] Watch history
- [ ] Party invitations via email
- [ ] Screen share mode
- [ ] Emoji reactions during playback
- [ ] Voice chat integration

---

Enjoy watching movies together! 🎬🍿
