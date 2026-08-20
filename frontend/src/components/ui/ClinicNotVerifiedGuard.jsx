// ─────────────────────────────────────────────────────────────────────────────
//  ClinicNotVerifiedGuard
//  Wraps any clinic operational page. If the clinic owner's approval status
//  is not VERIFIED, renders a clear blocked-state card instead of the page.
//  Pass through for SUPER_ADMIN so admin can still access these pages.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const STATUS_INFO = {
  PENDING: {
    icon: '⏳',
    title: 'Verification pending',
    message: 'Your clinic is under review by our admin team. This feature will be available once your clinic is approved.',
    color: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
  UNDER_REVIEW: {
    icon: '🔍',
    title: 'Under review',
    message: 'Your clinic is currently being reviewed. This feature will unlock after approval.',
    color: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  REJECTED: {
    icon: '❌',
    title: 'Clinic verification rejected',
    message: 'Your clinic was rejected. Please update your information and resubmit to unlock clinic features.',
    color: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
  CHANGES_REQUIRED: {
    icon: '✏️',
    title: 'Changes required',
    message: 'Admin has requested changes to your clinic application. Please update and resubmit to unlock features.',
    color: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
  },
  SUSPENDED: {
    icon: '🚫',
    title: 'Clinic suspended',
    message: 'Your clinic has been suspended. All operational features are disabled. Contact support to resolve this.',
    color: 'bg-gray-50 border-gray-300',
    badge: 'bg-gray-200 text-gray-700',
  },
};

const ClinicNotVerifiedGuard = ({ children }) => {
  const user = useAuthStore((s) => s.user);

  // Super admins bypass this guard
  if (!user || user.role === 'SUPER_ADMIN') return children;

  // Receptionists: check their own status (they are VERIFIED once created)
  // Clinic owners: check approval status
  if (user.role !== 'CLINIC_OWNER') return children;

  const status = user.approvalStatus || user.status;
  if (status === 'VERIFIED') return children;

  const info = STATUS_INFO[status] || STATUS_INFO.PENDING;
  const canResubmit = ['REJECTED', 'CHANGES_REQUIRED'].includes(status);

  return (
    <div className="page-container max-w-2xl mx-auto py-16">
      <div className={`rounded-2xl border p-8 ${info.color}`}>
        {/* Icon + badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{info.icon}</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${info.badge}`}>
            {status?.replace('_', ' ')}
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">{info.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{info.message}</p>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/clinic/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          {canResubmit && (
            <Link
              to="/clinic/edit-resubmit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              ✏️ Edit &amp; Resubmit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicNotVerifiedGuard;
