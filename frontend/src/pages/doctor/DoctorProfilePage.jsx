import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { updateDoctorProfile } from '../../api/doctor.api';
import { getMyCompleteProfile } from '../../api/doctorProfile.api';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const DoctorProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await getMyCompleteProfile();
        const completeProfile = profileRes.data.data;
        setProfile(completeProfile);
        
        // Initialize form with editable fields only
        setFormData({
          consultationFee: completeProfile.consultationFee || 0,
          avgConsultationMins: completeProfile.avgConsultationMins || 10,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInvitationAction = async (inviteId, action) => {
    setInviteLoading(inviteId);
    try {
      await respondToDoctorInvitation(inviteId, action);
      toast.success(
        action === 'ACCEPT'
          ? 'Invitation accepted'
          : action === 'REJECT'
            ? 'Invitation rejected'
            : 'You left the clinic'
      );
      // Refresh with complete profile API
      const [profileRes, invitesRes] = await Promise.all([
        getMyCompleteProfile(), // Changed from getDoctorProfile()
        getMyDoctorInvitations(),
      ]);
      setProfile(profileRes.data.data); // No .profile nesting
      setInvitations(invitesRes.data.data?.invitations || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update invitation');
    } finally {
      setInviteLoading(null);
    }
  };

  const handleEditClick = () => {
    // Only allow editing consultation fee and average duration
    setFormData({
      consultationFee: profile.consultationFee || 0,
      avgConsultationMins: profile.avgConsultationMins || 10,
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.consultationFee || formData.consultationFee < 0) {
      toast.error('Please enter a valid consultation fee');
      return;
    }
    
    if (!formData.avgConsultationMins || formData.avgConsultationMins < 5 || formData.avgConsultationMins > 120) {
      toast.error('Consultation duration must be between 5 and 120 minutes');
      return;
    }
    
    setIsSaving(true);
    try {
      // Only send editable fields to API
      await updateDoctorProfile({
        consultationFee: formData.consultationFee,
        avgConsultationMins: formData.avgConsultationMins,
      });
      
      // Refresh profile
      const res = await getMyCompleteProfile();
      setProfile(res.data.data);
      setIsEditing(false);
      toast.success('Consultation settings updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post('/upload/doctor-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile((p) => ({ ...p, profilePhotoUrl: res.data.data.url })); // Changed from profileImage
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Upload failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          {!isEditing && (
            <button onClick={handleEditClick} className="btn-outline">Edit Profile</button>
          )}
        </div>

        {/* Header card */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile?.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt="Profile" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-2xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </span>
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{user?.name}</h2>
              <p className="text-primary-600 font-medium">{profile?.specialization || 'Doctor'}</p>
              <p className="text-sm text-text-muted">{user?.mobile}</p>
            </div>
          </div>

          {/* Availability badges */}
          <div className="flex gap-2 mt-4">
            <span className={`badge ${profile?.offlineAvailable ? 'badge-success' : 'badge-gray'}`}>
              {profile?.offlineAvailable ? '✓' : '✗'} Offline
            </span>
            <span className={`badge ${profile?.onlineAvailable ? 'badge-info' : 'badge-gray'}`}>
              {profile?.onlineAvailable ? '✓' : '✗'} Online
            </span>
          </div>
        </div>

        {/* Clinics */}
        {profile?.clinics?.length > 0 && (
          <div className="card mb-6">
            <h3 className="font-semibold text-text-primary mb-3">Associated Clinics</h3>
            <div className="space-y-2">
              {profile.clinics.map((clinicAssoc) => (
                <div key={clinicAssoc.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-text-primary text-sm">{clinicAssoc.clinicName}</p>
                    <p className="text-xs text-text-muted">{clinicAssoc.clinicCity}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      clinicAssoc.inviteStatus === 'ACCEPTED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {clinicAssoc.inviteStatus}
                    </span>
                  </div>
                  {clinicAssoc.isActive && (
                    <div className="text-right text-xs text-text-muted">
                      <p>Consultation: ₹{clinicAssoc.consultationFee || profile.consultationFee}</p>
                      <p className="text-green-600 font-medium">Active</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card mb-6">
          <h3 className="font-semibold text-text-primary mb-3">Clinic Associations</h3>
          {(!profile?.clinics || profile.clinics.length === 0) ? (
            <p className="text-sm text-text-muted">No clinic associations yet. Approved clinics can invite you to join them.</p>
          ) : (
            <p className="text-sm text-text-success">You are associated with {profile.clinics.length} clinic{profile.clinics.length !== 1 ? 's' : ''}.</p>
          )}
        </div>

        {/* Profile form - ONLY CONSULTATION SETTINGS EDITABLE */}
        <div className="card">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="font-semibold text-text-primary mb-3 pb-2 border-b">Edit Consultation Settings</h3>
              <p className="text-sm text-text-muted mb-4">
                Only consultation fee and average duration can be updated. Other profile details are set during registration and verified by admin.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.consultationFee || 0}
                    onChange={(e) => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step="50"
                    required
                  />
                  <p className="text-xs text-text-muted mt-1">Enter your consultation fee</p>
                </div>
                <div>
                  <label className="label">Avg. Consultation Duration (minutes) *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.avgConsultationMins || 10}
                    onChange={(e) => setFormData({ ...formData, avgConsultationMins: parseInt(e.target.value) || 10 })}
                    min={5}
                    max={120}
                    step="5"
                    required
                  />
                  <p className="text-xs text-text-muted mt-1">Typical appointment length</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            // VIEW MODE - Display all onboarding data
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Full Legal Name</p>
                    <p className="text-text-primary mt-0.5 text-sm">{profile?.fullLegalName || user?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Date of Birth</p>
                    <p className="text-text-primary mt-0.5 text-sm">
                      {profile?.dateOfBirth 
                        ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })
                        : '—'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Gender</p>
                    <p className="text-text-primary mt-0.5 text-sm">{profile?.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Mobile</p>
                    <p className="text-text-primary mt-0.5 text-sm flex items-center gap-2">
                      {profile?.maskedMobile || user?.mobile || '—'}
                      {profile?.isPhoneVerified && <span className="text-green-600 text-xs">✓ Verified</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Email</p>
                    <p className="text-text-primary mt-0.5 text-sm flex items-center gap-2">
                      {profile?.maskedEmail || '—'}
                      {profile?.isEmailVerified && <span className="text-green-600 text-xs">✓ Verified</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Information Section - INCLUDING REGISTRATION NUMBER */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Professional Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Medical System</p>
                    <p className="text-text-primary mt-0.5 text-sm">{profile?.medicalSystem || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Qualification</p>
                    <p className="text-text-primary mt-0.5 text-sm">{profile?.qualification || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Specialization</p>
                    <p className="text-text-primary mt-0.5 text-sm">{profile?.specialization || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Experience</p>
                    <p className="text-text-primary mt-0.5 text-sm">
                      {profile?.experienceYears ? `${profile.experienceYears} years` : '—'}
                    </p>
                  </div>
                  {/* REGISTRATION DETAILS - VISIBLE TO DOCTOR */}
                  <div className="sm:col-span-2 pt-2 border-t">
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Medical Registration Number</p>
                    <p className="text-text-primary mt-0.5 text-sm font-mono">{profile?.medicalRegistrationNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Registration Authority</p>
                    <p className="text-text-primary mt-0.5 text-sm">{profile?.registrationAuthority || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Registration Year</p>
                    <p className="text-text-primary mt-0.5 text-sm">{profile?.registrationYear || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Document Verification Status */}
              {profile?.documentStatus && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Document Verification</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(profile.documentStatus).map(([key, status]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          status === 'Verified' || status === 'Submitted' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Experience */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Professional Experience</h4>
                <div className="space-y-3">
                  {profile?.languagesKnown && profile.languagesKnown.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Languages Known</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.languagesKnown.map((lang) => (
                          <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile?.areasOfExpertise && profile.areasOfExpertise.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Areas of Expertise</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.areasOfExpertise.map((area) => (
                          <span key={area} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile?.bio && (
                    <div>
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Professional Bio</p>
                      <p className="text-text-primary mt-1 text-sm leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Consultation Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Consultation Fee</p>
                    <p className="text-text-primary mt-0.5 text-sm">
                      {profile?.consultationFee ? `₹${profile.consultationFee}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Average Duration</p>
                    <p className="text-text-primary mt-0.5 text-sm">
                      {profile?.avgConsultationMins ? `${profile.avgConsultationMins} minutes` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              {profile?.verificationStatus && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">Verification Status</h4>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        profile.verificationStatus === 'VERIFIED'
                          ? 'bg-green-100 text-green-700'
                          : profile.verificationStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {profile.verificationStatus}
                      </span>
                      {profile.verificationStatus === 'VERIFIED' && (
                        <span className="text-green-600 text-sm">✓ PulseMate Verified Doctor</span>
                      )}
                    </div>
                    {profile.profileCompletion && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Profile Completion</span>
                          <span>{profile.profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${profile.profileCompletion}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfilePage;
