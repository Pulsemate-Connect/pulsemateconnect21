import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// ─── Widget display metadata ──────────────────────────────────────────────────
const WIDGET_META = {
  'revenue-metrics':     { label: 'Revenue Metrics',       desc: 'Total revenue, cash, online breakdown' },
  'patient-metrics':     { label: 'Patient Metrics',        desc: 'Total, new, and returning patients' },
  'appointment-metrics': { label: 'Appointment Metrics',    desc: 'Completion rate, wait times, peak hours' },
  'staff-metrics':       { label: 'Staff Metrics',          desc: 'Active staff, utilization rate' },
  'alerts-insights':     { label: 'Alerts & Insights',      desc: 'Smart alerts and actionable recommendations' },
  'revenue-chart':       { label: 'Revenue Chart',          desc: 'Revenue trend over time' },
  'appointment-chart':   { label: 'Appointment Chart',      desc: 'Appointment volume over time' },
  'revenue-by-doctor':   { label: 'Revenue by Doctor',      desc: 'Per-doctor appointment and revenue breakdown' },
  'recent-transactions': { label: 'Recent Transactions',    desc: 'Latest payment records' },
  'quick-actions':       { label: 'Quick Actions',          desc: 'Fast access to common clinic management tasks' },
};

/**
 * WidgetCustomizerModal
 *
 * Allows clinic owners to toggle widget visibility and reorder widgets via
 * drag-and-drop. Changes are held in local state and only committed on Save.
 *
 * Props:
 *   open       {boolean}   - Whether the modal is visible
 *   widgets    {Array}     - Current widget config: [{ id, visible, order }]
 *   saving     {boolean}   - True while the parent is persisting changes
 *   onSave     {Function}  - Called with the updated widget array on Save
 *   onCancel   {Function}  - Called to discard changes and close the modal
 *   onReset    {Function}  - Called to reset widgets to defaults
 */
const WidgetCustomizerModal = ({ open, widgets, saving, onSave, onCancel, onReset }) => {
  // Local copy — changes are not committed until Save is clicked
  const [localWidgets, setLocalWidgets] = useState([]);

  // Sync local state whenever the modal opens or the parent widgets change
  useEffect(() => {
    if (open && widgets?.length) {
      // Ensure a stable sorted copy keyed on `order`
      setLocalWidgets([...widgets].sort((a, b) => a.order - b.order));
    }
  }, [open, widgets]);

  // Prevent scroll on body while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Don't render when closed
  if (!open) return null;

  // ─── Sorted widgets (display order) ────────────────────────────────────────
  const sortedWidgets = [...localWidgets].sort((a, b) => a.order - b.order);

  // Save is disabled when no widgets are visible
  const allHidden = localWidgets.filter((w) => w.visible).length === 0;

  // ─── Toggle a widget's visibility ──────────────────────────────────────────
  const toggleWidget = (id) => {
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  // ─── Handle drag-and-drop reorder ──────────────────────────────────────────
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(sortedWidgets);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Reassign order values based on new positions
    const updated = reordered.map((widget, index) => ({ ...widget, order: index }));
    setLocalWidgets(updated);
  };

  // ─── Reset handler — apply defaults to local state immediately ─────────────
  const handleReset = () => {
    onReset();
    // The parent's reset() updates `widgets`, which re-syncs via useEffect
    // But we can also close the modal after reset — per spec onReset just resets
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-customizer-title"
    >
      {/* Backdrop — click to cancel */}
      <div
        className="absolute inset-0"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2
            id="widget-customizer-title"
            className="text-lg font-bold text-gray-900"
          >
            Customize Dashboard
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* ── Instruction text ── */}
        <p className="px-4 pt-3 pb-1 text-xs text-gray-500">
          Drag to reorder. Use the checkboxes to show or hide widgets.
        </p>

        {/* ── Drag-and-drop widget list ── */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets">
            {(droppableProvided) => (
              <div
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
                className="p-4 space-y-2"
              >
                {sortedWidgets.map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                  >
                    {(draggableProvided, snapshot) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        className={`flex items-center gap-3 rounded-xl p-3 border transition-shadow ${
                          snapshot.isDragging
                            ? 'bg-blue-50 border-blue-200 shadow-md'
                            : 'bg-gray-50 border-gray-100 shadow-none'
                        }`}
                      >
                        {/* Drag handle */}
                        <div
                          {...draggableProvided.dragHandleProps}
                          className="text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 select-none"
                          aria-label="Drag to reorder"
                        >
                          ⠿
                        </div>

                        {/* Visibility toggle */}
                        <input
                          type="checkbox"
                          id={`widget-toggle-${widget.id}`}
                          checked={widget.visible}
                          onChange={() => toggleWidget(widget.id)}
                          className="w-4 h-4 rounded accent-blue-600 flex-shrink-0 cursor-pointer"
                          aria-label={`Toggle ${WIDGET_META[widget.id]?.label ?? widget.id} visibility`}
                        />

                        {/* Widget info */}
                        <label
                          htmlFor={`widget-toggle-${widget.id}`}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <p className={`text-sm font-medium truncate ${widget.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                            {WIDGET_META[widget.id]?.label ?? widget.id}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {WIDGET_META[widget.id]?.desc}
                          </p>
                        </label>
                      </div>
                    )}
                  </Draggable>
                ))}
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* ── Validation message ── */}
        {allHidden && (
          <p
            className="mx-4 mb-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            role="alert"
          >
            At least one widget must be visible.
          </p>
        )}

        {/* ── Footer ── */}
        <div className="p-4 border-t border-gray-200 flex items-center gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          {/* Reset to Default */}
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] px-2"
            type="button"
          >
            Reset to Default
          </button>

          <div className="flex-1" />

          {/* Cancel */}
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
            type="button"
          >
            Cancel
          </button>

          {/* Save */}
          <div className="relative group">
            <button
              onClick={() => onSave(localWidgets)}
              disabled={saving || allHidden}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              type="button"
              aria-disabled={saving || allHidden}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>

            {/* Tooltip shown when Save is disabled due to all-hidden */}
            {allHidden && (
              <div
                className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                role="tooltip"
              >
                At least one widget must be visible
                <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetCustomizerModal;
