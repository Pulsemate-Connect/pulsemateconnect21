// ─────────────────────────────────────────────────────────────────────────────
//  SummaryCard — matches screenshot: icon box top, large number, label below
// ─────────────────────────────────────────────────────────────────────────────

// SVG icons matching the screenshot icons exactly
const CardIcon = {
  total: () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  pending: () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  underReview: () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  verified: () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  rejected: () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  changesRequired: () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  suspended: () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
};

const SummaryCard = ({ statsKey, icon, count, label, colorClass, bgClass, borderClass, onClick, active }) => {
  const IconComp = CardIcon[statsKey] || CardIcon.total;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`
        group relative flex flex-col w-full text-left rounded-2xl border bg-white
        transition-all duration-200 cursor-pointer p-5
        ${active
          ? `ring-2 ${borderClass} shadow-md`
          : 'border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
        }
      `}
    >
      {/* Icon box */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bgClass}`}>
        <span className={colorClass}>
          <IconComp />
        </span>
      </div>

      {/* Count */}
      <p className="text-3xl font-bold text-gray-900 leading-none mb-1.5 tabular-nums">
        {count === null || count === undefined ? (
          <span className="inline-block w-10 h-8 rounded-lg bg-gray-100 animate-pulse" />
        ) : count}
      </p>

      {/* Label */}
      <p className="text-sm text-gray-500 font-medium leading-tight">{label}</p>
    </button>
  );
};

export default SummaryCard;
