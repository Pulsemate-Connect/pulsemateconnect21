-- Verify new tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('doctor_invitations', 'doctor_verification_documents', 'doctor_verification_logs')
ORDER BY table_name;

-- Verify new columns in doctor_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'doctor_profiles'
    AND column_name IN ('fullLegalName', 'dateOfBirth', 'medicalSystem', 'registrationAuthority', 
                        'registrationYear', 'profilePhotoUrl', 'invitationId', 
                        'profileCompletionPercentage', 'profileSubmittedAt', 'lastEditedAt')
ORDER BY column_name;

-- Verify new columns in clinic_doctors
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'clinic_doctors'
    AND column_name IN ('invitationAcceptedAt', 'verificationSubmittedAt', 'adminVerifiedAt', 
                        'adminVerifiedById', 'changesRequestedAt', 'changesRequestedReason')
ORDER BY column_name;
