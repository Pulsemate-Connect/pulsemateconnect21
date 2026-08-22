import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { step3Schema } from '../../../../utils/validation/step3Schema';
import OnboardingLayout from '../components/OnboardingLayout';
import BottomActionBar from '../components/BottomActionBar';
import MandatoryDocumentsCard from '../components/sections/MandatoryDocumentsCard';
import OptionalDocumentsCard from '../components/sections/OptionalDocumentsCard';
import AdditionalInfoCard from '../components/sections/AdditionalInfoCard';
import axios from '../../../../api/axios'; // ✅ FIX: Import axios for authentication

const Step3ClinicDocuments = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(step3Schema),
    defaultValues: {
      clinicRegistrationCertificate: null,
      medicalLicense: null,
      ownerIdProof: null,
      gstCertificate: null,
      clinicLogo: null,
      clinicExterior: null,
      clinicReception: null,
      clinicConsultation: null,
      clinicRegistrationNumber: '',
      gstNumber: '',
    },
    mode: 'onChange',
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('clinic_onboarding_step3');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Only restore text fields, not file objects (they can't be serialized)
        if (parsed.clinicRegistrationNumber) setValue('clinicRegistrationNumber', parsed.clinicRegistrationNumber);
        if (parsed.gstNumber) setValue('gstNumber', parsed.gstNumber);
        
        toast.success('Restored your previous progress');
      } catch (error) {
        console.error('Failed to restore saved data:', error);
      }
    }
  }, [setValue]);

  // Auto-save to localStorage on form changes (text fields only)
  useEffect(() => {
    const subscription = watch((formData) => {
      try {
        // Only save text fields, not file objects
        const textFieldsOnly = {
          clinicRegistrationNumber: formData.clinicRegistrationNumber,
          gstNumber: formData.gstNumber,
        };
        localStorage.setItem('clinic_onboarding_step3', JSON.stringify(textFieldsOnly));
      } catch (error) {
        console.error('Failed to save form data:', error);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleSaveAndExit = async () => {
    try {
      const formData = watch();
      
      // TODO: Call API to save progress
      // await saveOnboardingProgress(formData);
      
      toast.success('Progress saved successfully');
      navigate('/clinic/dashboard');
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log('Clinic Documents Form Data:', data);
      
      // TODO: Upload files to cloud storage (Cloudinary)
      // For now, we'll create a FormData object
      const formData = new FormData();
      
      // Append files
      if (data.clinicRegistrationCertificate) {
        formData.append('clinicRegistrationCertificate', data.clinicRegistrationCertificate);
      }
      if (data.medicalLicense) {
        formData.append('medicalLicense', data.medicalLicense);
      }
      if (data.ownerIdProof) {
        formData.append('ownerIdProof', data.ownerIdProof);
      }
      if (data.gstCertificate) {
        formData.append('gstCertificate', data.gstCertificate);
      }
      
      // Append individual clinic photos
      if (data.clinicLogo) {
        formData.append('clinicLogo', data.clinicLogo);
      }
      if (data.clinicExterior) {
        formData.append('clinicExterior', data.clinicExterior);
      }
      if (data.clinicReception) {
        formData.append('clinicReception', data.clinicReception);
      }
      if (data.clinicConsultation) {
        formData.append('clinicConsultation', data.clinicConsultation);
      }
      
      // Append text fields
      formData.append('clinicRegistrationNumber', data.clinicRegistrationNumber);
      if (data.gstNumber) formData.append('gstNumber', data.gstNumber);

      // ✅ FIX: Use axios instead of fetch to include authentication headers
      // Note: axios automatically detects FormData and sets correct Content-Type
      const response = await axios.post('/auth/clinic-owner/save-clinic-documents', formData);

      console.log('[ClinicDocuments] Data saved to database:', response.data);
      
      // Clear localStorage for this step since it's now in database
      localStorage.removeItem('clinic_onboarding_step3');
      
      // Navigate to Step 4
      toast.success('Documents uploaded successfully!');
      navigate('/clinic/onboarding/step-4');
      
    } catch (error) {
      console.error('Failed to submit Clinic Documents:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save clinic documents');
    }
  };

  const isNextDisabled = Object.keys(errors).length > 0;

  return (
    <OnboardingLayout currentStep={3} completedSteps={[1, 2]}>
      {/* Full Screen Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-semibold text-gray-900">Uploading documents...</p>
            <p className="text-sm text-gray-600">Please wait while we save your information</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">
            Clinic Documents
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Upload required documents to verify your clinic
          </p>
        </div>

        {/* Section 1: Mandatory Documents */}
        <MandatoryDocumentsCard 
          setValue={setValue}
          watch={watch}
          errors={errors}
        />

        {/* Section 2: Optional Documents */}
        <OptionalDocumentsCard
          setValue={setValue}
          watch={watch}
          errors={errors}
        />

        {/* Section 3: Additional Information */}
        <AdditionalInfoCard
          register={register}
          errors={errors}
          watch={watch}
        />

        {/* Validation Summary (if errors exist) */}
        {Object.keys(errors).length > 0 && (
          <div className="p-6 bg-red-50 rounded-2xl border-2 border-red-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  Please fix the following errors before proceeding:
                </p>
                <ul className="space-y-1 text-sm text-red-700">
                  {Object.entries(errors).map(([key, error]) => (
                    <li key={key} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bottom spacing for fixed action bar */}
        <div className="h-8" />
      </form>

      {/* Bottom Action Bar */}
      <BottomActionBar
        onSaveAndExit={handleSaveAndExit}
        onNext={handleSubmit(onSubmit)}
        isNextDisabled={isNextDisabled}
        isSubmitting={isSubmitting}
      />
    </OnboardingLayout>
  );
};

export default Step3ClinicDocuments;
