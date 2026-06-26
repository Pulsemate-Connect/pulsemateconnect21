-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionType') THEN
        CREATE TYPE "SessionType" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');
    END IF;
END $$;

-- AlterTable (add column with default, then make it required)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinic_sessions' AND column_name = 'sessionType'
    ) THEN
        ALTER TABLE "clinic_sessions" ADD COLUMN "sessionType" "SessionType" DEFAULT 'MORNING';
        -- After adding column, you can manually update existing rows if needed
        -- Then remove the default:
        ALTER TABLE "clinic_sessions" ALTER COLUMN "sessionType" DROP DEFAULT;
        ALTER TABLE "clinic_sessions" ALTER COLUMN "sessionType" SET NOT NULL;
    END IF;
END $$;

-- CreateIndex (unique constraint for clinicId + sessionType)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'clinic_sessions_clinicId_sessionType_key'
    ) THEN
        CREATE UNIQUE INDEX "clinic_sessions_clinicId_sessionType_key" 
        ON "clinic_sessions"("clinicId", "sessionType");
    END IF;
END $$;
