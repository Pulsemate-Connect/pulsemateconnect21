import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

const OnboardingSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
              <LucideIcons.CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Registration Complete! 🎉
            </h1>
            <p className="text-xl text-gray-600">
              Your clinic partner application has been submitted successfully
            </p>
          </div>

          {/* Application Status */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <LucideIcons.Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Application Status: Under Review
                </h3>
                <p className="text-sm text-blue-700">
                  Expected review time: 24-48 hours
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <LucideIcons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Step 1: Application Received ✓</p>
                  <p className="text-gray-600">Your information has been saved successfully</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Step 2: Document Verification (In Progress)</p>
                  <p className="text-gray-600">Our team is reviewing your clinic documents</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 mt-0.5"></div>
                <div>
                  <p className="font-semibold text-gray-700">Step 3: Approval</p>
                  <p className="text-gray-600">You'll receive email notification once approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LucideIcons.Sparkles className="w-5 h-5 text-yellow-500" />
              What happens next?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <LucideIcons.Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Email Confirmation</p>
                  <p className="text-sm text-gray-600">Check your inbox for a confirmation email with your application details</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <LucideIcons.FileSearch className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Review Process</p>
                  <p className="text-sm text-gray-600">Our verification team will review your documents and information</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <LucideIcons.Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Approval Notification</p>
                  <p className="text-sm text-gray-600">You'll receive an email when your account is approved (usually within 48 hours)</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <LucideIcons.Rocket className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Start Accepting Bookings</p>
                  <p className="text-sm text-gray-600">Once approved, you can immediately start receiving patient appointments</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Important Information */}
          <div className="bg-amber-50 rounded-xl p-4 mb-8 border border-amber-200">
            <div className="flex items-start gap-3">
              <LucideIcons.Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Important Information
                </p>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Please ensure your email and phone are accessible for updates</li>
                  <li>• Keep your documents ready in case we need additional verification</li>
                  <li>• You can check your application status anytime from your dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Need Help?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <LucideIcons.Mail className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">partner@pulsemateconnect.com</span>
              </div>
              <div className="flex items-center gap-2">
                <LucideIcons.Phone className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">+91-XXXX-XXXXXX</span>
              </div>
              <div className="flex items-center gap-2">
                <LucideIcons.Clock className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">Mon-Sat, 9 AM - 6 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <LucideIcons.MessageCircle className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">Live Chat Support</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/clinic/dashboard')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <LucideIcons.LayoutDashboard className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-300 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <LucideIcons.Home className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Thank you for choosing PulseMate Connect! We're excited to have you as a partner. 💙
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccess;
