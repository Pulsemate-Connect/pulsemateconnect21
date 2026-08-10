/**
 * Protected Route Component — PulseMate Connect Web
 *
 * Wrapper component for routes that require authentication.
 * Redirects to login if user is not authenticated.
 *
 * Features:
 *   - Authentication check
 *   - Role-based access control
 *   - Automatic redirect to login
 *   - Loading state handling
 *
 * @module components/ProtectedRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore'; // FIX: Use correct store path (store not stores)

// ──────────────────────────────────────────────────────────────────────────────
// Constants - Role-based home routes
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Map of user roles to their home/dashboard routes
 */
export const ROLE_HOME = {
  PATIENT: '/patient/home',
  DOCTOR: '/doctor/dashboard',
  CLINIC_OWNER: '/owner/dashboard',
  RECEPTIONIST: '/receptionist/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Protected Route Component
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} [props.requiredRole] - Required role(s) for access
 * @param {React.ReactNode} [props.fallback] - Custom fallback component for unauthorized
 * @returns {React.ReactElement}
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole = null,
  fallback = null 
}) {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.includes(user?.role);

    if (!hasRequiredRole) {
      console.log(`[ProtectedRoute] Insufficient permissions. Required: ${roles.join(', ')}, User: ${user?.role}`);
      
      // Use custom fallback or default unauthorized page
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and authorized
  return children;
}

// ──────────────────────────────────────────────────────────────────────────────
// Role-Specific Route Wrappers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Route accessible only to patients
 */
export function PatientRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="PATIENT">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible only to doctors
 */
export function DoctorRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="DOCTOR">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible only to clinic owners
 */
export function ClinicOwnerRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="CLINIC_OWNER">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible only to receptionists
 */
export function ReceptionistRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="RECEPTIONIST">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible only to admins
 */
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible to staff (doctors, clinic owners, receptionists, admins)
 */
export function StaffRoute({ children }) {
  return (
    <ProtectedRoute requiredRole={['DOCTOR', 'CLINIC_OWNER', 'RECEPTIONIST', 'SUPER_ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Route accessible only when NOT authenticated (e.g., login, register pages)
 * Redirects to role-based home if user is already logged in
 */
export function PublicRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to role-based home
  if (isAuthenticated && user) {
    const homeRoute = ROLE_HOME[user.role] || '/';
    return <Navigate to={homeRoute} replace />;
  }

  // Not authenticated, show public content
  return children;
}
