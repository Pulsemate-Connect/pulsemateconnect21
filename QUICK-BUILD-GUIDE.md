# Quick Build Guide - Production AAB

## 🚀 When Ready to Build (After August 1st or Plan Upgrade)

### Single Command
```bash
npx eas build --platform android --profile production
```

That's it! Then wait 10-15 minutes.

## 📋 Pre-Build Checklist

✅ All items verified and ready:
- [x] EAS account logged in (shubhamskkk)
- [x] Project linked to EAS
- [x] google-services.json configured
- [x] Version 1.3.4, Code 55
- [x] Package: in.pulsemateconnect.patient
- [x] Firebase SafetyNet configured
- [x] Production API configured
- [x] All assets present
- [x] Keystore managed by EAS

## ⏱️ Build Timeline

| Time | What's Happening |
|------|------------------|
| 0:00 | Upload & queue |
| 0:30 | Build starts |
| 2:30 | Dependencies installed |
| 8:00 | Android build compiling |
| 10:00 | Signing AAB |
| 12:00 | Upload complete |
| 12:30 | ✅ **AAB Ready to Download** |

## 📥 After Build Completes

You'll see:
```
✔ Build finished
Download URL: https://expo.dev/artifacts/...
```

**Download the AAB** and upload to Google Play Console.

## 🎯 Production Features Enabled

When users install your AAB:
- ✅ Firebase OTP with SafetyNet (invisible, automatic)
- ✅ No reCAPTCHA modals
- ✅ Clean SMS-based authentication
- ✅ Production API backend
- ✅ Push notifications
- ✅ Location services

## 🔄 If Build Fails

Check logs:
```bash
# View build logs
npx eas build:view

# List recent builds
npx eas build:list
```

Common issues:
1. **Dependency errors**: Run `npm install` locally first
2. **Asset errors**: Check all image paths in assets/
3. **Keystore errors**: EAS manages this automatically
4. **Timeout**: Upgrade to paid plan for longer timeout

## 📱 Upload to Play Store

After downloading AAB:
1. Go to: https://play.google.com/console
2. Select your app
3. Go to: **Release** → **Production**
4. Click **Create new release**
5. Upload your AAB file
6. Add release notes
7. Review and rollout

## 🎉 Your App Configuration

Perfect for production:
- **Package**: in.pulsemateconnect.patient
- **Version**: 1.3.4
- **Backend**: api.pulsemateconnect.in
- **Firebase**: Phone Auth with SafetyNet
- **Min Android**: 5.0 (API 21)
- **Target Android**: 14 (API 34)

---

**Everything is ready!** Just run the build command when quota resets. 🚀
