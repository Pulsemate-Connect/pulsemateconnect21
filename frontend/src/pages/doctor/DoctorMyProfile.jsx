/**
 * Doctor My Profile Page
 * Doctor's private professional dashboard showing complete information
 * 
 * Security: Only accessible by logged-in doctor
 * Shows: Personal info, professional info, registration details, documents, verification status
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyCompleteProfile } from '../../api/doctorProfile.api';

// Components
import ProfileHeader from '../../components/doctor/profile/ProfileHeader';
import PersonalInfoCard from '../../components/doctor/profile/PersonalInfoCard';
import ProfessionalInfoCard from '../../components/doctor/profile/ProfessionalInfoCard';
import DocumentStatusCard from '../../components/doctor/profile/DocumentStatusCard';
import ProfessionalExperienceCard from '../../components/doctor/profile/ProfessionalExperienceCard';
import BioEditorCard from '../../components/doctor/profile/BioEditorCard';
import ConsultationInfoCard from '../../components/doctor/profile/ConsultationInfoCard';
import ClinicAssociationsCard from '../../components/doctor/profile/ClinicAssociationsCard';
import VerificationStatusBanner from '../../components/doctor/profile/VerificationStatusBanner';
import ProfileCompletionCard from '../../components/doctor/profile/ProfileCompletionCard';

const DoctorMyProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await getMyCompleteProfile();
      setProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile');
      if (error.response?.status === 401) {
        navigate('/login/doctor');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleProfileUpdate = () => {
    // Refresh profile after update
    handleRefresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Professional Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage your professional information
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Status Banner */}
        {profile.verificationStatus !== 'VERIFIED' && (
          <div className="mb-6">
            <VerificationStatusBanner
              status={profile.verificationStatus}
              approvalStatus={profile.approvalStatus}
              rejectionReason={profile.invitation?.rejectionReason}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <ProfileHeader
              fullLegalName={profile.fullLegalName}
              profilePhotoUrl={profile.profilePhotoUrl}
              qualification={profile.qualification}
              specialization={profile.specialization}
              medicalSystem={profile.medicalSystem}
              verificationStatus={profile.verificationStatus}
              clinics={profile.clinics}
            />

            {/* Personal Information */}
            <PersonalInfoCard
              fullLegalName={profile.fullLegalName}
              dateOfBirth={profile.dateOfBirth}
              gender={profile.gender}
              mobile={profile.mobile}
              maskedMobile={profile.maskedMobile}
              email={profile.email}
              maskedEmail={profile.maskedEmail}
              isPhoneVerified={profile.isPhoneVerified}
              isEmailVerified={profile.isEmailVerified}
            />

            {/* Professional Information - includes registration number */}
            <ProfessionalInfoCard
              medicalSystem={profile.medicalSystem}
              qualification={profile.qualification}
              specialization={profile.specialization}
              medicalRegistrationNumber={profile.medicalRegistrationNumber}
              registrationAuthority={profile.registrationAuthority}
              registrationYear={profile.registrationYear}
              experienceYears={profile.experienceYears}
            />

            {/* Document Verification Status */}
            <DocumentStatusCard
              documentStatus={profile.documentStatus}
              documents={profile.documents}
            />

            {/* Professional Experience */}
            <ProfessionalExperienceCard
              experienceYears={profile.experienceYears}
              areasOfExpertise={profile.areasOfExpertise}
              languagesKnown={profile.languagesKnown}
            />

            {/* Professional Bio (Editable) */}
            <BioEditorCard
              bio={profile.bio}
              onUpdate={handleProfileUpdate}
            />

            {/* Consultation Information */}
            <ConsultationInfoCard
              consultationFee={profile.consultationFee}
              avgConsultationMins={profile.avgConsultationMins}
              onlineAvailable={profile.onlineAvailable}
              offlineAvailable={profile.offlineAvailable}
              onUpdate={handleProfileUpdate}
            />

            {/* Clinic Associations */}
            <ClinicAssociationsCard clinics={profile.clinics} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <ProfileCompletionCard
              profileCompletion={profile.profileCompletion}
              profile={profile}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>View Appointments</span>
                </button>

                <button
                  onClick={() => navigate('/doctor/schedule')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Manage Schedule</span>
                </button>

                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">
                Contact support if you need assistance with your profile or verification.
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorMyProfile;
