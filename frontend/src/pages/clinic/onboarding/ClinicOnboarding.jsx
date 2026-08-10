import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Step1ClinicInfo from './steps/Step1ClinicInfo';

const ClinicOnboarding = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="step-1" replace />} />
      <Route path="step-1" element={<Step1ClinicInfo />} />
      {/* Future steps will be added here */}
      {/* <Route path="step-2" element={<Step2Services />} /> */}
      {/* <Route path="step-3" element={<Step3Documents />} /> */}
      {/* <Route path="step-4" element={<Step4Agreement />} /> */}
    </Routes>
  );
};

export default ClinicOnboarding;
