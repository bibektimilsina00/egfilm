# WebRTC Audio/Video Sharing - Complete Debugging Report

## Issue Summary

**Symptom**: Audio and video work locally but NOT after deployment
- ✅ Local: Peer connections establish, media flows
- ❌ Deployed: Connection state stuck at `new`, no media flowing

## Root Cause Analysis

### The Problem Chain

1. **Peer Connection State Never Reaches "connected"**
   - Connection state stuck at `new` instead of progressing to `connected`
   - This prevents media tracks from flowing

2. **Why This Happens in Production**
   - STUN server unreachable (firewall/network issue)
   - ICE candidates not being properly gathered
   - Network Address Translation (NAT) not being traversed

3. **Why It Works Locally**
   - Same network (no NAT traversal needed)
   - Direct IP addresses are reachable
   - WebRTC can establish direct P2P connection

## Key Logging Points to Monitor

### 1. **Peer Connection Initialization**
```
🔗 [PEER CONNECTION] Initialized for abc1234d...
📡 [PEER CONFIG] STUN servers configured, ICE gathering state: new
```
✅ Should appear when joining room

### 2. **Track Addition**
```
📤 [ADDING TRACKS] Total tracks: 2
   [0] VIDEO: FaceTime HD Camera (1C1C:B782)
   [1] AUDIO: Default - MacBook Air Microphone (Built-in)
✅ [TRACKS ADDED] All tracks added to peer connection
```
✅ Should show both video and audio tracks

### 3. **Offer/Answer Exchange**
```
🎥 [WEBRTC OFFER RECEIVED] From: abc1234d..., Type: offer
🎥 [WEBRTC] Creating new peer connection for abc1234d...
✅ [WEBRTC ANSWER CREATED] Type: answer, SDP length: 5584
📤 [WEBRTC] Sending answer to abc1234d...
```
✅ Complete handshake should finish quickly

### 4. **ICE Candidate Exchange** (CRITICAL)
```
📤 [ICE CANDIDATE LOCAL] Generated: candidate:661973147 1 udp 2122194687 192.168.1.65...
❄️ [ICE CANDIDATE RECEIVED] From: abc1234d..., Candidate: candidate:1982697229 1 udp...
❄️ [ICE] Adding candidate to peer connection abc1234d...
✅ [ICE GATHERING COMPLETE] All local candidates gathered
```
✅ Multiple candidates should be exchanged

### 5. **Connection State Progression** (MOST CRITICAL)
```
❄️ [ICE STATE] abc1234d... → checking
🔍 [ICE CHECKING] Finding candidates...

❄️ [ICE STATE] abc1234d... → connected
✅ [ICE CONNECTED] P2P connection established
✅ [PEER CONNECTION ESTABLISHED] Video/audio should now flow
```
🔴 **If you don't see this, WebRTC handshake failed**

### 6. **Remote Track Reception**
```
🎬 [REMOTE TRACK RECEIVED] From: abc1234d..., Track: video
   Stream ID: abc123xyz, Track enabled: true
✅ [PARTICIPANT UPDATED] Stream assigned to abc1234d...
```
✅ Remote video/audio should be received here

## Deployment Checklist

### Network Configuration
- [ ] **Firewall**: Allow UDP 443 (WebRTC)
- [ ] **STUN Server**: Accessible from VPS (test: `nc -zu stun.l.google.com 19302`)
- [ ] **NAT Settings**: Check if port forwarding needed
- [ ] **ISP Restrictions**: Some ISPs block P2P traffic

### VPS Testing Commands
```bash
# Test STUN server connectivity
nc -zv stun.l.google.com 19302

# Check open UDP ports
sudo netstat -uln | grep LISTEN

# Monitor network during call
sudo tcpdump -i any 'udp port 443' -v
```

### Browser Requirements
- [ ] **HTTPS Only**: getUserMedia requires secure context
- [ ] **Permissions**: Camera/Microphone must be allowed
- [ ] **Browser Support**: Check WebRTC capabilities

## Debugging Flowchart

```
Media Sharing Issue
├─ Is connection state "connected"?
│  ├─ YES: Issue is elsewhere (video element, stream not attached)
│  └─ NO: WebRTC connection failed
│     ├─ Are ICE candidates being gathered?
│     │  ├─ NO: STUN server unreachable
│     │  │   └─ Check: Firewall, STUN server, network
│     │  └─ YES: Are candidates being added to peer?
│     │     ├─ NO: addIceCandidate errors
│     │     │   └─ Check: Candidate format, browser console
│     │     └─ YES: NAT/Firewall blocking connection
│     │        └─ Need: TURN server configuration
│
├─ Is ontrack event firing?
│  ├─ NO: Remote peer not sending tracks
│  │   └─ Check: Remote stream has tracks, tracks enabled
│  └─ YES: Remote stream received
│     └─ Issue is local video element display
```

## Common Solutions

### Issue: ICE State Stuck at "checking"
**Root Cause**: STUN server unreachable
```
❄️ [ICE STATE] abc1234d... → checking
(stuck here, no transition to connected)
```
**Solution**:
1. Add TURN server configuration
2. Check firewall allows UDP 443
3. Test STUN: `nc -zv stun.l.google.com 19302`

**Code Fix**:
```typescript
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turnserver.example.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
};
```

### Issue: No ICE Candidates Generated
**Root Cause**: Network interface issue or STUN failure
```
📤 [ICE CANDIDATE LOCAL] Generated: (never appears)
❄️ [ICE GATHERING] Complete (appears immediately, no candidates)
```
**Solution**:
1. Check multicast routing
2. Verify network interfaces are up
3. Test with localhost first

### Issue: Candidates Generated but Not Connected
**Root Cause**: NAT/Firewall blocking P2P
```
📤 [ICE CANDIDATE LOCAL] Generated: ...192.168.x.x...
❄️ [ICE STATE] abc1234d... → failed
❌ [ICE FAILED] check firewall/NAT
```
**Solution**: Use TURN server (relay server for NAT traversal)

### Issue: Connection State "connected" but No Media
**Root Cause**: Stream not attached to video element
```
✅ [PEER CONNECTION ESTABLISHED]
(but no video appears)
```
**Solution**: Attach remote stream to video element
```typescript
peerConnection.ontrack = (event) => {
  videoElement.srcObject = event.streams[0];
};
```

## Production Deployment Recommendations

### 1. Add TURN Server
```typescript
// Free TURN server (limited usage)
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: ['turn:turnserver.stunprotocol.org:3478?transport=udp'],
      username: 'webrtc',
      credential: 'webrtc'
    }
  ]
};
```

### 2. Monitor Connection State in Production
```typescript
peerConnection.onconnectionstatechange = () => {
  fetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify({
      event: 'webrtc_state_change',
      state: peerConnection.connectionState,
      timestamp: new Date()
    })
  });
};
```

### 3. Log to External Service
```typescript
// Send all WebRTC logs to backend
console.log = ((originalLog) => {
  return function(...args) {
    if (args[0]?.includes?.('[')) {
      fetch('/api/webrtc-logs', {
        method: 'POST',
        body: JSON.stringify({ log: args.join(' ') })
      });
    }
    originalLog.apply(console, args);
  };
})(console.log);
```

## Test Checklist

### Local Testing
- [ ] Both users can see each other's video
- [ ] Audio is clear and bidirectional
- [ ] Mute/unmute works for both
- [ ] Connection establishes within 5 seconds
- [ ] Logs show "connected" state

### Staging/Production Testing
- [ ] Open DevTools on both machines
- [ ] Check for console errors
- [ ] Verify ICE state progresses to "connected"
- [ ] Confirm remote tracks are received
- [ ] Monitor network for UDP traffic

## Advanced Debugging

### Check WebRTC Statistics
```javascript
// In browser console
async function checkWebRTC() {
  for (const [id, pc] of Object.entries(peerConnections)) {
    const stats = await pc.getStats();
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        console.log(`✅ Connection ${id}:`, {
          currentRoundTripTime: report.currentRoundTripTime,
          availableOutgoingBitrate: report.availableOutgoingBitrate,
          availableIncomingBitrate: report.availableIncomingBitrate
        });
      }
    });
  }
}
checkWebRTC();
```

### Monitor Bandwidth
```javascript
let lastReport = {};
setInterval(async () => {
  for (const [id, pc] of Object.entries(peerConnections)) {
    const stats = await pc.getStats();
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const bytes = report.bytesReceived - (lastReport[id]?.bytes || 0);
        const kbps = (bytes * 8) / 1000;
        console.log(`📊 Video bitrate: ${kbps.toFixed(0)} kbps`);
        lastReport[id] = { bytes: report.bytesReceived };
      }
    });
  }
}, 1000);
```

## Next Steps

1. **Deploy with new logging**
2. **Test connection with 2 users**
3. **Monitor browser console for ICE state transitions**
4. **If stuck at "checking": Add TURN server**
5. **Check server logs for media updates**
6. **Monitor network bandwidth with DevTools**

---

## Quick Reference: Expected Log Sequence

### Successful Connection
```
1. 📡 [SETUP MEDIA] Starting local media setup...
2. ✅ [SETUP MEDIA] Stream obtained successfully
3. 🎯 [PEER SETUP] Ready
4. 🎥 [WEBRTC OFFER RECEIVED] From: ...
5. ✅ [WEBRTC ANSWER CREATED] Type: answer
6. 📤 [ICE CANDIDATE LOCAL] Generated: ...
7. ❄️ [ICE STATE] ... → checking
8. ❄️ [ICE STATE] ... → connected
9. ✅ [PEER CONNECTION ESTABLISHED]
10. 🎬 [REMOTE TRACK RECEIVED] From: ...
11. ✅ [PARTICIPANT UPDATED] Stream assigned
```

If you stop seeing new logs at any point, that's where the issue is!
