# Fix Path Length Issue - Move Project

## The Problem
Your build is failing because Windows path limit (260 chars) is exceeded.
Current path: `C:\Users\shubh\Desktop\pulsemateconnect123\pulsemateconnect21\`

## Solution: Move to Shorter Path

1. **Close all terminals and VS Code**

2. **Move the project folder:**
   ```cmd
   cd C:\Users\shubh\Desktop
   move pulsemateconnect123\pulsemateconnect21 C:\pm
   ```

3. **Navigate to new location:**
   ```cmd
   cd C:\pm
   ```

4. **Clean and rebuild:**
   ```cmd
   cd android
   gradlew clean
   cd ..
   npx expo run:android
   ```

This reduces your base path from 60 characters to just 6!

## Alternative: Enable Long Paths (if you want to keep current location)

See ENABLE-LONG-PATHS.ps1 or ENABLE-LONG-PATHS-ADMIN.ps1 in parent folder.
