# 📱 Run App in Expo Go - Quick Guide

## ✅ Expo Server is Running!

**Metro Bundler URL:** `exp://192.168.31.240:8081`

---

## How to Run on Your Phone

### Step 1: Install Expo Go

1. **Open Google Play Store** on your Android phone
2. Search for **"Expo Go"**
3. Install the app
4. Open Expo Go

### Step 2: Scan the QR Code

**Option A: Using Expo Go App**
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR Code"**
3. Point camera at the QR code shown in your terminal
4. App will load on your phone

**Option B: Using Camera App (may work on some phones)**
1. Open your phone's **Camera** app
2. Point at the QR code
3. Tap the notification to open in Expo Go

---

## ⚠️ Important Notes

### Package Version Warning
The following package needs updating for best compatibility:
- `@react-native-community/datetimepicker@9.1.0` → should be `8.4.4`

**To fix (optional):**
```cmd
npm install @react-native-community/datetimepicker@8.4.4
```

### Network Requirements
- Your phone and computer must be on the **same WiFi network**
- If QR code doesn't work, you can manually enter: `exp://192.168.31.240:8081`

---

## Terminal Commands

While Expo is running, you can press:

| Key | Action |
|-----|--------|
| **a** | Open on Android device/emulator |
| **w** | Open in web browser |
| **r** | Reload the app |
| **m** | Toggle developer menu |
| **j** | Open debugger |
| **s** | Switch to development build |
| **o** | Open code in editor |
| **?** | Show all commands |
| **Ctrl+C** | Stop the server |

---

## Troubleshooting

### QR Code Not Working?

**Try Manual Connection:**
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Type: `exp://192.168.31.240:8081`

### "Unable to Connect to Metro"

**Check WiFi:**
- Ensure phone and computer are on same network
- Disable VPN if active
- Try restarting the Expo server:
  ```cmd
  Ctrl+C (to stop)
  npm start (to restart)
  ```

### "Network Response Timed Out"

**Allow through firewall:**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

### App Shows Error on Load

**Clear cache and restart:**
```cmd
Ctrl+C (to stop)
npx expo start --clear
```

---

## Features in Expo Go

### ✅ What Works:
- Hot reload (instant code updates)
- React Navigation
- Most Expo SDK modules
- Firebase integration
- API calls
- Most React Native core components

### ❌ What Doesn't Work:
- Custom native code
- Some third-party native modules
- Background tasks requiring native modules
- Some device-specific features

---

## Development Workflow

### 1. Edit Code
Make changes to any `.js`, `.jsx`, `.ts`, or `.tsx` file

### 2. See Changes Instantly
- Save the file
- App reloads automatically on your phone
- No need to rebuild

### 3. Debug
- Shake your phone to open dev menu
- Or press **'m'** in the terminal
- Options:
  - Reload
  - Debug Remote JS
  - Toggle Performance Monitor
  - Toggle Element Inspector

---

## Quick Tips

1. **Keep Terminal Open**: Don't close the terminal window
2. **Same Network**: Phone and PC must be on same WiFi
3. **Fast Refresh**: Changes appear instantly
4. **Shake to Debug**: Shake phone to open dev menu
5. **Check Logs**: Errors appear in terminal

---

## Alternative: Use Android Emulator

If you have an Android emulator running:

1. **Start emulator** first
2. Press **'a'** in the Expo terminal
3. App opens in emulator

Or manually:
```cmd
# In separate terminal
C:\Users\shubh\AppData\Local\Android\Sdk\emulator\emulator @PulseMatePixel35c

# Then press 'a' in Expo terminal
```

---

## Alternative: Use Web Browser

Press **'w'** in the terminal to open in browser.

**Note:** Some mobile-specific features won't work in browser.

---

## Stop the Server

Press **Ctrl+C** in the terminal to stop Expo.

---

## Restart the Server

```cmd
cd c:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21
npm start
```

Or with cache clearing:
```cmd
npx expo start --clear
```

---

## Current Status

✅ **Expo Metro Server:** Running  
✅ **Network:** Available on `192.168.31.240:8081`  
✅ **QR Code:** Displayed in terminal  
⚠️ **Package Warning:** `datetimepicker` version mismatch (optional fix)

---

## Next Steps

1. **Install Expo Go** on your phone (if not installed)
2. **Scan the QR code** shown in your terminal
3. **Wait for app to load** (first load takes ~30 seconds)
4. **Start developing!** Edit code and see changes instantly

---

## Need Help?

- Check terminal for error messages
- Shake phone to open dev menu
- Press **'j'** in terminal for debugger
- Press **'r'** in terminal to reload
- Press **'?'** in terminal for all commands
