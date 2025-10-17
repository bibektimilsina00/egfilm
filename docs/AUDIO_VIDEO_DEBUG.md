# Audio/Video Debugging Guide

## Frontend Logging (Browser Console)

### Setup Phase
```
📡 [SETUP MEDIA] Starting local media setup...
📡 [SETUP MEDIA] mediaDevices available, requesting permissions...
📡 [SETUP MEDIA] Constraints: { video: true, audio: true }
✅ [SETUP MEDIA] Stream obtained successfully
📡 [STREAM TRACKS] Video: 1, Audio: 1
📹 [VIDEO TRACK] Device: FaceTime HD Camera, Ready: live
🎤 [AUDIO TRACK] Device: Built-in Microphone, Ready: live
📹 [VIDEO TRACK] Set to disabled (OFF)
🎤 [AUDIO TRACK] Set to enabled (ON)
✅ [UI STATE] Video: OFF, Audio: ON
```

### Toggle Actions
```
🎬 [TOGGLE VIDEO] Starting video toggle...
✅ [VIDEO STATE] Enabled: true
📹 [VIDEO TRACK] Status: ACTIVE
📹 [LOCAL VIDEO] Ref available: true, SrcObject: true
📹 [STREAM TRACKS] Video: 1, Audio: 1
📤 [MEDIA BROADCAST] Sending update: video=true, audio=true
✅ [VIDEO NOTIFICATION] 📹 Camera enabled
```

### WebRTC Signaling
```
🎥 [WEBRTC OFFER RECEIVED] From: abc1234d..., Type: offer
🎥 [WEBRTC] Creating new peer connection for abc1234d...
🎥 [WEBRTC] Setting remote description (offer) for abc1234d...
🎥 [WEBRTC] Creating answer for abc1234d...
✅ [WEBRTC ANSWER CREATED] Type: answer, SDP length: 3200
📤 [WEBRTC] Sending answer to abc1234d...
```

### ICE Candidates
```
❄️ [ICE CANDIDATE RECEIVED] From: abc1234d..., Candidate: candidate:842612 1 udp 1677729535 192.168...
❄️ [ICE] Adding candidate to peer connection abc1234d...
✅ [ICE CANDIDATE ADDED] Connection state: connected
```

## Backend Logging (Node.js/Socket.IO)

### Media Status Updates
```
🎬 [MEDIA UPDATE] Socket: abc1234d..., Room: 4SXLK2, Video: true, Audio: true
✅ [MEDIA UPDATED] Sandip Bajagain: Video false→true, Audio true→true
📊 [ROOM STATE] Room: 4SXLK2, Total participants: 2
  - Sandip Bajagain (abc1234d...): Video=false, Audio=true
  - Bibek Timilsina (def5678f...): Video=true, Audio=true
📤 [BROADCAST] Notifying other participants about Sandip Bajagain's media update
```

### WebRTC Signaling
```
🎥 [WEBRTC OFFER] From: abc1234d... → To: def5678f... (Room: 4SXLK2)
   Offer type: offer, SDP length: 3200
🎤 [WEBRTC ANSWER] From: def5678f... → To: abc1234d... (Room: 4SXLK2)
   Answer type: answer, SDP length: 3100
❄️ [ICE CANDIDATE] From: abc1234d... → To: def5678f... (Room: 4SXLK2)
   Candidate: candidate:842612 1 udp 1677729535 192.168...
```

## Troubleshooting Checklist

### Audio/Video Not Sharing (Local Works, Deployed Doesn't)

1. **Check Permission Logs**
   ```
   ✅ [SETUP MEDIA] Stream obtained successfully
   ```
   - If this doesn't appear, permissions weren't granted
   - Check browser permission settings

2. **Verify Stream Tracks**
   ```
   📡 [STREAM TRACKS] Video: 1, Audio: 1
   ```
   - Both should be 1 (not 0)
   - If 0, device not found or permission denied

3. **Check Toggle Actions**
   - Look for `🎬 [TOGGLE VIDEO]` or `🎤 [TOGGLE AUDIO]` logs
   - Verify `✅ [VIDEO STATE]` shows correct state (true/false)

4. **Monitor Media Broadcast**
   ```
   📤 [MEDIA BROADCAST] Sending update: video=true, audio=true
   ```
   - Should appear after toggle
   - If not, socket may not be connected

5. **Backend Should Receive Update**
   ```
   🎬 [MEDIA UPDATE] Socket: abc1234d..., Room: 4SXLK2, Video: true, Audio: true
   ```
   - Check server logs for this
   - If not appearing, check if update-media-status is being sent

6. **Verify Broadcast to Others**
   ```
   📤 [BROADCAST] Notifying other participants about Sandip Bajagain's media update
   ```
   - If not appearing, participants won't see the status change

7. **Check WebRTC Connection**
   ```
   🎥 [WEBRTC OFFER RECEIVED]
   ✅ [WEBRTC ANSWER CREATED]
   ❄️ [ICE CANDIDATE RECEIVED]
   ```
   - All three should appear during connection
   - If any is missing, WebRTC handshake failed

## Common Issues

### Issue: Stream Not Obtained
```
❌ [SETUP MEDIA ERROR] NotAllowedError: Permission denied
```
**Solution**: Check browser camera/microphone permissions

### Issue: No Peer Connection
```
❌ [WEBRTC OFFER ERROR] Cannot set remote description
```
**Solution**: Peer connection not initialized - check room join logs

### Issue: ICE Candidate Fails
```
❌ [ICE CANDIDATE ERROR] addIceCandidate failed
```
**Solution**: 
- Check firewall rules (UDP port 443 needed)
- Verify STUN server connectivity
- Check network NAT configuration

### Issue: Media Updates Not Sent
```
❌ [MEDIA BROADCAST] Sending update: video=true, audio=true (but no backend log)
```
**Solution**: 
- Check socket connection: `socket.connected` should be true
- Verify room code is correct
- Check browser network tab for socket.io errors

## Network Requirements for Production

1. **Firewall**: Allow UDP 443 for WebRTC
2. **STUN Servers**: Used for NAT traversal (Google's STUN is default)
3. **Browser**: Modern browser with WebRTC support
4. **Permissions**: Camera and microphone access granted
5. **HTTPS**: Required for getUserMedia to work (except localhost)

## Testing Flow

1. **Local Test**
   - Open DevTools Console (F12)
   - Open two browser windows in different sizes
   - Window 1: User A (creates room)
   - Window 2: User B (joins room)
   - Toggle video/audio in each window
   - Check browser console for all logs

2. **Check Participant List**
   - Verify both users appear in participants list
   - Check their video/audio status updates in real-time

3. **Monitor Server Logs**
   - SSH to VPS
   - `docker logs -f <container_name>`
   - Look for media update logs
   - Verify broadcast messages

4. **Network Debugging**
   - Browser DevTools → Network tab → Filter: socket.io
   - Look for `update-media-status` events
   - Verify response status

## Log Patterns to Monitor

### Success Pattern
```
📡 [SETUP MEDIA] ✅ [SETUP MEDIA]
🎬 [TOGGLE VIDEO] ✅ [VIDEO STATE]
📤 [MEDIA BROADCAST]
🎬 [MEDIA UPDATE] ✅ [MEDIA UPDATED]
📤 [BROADCAST]
```

### Error Pattern
```
📡 [SETUP MEDIA ERROR]
❌ [TOGGLE VIDEO ERROR]
❌ [MEDIA BROADCAST] (no update sent)
❌ [MEDIA ERROR] (no backend update)
```

## Browser Developer Tools Tips

### Monitor Socket Events
```javascript
// In browser console
socket.on('participant-updated', (data) => {
  console.log('👤 Participant updated:', data);
});

socket.on('room-joined', (data) => {
  console.log('🚪 Room data:', data);
});
```

### Check Media Stream
```javascript
// In browser console
console.log('Local stream:', localStreamRef.current);
console.log('Video track enabled:', localStreamRef.current?.getVideoTracks()[0]?.enabled);
console.log('Audio track enabled:', localStreamRef.current?.getAudioTracks()[0]?.enabled);
```

### Monitor WebRTC Connection
```javascript
// In browser console
Object.entries(peerConnections).forEach(([id, pc]) => {
  console.log(`${id}: ${pc.connectionState}`);
  pc.getStats().then(stats => {
    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        console.log('Inbound:', report);
      }
    });
  });
});
```
