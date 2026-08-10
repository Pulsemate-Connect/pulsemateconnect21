import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { step1Schema } from '../../../../utils/validation/clinicOnboardingSchema';
import OnboardingLayout from '../components/OnboardingLayout';
import BottomActionBar from '../components/BottomActionBar';
import ClinicDetailsCard from '../components/sections/ClinicDetailsCard';
import OwnerDetailsCard from '../components/sections/OwnerDetailsCard';
import PrimaryContactCard from '../components/sections/PrimaryContactCard';
import ClinicLocationCard from '../components/sections/ClinicLocationCard';
import AddressDetailsCard from '../components/sections/AddressDetailsCard';

const Step1ClinicInfo = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(step1Schema),
    defaultValues: {
      clinicName: '',
      clinicType: '',
      clinicTypeOther: '',
      displayName: '',
      ownerName: '',
      ownerEmail: '',
      ownerMobile: '',
      mobileVerified: false,
      sameAsOwner: true,
      primaryContactPhone: '',
      latitude: null,
      longitude: null,
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('clinic_onboarding_step1');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach(key => {
          setValue(key, parsed[key]);
        });
        toast.success('Restored your previous progress');
      } catch (error) {
        console.error('Failed to restore saved data:', error);
      }
    }
  }, [setValue]);

  // Auto-save to localStorage on form changes
  useEffect(() => {
    const subscription = watch((formData) => {
      try {
        localStorage.setItem('clinic_onboarding_step1', JSON.stringify(formData));
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
      console.log('Step 1 Form Data:', data);
      
      // TODO: Call API to save Step 1 data
      // await saveStep1Data(data);
      
      toast.success('Clinic information saved successfully!');
      
      // Clear localStorage for this step
      localStorage.removeItem('clinic_onboarding_step1');
      
      // Navigate to Step 2
      // navigate('/clinic/onboarding/step-2');
      
      // For now, just show success
      toast.success('Step 1 completed! (Step 2 coming soon)');
      
    } catch (error) {
      console.error('Failed to submit Step 1:', error);
      toast.error(error.response?.data?.message || 'Failed to save clinic information');
    }
  };

  const isNextDisabled = Object.keys(errors).length > 0 || !watch('mobileVerified');

  return (
    <OnboardingLayout currentStep={1} completedSteps={[]}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto py-12 space-y-8">
        {/* Page Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Clinic Information
          </h1>
          <p className="text-base text-gray-600">
            Tell us about your clinic so we can create your PulseMate Connect profile.
          </p>
        </div>

        {/* Section 1: Clinic Details */}
        <ClinicDetailsCard 
          register={register} 
          errors={errors} 
          watch={watch}
        />

        {/* Section 2: Owner Details */}
        <OwnerDetailsCard
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {/* Section 3: Primary Contact */}
        <PrimaryContactCard
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {/* Section 4: Clinic Location */}
        <ClinicLocationCard
          setValue={setValue}
          watch={watch}
          errors={errors}
        />

        {/* Section 5: Address Details */}
        <AddressDetailsCard
          register={register}
          errors={errors}
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

export default Step1ClinicInfo;
