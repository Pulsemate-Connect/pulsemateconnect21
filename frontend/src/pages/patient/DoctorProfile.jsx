import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getDoctorProfile } from '../../api/patient.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BookAppointmentModal from './BookAppointmentModal';
import { getFileUrl } from '../../utils/fileUrl';

/* ── Clinic logo with fallback ───────────────────────────────────────────── */
const ClinicLogo = ({ src, name }) => {
  const [broken, setBroken] = useState(false);
  const url = getFileUrl(src);

  if (!url || broken) {
    return (
      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-lg border border-primary-200">
        {name?.charAt(0)?.toUpperCase() || '🏥'}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${name} logo`}
      className="w-12 h-12 rounded-xl object-contain border border-gray-200 bg-white flex-shrink-0 shadow-sm"
      onError={() => setBroken(true)}
    />
  );
};

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await getDoctorProfile(id);
        setDoctor(res.data.data.doctor);
      } catch (err) {
        navigate('/patient/search');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) return null;

  const handleBook = (clinic) => {
    setSelectedClinic(clinic);
    setShowBookModal(true);
  };

  return (
    <DashboardLayout>
      <div className="page-container max-w-3xl">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 text-sm"
        >
          ← Back to search
        </button>

        {/* Doctor Header */}
        <div className="card mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar / Photo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm bg-primary-50">
              {doctor.profileImage || doctor.profilePhotoUrl ? (
                <img
                  src={doctor.profileImage || doctor.profilePhotoUrl}
                  alt={doctor.user?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className="w-full h-full bg-primary-100 flex items-center justify-center"
                style={{ display: (doctor.profileImage || doctor.profilePhotoUrl) ? 'none' : 'flex' }}
              >
                <span className="text-primary-700 font-bold text-3xl">
                  {doctor.user?.name?.charAt(0) || 'D'}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary">{doctor.user?.name}</h1>
              <p className="text-primary-600 font-medium text-lg">{doctor.specialization}</p>
              <p className="text-text-muted text-sm mt-1">{doctor.education}</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <span>🏆</span>
                  <span>{doctor.experienceYears} years experience</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-text-muted">
                  <span>⏱️</span>
                  <span>~{doctor.avgConsultationMins} min per patient</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {doctor.offlineAvailable && <span className="badge badge-success">Offline Available</span>}
                {doctor.onlineAvailable && <span className="badge badge-info">Online Available</span>}
              </div>
            </div>
          </div>

          {doctor.bio && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-text-muted">{doctor.bio}</p>
            </div>
          )}
        </div>

        {/* Clinics */}
        <div>
          <h2 className="section-title mb-4">Available at Clinics</h2>
          {doctor.doctorClinics?.length === 0 ? (
            <p className="text-text-muted text-sm">No clinic information available</p>
          ) : (
            <div className="space-y-4">
              {doctor.doctorClinics?.map((dc) => (
                <div key={dc.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Clinic logo */}
                      <ClinicLogo src={dc.clinic?.clinicLogoUrl} name={dc.clinic?.name} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary">{dc.clinic?.name}</h3>
                        <p className="text-sm text-text-muted mt-0.5">
                          📍 {dc.clinic?.address}, {dc.clinic?.city}
                        </p>
                        {dc.clinic?.phone && (
                          <p className="text-sm text-text-muted">📞 {dc.clinic.phone}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-text-muted">
                          <span>🕐 {dc.startTime} - {dc.endTime}</span>
                          <span>📅 {dc.availableDays?.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    {dc.clinic?.isVerified && (
                      <span className="badge badge-success flex-shrink-0 ml-2">✓ Verified</span>
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    {doctor.offlineAvailable && (
                      <button
                        onClick={() => handleBook({ ...dc.clinic, doctorClinicId: dc.id, type: 'OFFLINE' })}
                        className="btn-primary flex-1"
                      >
                        Book Offline
                      </button>
                    )}
                    {doctor.onlineAvailable && (
                      <button
                        onClick={() => handleBook({ ...dc.clinic, doctorClinicId: dc.id, type: 'ONLINE' })}
                        className="btn-outline flex-1"
                      >
                        Book Online
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBookModal && selectedClinic && (
        <BookAppointmentModal
          doctor={doctor}
          clinic={selectedClinic}
          defaultType={selectedClinic.type}
          onClose={() => setShowBookModal(false)}
          onSuccess={() => {
            setShowBookModal(false);
            navigate('/patient/appointments');
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default DoctorProfile;
