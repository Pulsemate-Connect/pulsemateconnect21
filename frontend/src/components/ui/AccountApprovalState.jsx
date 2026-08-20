import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  PENDING: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    panel: 'border-amber-200 bg-amber-50',
    title: 'Verification in progress',
    message: 'Your clinic verification is pending. Our admin team is reviewing your details. You cannot receive bookings until approval.',
    accent: 'text-amber-700',
    icon: '⏳',
  },
  UNDER_REVIEW: {
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    panel: 'border-blue-200 bg-blue-50',
    title: 'Under review',
    message: 'Your clinic is currently being reviewed by our admin team. This usually takes 1–2 business days.',
    accent: 'text-blue-700',
    icon: '🔍',
  },
  VERIFIED: {
    badge: 'bg-green-100 text-green-800 border border-green-200',
    panel: 'border-green-200 bg-green-50',
    title: 'Clinic verified',
    message: 'Your clinic is verified. You can now add doctors, receptionists, receive bookings, and manage your queue.',
    accent: 'text-green-700',
    icon: '✅',
  },
  REJECTED: {
    badge: 'bg-red-100 text-red-800 border border-red-200',
    panel: 'border-red-200 bg-red-50',
    title: 'Clinic verification rejected',
    message: 'Your clinic verification was rejected. Please review the reason below, make the necessary changes, and resubmit.',
    accent: 'text-red-700',
    icon: '❌',
  },
  CHANGES_REQUIRED: {
    badge: 'bg-orange-100 text-orange-800 border border-orange-200',
    panel: 'border-orange-200 bg-orange-50',
    title: 'Changes required',
    message: 'Our admin team has reviewed your clinic and requires some changes before approval. Please review the note below and resubmit.',
    accent: 'text-orange-700',
    icon: '✏️',
  },
  SUSPENDED: {
    badge: 'bg-gray-200 text-gray-800 border border-gray-300',
    panel: 'border-gray-300 bg-gray-50',
    title: 'Clinic suspended',
    message: 'Your clinic has been suspended. Bookings and patient visibility are disabled. Contact support if you believe this is an error.',
    accent: 'text-gray-700',
    icon: '🚫',
  },
};

const AccountApprovalState = ({
  status,
  roleLabel,
  reason,
  primaryAction,
  secondaryAction,
  extraActions,
}) => {
  const config = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  const showReason = reason && ['REJECTED', 'CHANGES_REQUIRED', 'SUSPENDED'].includes(status);
  const reasonLabel = status === 'REJECTED' ? 'Rejection reason' : status === 'CHANGES_REQUIRED' ? 'Changes requested' : 'Suspension reason';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className={`rounded-3xl border p-8 shadow-sm ${config.panel}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.badge}`}>
            {status.replace('_', ' ')}
          </div>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">{config.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {roleLabel && <span className="font-semibold">{roleLabel} — </span>}
          {config.message}
        </p>

        {showReason && (
          <div className="mt-6 rounded-2xl bg-white/80 p-4 border border-white">
            <p className="text-sm font-semibold text-gray-800">{reasonLabel}</p>
            <p className={`mt-1 text-sm leading-relaxed ${config.accent}`}>{reason}</p>
          </div>
        )}

        {status === 'VERIFIED' && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['Add doctors', 'Add receptionists', 'Receive bookings', 'Manage queue', 'Appear in patient search'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm text-green-700">
                <span>✓</span> {item}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {primaryAction && (
            <Link
              to={primaryAction.to}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {primaryAction.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              to={secondaryAction.to}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              {secondaryAction.label}
            </Link>
          )}
          {extraActions}
        </div>
      </div>
    </div>
  );
};

export default AccountApprovalState;
