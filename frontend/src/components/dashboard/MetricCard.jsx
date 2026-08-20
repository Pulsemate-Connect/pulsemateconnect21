import React, { useEffect, useRef, useState } from 'react';

/**
 * MetricCard — memoised dashboard metric tile.
 *
 * Props:
 *   icon        {string|ReactNode}  emoji or icon element
 *   label       {string}            metric display name
 *   value       {number|string|undefined}  undefined → skeleton/loading state
 *   unit        {string}            optional suffix, e.g. "%" or "mins"
 *   comparison  {{ delta, pct, period }|null|undefined}
 *               null  → "No previous data"
 *               undefined / omitted → no comparison section rendered
 *               { pct: null } → no badge (previous data exists but no %  change possible)
 *               { pct: 0 }    → gray "→ 0%"
 *               { pct > 0 }   → green "↑ +N%"
 *               { pct < 0 }   → red  "↓ N%"
 */
const MetricCard = React.memo(({ icon, label, value, unit, comparison }) => {
  const [highlight, setHighlight] = useState(false);
  const prevValueRef = useRef(value);

  // Real-time highlight — flash ring when value changes (Req 8.20)
  useEffect(() => {
    if (value === undefined) return;
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  // ── Skeleton state (Req 1.19, 10.6) ──────────────────────────────────────
  if (value === undefined) {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2 min-h-[44px] animate-pulse"
        aria-busy="true"
        aria-label="Loading metric"
      >
        {/* Icon placeholder */}
        <div className="w-[60px] h-[60px] rounded-xl bg-gray-200" />
        {/* Value placeholder */}
        <div className="h-7 w-24 rounded bg-gray-200 mt-1" />
        {/* Label placeholder */}
        <div className="h-3 w-32 rounded bg-gray-200" />
        {/* Comparison placeholder */}
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    );
  }

  // ── Comparison badge (Req 3.3–3.5, 3.13, 3.14) ──────────────────────────
  const renderComparison = () => {
    // prop not provided → render nothing
    if (comparison === undefined) return null;

    // explicitly null → "No previous data"
    if (comparison === null) {
      return (
        <span className="text-xs text-gray-400">No previous data</span>
      );
    }

    const { pct, period } = comparison;

    // pct null → previous data exists but percentage can't be computed
    if (pct === null || pct === undefined) return null;

    if (pct > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
          ↑ +{pct}% vs. last {period}
        </span>
      );
    }

    if (pct < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
          ↓ {pct}% vs. last {period}
        </span>
      );
    }

    // pct === 0
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        → 0% vs. last {period}
      </span>
    );
  };

  // ── Normal state ─────────────────────────────────────────────────────────
  return (
    <div
      className={[
        'bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-2 min-h-[44px]',
        highlight ? 'ring-2 ring-blue-400 transition-all' : 'transition-all',
      ].join(' ')}
    >
      {/* Icon (Req 9.9) */}
      <div
        className="w-[60px] h-[60px] rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl flex-shrink-0"
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Value + optional unit (Req 1.20, responsive font Req 9.9) */}
      <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">
        {value}
        {unit && (
          <span className="ml-0.5 text-sm font-medium text-gray-500">{unit}</span>
        )}
      </p>

      {/* Label (Req 1.19) */}
      <p className="text-xs text-gray-500">{label}</p>

      {/* Comparison badge */}
      {renderComparison()}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
