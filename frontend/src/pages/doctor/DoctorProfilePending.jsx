import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Mail, Phone } from 'lucide-react';

const DoctorProfilePending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.message || 'Your profile is pending verification.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Submitted!</h1>
          <p className="text-lg text-gray-600">{message}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            What Happens Next?
          </h2>
          <ol className="space-y-3 text-blue-800">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>Our admin team will review your profile and documents</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>We'll verify your medical registration and qualifications</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>You'll receive an email and SMS once your profile is verified</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>After verification, you'll be active at the clinic and visible to patients</span>
            </li>
          </ol>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Verification Timeline</h3>
          <p className="text-sm text-gray-600 mb-4">
            Our verification process typically takes <strong>1-3 business days</strong>. You'll be notified via email and SMS as soon as your profile is reviewed.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>Email Notification</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>SMS Notification</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2">Need to Make Changes?</h3>
          <p className="text-sm text-yellow-800">
            If you need to update your profile before verification, please contact the clinic owner who invited you or email us at <a href="mailto:support@pulsemateconnect.in" className="text-yellow-900 underline font-medium">support@pulsemateconnect.in</a>
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Go to Home
          </button>
          <button
            onClick={() => navigate('/login/doctor')}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Login to Portal
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Thank you for joining PulseMate Connect! We'll notify you soon.
        </p>
      </div>
    </div>
  );
};

export default DoctorProfilePending;
