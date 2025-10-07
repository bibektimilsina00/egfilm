# 🚀 Quick Start - Watch Together in 3 Minutes

## ⚠️ Important: Login Required
You must be logged in to use Watch Together. If you're not logged in, you'll be redirected to the login page.

## For Users (Non-Technical)

### 🎬 Hosting a Watch Party

**Step 0: Login First** ⭐
- Make sure you're logged in to StreamFlix
- If not, click "Login" and sign in
- If you don't have an account, sign up first

**Step 1: Pick Your Movie**
- Browse StreamFlix
- Click on any movie or TV show
- Find the purple "Watch Together" button

**Step 2: Create Your Room**
- Click "Watch Together"
- Your username is **automatically filled** from your account!
- Copy the room code (e.g., ABC123)
- *(Optional)* Turn on camera/mic
- Click "Create Watch Party"

**Step 3: Invite Friends**
- Share the room code via:
  - WhatsApp: "Join my watch party! Code: ABC123"
  - Discord: "Watch with me! Code: ABC123"
  - Text message: "Movie night! Code: ABC123"

**Step 4: Start Watching!**
- Wait for friends to join
- See them appear in the sidebar
- Start chatting or turn on video
- Enjoy the movie together! 🍿

**Controls:**
- 📹 Camera button - Turn video on/off
- 🎤 Mic button - Mute/unmute
- 💬 Chat button - Open chat
- 👥 People button - See participants

---

### 👥 Joining a Watch Party

**Step 0: Login First** ⭐
- Make sure you're logged in to StreamFlix
- If not, you'll be redirected to login

**Step 1: Get the Code**
- Your friend will send you a 6-digit code
- Example: "ABC123"

**Step 2: Join**
- Go to StreamFlix
- Click any movie (doesn't matter which)
- Click "Watch Together"
- Click "Join Room" tab
- Your username is **automatically filled**!
- Enter the room code
- Click "Join Watch Party"

**Step 3: You're In!**
- You'll see the movie
- Chat with everyone
- Turn on video/mic if you want
- Enjoy! 🎉

---

## For Developers

### Installation (Already Done ✅)
```bash
# Dependencies already installed
npm install
```

### Running Locally
```bash
# Start the dev server
npm run dev

# Open http://localhost:3000
```

### Testing with 2 Users
```bash
# Terminal 1
npm run dev

# Browser 1: http://localhost:3000
# - Create a room

# Browser 2: http://localhost:3000 (incognito)
# - Join with the room code
```

### Key Files
```
src/
├── components/
│   └── WatchTogetherModal.tsx     # Create/Join UI
├── app/
│   └── watch-together/
│       └── page.tsx                # Main room
└── pages/
    └── api/
        └── socketio.ts             # Backend
```

### Environment Variables (Optional)
```env
# .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## Common Issues & Solutions

### ❌ "Can't access camera"
**Fix:** Click "Allow" when browser asks for permissions

### ❌ "Room not found"
**Fix:** 
- Check the code is correct
- Make sure host is still in the room
- Try creating a new room

### ❌ Video not showing
**Fix:**
- Grant camera permissions
- Check if another app is using camera
- Try refreshing the page

### ❌ Echo during call
**Fix:**
- Everyone should use headphones
- Or mute when not talking

### ❌ Poor video quality
**Fix:**
- Check internet speed (need 5+ Mbps)
- Close other tabs
- Turn off video, use audio only

---

## Pro Tips 💡

### For Best Experience
✅ Use **Chrome or Firefox** browser
✅ Wear **headphones** to prevent echo
✅ Use **wired internet** if possible
✅ **Close other tabs** for better performance
✅ **Test your setup** before inviting others

### Fun Features to Try
🎨 Send **emojis** in chat
👋 **Wave at friends** on video
💬 **Chat while watching**
🎬 **Switch between movies** (create new room)
📱 Try on **mobile** (chat works great!)

---

## Feature Checklist

When everything works, you should be able to:

- ✅ Create a room with one click
- ✅ Share a 6-digit code
- ✅ Join with just a code
- ✅ See other participants
- ✅ Send chat messages
- ✅ Turn video on/off
- ✅ Turn audio on/off
- ✅ Watch the movie together
- ✅ See video feeds in sidebar
- ✅ Go fullscreen
- ✅ Leave the room anytime

---

## Example Scenarios

### Movie Night with Friends
```
You: Create room → ABC123
Friend 1: Joins ABC123
Friend 2: Joins ABC123
Everyone: Chat + Watch + Have fun!
```

### Long Distance Date
```
You: Create room with video ON
Partner: Joins with video ON
Both: See each other while watching
      Chat, laugh, enjoy together
```

### Family Time
```
Host: Create room
Mom: Joins ABC123
Dad: Joins ABC123
Siblings: Join ABC123
Everyone: Family movie night!
```

---

## Need Help?

### Check These Guides
- **Full Guide:** `WATCH_TOGETHER_GUIDE.md`
- **Setup Help:** `WATCH_TOGETHER_SETUP.md`
- **Summary:** `WATCH_TOGETHER_SUMMARY.md`

### Browser Console
Press `F12` to see:
- Connection status
- Error messages
- WebRTC states

### Test Connection
```
1. Open browser console (F12)
2. Look for "Connected to socket"
3. Should see "User [name] joining room [code]"
4. Check for any red errors
```

---

## Quick Commands

### Start Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Check for Errors
```bash
npm run lint
```

---

## Success Indicators

You know it's working when:

✅ Room code appears instantly
✅ Join happens within 2 seconds
✅ Chat messages appear immediately
✅ Video shows after granting permission
✅ You can see other participants
✅ Audio is clear (with headphones)
✅ No lag or freezing

---

## Share Your Experience!

**Did it work?** 
- Share with friends
- Host watch parties
- Enjoy together!

**Found a bug?**
- Check the troubleshooting guides
- Look at browser console
- Try different browser

---

## Time to Success

- **Read this guide:** 3 minutes ✅
- **Create room:** 30 seconds ✅
- **Join room:** 20 seconds ✅
- **Start watching:** Instant! ✅

**Total time:** Less than 5 minutes to watch together! 🎉

---

## Final Checklist

Before your first watch party:

- [ ] Tested room creation
- [ ] Tested joining
- [ ] Camera works
- [ ] Mic works
- [ ] Chat works
- [ ] Can see participants
- [ ] Video plays
- [ ] Know how to share code

All checked? **You're ready!** 🚀

---

**Enjoy watching together! 🍿🎬👥**

*"The best movies are the ones we watch with friends"* ✨
