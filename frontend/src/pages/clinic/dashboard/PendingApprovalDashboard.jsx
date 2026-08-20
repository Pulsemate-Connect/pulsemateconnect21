import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';

const PendingApprovalDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">PM</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">PulseMate Connect</h1>
              <p className="text-sm text-gray-500">Clinic Partner Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pending Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Status Banner */}
          <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-yellow-900">Application Pending Review</h2>
                <p className="text-sm text-yellow-700 mt-1">Your clinic partner application is currently under review by our admin team.</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* User Info */}
            <div className="mb-8 pb-6 border-b">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Application Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-base font-medium text-gray-900">{user?.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900">{user?.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="text-base font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending Review
                  </span>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-gray-900 mb-4">What Happens Next?</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">1</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Application Review</p>
                    <p className="text-sm text-gray-600 mt-1">Our admin team will review your clinic registration details and uploaded documents.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">2</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Verification</p>
                    <p className="text-sm text-gray-600 mt-1">We'll verify your clinic's registration certificates and medical licenses.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">3</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approval & Onboarding</p>
                    <p className="text-sm text-gray-600 mt-1">Once approved, you'll receive an email and can access the full clinic dashboard to manage appointments.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-blue-50 rounded-lg px-4 py-3 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Expected Review Time</p>
                  <p className="text-sm text-blue-700 mt-1">Typically 1-3 business days. We'll notify you via email once a decision is made.</p>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="border-t pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you have questions about your application or need to make changes, please contact our support team.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:support@pulsemateconnect.com"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Support
                </a>
                <a
                  href="tel:+911234567890"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You'll be automatically redirected to the full dashboard once your application is approved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PendingApprovalDashboard;
