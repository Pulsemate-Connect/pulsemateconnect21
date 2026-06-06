// ─────────────────────────────────────────────────────────────────────────────
//  ClinicVerificationTable — matches screenshot exactly
//  Logic unchanged — only UI
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';

// ── Status badge matching screenshot ─────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const MAP = {
    VERIFIED:         { label: 'Verified',        icon: '✓', cls: 'text-green-700 bg-green-50 border-green-200'   },
    PENDING:          { label: 'Pending',          icon: '⏳',cls: 'text-yellow-700 bg-yellow-50 border-yellow-200'},
    UNDER_REVIEW:     { label: 'Under Review',     icon: '🔍',cls: 'text-blue-700 bg-blue-50 border-blue-200'     },
    REJECTED:         { label: 'Rejected',         icon: '✕', cls: 'text-red-700 bg-red-50 border-red-200'        },
    CHANGES_REQUIRED: { label: 'Changes Required', icon: '✏', cls: 'text-orange-700 bg-orange-50 border-orange-200'},
    SUSPENDED:        { label: 'Suspended',        icon: '⊘', cls: 'text-gray-700 bg-gray-100 border-gray-200'    },
  };
  const cfg = MAP[status] || { label: status, icon: '·', cls: 'text-gray-600 bg-gray-100 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.cls}`}>
      <span className="text-[11px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

// ── Clinic type badge ─────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  if (!type) return <span className="text-gray-300 text-xs">—</span>;
  const t = type.toLowerCase();
  let cls = 'bg-purple-50 text-purple-700';
  if (t.includes('dental'))        cls = 'bg-emerald-50 text-emerald-700';
  else if (t.includes('eye'))      cls = 'bg-sky-50 text-sky-700';
  else if (t.includes('diagn'))    cls = 'bg-teal-50 text-teal-700';
  else if (t.includes('hospital')) cls = 'bg-rose-50 text-rose-700';
  else if (t.includes('skin'))     cls = 'bg-pink-50 text-pink-700';
  else if (t.includes('pediatr'))  cls = 'bg-cyan-50 text-cyan-700';
  else if (t.includes('general') || t.includes('individual')) cls = 'bg-blue-50 text-blue-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${cls}`}>
      {type}
    </span>
  );
};

// ── Avatar colour (deterministic from first char) ─────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];
const avatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    {[52, 36, 28, 40, 24, 20, 24, 20, 24, 16].map((w, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: `${w * 3}px`, maxWidth: '100%' }} />
      </td>
    ))}
  </tr>
);

const COLS = [
  'Clinic Name', 'Owner Name', 'Mobile', 'Email',
  'Type', 'City', 'State', 'Submitted', 'Status', 'Action',
];

const ClinicVerificationTable = ({ clinics, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          {/* Head */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {COLS.map((col) => (
                <th key={col}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : clinics.map((c) => {
                  const dateStr = c.submittedAt || c.createdAt;
                  const formatted = dateStr
                    ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  const initial  = (c.name || '?').charAt(0).toUpperCase();
                  const avColor  = avatarColor(c.name);

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Clinic Name + avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${avColor}`}>
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[150px]" title={c.name}>
                              {c.name || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3.5 text-gray-700 text-sm whitespace-nowrap">
                        {c.owner?.name || '—'}
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-3.5 text-gray-600 text-sm whitespace-nowrap font-mono">
                        {c.owner?.mobile || '—'}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <span className="text-gray-600 text-sm truncate block" title={c.owner?.email}>
                          {c.owner?.email || '—'}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <TypeBadge type={c.clinicType} />
                      </td>

                      {/* City */}
                      <td className="px-4 py-3.5 text-gray-600 text-sm whitespace-nowrap">
                        {c.city || '—'}
                      </td>

                      {/* State */}
                      <td className="px-4 py-3.5 text-gray-600 text-sm whitespace-nowrap uppercase text-xs font-medium">
                        {c.state || '—'}
                      </td>

                      {/* Submitted */}
                      <td className="px-4 py-3.5 text-gray-600 text-sm whitespace-nowrap">
                        {formatted}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={c.approvalStatus} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* View button — matches screenshot "👁 View" style */}
                          <button
                            onClick={() => navigate(`/admin/clinics/verify/${c.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                       text-blue-600 bg-blue-50 border border-blue-100 text-xs font-semibold
                                       hover:bg-blue-100 active:scale-95 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>

                          {/* Three-dot menu */}
                          <button
                            onClick={() => navigate(`/admin/clinics/verify/${c.id}`)}
                            title="More actions"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400
                                       hover:bg-gray-100 hover:text-gray-600 transition-all"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5"  r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClinicVerificationTable;
