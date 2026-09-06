import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import { getMe } from './api/auth.api';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import useFcm from './hooks/useFcm';
import { PageLoader } from './components/ui/LoadingSpinner';

// ── Eagerly load auth/public pages (small, needed immediately) ──
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import PublicHomePage from './pages/public/PublicHomePage';

// ── Lazy load heavy dashboard pages (loaded on demand) ──
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const ReceptionDashboard = lazy(() => import('./pages/receptionist/ReceptionDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// ── Lazy load other auth pages ──
const DoctorRegisterPage = lazy(() => import('./pages/auth/DoctorRegisterPage'));
const ClinicOwnerRegisterPage = lazy(() => import('./pages/auth/ClinicOwnerRegisterPage'));
const RoleLoginPage = lazy(() => import('./pages/auth/RoleLoginPage'));
const StaffLoginPage = lazy(() => import('./pages/auth/StaffLoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const PendingVerificationPage = lazy(() => import('./pages/auth/PendingVerificationPage'));
const PortalLandingPage = lazy(() => import('./pages/auth/PortalLandingPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));
const DoctorLoginPage = lazy(() => import('./pages/auth/DoctorLoginPage'));

// ── Lazy load public/legal pages ──
const ClinicPartnerPage = lazy(() => import('./pages/public/ClinicPartnerPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const DeleteAccountPage = lazy(() => import('./pages/public/DeleteAccountPage'));
const RefundPolicyPage = lazy(() => import('./pages/public/legal/RefundPolicyPage'));
const CancellationPolicyPage = lazy(() => import('./pages/public/legal/CancellationPolicyPage'));
const CookiesPolicyPage = lazy(() => import('./pages/public/legal/CookiesPolicyPage'));
const SecurityPolicyPage = lazy(() => import('./pages/public/legal/SecurityPolicyPage'));
const MedicalDisclaimerPage = lazy(() => import('./pages/public/legal/MedicalDisclaimerPage'));
const CommunityGuidelinesPage = lazy(() => import('./pages/public/legal/CommunityGuidelinesPage'));
const ContactPage = lazy(() => import('./pages/public/legal/ContactPage'));
const AboutPage = lazy(() => import('./pages/public/legal/AboutPage'));
const AccessibilityPage = lazy(() => import('./pages/public/legal/AccessibilityPage'));
const CopyrightPage = lazy(() => import('./pages/public/legal/CopyrightPage'));
const OpenSourcePage = lazy(() => import('./pages/public/legal/OpenSourcePage'));

// ── Lazy load patient pages ──
const DoctorSearch = lazy(() => import('./pages/patient/DoctorSearch'));
const DoctorProfile = lazy(() => import('./pages/patient/DoctorProfile'));
const MyAppointments = lazy(() => import('./pages/patient/MyAppointments'));
const LiveQueue = lazy(() => import('./pages/patient/LiveQueue'));
const PatientProfile = lazy(() => import('./pages/patient/PatientProfile'));
const PaymentPage = lazy(() => import('./pages/patient/PaymentPage'));
const MyPayments = lazy(() => import('./pages/patient/MyPayments'));

// ── Lazy load doctor pages ──
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorQueue = lazy(() => import('./pages/doctor/DoctorQueue'));
const DoctorProfilePage = lazy(() => import('./pages/doctor/DoctorProfilePage'));
const DoctorSchedulePage = lazy(() => import('./pages/doctor/DoctorSchedulePage'));
const DoctorInvitationAccept = lazy(() => import('./pages/doctor/DoctorInvitationAccept'));
const DoctorVerification = lazy(() => import('./pages/doctor/DoctorVerification'));
const DoctorProfileComplete = lazy(() => import('./pages/doctor/DoctorProfileComplete'));
const DoctorProfilePending = lazy(() => import('./pages/doctor/DoctorProfilePending'));

// ── Lazy load receptionist pages ──
const TodayQueue = lazy(() => import('./pages/receptionist/TodayQueue'));
const WalkInBooking = lazy(() => import('./pages/receptionist/WalkInBooking'));
const FollowUpBooking = lazy(() => import('./pages/receptionist/FollowUpBooking'));

// ── Lazy load owner pages ──
const ClinicEditResubmit = lazy(() => import('./pages/owner/ClinicEditResubmit'));
const ManageStaff = lazy(() => import('./pages/owner/ManageStaff'));
const OwnerAppointments = lazy(() => import('./pages/owner/OwnerAppointments'));
const QueueOverview = lazy(() => import('./pages/owner/QueueOverview'));
const SessionManagement = lazy(() => import('./pages/owner/SessionManagement'));
const ClinicOnboarding = lazy(() => import('./pages/clinic/onboarding/ClinicOnboarding'));
const Step1ClinicInfo = lazy(() => import('./pages/clinic/onboarding/steps/Step1ClinicInfo'));
const ClinicSchedulePage = lazy(() => import('./pages/clinic/ClinicSchedulePage'));

// ── Lazy load admin pages ──
const DoctorManagement = lazy(() => import('./pages/admin/DoctorManagement'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const ClinicVerification = lazy(() => import('./pages/admin/ClinicVerification'));
const ClinicVerificationDetail = lazy(() => import('./pages/admin/ClinicVerificationDetail'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// ── Lazy load notification pages ──
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/notifications/NotificationSettingsPage'));

const AppRoutes = () => {
  useFcm();
  const { restoreSession, isLoading, isInitialized } = useAuthStore();

  // ═════════════════════════════════════════════════════════════════════════
  // Session Restoration on App Start
  // ═════════════════════════════════════════════════════════════════════════
  // This is the KEY logic that enables persistent login across:
  // - Normal refresh (F5)
  // - Hard refresh (Ctrl+Shift+R)
  // - Browser restart
  // - Tab reopen
  //
  // The session cookie is sent automatically by the browser
  // If the backend validates it, user state is restored
  // ═════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isInitialized) {
      console.log('[App] Restoring session on app start...');
      restoreSession(getMe);
    }
  }, [isInitialized, restoreSession]);

  // Show loading screen during session restoration
  if (!isInitialized || isLoading) {
    return <PageLoader />;
  }

  return (
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/portal" element={<PublicRoute><Suspense fallback={<PageLoader />}><PortalLandingPage /></Suspense></PublicRoute>} />
      <Route path="/clinic-partner" element={<PublicRoute><Suspense fallback={<PageLoader />}><ClinicPartnerPage /></Suspense></PublicRoute>} />
      <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPolicyPage /></Suspense>} />
      <Route path="/terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
      <Route path="/delete-account" element={<Suspense fallback={<PageLoader />}><DeleteAccountPage /></Suspense>} />
      <Route path="/data-deletion" element={<Suspense fallback={<PageLoader />}><DeleteAccountPage /></Suspense>} />
      <Route path="/refund-policy" element={<Suspense fallback={<PageLoader />}><RefundPolicyPage /></Suspense>} />
      <Route path="/cancellation-policy" element={<Suspense fallback={<PageLoader />}><CancellationPolicyPage /></Suspense>} />
      <Route path="/cookies" element={<Suspense fallback={<PageLoader />}><CookiesPolicyPage /></Suspense>} />
      <Route path="/security" element={<Suspense fallback={<PageLoader />}><SecurityPolicyPage /></Suspense>} />
      <Route path="/medical-disclaimer" element={<Suspense fallback={<PageLoader />}><MedicalDisclaimerPage /></Suspense>} />
      <Route path="/community-guidelines" element={<Suspense fallback={<PageLoader />}><CommunityGuidelinesPage /></Suspense>} />
      <Route path="/contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
      <Route path="/about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
      <Route path="/accessibility" element={<Suspense fallback={<PageLoader />}><AccessibilityPage /></Suspense>} />
      <Route path="/copyright" element={<Suspense fallback={<PageLoader />}><CopyrightPage /></Suspense>} />
      <Route path="/open-source" element={<Suspense fallback={<PageLoader />}><OpenSourcePage /></Suspense>} />
      
      {/* TEST ROUTE - Clinic Onboarding without auth (for testing only) */}
      <Route path="/test/clinic-onboarding" element={<Suspense fallback={<PageLoader />}><Step1ClinicInfo /></Suspense>} />
      
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/staff/login" element={<PublicRoute><Suspense fallback={<PageLoader />}><StaffLoginPage /></Suspense></PublicRoute>} />
      <Route path="/login/:role" element={<PublicRoute><Suspense fallback={<PageLoader />}><RoleLoginPage /></Suspense></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/register/doctor" element={<PublicRoute><Suspense fallback={<PageLoader />}><DoctorRegisterPage /></Suspense></PublicRoute>} />
      <Route path="/portal/apply-doctor" element={<PublicRoute><Suspense fallback={<PageLoader />}><DoctorRegisterPage /></Suspense></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense></PublicRoute>} />
      <Route path="/verification-pending" element={<ProtectedRoute requiredRole={['CLINIC_OWNER', 'DOCTOR']}><Suspense fallback={<PageLoader />}><PendingVerificationPage /></Suspense></ProtectedRoute>} />

      <Route path="/patient" element={<Navigate to="/patient/home" replace />} />
      <Route path="/patient/home" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><PatientDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/patient/search" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><DoctorSearch /></Suspense></ProtectedRoute>} />
      <Route path="/patient/doctors/:id" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><DoctorProfile /></Suspense></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><MyAppointments /></Suspense></ProtectedRoute>} />
      <Route path="/patient/appointments/:id" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><MyAppointments /></Suspense></ProtectedRoute>} />
      <Route path="/patient/queue/:appointmentId" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><LiveQueue /></Suspense></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><PatientProfile /></Suspense></ProtectedRoute>} />
      <Route path="/patient/payment/:appointmentId" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><PaymentPage /></Suspense></ProtectedRoute>} />
      <Route path="/patient/payments" element={<ProtectedRoute requiredRole="PATIENT"><Suspense fallback={<PageLoader />}><MyPayments /></Suspense></ProtectedRoute>} />

      <Route path="/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
      <Route path="/doctor/login" element={<PublicRoute><Suspense fallback={<PageLoader />}><DoctorLoginPage /></Suspense></PublicRoute>} />
      <Route path="/doctor/invitation/:token" element={<Suspense fallback={<PageLoader />}><DoctorInvitationAccept /></Suspense>} />
      <Route path="/doctor/verification/:token" element={<Suspense fallback={<PageLoader />}><DoctorVerification /></Suspense>} />
      <Route path="/doctor/profile/complete/:token" element={<Suspense fallback={<PageLoader />}><DoctorProfileComplete /></Suspense>} />
      <Route path="/doctor/profile/pending" element={<Suspense fallback={<PageLoader />}><DoctorProfilePending /></Suspense>} />
      <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="DOCTOR"><Suspense fallback={<PageLoader />}><DoctorDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="DOCTOR"><Suspense fallback={<PageLoader />}><DoctorAppointments /></Suspense></ProtectedRoute>} />
      <Route path="/doctor/queue" element={<ProtectedRoute requiredRole="DOCTOR"><Suspense fallback={<PageLoader />}><DoctorQueue /></Suspense></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute requiredRole="DOCTOR"><Suspense fallback={<PageLoader />}><DoctorProfilePage /></Suspense></ProtectedRoute>} />
      <Route path="/doctor/schedule" element={<ProtectedRoute requiredRole="DOCTOR"><Suspense fallback={<PageLoader />}><DoctorSchedulePage /></Suspense></ProtectedRoute>} />

      <Route path="/reception" element={<Navigate to="/receptionist/dashboard" replace />} />
      <Route path="/reception/queue" element={<Navigate to="/receptionist/queue" replace />} />
      <Route path="/reception/walk-in" element={<Navigate to="/receptionist/walk-in" replace />} />
      <Route path="/reception/follow-up" element={<Navigate to="/receptionist/follow-up" replace />} />
      <Route path="/receptionist/dashboard" element={<ProtectedRoute requiredRole="RECEPTIONIST"><Suspense fallback={<PageLoader />}><ReceptionDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/receptionist/queue" element={<ProtectedRoute requiredRole="RECEPTIONIST"><Suspense fallback={<PageLoader />}><TodayQueue /></Suspense></ProtectedRoute>} />
      <Route path="/receptionist/walk-in" element={<ProtectedRoute requiredRole="RECEPTIONIST"><Suspense fallback={<PageLoader />}><WalkInBooking /></Suspense></ProtectedRoute>} />
      <Route path="/receptionist/follow-up" element={<ProtectedRoute requiredRole="RECEPTIONIST"><Suspense fallback={<PageLoader />}><FollowUpBooking /></Suspense></ProtectedRoute>} />

      <Route path="/owner" element={<Navigate to="/clinic/dashboard" replace />} />
      <Route path="/owner/doctors" element={<Navigate to="/clinic/doctors" replace />} />
      <Route path="/owner/receptionists" element={<Navigate to="/clinic/receptionists" replace />} />
      <Route path="/owner/appointments" element={<Navigate to="/clinic/appointments" replace />} />
      <Route path="/owner/queue" element={<Navigate to="/clinic/queue" replace />} />
      <Route path="/clinic/dashboard" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><OwnerDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/onboarding/*" element={<ProtectedRoute requiredRole={["CLINIC_OWNER", "PATIENT"]}><Suspense fallback={<PageLoader />}><ClinicOnboarding /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/edit-resubmit" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><ClinicEditResubmit /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/doctors" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><ManageStaff staffRole="DOCTOR" /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/receptionists" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><ManageStaff staffRole="RECEPTIONIST" /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/appointments" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><OwnerAppointments /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/queue" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><QueueOverview /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/sessions" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><SessionManagement /></Suspense></ProtectedRoute>} />
      <Route path="/clinic/:clinicId/schedule" element={<ProtectedRoute requiredRole="CLINIC_OWNER"><Suspense fallback={<PageLoader />}><ClinicSchedulePage /></Suspense></ProtectedRoute>} />

      <Route path="/admin" element={<PublicRoute><Suspense fallback={<PageLoader />}><AdminLoginPage /></Suspense></PublicRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense></ProtectedRoute>} />
      <Route path="/admin/clinics" element={<Navigate to="/admin/clinics/verify" replace />} />
      <Route path="/admin/clinics/verify" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Suspense fallback={<PageLoader />}><ClinicVerification /></Suspense></ProtectedRoute>} />
      <Route path="/admin/clinics/verify/:clinicId" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Suspense fallback={<PageLoader />}><ClinicVerificationDetail /></Suspense></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Suspense fallback={<PageLoader />}><DoctorManagement /></Suspense></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Suspense fallback={<PageLoader />}><UsersManagement /></Suspense></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Suspense fallback={<PageLoader />}><AdminNotifications /></Suspense></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requiredRole="SUPER_ADMIN"><Suspense fallback={<PageLoader />}><AdminSettings /></Suspense></ProtectedRoute>} />

      <Route path="/notifications" element={<ProtectedRoute requiredRole={['PATIENT','DOCTOR','RECEPTIONIST','CLINIC_OWNER','SUPER_ADMIN']}><Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense></ProtectedRoute>} />
      <Route path="/notifications/settings" element={<ProtectedRoute requiredRole={['PATIENT','DOCTOR','RECEPTIONIST','CLINIC_OWNER','SUPER_ADMIN']}><Suspense fallback={<PageLoader />}><NotificationSettingsPage /></Suspense></ProtectedRoute>} />

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
