/**
 * DoctorSchedulePage — Weekly schedule management for doctors
 *
 * Allows doctors to configure:
 *  - Per-day availability (on/off toggle for each clinic + day)
 *  - Working hours (start time / end time) per day
 *  - Slot duration in minutes (10 / 15 / 20 / 30)
 *  - Max patients per day
 *
 * Uses: POST /doctor/availability (upsert) and PUT /doctor/availability/:id
 */

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getDoctorProfile,
  getDoctorSchedule,
  setDaySchedule,
  updateDaySchedule,
} from '../../api/doctor.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// ── Constants ──────────────────────────────────────────────────────────────────
const DAYS = [
  { label: 'Sunday',    short: 'Sun', index: 0 },
  { label: 'Monday',    short: 'Mon', index: 1 },
  { label: 'Tuesday',   short: 'Tue', index: 2 },
  { label: 'Wednesday', short: 'Wed', index: 3 },
  { label: 'Thursday',  short: 'Thu', index: 4 },
  { label: 'Friday',    short: 'Fri', index: 5 },
  { label: 'Saturday',  short: 'Sat', index: 6 },
];

const SLOT_DURATIONS = [
  { value: 10,  label: '10 min' },
  { value: 15,  label: '15 min' },
  { value: 20,  label: '20 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hour' },
];

// Generate all HH:MM options in 30-min increments for time pickers
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const time = `${hh}:${mm}`;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr   = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const label = `${hr}:${mm} ${ampm}`;
      opts.push({ value: time, label });
    }
  }
  return opts;
})();

// Compute how many slots fit in a window
const slotCount = (start, end, duration) => {
  if (!start || !end || !duration) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? Math.floor(mins / duration) : 0;
};

// ── Default row state for a day ───────────────────────────────────────────────
const defaultRow = (dayOfWeek, clinicId) => ({
  id: null,           // null = not saved yet
  clinicId,
  dayOfWeek,
  isActive: false,
  startTime: '09:00',
  endTime: '17:00',
  slotDurationMin: 15,
  maxPatients: 20,
  dirty: false,
  saving: false,
});

// ── Day row component ─────────────────────────────────────────────────────────
function DayRow({ day, row, onChange, onSave }) {
  const count = slotCount(row.startTime, row.endTime, row.slotDurationMin);

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      row.isActive
        ? 'border-primary-300 bg-primary-50'
        : 'border-border bg-white opacity-70'
    }`}>
      {/* ── Header row ── */}
      <div className="flex items-center gap-3 p-4">
        {/* Day name + toggle */}
        <div className="flex items-center gap-3 w-28 shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={row.isActive}
              onChange={(e) => onChange({ isActive: e.target.checked, dirty: true })}
            />
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer
              peer-checked:after:translate-x-full peer-checked:after:border-white
              after:content-[''] after:absolute after:top-0.5 after:left-0.5
              after:bg-white after:border-gray-300 after:border after:rounded-full
              after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
          </label>
          <span className={`text-sm font-semibold ${row.isActive ? 'text-primary-700' : 'text-text-muted'}`}>
            {day.short}
          </span>
        </div>

        {/* Schedule config — only when active */}
        {row.isActive ? (
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Start time */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted whitespace-nowrap">From</span>
              <select
                className="input py-1 px-2 text-sm w-28"
                value={row.startTime}
                onChange={(e) => onChange({ startTime: e.target.value, dirty: true })}
              >
                {TIME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* End time */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted whitespace-nowrap">To</span>
              <select
                className="input py-1 px-2 text-sm w-28"
                value={row.endTime}
                onChange={(e) => onChange({ endTime: e.target.value, dirty: true })}
              >
                {TIME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Slot duration */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted whitespace-nowrap">Slot</span>
              <select
                className="input py-1 px-2 text-sm w-24"
                value={row.slotDurationMin}
                onChange={(e) => onChange({ slotDurationMin: Number(e.target.value), dirty: true })}
              >
                {SLOT_DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Max patients */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted whitespace-nowrap">Max</span>
              <input
                type="number"
                className="input py-1 px-2 text-sm w-16"
                value={row.maxPatients}
                min={1}
                max={100}
                onChange={(e) => onChange({ maxPatients: Number(e.target.value) || 1, dirty: true })}
              />
              <span className="text-xs text-text-muted">pts</span>
            </div>

            {/* Slot count badge */}
            {count > 0 && (
              <span className="badge badge-info text-xs ml-auto">
                {count} slots
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-text-muted italic">Day off</span>
        )}

        {/* Save button */}
        {row.dirty && (
          <button
            type="button"
            onClick={onSave}
            disabled={row.saving}
            className="btn-primary text-xs py-1.5 px-3 ml-auto shrink-0"
          >
            {row.saving ? <LoadingSpinner size="sm" className="mx-auto" /> : 'Save'}
          </button>
        )}

        {/* Saved checkmark */}
        {!row.dirty && row.id && row.isActive && (
          <span className="text-xs text-green-600 font-semibold ml-auto shrink-0 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const DoctorSchedulePage = () => {
  const { user } = useAuthStore();
  const [profile, setProfile]   = useState(null);
  const [isLoading, setLoading] = useState(true);

  // scheduleMap[clinicId][dayIndex] = row state
  const [scheduleMap, setScheduleMap] = useState({});
  const [selectedClinic, setSelectedClinic] = useState(null);

  // ── Load profile + existing schedule ─────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getDoctorProfile();
      const prof = res.data.data.profile;
      setProfile(prof);

      const clinics = prof.doctorClinics?.filter((dc) => dc.isActive) || [];
      if (clinics.length === 0) { setLoading(false); return; }

      const firstClinic = clinics[0].clinic?.id || clinics[0].clinicId;
      setSelectedClinic(firstClinic);

      // Build initial schedule map for all clinics
      const map = {};
      for (const dc of clinics) {
        const cId = dc.clinic?.id || dc.clinicId;
        map[cId] = {};
        DAYS.forEach((d) => {
          map[cId][d.index] = defaultRow(d.index, cId);
        });
      }

      // Fetch saved schedules for each clinic
      const doctorProfileId = prof.id;
      for (const dc of clinics) {
        const cId = dc.clinic?.id || dc.clinicId;
        try {
          const sRes = await getDoctorSchedule(doctorProfileId, { clinicId: cId });
          const saved = sRes.data.data?.availability || [];
          for (const avail of saved) {
            map[cId][avail.dayOfWeek] = {
              id: avail.id,
              clinicId: cId,
              dayOfWeek: avail.dayOfWeek,
              isActive: avail.isActive,
              startTime: avail.startTime,
              endTime: avail.endTime,
              slotDurationMin: avail.slotDurationMin,
              maxPatients: avail.maxPatients,
              dirty: false,
              saving: false,
            };
          }
        } catch { /* clinic may have no schedule yet */ }
      }

      setScheduleMap(map);
    } catch (err) {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Row change handler ────────────────────────────────────────────────────
  const handleChange = (clinicId, dayIndex, patch) => {
    setScheduleMap((prev) => ({
      ...prev,
      [clinicId]: {
        ...prev[clinicId],
        [dayIndex]: { ...prev[clinicId][dayIndex], ...patch },
      },
    }));
  };

  // ── Save a single day ─────────────────────────────────────────────────────
  const handleSave = async (clinicId, dayIndex) => {
    const row = scheduleMap[clinicId]?.[dayIndex];
    if (!row) return;

    // Validation
    const [sh, sm] = row.startTime.split(':').map(Number);
    const [eh, em] = row.endTime.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      toast.error('End time must be after start time');
      return;
    }

    handleChange(clinicId, dayIndex, { saving: true });
    try {
      if (row.id) {
        // Update existing record
        await updateDaySchedule(row.id, {
          startTime:      row.startTime,
          endTime:        row.endTime,
          slotDurationMin: row.slotDurationMin,
          maxPatients:    row.maxPatients,
          isActive:       row.isActive,
        });
      } else {
        // Create new record
        const res = await setDaySchedule({
          clinicId:        row.clinicId,
          dayOfWeek:       row.dayOfWeek,
          startTime:       row.startTime,
          endTime:         row.endTime,
          slotDurationMin: row.slotDurationMin,
          maxPatients:     row.maxPatients,
          isActive:        row.isActive,
        });
        const newId = res.data.data?.availability?.id;
        handleChange(clinicId, dayIndex, { id: newId });
      }
      handleChange(clinicId, dayIndex, { dirty: false, saving: false });
      toast.success(`${DAYS[dayIndex].label} schedule saved`);
    } catch (err) {
      handleChange(clinicId, dayIndex, { saving: false });
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  // ── Apply same schedule to all days ──────────────────────────────────────
  const applyToWeekdays = (clinicId) => {
    const mon = scheduleMap[clinicId]?.[1];
    if (!mon || !mon.isActive) { toast.error('Set Monday schedule first'); return; }

    setScheduleMap((prev) => {
      const updated = { ...prev[clinicId] };
      [2, 3, 4, 5].forEach((d) => { // Tue–Fri
        updated[d] = {
          ...updated[d],
          isActive:       mon.isActive,
          startTime:      mon.startTime,
          endTime:        mon.endTime,
          slotDurationMin: mon.slotDurationMin,
          maxPatients:    mon.maxPatients,
          dirty: true,
        };
      });
      return { ...prev, [clinicId]: updated };
    });
    toast.success('Monday schedule applied to Tue–Fri. Save each day to confirm.');
  };

  // ── Save all dirty rows at once ───────────────────────────────────────────
  const saveAll = async (clinicId) => {
    const rows = scheduleMap[clinicId] || {};
    const dirtyDays = Object.entries(rows).filter(([, r]) => r.dirty).map(([d]) => Number(d));
    if (dirtyDays.length === 0) { toast('No unsaved changes'); return; }

    for (const dayIndex of dirtyDays) {
      await handleSave(clinicId, dayIndex);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const clinics = profile?.doctorClinics?.filter((dc) => dc.isActive) || [];

  if (clinics.length === 0) {
    return (
      <DashboardLayout>
        <div className="page-container max-w-2xl">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Availability Schedule</h1>
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Active Clinic</h3>
            <p className="text-text-muted text-sm">
              You need to be associated with an active clinic before configuring your schedule.
              Accept a clinic invitation from the <a href="/doctor/profile" className="text-primary-600 underline">Profile page</a>.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentClinicRows = scheduleMap[selectedClinic] || {};
  const hasDirty = Object.values(currentClinicRows).some((r) => r.dirty);
  const selectedClinicInfo = clinics.find(
    (dc) => (dc.clinic?.id || dc.clinicId) === selectedClinic
  );

  return (
    <DashboardLayout>
      <div className="page-container max-w-3xl">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Availability Schedule</h1>
            <p className="text-sm text-text-muted mt-1">
              Configure when patients can book appointments with you
            </p>
          </div>
          {hasDirty && (
            <button
              type="button"
              onClick={() => saveAll(selectedClinic)}
              className="btn-primary"
            >
              Save All Changes
            </button>
          )}
        </div>

        {/* ── Clinic selector (when doctor has multiple) ── */}
        {clinics.length > 1 && (
          <div className="card mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Select Clinic</h3>
            <div className="flex flex-wrap gap-2">
              {clinics.map((dc) => {
                const cId = dc.clinic?.id || dc.clinicId;
                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => setSelectedClinic(cId)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selectedClinic === cId
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-text-primary border-border hover:border-primary-300'
                    }`}
                  >
                    {dc.clinic?.name || 'Clinic'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Clinic info banner ── */}
        <div className="card mb-6 bg-primary-50 border border-primary-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-primary-800">
                {selectedClinicInfo?.clinic?.name || 'Clinic'}
              </p>
              <p className="text-xs text-primary-600 mt-0.5">
                {selectedClinicInfo?.clinic?.city}
                {selectedClinicInfo?.startTime && selectedClinicInfo?.endTime
                  ? ` · Default hours: ${selectedClinicInfo.startTime}–${selectedClinicInfo.endTime}`
                  : ''}
              </p>
              <p className="text-xs text-primary-500 mt-1">
                Per-day settings below override the default clinic schedule for patients booking online.
              </p>
            </div>
          </div>
        </div>

        {/* ── Quick-fill toolbar ── */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Weekly Schedule</h3>
          <button
            type="button"
            onClick={() => applyToWeekdays(selectedClinic)}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium underline underline-offset-2"
          >
            Copy Monday to Tue–Fri
          </button>
        </div>

        {/* ── Day rows ── */}
        <div className="space-y-2 mb-6">
          {DAYS.map((day) => (
            <DayRow
              key={day.index}
              day={day}
              row={currentClinicRows[day.index] || defaultRow(day.index, selectedClinic)}
              onChange={(patch) => handleChange(selectedClinic, day.index, patch)}
              onSave={() => handleSave(selectedClinic, day.index)}
            />
          ))}
        </div>

        {/* ── Summary card ── */}
        <div className="card bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Schedule Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DAYS.filter((d) => currentClinicRows[d.index]?.isActive).map((day) => {
              const row = currentClinicRows[day.index];
              const count = slotCount(row.startTime, row.endTime, row.slotDurationMin);
              return (
                <div key={day.index} className="rounded-lg bg-white border border-border p-3">
                  <p className="text-xs font-bold text-primary-700">{day.label}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {row.startTime} – {row.endTime}
                  </p>
                  <p className="text-xs text-text-muted">
                    {row.slotDurationMin} min · {count} slots · max {row.maxPatients} pts
                  </p>
                </div>
              );
            })}
            {DAYS.filter((d) => currentClinicRows[d.index]?.isActive).length === 0 && (
              <p className="col-span-3 text-sm text-text-muted">
                No working days configured yet. Enable days above to get started.
              </p>
            )}
          </div>
        </div>

        {/* ── Help note ── */}
        <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 leading-relaxed">
          <strong>How it works:</strong> Patients will only see slots from your schedule above.
          Booked slots are automatically hidden. When no schedule is configured for a day, patients
          will see "No slots available" instead of hardcoded times.
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DoctorSchedulePage;
