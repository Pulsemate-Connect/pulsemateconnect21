-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: Add notification enum types and convert columns
-- This fixes the "type public.DeliveryStatus does not exist" error
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Create NotificationType enum if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'APPOINTMENT_BOOKED',
      'APPOINTMENT_REMINDER_24H',
      'APPOINTMENT_REMINDER_2H',
      'APPOINTMENT_REMINDER_30M',
      'QUEUE_UPDATE',
      'QUEUE_ALMOST_YOUR_TURN',
      'QUEUE_YOUR_TURN',
      'APPOINTMENT_CANCELLED',
      'APPOINTMENT_RESCHEDULED',
      'PAYMENT_SUCCESS',
      'PRESCRIPTION_READY',
      'FOLLOW_UP_REMINDER',
      'DOCTOR_NEW_APPOINTMENT',
      'DOCTOR_APPOINTMENT_CANCELLED',
      'DOCTOR_PATIENT_CHECKED_IN',
      'DOCTOR_PRESCRIPTION_VIEWED',
      'RECEPTIONIST_PATIENT_ARRIVED',
      'RECEPTIONIST_WALK_IN_ADDED',
      'OWNER_DAILY_SUMMARY',
      'OWNER_HIGH_QUEUE',
      'ADMIN_EMERGENCY'
    );
    RAISE NOTICE 'Created NotificationType enum';
  END IF;
END $$;

-- Step 2: Create NotificationPriority enum if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationPriority') THEN
    CREATE TYPE "NotificationPriority" AS ENUM (
      'LOW',
      'NORMAL',
      'HIGH',
      'URGENT'
    );
    RAISE NOTICE 'Created NotificationPriority enum';
  END IF;
END $$;

-- Step 3: Create DeliveryStatus enum if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryStatus') THEN
    CREATE TYPE "DeliveryStatus" AS ENUM (
      'PENDING',
      'SENT',
      'DELIVERED',
      'FAILED',
      'RETRY',
      'EXPIRED'
    );
    RAISE NOTICE 'Created DeliveryStatus enum';
  END IF;
END $$;

-- Step 4: Convert notification columns from TEXT to enum
-- Only convert if table exists and columns are TEXT type
DO $$ BEGIN
  -- Convert type column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
      AND column_name = 'type' 
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "notifications" 
      ALTER COLUMN "type" 
      TYPE "NotificationType" 
      USING "type"::"NotificationType";
    RAISE NOTICE 'Converted type column to NotificationType enum';
  END IF;

  -- Convert priority column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
      AND column_name = 'priority' 
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "notifications" 
      ALTER COLUMN "priority" 
      TYPE "NotificationPriority" 
      USING "priority"::"NotificationPriority";
    RAISE NOTICE 'Converted priority column to NotificationPriority enum';
  END IF;

  -- Convert deliveryStatus column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
      AND column_name = 'deliveryStatus' 
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "notifications" 
      ALTER COLUMN "deliveryStatus" 
      TYPE "DeliveryStatus" 
      USING "deliveryStatus"::"DeliveryStatus";
    RAISE NOTICE 'Converted deliveryStatus column to DeliveryStatus enum';
  END IF;
END $$;

-- Step 5: Verify the changes
SELECT 
  table_name,
  column_name, 
  data_type, 
  udt_name 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND column_name IN ('type', 'priority', 'deliveryStatus')
ORDER BY column_name;
