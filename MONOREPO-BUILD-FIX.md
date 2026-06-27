# EAS Build Monorepo Issue & Solution

## Problem
EAS Build uploads files from the git root (`pulsemate123`), but the app is in a subdirectory (`PulseMateApp`). This causes `google-services.json` to not be found during builds, even though it's committed.

## Solution Options

### Option 1: Move App to Root (Simplest - Recommended)
Move all files from `PulseMateApp/` to the repository root.

```bash
# From pulsemate123 directory
cd c:\Users\shubh\Desktop\pulsemate123
git mv PulseMateApp/* .
git mv PulseMateApp/.* . 2>$null  # Move hidden files
git rm -r PulseMateApp
git commit -m "refactor: move app files to repository root for EAS Build"
git push
```

### Option 2: Use EAS Environment Variables (Current Recommended)
Set google-services.json as an environment variable in EAS:

1. **Encode the file to base64:**
   ```
   ew0KICAicHJvamVjdF9pbmZvIjogew0KICAgICJwcm9qZWN0X251bWJlciI6ICIxNTc2MjAzODIzMzIiLA0KICAgICJwcm9qZWN0X2lkIjogInB1bHNlbWF0ZWNvbm5lY3QiLA0KICAgICJzdG9yYWdlX2J1Y2tldCI6ICJwdWxzZW1hdGVjb25uZWN0LmZpcmViYXNlc3RvcmFnZS5hcHAiDQogIH0sDQogICJjbGllbnQiOiBbDQogICAgew0KICAgICAgImNsaWVudF9pbmZvIjogew0KICAgICAgICAibW9iaWxlc2RrX2FwcF9pZCI6ICIxOjE1NzYyMDM4MjMzMjphbmRyb2lkOmExM2RmZmJjOWE3MTJhYzJlNmI3ZjkiLA0KICAgICAgICAiYW5kcm9pZF9jbGllbnRfaW5mbyI6IHsNCiAgICAgICAgICAicGFja2FnZV9uYW1lIjogImluLnB1bHNlbWF0ZWNvbm5lY3QuYXBwIg0KICAgICAgICB9DQogICAgICB9LA0KICAgICAgIm9hdXRoX2NsaWVudCI6IFtdLA0KICAgICAgImFwaV9rZXkiOiBbDQogICAgICAgIHsNCiAgICAgICAgICAiY3VycmVudF9rZXkiOiAiQUl6YVN5QTJQWEp4eUlacFlPRzJ0WEhEUnU5NWdhYUpvZ0tFREJjIg0KICAgICAgICB9DQogICAgICBdLA0KICAgICAgInNlcnZpY2VzIjogew0KICAgICAgICAiYXBwaW52aXRlX3NlcnZpY2UiOiB7DQogICAgICAgICAgIm90aGVyX3BsYXRmb3JtX29hdXRoX2NsaWVudCI6IFtdDQogICAgICAgIH0NCiAgICAgIH0NCiAgICB9DQogIF0sDQogICJjb25maWd1cmF0aW9uX3ZlcnNpb24iOiAiMSINCn0NCg==
   ```

2. **Set as EAS Secret:**
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICES_JSON --value "<paste-base64-above>" --type file
   ```

3. **Update app.json:**
   ```json
   "android": {
     "googleServicesFile": process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
   }
   ```

### Option 3: Configure Monorepo Support
Create root-level configuration files (complex, not recommended for single-app repos).

## Recommended Action: Option 1

Move app to root - it's the simplest and most reliable solution for a single-app repository.
