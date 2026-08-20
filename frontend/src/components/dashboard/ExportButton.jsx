import { useState, useEffect, useRef } from 'react';

/**
 * ExportButton
 *
 * A dropdown button for exporting dashboard data.
 *
 * - Desktop: "📥 Export ▾" button that opens a dropdown with two options.
 * - Mobile:  icon-only "📥" button that opens the same dropdown.
 * - While exporting: shows spinner + "Generating report..." and is disabled.
 * - Dropdown closes when the user clicks outside (document mousedown listener).
 *
 * Props:
 *   exporting    {boolean}  – whether an export is currently in progress
 *   onExportPDF  {function} – called when "Export as PDF" is selected
 *   onExportExcel{function} – called when "Export as Excel" is selected
 *
 * Requirements: 6.1, 6.2, 6.16–6.18, 9.7
 */
export default function ExportButton({ exporting, onExportPDF, onExportExcel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Exporting state ─────────────────────────────────────────────────────────
  if (exporting) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm">
        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="hidden sm:inline">Generating report...</span>
      </div>
    );
  }

  // ── Normal state ────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={ref}>
      {/* Desktop button — hidden on mobile */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        📥 Export ▾
      </button>

      {/* Mobile icon-only button — hidden on desktop */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex sm:hidden items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-lg hover:border-blue-300 transition-colors"
        aria-label="Export"
        aria-haspopup="true"
        aria-expanded={open}
      >
        📥
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]"
          role="menu"
        >
          <button
            onClick={() => {
              onExportPDF();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            role="menuitem"
          >
            📄 Export as PDF
          </button>
          <button
            onClick={() => {
              onExportExcel();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            role="menuitem"
          >
            📊 Export as Excel
          </button>
        </div>
      )}
    </div>
  );
}
