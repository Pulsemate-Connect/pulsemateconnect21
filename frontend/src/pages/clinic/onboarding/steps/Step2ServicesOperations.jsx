import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { step2Schema } from '../../../../utils/validation/step2Schema';
import OnboardingLayout from '../components/OnboardingLayout';
import BottomActionBar from '../components/BottomActionBar';
import ServicesCard from '../components/sections/ServicesCard';
import OperatingHoursCard from '../components/sections/OperatingHoursCard';
import AppointmentModeCard from '../components/sections/AppointmentModeCard';

const Step2ServicesOperations = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(step2Schema),
    defaultValues: {
      specialties: [],
      specialtyOther: '',
      consultationTypes: [],
      openingTime: '',
      closingTime: '',
      weeklyOffDays: [],
      appointmentMode: '',
    },
    mode: 'onChange',
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('clinic_onboarding_step2');
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
        localStorage.setItem('clinic_onboarding_step2', JSON.stringify(formData));
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
      console.log('Services & Operations Form Data:', data);
      
      // Save Step 2 data to database
      const response = await fetch('/api/auth/clinic-owner/save-services-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save services & operations');
      }

      console.log('[ServicesOperations] Data saved to database:', result);
      toast.success('Services & operations saved successfully!');
      
      // Clear localStorage for this step since it's now in database
      localStorage.removeItem('clinic_onboarding_step2');
      
      // Navigate to Step 3
      navigate('/clinic/onboarding/step-3');
      
    } catch (error) {
      console.error('Failed to submit Services & Operations:', error);
      toast.error(error.message || 'Failed to save services & operations');
    }
  };

  const isNextDisabled = Object.keys(errors).length > 0;

  return (
    <OnboardingLayout currentStep={2} completedSteps={[1]}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">
            Services & Operations
          </h1>
        </div>

        {/* Section 1: Services Offered */}
        <ServicesCard 
          register={register} 
          errors={errors} 
          watch={watch}
        />

        {/* Section 2: Operating Hours */}
        <OperatingHoursCard
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />

        {/* Section 3: Appointment Mode */}
        <AppointmentModeCard
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

export default Step2ServicesOperations;
