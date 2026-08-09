-- ============================================================================
-- FIX DATABASE ENUM TYPES — RUN THIS ON RENDER NOW
-- ============================================================================
-- 
-- PROBLEM: Production database missing enum types for notifications table
-- ERROR: type "public.DeliveryStatus" does not exist
--
-- SOLUTION: Create the missing enum types
--
-- HOW TO RUN ON RENDER:
-- 1. Go to Render Dashboard → Your PostgreSQL database
-- 2. Click "Shell" tab
-- 3. Paste this entire SQL script
-- 4. Press Enter
--
-- OR use CLI:
-- psql $DATABASE_URL < FIX-DATABASE-ENUMS-NOW.sql
--
-- ============================================================================

-- Create DeliveryStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create NotificationType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_CANCELLATION', 'PRESCRIPTION_READY', 'PAYMENT_REMINDER', 'SYSTEM_ANNOUNCEMENT', 'MARKETING');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create NotificationPriority enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Now alter the notifications table columns to use proper enum types
-- (If the columns exist as TEXT, convert them)

-- Fix deliveryStatus column
DO $$ BEGIN
    -- Drop the column if it exists and recreate with proper type
    ALTER TABLE notifications 
        ALTER COLUMN "deliveryStatus" TYPE "DeliveryStatus" 
        USING "deliveryStatus"::"DeliveryStatus";
EXCEPTION
    WHEN OTHERS THEN
        -- If conversion fails, try dropping and recreating
        ALTER TABLE notifications DROP COLUMN IF EXISTS "deliveryStatus";
        ALTER TABLE notifications ADD COLUMN "deliveryStatus" "DeliveryStatus" DEFAULT 'PENDING';
END $$;

-- Fix type column  
DO $$ BEGIN
    ALTER TABLE notifications 
        ALTER COLUMN "type" TYPE "NotificationType" 
        USING "type"::"NotificationType";
EXCEPTION
    WHEN OTHERS THEN
        ALTER TABLE notifications DROP COLUMN IF EXISTS "type";
        ALTER TABLE notifications ADD COLUMN "type" "NotificationType" NOT NULL;
END $$;

-- Fix priority column
DO $$ BEGIN
    ALTER TABLE notifications 
        ALTER COLUMN "priority" TYPE "NotificationPriority" 
        USING "priority"::"NotificationPriority";
EXCEPTION
    WHEN OTHERS THEN
        ALTER TABLE notifications DROP COLUMN IF EXISTS "priority";
        ALTER TABLE notifications ADD COLUMN "priority" "NotificationPriority" DEFAULT 'MEDIUM';
END $$;

-- Verify the enum types exist
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('DeliveryStatus', 'NotificationType', 'NotificationPriority')
ORDER BY t.typname, e.enumsortorder;

-- Show notifications table structure
\d notifications;

-- ============================================================================
-- DONE! The enum types are now created.
-- Restart your backend service on Render to clear the error.
-- ============================================================================
