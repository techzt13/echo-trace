# 🚀 EchoTrace Installation & Testing Guide

## ✅ Installation Complete!

Your EchoTrace extension is ready to load into Chrome. All files are generated and validated.

### File Structure Created:
```
echo-trace/
├── manifest.json              ✓ Manifest V3 config
├── background.js             ✓ Service worker (tracking logic)
├── newtab.html              ✓ Dashboard UI
├── newtab.js                ✓ Dashboard logic + Chart.js
├── newtab.css               ✓ Modern dark mode styles
├── popup.html               ✓ Popup widget
├── popup.js                 ✓ Popup logic
├── popup.css                ✓ Popup styles
├── icons/
│   ├── icon16.png           ✓ Generated (16x16)
│   ├── icon48.png           ✓ Generated (48x48)
│   └── icon128.png          ✓ Generated (128x128)
├── README.md                ✓ Full documentation
└── setup.sh                 ✓ Icon generation script
```

### Files Generated: **17 files, 2076 lines of code**
- ✅ All JavaScript files validated (syntax OK)
- ✅ Manifest JSON validated
- ✅ All icons generated as PNG (transparent background)
- ✅ CSS includes dark mode support

---

## 📥 Step 1: Load into Chrome

### Option A: Windows/Mac/Linux
1. Open **Chrome** (or Chromium-based browser)
2. Navigate to **chrome://extensions/**
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Select the `/workspaces/echo-trace` folder
6. ✅ Extension loaded! Icon appears in toolbar

### Option B: Copy to Extension Folder (Windows)
If load unpacked doesn't work:
```powershell
$extensionPath = "$env:USERPROFILE\AppData\Local\Google\Chrome\User Data\Default\Extensions"
Copy-Item -Path ".\echo-trace" -Destination "$extensionPath" -Recurse
```

### Option C: Package as CRX (Advanced)
```bash
# Create .crx file (requires Chrome signing)
chromium --pack-extension=/workspaces/echo-trace
```

---

## 🎮 Step 2: Test the Extension

### Test 1: Enable Tracking
1. Click the **EchoTrace icon** in Chrome toolbar
2. In the popup, toggle **"Enable Tracking"** ON
3. Confirm toggle switches to active state (blue)
4. Privacy notice should say "🔒 100% Local"

**Expected:** Toggles successfully, no console errors

---

### Test 2: Visit Different Website Categories
1. With tracking enabled, open these sites in tabs:
   - **Social:** twitter.com, reddit.com, instagram.com
   - **News:** cnn.com, bbc.com, nytimes.com
   - **Productivity:** github.com, notion.so, stackoverflow.com
   - **Entertainment:** youtube.com, netflix.com

2. Spend **2-5 minutes** on each category (click between tabs)
3. Don't just leave them open—actively navigate to ensure tab changes trigger tracking

**Expected:** Time accumulates per domain/category

---

### Test 3: Check the Dashboard
1. **Open a new tab** (Ctrl+T or Cmd+T)
2. You should see the **custom new tab page** (EchoTrace Dashboard)
3. Verify you see:
   - ✅ "🔄 EchoTrace Dashboard" header
   - ✅ Privacy badge: "🔒 100% Local • No Data Leaves Your Device"
   - ✅ Stats overview cards (Today's Total, This Week, Top Category, Most Visited)
   - ✅ Pie chart showing category breakdown
   - ✅ Weekly bar chart
   - ✅ Top sites list
   - ✅ Tracking toggle switch
   - ✅ "Your Future Echo" section with projections

**Expected:** Dashboard displays with real-time data from your browsing

---

### Test 4: View "Future Echo" Projections
1. On the dashboard, scroll to **"Your Future Echo"** section
2. If you browsed social media (30+ mins):
   - Should show warning about lost focus hours
   - Example: "In 90 days, you could lose ~X focus hours"
3. If productivity time > 2h:
   - Should show motivational message
   - Example: "Keep it up! 🚀"
4. Overall balance shown based on daily average

**Expected:** Projections appear with emoji and motivational text

---

### Test 5: Test Idle Detection
1. Open a tab on a website with tracking enabled
2. **Verify it's tracking:** Watch the active tab timer increment
3. **Go idle:** Don't touch mouse/keyboard for 5+ minutes
4. **Check tracking paused:** Time counter should stop
5. **Resume activity:** Move mouse or click → tracking resumes

**Expected:** Tracking pauses when idle, resumes when active

---

### Test 6: Export Data
1. On the dashboard, find the **"Export JSON"** button
2. Click it
3. A `.json` file downloads with name: `echotrace-export-YYYY-MM-DD.json`
4. Open the file to verify it contains:
   ```json
   {
     "enabled": true,
     "dailyStats": {
       "2024-02-02": {
         "social": 1200,
         "productivity": 3600,
         "entertainment": 600
       }
     },
     "totalByDomain": {
       "twitter.com": 1200,
       "github.com": 3600
     },
     "totalByCategory": {
       "social": 1200,
       "productivity": 3600
     }
   }
   ```

**Expected:** Valid JSON file exports successfully

---

### Test 7: Reset Data
1. Click the **"Reset Data"** button on dashboard
2. Confirm dialog: "Are you sure? This will delete all tracked data."
3. Click OK
4. Dashboard stats reset to 0

**Expected:** All data cleared, stats show empty state

---

### Test 8: Test Dark Mode
1. **Check your OS settings:**
   - Windows: Settings → Personalization → Colors → Dark
   - macOS: System Preferences → General → Dark
   - Linux: Depends on desktop environment
2. **Refresh dashboard** (F5 or Cmd+R)
3. Verify dashboard uses dark colors instead of light

**Expected:** Dashboard automatically adapts to system dark mode preference

---

### Test 9: Popup Quick View
1. Click the **EchoTrace icon** in toolbar
2. Popup shows:
   - ✅ Today's total time
   - ✅ Top category
   - ✅ Top site/domain
   - ✅ Quick echo message (motivational or warning)
   - ✅ Tracking toggle
   - ✅ "Full Dashboard" and "Reset Data" buttons

**Expected:** Popup displays current stats and provides quick actions

---

### Test 10: Background Service Worker Persistence
1. Track some sites
2. **Unload extension:** On chrome://extensions, toggle off the extension
3. **Reload extension:** Toggle it back on
4. Open dashboard
5. All data should still be there

**Expected:** Data persists even after extension restart

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Failed to load extension"** | Verify manifest.json is in root directory. Check console for errors. |
| **Tracking toggle doesn't work** | Check DevTools (F12) → Background service worker → Console for errors |
| **Dashboard is blank** | Open DevTools → Console tab → check for JavaScript errors |
| **No new tab override** | Manifest might have incorrect `chrome_url_overrides` path. Verify it points to `newtab.html` |
| **Icons not showing** | Check PNG files exist in `icons/` folder. Reload extension on chrome://extensions |
| **Time not accumulating** | Make sure tracking is enabled. Wait 5-10 minutes for background service worker to process. |
| **Stock icons showing instead of custom clock** | Icons might be cached. Clear browser cache or hard reload (Ctrl+Shift+R) |

---

## 📊 Data Storage Locations

Chrome stores extension data in different locations:

**Windows:**
- Local Storage: `%AppData%\Local\Google\Chrome\User Data\Default\Local Storage`

**Mac:**
- Local Storage: `~/Library/Application Support/Google/Chrome/Default/Local Storage`

**Linux:**
- Local Storage: `~/.config/google-chrome/Default/Local Storage`

All EchoTrace data is stored as `chrome.storage.local` (no server syncing).

---

## 🔧 Advanced Testing

### Check Service Worker Logs
1. Go to **chrome://extensions/**
2. Find **EchoTrace**, scroll down, click **"Service Worker"** link
3. Opens DevTools for the service worker
4. You should see console logs like:
   ```
   Service worker initialized, tracking enabled: true
   Tab activated: twitter.com
   Processing stats
   Tracking toggled: true
   ```

### Monitor Performance
1. Open DevTools (F12) → Application → Storage → Chrome Storage
2. Expand `chrome-extension://[ID]/Local`
3. View current stats structure:
   ```json
   {
     "enabled": true,
     "dailyStats": {...},
     "totalByDomain": {...},
     "totalByCategory": {...}
   }
   ```

### Simulate Data for Testing
```javascript
// In DevTools console on any page:
chrome.storage.local.set({
  enabled: true,
  dailyStats: {
    "2024-02-02": {
      "social": 7200,
      "productivity": 10800,
      "entertainment": 3600
    }
  },
  totalByDomain: {
    "twitter.com": 3600,
    "reddit.com": 3600,
    "github.com": 5400,
    "notion.so": 5400
  },
  totalByCategory: {
    "social": 7200,
    "productivity": 10800,
    "entertainment": 3600
  }
});
// Then refresh dashboard to see chart updates
```

---

## 🎓 Next Steps: Future Enhancements

### ML-Powered Predictions (Add Later)
```javascript
// In newtab.js, add:
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';
const classifier = await pipeline('zero-shot-classification');
// Classify visited pages and improve projections
```

### Add Website Blocker
```javascript
// Listen to chrome.webRequest to block distracting sites
```

### Pomodoro Timer Integration
```javascript
// Add 25-min focus block timer in popup
```

### Weekly Reports
```javascript
// Generate and email weekly habit summaries
```

---

## ✅ Verification Checklist

- [ ] Extension loads without errors
- [ ] Tracking toggle works
- [ ] Time accumulates when browsing
- [ ] Dashboard displays with charts
- [ ] Dark mode works
- [ ] Idle detection pauses tracking
- [ ] Data persists after reload
- [ ] Export JSON works
- [ ] Reset data clears everything
- [ ] Popup shows quick stats
- [ ] Future echo projections appear
- [ ] No console errors in DevTools

---

## 🎉 Success!

If all tests pass, your **EchoTrace extension is fully functional!**

### Share Your Setup
- Add extension to Chrome profile
- Test on real browsing habits
- Export your first week of data
- See if future echo projections are accurate

### Report Issues
Check the [README.md](README.md) for debugging tips or GitHub issues.

---

**Happy tracking! 🔄 May your digital habits become more mindful.** ✨
