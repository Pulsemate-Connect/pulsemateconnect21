import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useOnboardingStatus from '../../hooks/useOnboardingStatus';
import toast from 'react-hot-toast';

/**
 * OnboardingGuard - Enforces sequential doctor onboarding flow
 * 
 * This component ensures doctors can only access routes that match their current onboarding status.
 * It prevents step skipping and URL manipulation by validating backend status.
 * 
 * @param {Object} props
 * @param {string} props.requiredStatus - The onboarding status required to access this route
 * @param {JSX.Element} props.children - The component to render if access is granted
 * @param {string} props.routePath - Current route path (for validation)
 * 
 * @example
 * <OnboardingGuard requiredStatus="PROFILE_IN_PROGRESS" routePath="/doctor/profile/complete/:token">
 *   <DoctorProfileCompletion />
 * </OnboardingGuard>
 */
const OnboardingGuard = ({ requiredStatus, children, routePath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, loading, error, onboardingStatus, correctRoute, nextStep } = useOnboardingStatus();

  useEffect(() => {
    // Wait for status to load
    if (loading) return;

    // Handle errors
    if (error) {
      console.error('[OnboardingGuard] Error:', error);
      toast.error('Failed to verify onboarding status');
      // Don't redirect on error, allow manual retry
      return;
    }

    // If no status found, user might not be authenticated or no invitation
    if (!status || !onboardingStatus) {
      console.warn('[OnboardingGuard] No onboarding status found');
      // Allow the page to handle this (e.g., redirect to login)
      return;
    }

    // Check if current status matches required status
    if (onboardingStatus !== requiredStatus) {
      console.warn(`[OnboardingGuard] Status mismatch: current=${onboardingStatus}, required=${requiredStatus}`);
      
      // Show user-friendly message
      const statusMessages = {
        INVITATION_ACCEPTED: 'Please verify your mobile number first',
        MOBILE_VERIFIED: 'Please verify your email address',
        PROFILE_IN_PROGRESS: 'Please complete your professional profile',
        CREDENTIALS_PENDING: 'Please submit your credentials for verification',
        VERIFICATION_PENDING: 'Your profile is under review by PulseMate admin',
        CHANGES_REQUIRED: 'Please update your profile as requested by admin',
        REJECTED: 'Your application was rejected. Please contact support',
        VERIFIED: 'Your profile is verified! You can now access the clinic',
      };

      toast.error(statusMessages[onboardingStatus] || 'You cannot access this step yet');

      // Redirect to correct route based on backend response
      if (correctRoute && correctRoute !== location.pathname) {
        console.log(`[OnboardingGuard] Redirecting to correct route: ${correctRoute}`);
        setTimeout(() => {
          navigate(correctRoute, { replace: true });
        }, 1000);
      }
    }
  }, [loading, error, status, onboardingStatus, requiredStatus, correctRoute, location.pathname, navigate]);

  // Show loading spinner while checking status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your onboarding status...</p>
        </div>
      </div>
    );
  }

  // Show error state (but allow manual retry)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <p className="font-semibold text-lg">Unable to Verify Status</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No status found (not authenticated or no invitation)
  if (!status || !onboardingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">No active onboarding found</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Status matches required status - allow access
  if (onboardingStatus === requiredStatus) {
    return <>{children}</>;
  }

  // Status mismatch - show waiting message while redirect happens
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to the correct step...</p>
        <p className="text-sm text-gray-500 mt-2">Current step: {nextStep}</p>
      </div>
    </div>
  );
};

export default OnboardingGuard;
