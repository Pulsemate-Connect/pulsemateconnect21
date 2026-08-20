-- AlterTable
ALTER TABLE "users" ADD COLUMN "clinicOnboardingData" JSONB;

-- Add comment explaining the field
COMMENT ON COLUMN "users"."clinicOnboardingData" IS 'Stores clinic onboarding draft data for multi-step registration (clinicInformation, servicesOperations, documents, agreement)';
