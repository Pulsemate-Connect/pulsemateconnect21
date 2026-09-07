-- ============================================================================
-- Fix BOTH accounts using current IDs from database
-- ============================================================================

-- Fix Account 1: kotharkar276@gmail.com (Current ID)
UPDATE users
SET 
  mobile = '+919999999999',
  "isPhoneVerified" = true,
  "updatedAt" = NOW()
WHERE id = 'e3810897-a7a6-4574-a77f-ec57237258a1';

-- Fix Account 2: shubham27052002@gmail.com
-- First, let's find its current ID
-- Run this to see the current ID:
SELECT id, name, email, mobile FROM users WHERE email = 'shubham27052002@gmail.com';

-- Then update with correct mobile (replace ID if different)
UPDATE users
SET 
  mobile = '+919141638162',
  "isPhoneVerified" = true,
  "updatedAt" = NOW()
WHERE email = 'shubham27052002@gmail.com';

-- Verify both worked
SELECT 
  id,
  name,
  email,
  mobile,
  "isPhoneVerified",
  "approvalStatus"
FROM users
WHERE email IN ('kotharkar276@gmail.com', 'shubham27052002@gmail.com')
ORDER BY email;
