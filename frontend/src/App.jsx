import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import useFcm from './hooks/useFcm';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DoctorRegisterPage from './pages/auth/DoctorRegisterPage';
import ClinicOwnerRegisterPage from './pages/auth/ClinicOwnerRegisterPage';
import RoleLoginPage from './pages/auth/RoleLoginPage';
import StaffLoginPage from './pages/auth/StaffLoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PendingVerificationPage from './pages/auth/PendingVerificationPage';
import PortalLandingPage from './pages/auth/PortalLandingPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import PublicHomePage from './pages/public/PublicHomePage';
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage';
import TermsPage from './pages/public/TermsPage';
import DeleteAccountPage from './pages/public/DeleteAccountPage';
import RefundPolicyPage from './pages/public/legal/RefundPolicyPage';
import CancellationPolicyPage from './pages/public/legal/CancellationPolicyPage';
import CookiesPolicyPage from './pages/public/legal/CookiesPolicyPage';
import SecurityPolicyPage from './pages/public/legal/SecurityPolicyPage';
import MedicalDisclaimerPage from './pages/public/legal/MedicalDisclaimerPage';
import CommunityGuidelinesPage from './pages/public/legal/CommunityGuidelinesPage';
import ContactPage from './pages/public/legal/ContactPage';
import AboutPage from './pages/public/legal/AboutPage';
import AccessibilityPage from './pages/public/legal/AccessibilityPage';
import CopyrightPage from './pages/public/legal/CopyrightPage';
import OpenSourcePage from './pages/public/legal/OpenSourcePage';

import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorSearch from './pages/patient/DoctorSearch';
import DoctorProfile from './pages/patient/DoctorProfile';
import MyAppointments from './pages/patient/MyAppointments';
import LiveQueue from './pages/patient/LiveQueue';
import PatientProfile from './pages/patient/PatientProfile';
import PaymentPage from './pages/patient/PaymentPage';
import MyPayments from './pages/patient/MyPayments';

import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorQueue from './pages/doctor/DoctorQueue';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import DoctorSchedulePage from './pages/doctor/DoctorSchedulePage';

import ReceptionDashboard from './pages/receptionist/ReceptionDashboard';
import TodayQueue from './pages/receptionist/TodayQueue';
import WalkInBooking from './pages/receptionist/WalkInBooking';
import FollowUpBooking from './pages/receptionist/FollowUpBooking';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import ClinicProfile from './pages/owner/ClinicProfile';
import ClinicEditResubmit from './pages/owner/ClinicEditResubmit';
import ManageStaff from './pages/owner/ManageStaff';
import OwnerAppointments from './pages/owner/OwnerAppointments';
import QueueOverview from './pages/owner/QueueOverview';
import SessionManagement from './pages/owner/SessionManagement';
import ClinicOnboarding from './pages/clinic/onboarding/ClinicOnboarding';

import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import ClinicVerification from './pages/admin/ClinicVerification';
import ClinicVerificationDetail from './pages/admin/ClinicVerificationDetail';
import AdminNotifications from './pages/admin/AdminNotifications';
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotificationSettingsPage from './pages/notifications/NotificationSettingsPage';

const AppRoutes = () => {
  useFcm();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><PublicHomePage /></PublicRoute>} />
      <Route path="/portal" element={<PublicRoute><PortalLandingPage /></PublicRoute>} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/delete-account" element={<DeleteAccountPage />} />
      <Route path="/data-deletion" element={<DeleteAccountPage />} />
      <Route path="/refund-policy" element={<RefundPolicyPage />} />
      <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
      <Route path="/cookies" element={<CookiesPolicyPage />} />
      <Route path="/security" element={<SecurityPolicyPage />} />
      <Route path="/medical-disclaimer" element={<MedicalDisclaimerPage />} />
      <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/accessibility" element={<AccessibilityPage />} />
      <Route path="/copyright" element={<CopyrightPage />} />
      <Route path="/open-source" element={<OpenSourcePage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/staff/login" element={<PublicRoute><StaffLoginPage /></PublicRoute>} />
      <Route path="/login/:role" element={<PublicRoute><RoleLoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/register/doctor" element={<PublicRoute><DoctorRegisterPage /></PublicRoute>} />
      <Route path="/register/clinic-owner" element={<PublicRoute><ClinicOwnerRegisterPage /></PublicRoute>} />
      <Route path="/portal/apply-doctor" element={<PublicRoute><DoctorRegisterPage /></PublicRoute>} />
      <Route path="/portal/apply-clinic" element={<PublicRoute><ClinicOwnerRegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/verification-pending" element={<ProtectedRoute requiredRole={['CLINIC_OWNER', 'DOCTOR']}><PendingVerificationPage /></ProtectedRoute>} />

      <Route path="/patient" element={<Navigate to="/patient/home" replace />} />
      <Route path="/patient/home" element={<ProtectedRoute requiredRole="PATIENT"><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/search" element={<ProtectedRoute requiredRole="PATIENT"><DoctorSearch /></ProtectedRoute>} />
      <Route path="/patient/doctors/:id" element={<ProtectedRoute requiredRole="PATIENT"><DoctorProfile /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute requiredRole="PATIENT"><MyAppointments /></ProtectedRoute>} />
      <Route path="/patient/appointments/:id" element={<ProtectedRoute requiredRole="PATIENT"><MyAppointments /></ProtectedRoute>} />
      <Route path="/patient/queue/:appointmentId" element={<ProtectedRoute requiredRole="PATIENT"><LiveQueue /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute requiredRole="PATIENT"><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/payment/:appointmentId" element={<ProtectedRoute requiredRole="PATIENT"><PaymentPage /></ProtectedRoute>} />
      <Route path="/patient/payments" element={<ProtectedRoute requiredRole="PATIENT"><MyPayments /></ProtectedRoute>} />

      <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
      <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/queue" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorQueue /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorProfilePage /></ProtectedRoute>} />
      <Route path="/doctor/schedule" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorSchedulePage /></ProtectedRoute>} />

      <Route path="/reception" element={<Navigate to="/receptionist/dashboard" replace />} />
      <Route path="/reception/queue" element={<Navigate to="/receptionist/queue" replace />} />
      <Route path="/reception/walk-in" element={<Navigate to="/receptionist/walk-in" replace />} />
      <Route path="/reception/follow-up" element={<Navigate to="/receptionist/follow-up" replace />} />
      <Route path="/receptionist/dashboard" element={<ProtectedRoute requiredRole="RECEPTIONIST"><ReceptionDashboard /></ProtectedRoute>} />
      <Route path="/receptionist/queue" element={<ProtectedRoute requiredRole="RECEPTIONIST"><TodayQueue /></ProtectedRoute>} />
      <Route path="/receptionist/walk-in" element={<ProtectedRoute requiredRole="RECEPTIONIST"><WalkInBooking /></ProtectedRoute>} />
      <Route path="/receptionist/follow-up" element={<ProtectedRoute requiredRole="RECEPTIONIST"><FollowUpBooking /></ProtectedRoute>} />

      <Route path="/owner" element={<Navigate to="/clinic/dashboard" replace />} />
      <Route path="/owner/clinic" element={<Navigate to="/clinic/profile" replace />} />
      <Route path="/owner/clinic/:id" element={<Navigate to="/clinic/profile" replace />} />
      <Route path="/owner/doctors" element={<Navigate to="/clinic/doctors" replace />} />
      <Route path="/owner/receptionists" element={<Navigate to="/clinic/receptionists" replace />} />
      <Route path="/owner/appointments" element={<Navigate to="/clinic/appointments" replace />} />
      <Route path="/owner/queue" element={<Navigate to="/clinic/queue" replace />} />
      <Route path="/clinic/dashboard" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><OwnerDashboard /></ProtectedRoute>} />
      <Route path="/clinic/onboarding/*" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><ClinicOnboarding /></ProtectedRoute>} />
      <Route path="/clinic/edit-resubmit" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><ClinicEditResubmit /></ProtectedRoute>} />
      <Route path="/clinic/profile" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><ClinicProfile /></ProtectedRoute>} />
      <Route path="/clinic/profile/:id" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><ClinicProfile /></ProtectedRoute>} />
      <Route path="/clinic/doctors" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><ManageStaff staffRole="DOCTOR" /></ProtectedRoute>} />
      <Route path="/clinic/receptionists" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><ManageStaff staffRole="RECEPTIONIST" /></ProtectedRoute>} />
      <Route path="/clinic/appointments" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><OwnerAppointments /></ProtectedRoute>} />
      <Route path="/clinic/queue" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><QueueOverview /></ProtectedRoute>} />
      <Route path="/clinic/sessions" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><SessionManagement /></ProtectedRoute>} />

      <Route path="/admin" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/clinics" element={<Navigate to="/admin/clinics/verify" replace />} />
      <Route path="/admin/clinics/verify" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><ClinicVerification /></ProtectedRoute>} />
      <Route path="/admin/clinics/verify/:clinicId" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><ClinicVerificationDetail /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><UsersManagement /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><AdminNotifications /></ProtectedRoute>} />

      <Route path="/notifications" element={<ProtectedRoute requiredRole={['PATIENT','DOCTOR','RECEPTIONIST','CLINIC_OWNER','SUPER_ADMIN']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/notifications/settings" element={<ProtectedRoute requiredRole={['PATIENT','DOCTOR','RECEPTIONIST','CLINIC_OWNER','SUPER_ADMIN']}><NotificationSettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111827',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
