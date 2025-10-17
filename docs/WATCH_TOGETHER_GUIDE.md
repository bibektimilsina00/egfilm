# 🎬 Watch Together Feature - Complete Guide

## Overview
The Watch Together feature allows users to watch movies and TV shows together in real-time with friends, complete with video/voice calling and live chat. It's perfect for virtual movie nights!

## ✨ Features

### 🎥 Video & Voice Calling
- **WebRTC-based calls** - Peer-to-peer video and voice communication
- **Toggle video on/off** - Control your camera
- **Toggle audio on/off** - Mute/unmute your microphone
- **Multiple participants** - Watch with multiple friends simultaneously
- **Live video feeds** - See all participants in the sidebar

### 💬 Real-time Chat
- **Instant messaging** - Chat while watching
- **System notifications** - Know when people join/leave
- **Message history** - Scroll through previous messages
- **Timestamps** - See when each message was sent

### 🎬 Synchronized Playback
- **Shared video player** - Everyone watches the same content
- **Embedded streaming** - Uses the same multi-server system
- **Fullscreen mode** - Immersive viewing experience

### 👥 Room Management
- **Easy room creation** - Generate a 6-digit room code
- **Simple joining** - Enter code to join
- **User invites** - Search and invite specific users
- **Participant list** - See who's in the room

## 🚀 How to Use

### Creating a Watch Party

1. **Navigate to any movie or TV show detail page**

2. **Click the "Watch Together" button** (purple/pink gradient)

3. **In the modal:**
   - Click "Create Room" tab
   - Enter your username
   - Copy the generated room code
   - (Optional) Enable video/audio
   - (Optional) Search and invite friends
   - Click "Create Watch Party"

4. **Share the room code** with friends via any messaging app

### Joining a Watch Party

1. **Get the room code** from your friend

2. **Click "Watch Together"** on any movie/TV page

3. **In the modal:**
   - Click "Join Room" tab
   - Enter your username
   - Enter the 6-digit room code
   - Choose if you want video/audio enabled
   - Click "Join Watch Party"

4. **You're in!** Start watching and chatting

### During the Watch Party

#### Video Controls
- **Camera toggle** - Click the video icon to turn camera on/off
- **Mic toggle** - Click the mic icon to mute/unmute
- **Fullscreen** - Click fullscreen button on the video player

#### Chat
- **Send messages** - Type in the chat box and press Enter or click Send
- **View messages** - Scroll through chat history
- **Switch views** - Toggle between Chat and People tabs

#### Participants
- **View everyone** - Click "People" tab to see all participants
- **See video status** - Icons show who has video/audio enabled
- **Your video** - See yourself marked with "(You)"

#### Leaving
- **Click "Leave" button** in the header
- Or simply close the browser tab

## 🎨 User Interface

### Watch Together Modal
```
┌─────────────────────────────────────────┐
│  Watch Together                    [X]  │
│  Movie/Show Title                       │
├─────────────────────────────────────────┤
│  [Create Room]  [Join Room]            │
│                                         │
│  Your Username: [____________]          │
│                                         │
│  Room Code: [ABC123]  [Copy]           │
│                                         │
│  Call Settings:                         │
│  ☑ Enable Video Call                   │
│  ☑ Enable Voice Call                   │
│                                         │
│  Invite Friends:                        │
│  [Search username...]                   │
│                                         │
│  [Create Watch Party]                   │
└─────────────────────────────────────────┘
```

### Watch Together Room
```
┌───────────────────────────────────────────────────────────┐
│  Movie Title        Room: ABC123 [Copy]      [Leave]      │
├───────────────────────────────────────┬───────────────────┤
│                                       │ [Chat] [People]   │
│                                       ├───────────────────┤
│                                       │                   │
│         Video Player                  │   Chat Messages   │
│       (Movie/Show)                    │   or             │
│                                       │   Participant     │
│                                       │   Video Feeds     │
│                                       │                   │
│                          [Fullscreen] │                   │
├───────────────────────────────────────┤                   │
│   [Video] [Mic] [Chat] [Users: 3]   │ [Send Message]    │
└───────────────────────────────────────┴───────────────────┘
```

## 🔧 Technical Implementation

### Architecture

```
src/
├── components/
│   └── WatchTogetherModal.tsx      # Modal for creating/joining
├── app/
│   └── watch-together/
│       └── page.tsx                # Main watch party room
└── pages/
    └── api/
        └── socketio.ts             # WebSocket server
```

### Key Technologies

1. **WebRTC** - Peer-to-peer video/audio calling
   - Browser-to-browser direct connection
   - STUN servers for NAT traversal
   - ICE candidates for connection establishment

2. **Socket.IO** - Real-time communication
   - Room management
   - Chat messages
   - WebRTC signaling
   - Participant updates

3. **MediaStream API** - Camera/microphone access
   - `getUserMedia()` for local media
   - Track management (enable/disable)

### Data Flow

#### Creating a Room
```
User clicks "Watch Together"
    ↓
Modal opens
    ↓
User enters details
    ↓
Room code generated
    ↓
Room data saved locally
    ↓
Navigate to /watch-together?room=CODE
    ↓
Socket connection established
    ↓
WebRTC peers initialized
```

#### WebRTC Connection
```
User A creates room
    ↓
User B joins room
    ↓
Socket.IO signals connection
    ↓
User A creates offer
    ↓
Offer sent via Socket.IO
    ↓
User B creates answer
    ↓
Answer sent back
    ↓
ICE candidates exchanged
    ↓
Direct peer connection established
    ↓
Video/audio streams shared
```

## 🎯 User Experience Features

### Visual Indicators
- **Video status icons** - See who has camera enabled
- **Audio status icons** - See who's muted
- **System messages** - "User joined/left" notifications
- **Participant count** - Always visible
- **Room code display** - Easy to copy and share

### Responsive Design
- **Works on desktop and tablet**
- **Adaptive layout** - Sidebar can be toggled
- **Fullscreen support** - Immersive viewing
- **Mobile-friendly controls**

## ⚙️ Configuration

### Room Settings
- **Room Code** - Auto-generated 6-character code
- **Video Quality** - Based on embed source selection
- **Max Participants** - No hard limit (peer-to-peer)

### Media Settings
- **Video resolution** - Browser default (usually 720p)
- **Audio quality** - Browser default
- **STUN servers** - Google's free STUN servers

## 🐛 Troubleshooting

### Video/Audio Issues

**Camera not working:**
- Grant browser permission when prompted
- Check if another app is using the camera
- Try refreshing the page

**Can't hear others:**
- Check your volume settings
- Make sure they haven't muted their mic
- Check browser permissions

**Black screen:**
- Participant may have video disabled
- Check internet connection
- Try different browser

### Connection Issues

**Can't join room:**
- Verify the room code is correct
- Check if room still exists
- Make sure host is still in the room

**Delayed messages:**
- Check internet connection
- Socket.IO might be reconnecting
- Try refreshing the page

**Video freezing:**
- Poor internet connection
- Too many participants (WebRTC limitation)
- Try disabling video temporarily

### Browser Compatibility

**Recommended browsers:**
- ✅ Chrome/Edge (best support)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ❌ Internet Explorer (not supported)

**Required browser features:**
- WebRTC support
- MediaStream API
- WebSocket support

## 🔒 Privacy & Security

### Data Handling
- **Peer-to-peer** - Video/audio streams go directly between users
- **Not recorded** - Nothing is saved to servers
- **Temporary rooms** - Rooms exist only while in use
- **No signup required** - Just enter a username

### Permissions
- **Camera/Mic access** - Only requested when you enable them
- **User control** - Toggle video/audio anytime
- **Room privacy** - Only users with code can join

## 🚀 Future Enhancements

### Planned Features
- [ ] Persistent rooms (saved to database)
- [ ] User authentication integration
- [ ] Screen sharing
- [ ] Reactions/emojis
- [ ] Picture-in-picture mode
- [ ] Recording capability
- [ ] More invite options (email, link sharing)
- [ ] Waiting room before joining
- [ ] Host controls (kick users, lock room)
- [ ] Better mobile support
- [ ] Background effects (blur, virtual backgrounds)

### Improvements
- [ ] Better peer connection handling
- [ ] Automatic quality adjustment
- [ ] Network quality indicators
- [ ] More TURN servers for better connectivity
- [ ] Noise suppression
- [ ] Echo cancellation

## 📱 Mobile Support

### Current Status
- ✅ Chat works perfectly
- ✅ Video player works
- ⚠️ Video calling has limitations
- ⚠️ Layout may need adjustments

### Mobile Limitations
- Some browsers restrict WebRTC
- Camera switching may not work
- Battery drain with video enabled
- Screen space is limited

## 🎓 Tips for Best Experience

### For Hosts
1. **Test your setup** before inviting others
2. **Share room code** via a reliable method
3. **Start with audio only** if bandwidth is limited
4. **Use headphones** to prevent echo

### For Participants
1. **Join with a recognizable username**
2. **Use headphones** for better audio quality
3. **Mute when not talking** to reduce noise
4. **Close other apps** for better performance

### General
1. **Good internet required** - At least 5 Mbps recommended
2. **Modern browser** - Keep it updated
3. **Grant permissions** - Allow camera/mic when prompted
4. **Stay engaged** - Use chat if video/audio has issues

## 📊 Performance

### Bandwidth Usage
- **Audio only** - ~30-50 KB/s per participant
- **Video (480p)** - ~200-500 KB/s per participant
- **Video (720p)** - ~500 KB/s - 1.5 MB/s per participant

### Recommended Specs
- **Internet** - 5+ Mbps upload/download
- **RAM** - 4GB minimum, 8GB recommended
- **CPU** - Modern dual-core or better
- **Browser** - Latest version of Chrome/Firefox/Edge

## 🔗 Integration

### With Movie Pages
- Button appears on all movie detail pages
- Button appears on all TV show detail pages
- Automatically includes movie/show information
- Passes embed URL to watch party room

### With User System
- Username saved in localStorage
- No account required
- Can be integrated with authentication later

## 📝 Code Examples

### Creating a Room Programmatically
```typescript
const roomData = {
    roomCode: 'ABC123',
    hostUsername: 'john_doe',
    movieTitle: 'Movie Name',
    movieId: 12345,
    embedUrl: 'https://...',
    type: 'movie',
    enableVideo: true,
    enableAudio: true,
    timestamp: Date.now()
};

localStorage.setItem(`room_${roomCode}`, JSON.stringify(roomData));
```

### Joining a Room
```typescript
window.location.href = `/watch-together?room=${roomCode}&username=${username}`;
```

## 🎉 Success Metrics

The Watch Together feature is successful when:
- ✅ Users can create and join rooms easily
- ✅ Video/audio calling works smoothly
- ✅ Chat messages are delivered instantly
- ✅ Video playback stays synchronized
- ✅ Users have fun watching together!

---

**Enjoy watching together! 🍿🎬**
