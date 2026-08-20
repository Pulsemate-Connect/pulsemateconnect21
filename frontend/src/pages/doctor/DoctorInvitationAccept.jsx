import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building2, MapPin, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DoctorInvitationAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/doctor/invitation/${token}`);
      setInvitation(response.data.data.invitation);
      setError(null);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError(err.response?.data?.message || 'Invalid or expired invitation link');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setSubmitting(true);
      const response = await axios.post(`${API_URL}/api/doctor/invitation/${token}/accept`);
      
      toast.success('Invitation accepted! Please verify your contact details.');
      
      // Redirect to verification page
      navigate(`/doctor/verification/${token}`, {
        state: { invitation: response.data.data.invitation }
      });
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/doctor/invitation/${token}/decline`);
      
      toast.success('Invitation declined');
      navigate('/');
    } catch (err) {
      console.error('Error declining invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (invitation.status === 'INVITATION_ACCEPTED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted</h1>
          <p className="text-gray-600 mb-6">
            You have already accepted this invitation. Please verify your mobile number and email to continue.
          </p>
          <button
            onClick={() => navigate(`/doctor/verification/${token}`)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Verify Mobile & Email
          </button>
        </div>
      </div>
    );
  }

  if (invitation.status === 'INVITATION_DECLINED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Declined</h1>
          <p className="text-gray-600 mb-6">This invitation has been declined.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (invitation.status === 'INVITATION_EXPIRED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h1>
          <p className="text-gray-600 mb-6">This invitation has expired. Please contact the clinic for a new invitation.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">🏥 Clinic Invitation</h1>
            <p className="text-blue-100">You've been invited to join a clinic on PulseMate</p>
          </div>

          <div className="p-8">
            {/* Doctor Info */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hello, Dr. {invitation.doctorName}!</h2>
              <p className="text-gray-600 mb-4">
                <strong>{invitation.clinic.name}</strong> has invited you to join their clinic on PulseMate Connect.
              </p>
            </div>

            {/* Clinic Details */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mb-8">
              <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Clinic Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Clinic Name:</span>
                  <span className="ml-2 text-gray-900">{invitation.clinic.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-900">
                      {invitation.clinic.address}, {invitation.clinic.city}
                      {invitation.clinic.state && `, ${invitation.clinic.state}`}
                    </span>
                  </div>
                </div>
                {invitation.specialization && (
                  <div>
                    <span className="font-semibold text-gray-700">Role:</span>
                    <span className="ml-2 text-gray-900">{invitation.specialization}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Next Steps After Accepting:
              </h3>
              <ol className="space-y-2 text-sm text-green-800 ml-6">
                <li className="list-decimal">Complete your professional profile with credentials</li>
                <li className="list-decimal">Upload required documents (certificates, registration)</li>
                <li className="list-decimal">Submit for PulseMate admin verification</li>
                <li className="list-decimal">Once verified, you'll be active at this clinic</li>
              </ol>
            </div>

            {/* Important Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-sm font-semibold text-yellow-900 mb-3">💡 Important:</h3>
              <ul className="space-y-2 text-sm text-yellow-800 ml-6">
                <li className="list-disc">You will provide your own professional credentials and documents</li>
                <li className="list-disc">PulseMate admin will verify your qualifications before activation</li>
                <li className="list-disc">This ensures patient safety and trust</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAccept}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Accept Invitation
                  </>
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Decline
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-center text-sm text-gray-500 mt-6">
              If you did not expect this invitation, you can safely decline it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorInvitationAccept;
