import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as LucideIcons from 'lucide-react';
import { step4Schema } from '../../../../utils/validation/step4Schema';
import OnboardingLayout from '../components/OnboardingLayout';
import BottomActionBar from '../components/BottomActionBar';
import TermsCard from '../components/sections/TermsCard';
import axios from '../../../../api/axios'; // ✅ FIX: Import axios for authentication

const Step4PartnerAgreement = () => {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(step4Schema),
    defaultValues: {
      confirmAuthorized: false,
      termsAccepted: false,
      confirmAccurate: false,
      confirmCompliance: false,
    },
    mode: 'onChange',
  });

  const allChecked = 
    watch('confirmAuthorized') && 
    watch('termsAccepted') && 
    watch('confirmAccurate') && 
    watch('confirmCompliance');

  const onSubmit = async (data) => {
    try {
      console.log('Partner Agreement Form Data:', data);
      
      // ✅ FIX: Use axios instead of fetch to include authentication headers
      const response = await axios.post('/auth/clinic-owner/submit-application', {
        termsAccepted: data.termsAccepted,
        confirmAuthorized: data.confirmAuthorized,
        confirmAccurate: data.confirmAccurate,
        confirmCompliance: data.confirmCompliance,
        termsAcceptedAt: new Date().toISOString(),
        agreementVersion: 'v1.0-draft', // Track agreement version
      });

      console.log('[PartnerAgreement] Application submitted:', response.data);
      
      // Mark as submitted
      setIsSubmitted(true);
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to submit application');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to a confirmation page or dashboard
    navigate('/clinic/onboarding/success');
  };

  const isNextDisabled = !allChecked || Object.keys(errors).length > 0;

  return (
    <OnboardingLayout currentStep={4} completedSteps={isSubmitted ? [1, 2, 3, 4] : [1, 2, 3]}>
      {/* Full Screen Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-md mx-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-semibold text-gray-900">Submitting your application...</p>
            <p className="text-sm text-gray-600 text-center">
              Please wait while we process your clinic partner registration
            </p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in duration-300">
            <div className="text-center space-y-4">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <LucideIcons.CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>

              {/* Success Message */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Application Submitted Successfully!
                </h2>
                <p className="text-sm text-gray-600">
                  Thank you for partnering with PulseMate Connect
                </p>
              </div>

              {/* What's Next */}
              <div className="bg-blue-50 rounded-xl p-4 text-left">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <LucideIcons.Clock className="w-4 h-4" />
                  What happens next?
                </h3>
                <ul className="space-y-2 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <LucideIcons.FileSearch className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Our team will verify your information within 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LucideIcons.Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>You'll receive an email once your application is approved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LucideIcons.Rocket className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>After approval, you can start accepting patient appointments</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <LucideIcons.ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">
            Partner Agreement
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Final step: Review and accept our partner agreement to complete your registration
          </p>
        </div>

        {/* Terms Card */}
        <TermsCard 
          register={register}
          watch={watch}
          errors={errors}
          setValue={setValue}
        />

        {/* Bottom spacing for fixed action bar */}
        <div className="h-8" />
      </form>

      {/* Bottom Action Bar */}
      <BottomActionBar
        onSaveAndExit={() => navigate('/clinic/dashboard')}
        onNext={handleSubmit(onSubmit)}
        isNextDisabled={isNextDisabled}
        isSubmitting={isSubmitting}
        nextButtonText="Submit"
        nextButtonIcon="Send"
      />
    </OnboardingLayout>
  );
};

export default Step4PartnerAgreement;
