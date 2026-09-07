-- Verify the fix worked
SELECT 
  name, 
  email, 
  mobile, 
  "isPhoneVerified"
FROM users
WHERE email IN ('kotharkar276@gmail.com', 'shubham27052002@gmail.com')
ORDER BY email;
