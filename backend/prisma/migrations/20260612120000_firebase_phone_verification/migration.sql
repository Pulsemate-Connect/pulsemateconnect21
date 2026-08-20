-- CreateTable
CREATE TABLE "firebase_phone_verifications" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firebase_phone_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "firebase_phone_verifications_mobile_purpose_idx" ON "firebase_phone_verifications"("mobile", "purpose");
