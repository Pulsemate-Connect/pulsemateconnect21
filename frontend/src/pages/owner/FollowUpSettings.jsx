// ─────────────────────────────────────────────────────────────────────────────
//  FollowUpSettings — PulseMate Connect  |  Clinic Owner
//
//  Clinic Admin can:
//   • Activate / deactivate the follow-up feature for their clinic
//   • Configure which preset options are available (7 / 15 / 30 days)
//   • Enable / disable Custom Days
//   • Set the default follow-up period
//   • Configure the grace period before OVERDUE
//
//  When disabled, EXISTING follow-ups remain visible and are NOT deleted.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getFollowUpSettings, updateFollowUpSettings } from '../../api/followup.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Preset day button ─────────────────────────────────────────────────────────
function PresetRow({ label, days, enabled, disabled, onChange }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
      enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {enabled ? 'Doctors can select this option' : 'Hidden from doctors'}
        </p>
      </div>
      <Toggle checked={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function FollowUpSettings() {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [clinicId, setClinicId]     = useState(null);
  const [settings, setSettings]     = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getFollowUpSettings();
        const s   = res.data.data.settings;
        setSettings(s);
        setClinicId(s.clinicId);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load follow-up settings');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await updateFollowUpSettings({
        clinicId,
        followUpEnabled:     settings.followUpEnabled,
        preset7DaysEnabled:  settings.preset7DaysEnabled,
        preset15DaysEnabled: settings.preset15DaysEnabled,
        preset30DaysEnabled: settings.preset30DaysEnabled,
        customDaysEnabled:   settings.customDaysEnabled,
        defaultFollowUpDays: settings.defaultFollowUpDays,
        gracePeriodDays:     settings.gracePeriodDays,
      });
      setSettings(res.data.data.settings);
      toast.success('Follow-up settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Follow-Up Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Control how follow-up visits work at your clinic
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Master toggle ──────────────────────────────────────────────── */}
          <div className={`rounded-2xl border-2 p-5 ${
            settings.followUpEnabled
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-base">Follow-Up Feature</p>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.followUpEnabled
                    ? 'Active — doctors and receptionists can create follow-ups'
                    : 'Disabled — new follow-ups cannot be created, but existing ones remain visible'}
                </p>
                {!settings.followUpEnabled && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    ⚠️ Existing follow-ups are preserved. Booked appointments are not cancelled.
                  </p>
                )}
              </div>
              <Toggle
                checked={settings.followUpEnabled}
                onChange={(v) => set('followUpEnabled', v)}
              />
            </div>
          </div>

          {/* ── Preset options ────────────────────────────────────────────── */}
          <div className={`rounded-2xl border border-gray-200 bg-white p-5 ${!settings.followUpEnabled && 'opacity-50 pointer-events-none'}`}>
            <h2 className="font-bold text-gray-900 mb-1">Available Follow-Up Presets</h2>
            <p className="text-xs text-gray-500 mb-4">
              Choose which preset durations doctors can select when creating a follow-up.
              Receptionists can always enter any positive number of days.
            </p>
            <div className="space-y-3">
              <PresetRow
                label="7 Days"
                days={7}
                enabled={settings.preset7DaysEnabled}
                onChange={(v) => set('preset7DaysEnabled', v)}
              />
              <PresetRow
                label="15 Days"
                days={15}
                enabled={settings.preset15DaysEnabled}
                onChange={(v) => set('preset15DaysEnabled', v)}
              />
              <PresetRow
                label="30 Days"
                days={30}
                enabled={settings.preset30DaysEnabled}
                onChange={(v) => set('preset30DaysEnabled', v)}
              />
              <PresetRow
                label="Custom Days"
                days={null}
                enabled={settings.customDaysEnabled}
                onChange={(v) => set('customDaysEnabled', v)}
              />
            </div>
          </div>

          {/* ── Default + Grace ───────────────────────────────────────────── */}
          <div className={`rounded-2xl border border-gray-200 bg-white p-5 ${!settings.followUpEnabled && 'opacity-50 pointer-events-none'}`}>
            <h2 className="font-bold text-gray-900 mb-4">Defaults</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Follow-Up Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.defaultFollowUpDays}
                  onChange={(e) => set('defaultFollowUpDays', parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Pre-filled when creating a new follow-up</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.gracePeriodDays}
                  onChange={(e) => set('gracePeriodDays', parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Days after due date before status becomes OVERDUE</p>
              </div>
            </div>
          </div>

          {/* ── Status flow info ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm">Follow-Up Status Flow</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {['PENDING', '→', 'UPCOMING', '→', 'DUE', '→', 'OVERDUE', '→', 'BOOKED', '→', 'COMPLETED'].map((s, i) => (
                s === '→' ? (
                  <span key={i} className="text-gray-400 self-center">→</span>
                ) : (
                  <span key={i} className="px-2 py-1 rounded-md font-semibold"
                    style={{
                      backgroundColor: {
                        PENDING: '#EFF6FF', UPCOMING: '#FEF3C7', DUE: '#FEE2E2',
                        OVERDUE: '#FEE2E2', BOOKED: '#D1FAE5', COMPLETED: '#D1FAE5',
                      }[s],
                      color: {
                        PENDING: '#1D4ED8', UPCOMING: '#92400E', DUE: '#991B1B',
                        OVERDUE: '#991B1B', BOOKED: '#065F46', COMPLETED: '#065F46',
                      }[s],
                    }}
                  >{s}</span>
                )
              ))}
            </div>
          </div>

          {/* ── Save ──────────────────────────────────────────────────────── */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><LoadingSpinner size="sm" /> Saving…</> : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
