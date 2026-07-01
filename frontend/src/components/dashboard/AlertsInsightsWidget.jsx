import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Severity colour/icon map.
 * Drives the left border colour, background tint, text colour, and icon
 * for each alert card.
 *
 * Requirements: 5.12–5.16
 */
const SEVERITY_COLORS = {
  HIGH:     { border: 'border-l-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    icon: '🚨' },
  MEDIUM:   { border: 'border-l-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', icon: '⚠️' },
  LOW:      { border: 'border-l-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '💡' },
  POSITIVE: { border: 'border-l-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  icon: '✅' },
};

/**
 * AlertsInsightsWidget
 *
 * Renders a vertical list of up to 5 actionable alert cards derived from
 * `useAlertEngine`.  When the `alerts` array is empty it shows a friendly
 * "All Good" placeholder instead.
 *
 * Props:
 *   alerts    {Array<{ id, severity, title, description?, action?, link? }>}
 *   onDismiss {(id: string) => void}  called when the × button is clicked
 *
 * Requirements: 5.2, 5.12–5.19, 9.13
 */
function AlertsInsightsWidget({ alerts = [], onDismiss }) {
  // ── Empty state (Req 5.19, 9.13) ─────────────────────────────────────────
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4">
        <span className="text-2xl" aria-hidden="true">✅</span>
        <div>
          <p className="font-semibold text-green-800 text-sm">All Good</p>
          <p className="text-xs text-green-600">No issues detected. Your clinic is running smoothly.</p>
        </div>
      </div>
    );
  }

  // ── Alert list (Req 5.12–5.18) ────────────────────────────────────────────
  return (
    <section aria-label="Insights & Alerts">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Insights &amp; Alerts</h2>

      {/* Both mobile and desktop: vertical stacked list (Req 9.13) */}
      <div className="flex flex-col gap-3">
        {alerts.map((alert) => {
          const colors = SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.LOW;

          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border-l-4 border border-gray-100 ${colors.border} p-4 flex items-start gap-3 shadow-sm`}
              role="alert"
              aria-live="polite"
            >
              {/* Severity icon (Req 5.12) */}
              <span className="text-xl flex-shrink-0" aria-hidden="true">
                {colors.icon}
              </span>

              <div className="flex-1 min-w-0">
                {/* Title row + dismiss button (Req 5.13, 5.17) */}
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${colors.text}`}>{alert.title}</p>

                  {/* Dismiss button — 44×44px touch target (Req 9.13) */}
                  <button
                    type="button"
                    onClick={() => onDismiss(alert.id)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={`Dismiss alert: ${alert.title}`}
                  >
                    ×
                  </button>
                </div>

                {/* Description (Req 5.14) */}
                {alert.description && (
                  <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                )}

                {/* Suggested action (Req 5.15) */}
                {alert.action && (
                  <p className="text-xs text-gray-500 mt-1 italic">{alert.action}</p>
                )}

                {/* "View Details" link — uses react-router Link (Req 5.16) */}
                {alert.link && (
                  <Link
                    to={alert.link}
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View Details →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AlertsInsightsWidget;
