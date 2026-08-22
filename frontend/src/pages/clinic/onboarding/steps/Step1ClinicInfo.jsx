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
import useAuthStore from '../../../../store/authStore';

const Step1ClinicInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Get authenticated user
  
  // Track which address fields are auto-filled (read-only)
  const [autoFilledFields, setAutoFilledFields] = React.useState({
    city: false,
    pincode: false,
    state: false,
  });
  
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
      locality: '',
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
    // Clear any stale mobile verification data from previous sessions
    // This ensures mobile number field starts fresh
    const clearStaleData = () => {
      const keysToCheck = [
        'clinic_onboarding_verified_numbers',
        'clinic_onboarding_editing_mode'
      ];
      
      keysToCheck.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`[Step1] Cleared stale localStorage key: ${key}`);
        }
      });
    };
    
    clearStaleData();
    
    const savedData = localStorage.getItem('clinic_onboarding_step1');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach(key => {
          // Don't override email or mobile from localStorage - always use fresh data
          // Email comes from authenticated user, mobile must be entered fresh
          if (key !== 'ownerEmail' && key !== 'ownerMobile' && key !== 'mobileVerified') {
            setValue(key, parsed[key]);
          }
        });
        toast.success('Restored your previous progress');
      } catch (error) {
        console.error('Failed to restore saved data:', error);
      }
    }
    
    // Pre-fill owner details from authenticated user (email and name only, NOT mobile)
    if (user) {
      if (user.email) {
        setValue('ownerEmail', user.email);
        console.log('[Step1] Pre-filled owner email from auth:', user.email);
      }
      if (user.name) {
        setValue('ownerName', user.name);
        console.log('[Step1] Pre-filled owner name from auth:', user.name);
      }
      // DO NOT pre-fill mobile number - user must enter and verify it fresh each time
    }
  }, [setValue, user]);

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
      console.log('Clinic Information Form Data:', data);
      
      // Save Clinic Information data to database
      const response = await fetch('/api/auth/clinic-owner/save-clinic-information', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save clinic information');
      }

      console.log('[ClinicInformation] Data saved to database:', result);
      toast.success('Clinic information saved successfully!');
      
      // Clear localStorage for this step since it's now in database
      localStorage.removeItem('clinic_onboarding_step1');
      
      // Navigate to Step 2
      navigate('/clinic/onboarding/step-2');
      
    } catch (error) {
      console.error('Failed to submit Clinic Information:', error);
      toast.error(error.message || 'Failed to save clinic information');
    }
  };

  const isNextDisabled = Object.keys(errors).length > 0 || !watch('mobileVerified');

  return (
    <OnboardingLayout currentStep={1} completedSteps={[]}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">
            Clinic Information
          </h1>
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
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          setAutoFilledFields={setAutoFilledFields}
        />

        {/* Section 5: Address Details */}
        <AddressDetailsCard
          register={register}
          errors={errors}
          watch={watch}
          autoFilledFields={autoFilledFields}
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
