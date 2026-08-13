import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Step1ClinicInfo from './steps/Step1ClinicInfo';
import Step2ServicesOperations from './steps/Step2ServicesOperations';
import Step3ClinicDocuments from './steps/Step3ClinicDocuments';
import Step4PartnerAgreement from './steps/Step4PartnerAgreement';
import OnboardingSuccess from './OnboardingSuccess';

const ClinicOnboarding = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="step-1" replace />} />
      <Route path="step-1" element={<Step1ClinicInfo />} />
      <Route path="step-2" element={<Step2ServicesOperations />} />
      <Route path="step-3" element={<Step3ClinicDocuments />} />
      <Route path="step-4" element={<Step4PartnerAgreement />} />
      <Route path="success" element={<OnboardingSuccess />} />
    </Routes>
  );
};

export default ClinicOnboarding;
