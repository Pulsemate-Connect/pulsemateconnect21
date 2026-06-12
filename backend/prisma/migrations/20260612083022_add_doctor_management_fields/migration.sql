/*
  Warnings:

  - You are about to drop the `doctor_availabilities` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[firebaseUid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DoctorProfileStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DoctorVerificationStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "doctor_availabilities" DROP CONSTRAINT "doctor_availabilities_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "doctor_availabilities" DROP CONSTRAINT "doctor_availabilities_doctorId_fkey";

-- DropIndex
DROP INDEX "clinics_clinicRegistrationNumber_idx";

-- DropIndex
DROP INDEX "clinics_submittedAt_idx";

-- DropIndex
DROP INDEX "clinics_verifiedById_idx";

-- DropIndex
DROP INDEX "users_freeBookingUsed_idx";

-- AlterTable
ALTER TABLE "doctor_profiles" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "profileStatus" "DoctorProfileStatus" NOT NULL DEFAULT 'INCOMPLETE',
ADD COLUMN     "verificationStatus" "DoctorVerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED';

-- AlterTable
ALTER TABLE "notification_campaigns" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "doctor_availabilities";

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "diagnosis" TEXT,
    "medicines" JSONB NOT NULL,
    "instructions" TEXT,
    "followUpDate" TIMESTAMP(3),
    "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_appointmentId_key" ON "prescriptions"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
