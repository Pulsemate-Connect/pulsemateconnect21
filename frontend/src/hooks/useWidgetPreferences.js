import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getWidgetPreferences, saveWidgetPreferences } from '../api/dashboard.api';

// ─── Default widget configuration ────────────────────────────────────────────
export const DEFAULT_WIDGET_CONFIG = [
  { id: 'revenue-metrics',     visible: true, order: 0 },
  { id: 'patient-metrics',     visible: true, order: 1 },
  { id: 'appointment-metrics', visible: true, order: 2 },
  { id: 'staff-metrics',       visible: true, order: 3 },
  { id: 'alerts-insights',     visible: true, order: 4 },
  { id: 'revenue-chart',       visible: true, order: 5 },
  { id: 'appointment-chart',   visible: true, order: 6 },
  { id: 'revenue-by-doctor',   visible: true, order: 7 },
  { id: 'recent-transactions', visible: true, order: 8 },
  { id: 'quick-actions',       visible: true, order: 9 },
];

/**
 * Merges API-returned widget preferences with the defaults.
 * For each default widget, uses the API's visible/order if a match exists;
 * otherwise keeps the default. This ensures newly added widgets always appear.
 *
 * @param {Array} apiWidgets - Array of { id, visible, order } from the API
 * @returns {Array} Merged widget config
 */
function mergeWithDefaults(apiWidgets) {
  const apiMap = new Map(apiWidgets.map((w) => [w.id, w]));

  return DEFAULT_WIDGET_CONFIG.map((defaultWidget) => {
    const apiWidget = apiMap.get(defaultWidget.id);
    if (apiWidget) {
      return {
        ...defaultWidget,
        visible: apiWidget.visible,
        order: apiWidget.order,
      };
    }
    return { ...defaultWidget };
  });
}

/**
 * useWidgetPreferences(clinicId)
 *
 * Manages dashboard widget visibility and order preferences.
 * Loads preferences from the backend on mount and merges with defaults
 * to ensure new widgets are always visible.
 *
 * @param {string} clinicId - The clinic ID for which to load/save preferences
 * @returns {{ widgets, saving, isVisible, save, reset }}
 */
export function useWidgetPreferences(clinicId) {
  const [widgets, setWidgets] = useState([...DEFAULT_WIDGET_CONFIG]);
  const [saving, setSaving] = useState(false);

  // ─── Load preferences on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!clinicId) return;

    getWidgetPreferences(clinicId)
      .then((response) => {
        const apiWidgets = response?.data?.widgets;
        if (Array.isArray(apiWidgets) && apiWidgets.length > 0) {
          setWidgets(mergeWithDefaults(apiWidgets));
        }
        // If no widgets returned, keep defaults silently
      })
      .catch(() => {
        // Silently keep defaults on error — do not toast
      });
  }, [clinicId]);

  // ─── Save preferences to backend ───────────────────────────────────────────
  /**
   * Saves the provided widget configuration to the backend.
   * On success, updates local state and shows a success toast.
   * On failure, shows an error toast without updating local state.
   *
   * @param {Array} updatedWidgets - Array of { id, visible, order }
   */
  const save = async (updatedWidgets) => {
    setSaving(true);
    try {
      await saveWidgetPreferences(clinicId, updatedWidgets);
      setWidgets(updatedWidgets);
      toast.success('Dashboard layout saved');
    } catch {
      toast.error('Failed to save layout');
      // Do NOT update local state on failure
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset to defaults (no backend call) ───────────────────────────────────
  /**
   * Resets local widget state to the defaults without persisting to the backend.
   */
  const reset = () => {
    setWidgets([...DEFAULT_WIDGET_CONFIG]);
  };

  // ─── Visibility helper ─────────────────────────────────────────────────────
  /**
   * Returns true if the widget with the given id has visible: true.
   *
   * @param {string} id - Widget ID to check
   * @returns {boolean}
   */
  const isVisible = (id) => {
    const widget = widgets.find((w) => w.id === id);
    return widget ? widget.visible === true : false;
  };

  return { widgets, saving, isVisible, save, reset };
}
