-- CreateEnum for DeliveryStatus
DO $$ BEGIN
    CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for NotificationType  
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_CANCELLATION', 'PRESCRIPTION_READY', 'PAYMENT_REMINDER', 'SYSTEM_ANNOUNCEMENT', 'MARKETING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for NotificationPriority
DO $$ BEGIN
    CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable notifications - convert columns to use enum types
-- First, update any existing NULL or invalid values to valid enum values
UPDATE "notifications" SET "deliveryStatus" = 'PENDING' WHERE "deliveryStatus" IS NULL OR "deliveryStatus" NOT IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');
UPDATE "notifications" SET "priority" = 'MEDIUM' WHERE "priority" IS NULL OR "priority" NOT IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Now alter the columns to use the enum types
ALTER TABLE "notifications" ALTER COLUMN "deliveryStatus" TYPE "DeliveryStatus" USING "deliveryStatus"::"DeliveryStatus";
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType" USING "type"::"NotificationType";
ALTER TABLE "notifications" ALTER COLUMN "priority" TYPE "NotificationPriority" USING "priority"::"NotificationPriority";
