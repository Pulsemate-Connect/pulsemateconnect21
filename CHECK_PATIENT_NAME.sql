-- Check why patient name is not showing in queue

-- Find the user/patient with mobile 9380328154
SELECT 
  id,
  name,
  mobile,
  role,
  "createdAt"
FROM users
WHERE mobile LIKE '%9380328154%' OR mobile LIKE '%380328154%';

-- If found, check their appointments and queue items
SELECT 
  qi.id as queue_item_id,
  qi."queueNumber",
  qi.status as queue_status,
  u.id as patient_user_id,
  u.name as patient_name,
  u.mobile as patient_mobile,
  a.id as appointment_id,
  a.status as appointment_status,
  a."appointmentDate"
FROM queue_items qi
LEFT JOIN users u ON u.id = qi."patientId"
LEFT JOIN appointments a ON a.id = qi."appointmentId"
WHERE u.mobile LIKE '%9380328154%' OR u.mobile LIKE '%380328154%'
ORDER BY qi."createdAt" DESC
LIMIT 5;

-- Check if patient profile exists
SELECT 
  pp.id,
  pp."userId",
  u.name as user_name,
  u.mobile,
  pp."dateOfBirth",
  pp.gender
FROM patient_profiles pp
JOIN users u ON u.id = pp."userId"
WHERE u.mobile LIKE '%9380328154%' OR u.mobile LIKE '%380328154%';
