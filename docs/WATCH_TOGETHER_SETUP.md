# 🚀 Watch Together - Quick Setup Guide

## Overview
This guide will help you get the Watch Together feature up and running.

## Prerequisites
- ✅ Node.js installed
- ✅ Socket.IO configured
- ✅ HTTPS (recommended for WebRTC, but HTTP works for localhost)

## Installation Steps

### 1. Dependencies Already Installed
The following packages are already included:
- `socket.io` - Real-time communication
- `socket.io-client` - Client-side socket connection
- WebRTC APIs - Built into modern browsers

### 2. Files Created

#### Components
- `/src/components/WatchTogetherModal.tsx` - Modal for creating/joining rooms
- `/src/app/watch-together/page.tsx` - Main watch party room

#### Updates
- `/src/app/movie/[id]/page.tsx` - Added "Watch Together" button
- `/src/app/tv/[id]/page.tsx` - Added "Watch Together" button
- `/src/pages/api/socketio.ts` - Added Watch Together socket events

## Usage

### For Users

#### Creating a Room
1. Navigate to any movie/TV show page
2. Click the purple "Watch Together" button
3. Enter your username
4. Copy the room code
5. (Optional) Enable video/audio
6. (Optional) Invite friends
7. Click "Create Watch Party"
8. Share the room code with friends

#### Joining a Room
1. Click "Watch Together" on any movie/TV page
2. Click "Join Room" tab
3. Enter your username
4. Enter the room code from your friend
5. Choose video/audio settings
6. Click "Join Watch Party"

### Testing Locally

1. **Start the development server:**
```bash
npm run dev
```

2. **Open two browser windows:**
   - Window 1: `http://localhost:3000`
   - Window 2: `http://localhost:3000` (incognito mode)

3. **Create a room in Window 1:**
   - Go to any movie page
   - Click "Watch Together"
   - Create a room and copy the code

4. **Join from Window 2:**
   - Go to any movie page
   - Click "Watch Together"
   - Enter the room code
   - Join the room

5. **Test features:**
   - Send chat messages
   - Enable video/audio (grant permissions)
   - Toggle video/audio on/off
   - Watch the video together

## Browser Permissions

### Camera Access
When you enable video, the browser will ask:
```
Allow [domain] to use your camera?
[Block] [Allow]
```
Click **Allow** to enable video calling.

### Microphone Access
When you enable audio, the browser will ask:
```
Allow [domain] to use your microphone?
[Block] [Allow]
```
Click **Allow** to enable voice calling.

### Managing Permissions
If you blocked permissions by mistake:
1. Click the lock icon in the address bar
2. Reset camera/microphone permissions
3. Refresh the page and try again

## Network Configuration

### For Local Testing (localhost)
WebRTC works on localhost without any configuration.

### For Production (HTTPS required)
WebRTC requires HTTPS in production for security.

#### Using Free STUN Servers (Current Setup)
The app uses Google's free STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

These work for most users but may have issues with:
- Symmetric NAT
- Corporate firewalls
- Some mobile networks

#### Upgrading to TURN Servers (Optional)
For better connectivity, add TURN servers in `/src/app/watch-together/page.tsx`:

```typescript
const configuration: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:your-turn-server.com:3478',
            username: 'your-username',
            credential: 'your-password'
        }
    ]
};
```

**Free TURN Server Providers:**
- Twilio TURN (free tier available)
- Xirsys (free tier available)
- OpenRelay (free but limited)

## Troubleshooting

### Video/Audio Not Working

**Problem:** Camera/mic not accessible
**Solution:**
1. Check browser permissions
2. Make sure no other app is using the camera
3. Try a different browser
4. Restart your browser

**Problem:** "Could not access camera/microphone" message
**Solution:**
1. Grant permissions when prompted
2. Check if camera/mic is connected
3. Try disabling browser extensions
4. Use Chrome/Firefox (best compatibility)

### Connection Issues

**Problem:** Can't connect to other participants
**Solution:**
1. Check internet connection
2. Try refreshing the page
3. Check if Socket.IO is running
4. Look at browser console for errors

**Problem:** Room code doesn't work
**Solution:**
1. Verify the code is correct (6 characters)
2. Make sure the host is still in the room
3. Try creating a new room

### Socket.IO Issues

**Problem:** "Socket is initializing" but never connects
**Solution:**
1. Make sure the Socket.IO API route is running
2. Check `/api/socketio` is accessible
3. Look for CORS errors in console
4. Restart the development server

**Problem:** Messages not sending
**Solution:**
1. Check Socket.IO connection in browser console
2. Verify the room code is correct
3. Refresh the page and rejoin

## Performance Tips

### For Better Experience
1. **Use wired internet** - More stable than WiFi
2. **Close other tabs** - Frees up resources
3. **Disable video if slow** - Audio-only uses less bandwidth
4. **Use headphones** - Prevents echo
5. **Update browser** - Latest version has best WebRTC support

### Bandwidth Requirements
- **Audio only:** ~30-50 KB/s per participant
- **Video (480p):** ~200-500 KB/s per participant
- **Video (720p):** ~500 KB/s - 1.5 MB/s per participant

### Recommended
- **Internet:** 5+ Mbps upload/download
- **RAM:** 8GB+
- **Browser:** Chrome, Firefox, or Edge (latest)

## Security Considerations

### Current Implementation
- **Peer-to-peer** - Video/audio streams directly between users
- **Not recorded** - No server-side storage
- **Temporary** - Rooms deleted when empty
- **No authentication** - Just username required

### Recommendations for Production
1. **Add user authentication** - Require login
2. **Rate limiting** - Prevent spam/abuse
3. **Room passwords** - Optional private rooms
4. **Report system** - Flag inappropriate behavior
5. **Admin controls** - Kick/ban users if needed

## Deployment

### Vercel/Netlify
Socket.IO requires a persistent server, which doesn't work on serverless platforms like Vercel.

**Alternative:** Use a Socket.IO hosting service like:
- Socket.IO Cloud
- Heroku
- DigitalOcean
- AWS EC2

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
NEXT_PUBLIC_TMDB_API_KEY=your_api_key
```

## Monitoring

### Check Socket.IO Connection
Open browser console:
```javascript
// Should see:
// "Connected to socket"
// "User [username] joining room [code]"
```

### Check WebRTC Connection
Open browser console:
```javascript
// Should see ICE candidates being exchanged
// Connection state changes
// Remote streams being added
```

### Debug Mode
Add to `/src/app/watch-together/page.tsx`:
```typescript
// Enable verbose logging
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
};
```

## Future Enhancements

### Planned Features
- [ ] Screen sharing
- [ ] Recording capability
- [ ] Picture-in-picture mode
- [ ] Reactions/emojis
- [ ] Better mobile support
- [ ] Noise suppression
- [ ] Virtual backgrounds

### Backend Improvements
- [ ] Database for persistent rooms
- [ ] User authentication
- [ ] Room history
- [ ] Analytics
- [ ] Better TURN server configuration

## Support

### Getting Help
1. Check browser console for errors
2. Review the Watch Together Guide
3. Test with different browsers
4. Check Socket.IO logs
5. Review WebRTC connection logs

### Common Error Messages

**"Missing room code or username"**
- Make sure URL has `?room=CODE&username=NAME`

**"Room not found"**
- Room may have been deleted
- Create a new room

**"Could not access camera/microphone"**
- Grant browser permissions
- Check if device is connected

**"Failed to join room"**
- Check Socket.IO connection
- Try refreshing the page

## Quick Reference

### URL Structure
```
/watch-together?room=ABC123&username=john_doe
```

### Socket Events
- `join-watch-together` - Join a room
- `send-chat-message` - Send chat
- `webrtc-offer` - WebRTC offer
- `webrtc-answer` - WebRTC answer
- `webrtc-ice-candidate` - ICE candidate

### Keyboard Shortcuts
- **Enter** - Send chat message
- **Esc** - (Future) Exit fullscreen

## Success Checklist

✅ Socket.IO server running
✅ Both users can join the room
✅ Chat messages working
✅ Video player loading
✅ Camera/mic permissions granted
✅ Video/audio streams working
✅ Can toggle video/audio
✅ Participant list showing
✅ Can leave room properly

---

**🎉 Enjoy watching together!**
