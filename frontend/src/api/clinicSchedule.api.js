/**
 * Clinic Schedule & Timings API
 * Frontend API service for managing clinic schedules, breaks, holidays, and settings
 */

import api from './axios';

// ═══════════════════════════════════════════════════════════════════════════
// WORKING HOURS
// ═══════════════════════════════════════════════════════════════════════════

export const getWorkingHours = (clinicId) =>
  api.get(`/clinic/${clinicId}/schedule/working-hours`);

export const updateWorkingHours = (clinicId, workingHours) =>
  api.put(`/clinic/${clinicId}/schedule/working-hours`, { workingHours });

export const copyMondayToAll = (clinicId, targetDays) =>
  api.post(`/clinic/${clinicId}/schedule/copy-monday`, { targetDays });

// ═══════════════════════════════════════════════════════════════════════════
// BREAKS
// ═══════════════════════════════════════════════════════════════════════════

export const getBreaks = (clinicId) =>
  api.get(`/clinic/${clinicId}/schedule/breaks`);

export const createBreak = (clinicId, breakData) =>
  api.post(`/clinic/${clinicId}/schedule/breaks`, breakData);

export const updateBreak = (clinicId, breakId, breakData) =>
  api.put(`/clinic/${clinicId}/schedule/breaks/${breakId}`, breakData);

export const deleteBreak = (clinicId, breakId) =>
  api.delete(`/clinic/${clinicId}/schedule/breaks/${breakId}`);

// ═══════════════════════════════════════════════════════════════════════════
// HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════

export const getHolidays = (clinicId, params = {}) =>
  api.get(`/clinic/${clinicId}/schedule/holidays`, { params });

export const createHoliday = (clinicId, holidayData) =>
  api.post(`/clinic/${clinicId}/schedule/holidays`, holidayData);

export const updateHoliday = (clinicId, holidayId, holidayData) =>
  api.put(`/clinic/${clinicId}/schedule/holidays/${holidayId}`, holidayData);

export const deleteHoliday = (clinicId, holidayId) =>
  api.delete(`/clinic/${clinicId}/schedule/holidays/${holidayId}`);

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL HOURS
// ═══════════════════════════════════════════════════════════════════════════

export const getSpecialHours = (clinicId, params = {}) =>
  api.get(`/clinic/${clinicId}/schedule/special-hours`, { params });

export const createSpecialHour = (clinicId, specialHoursData) =>
  api.post(`/clinic/${clinicId}/schedule/special-hours`, specialHoursData);

export const createSpecialHours = (clinicId, specialHoursData) =>
  api.post(`/clinic/${clinicId}/schedule/special-hours`, specialHoursData);

export const updateSpecialHour = (clinicId, specialHoursId, specialHoursData) =>
  api.put(`/clinic/${clinicId}/schedule/special-hours/${specialHoursId}`, specialHoursData);

export const updateSpecialHours = (clinicId, specialHoursId, specialHoursData) =>
  api.put(`/clinic/${clinicId}/schedule/special-hours/${specialHoursId}`, specialHoursData);

export const deleteSpecialHour = (clinicId, specialHoursId) =>
  api.delete(`/clinic/${clinicId}/schedule/special-hours/${specialHoursId}`);

export const deleteSpecialHours = (clinicId, specialHoursId) =>
  api.delete(`/clinic/${clinicId}/schedule/special-hours/${specialHoursId}`);

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORARY CLOSURE
// ═══════════════════════════════════════════════════════════════════════════

export const getTemporaryClosure = (clinicId) =>
  api.get(`/clinic/${clinicId}/schedule/temporary-closure`);

export const createTemporaryClosure = (clinicId, reason) =>
  api.post(`/clinic/${clinicId}/schedule/temporary-closure`, { reason });

export const reopenClinic = (clinicId) =>
  api.post(`/clinic/${clinicId}/schedule/reopen`);

// ═══════════════════════════════════════════════════════════════════════════
// CLINIC STATUS & TODAY'S SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════

export const getClinicStatus = (clinicId) =>
  api.get(`/clinic/${clinicId}/schedule/status`);

export const getTodaySchedule = (clinicId) =>
  api.get(`/clinic/${clinicId}/schedule/today`);

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export const getAppointmentSettings = (clinicId) =>
  api.get(`/clinic/${clinicId}/settings/appointments`);

export const updateAppointmentSettings = (clinicId, settings) =>
  api.put(`/clinic/${clinicId}/settings/appointments`, settings);

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export const getQueueSettings = (clinicId) =>
  api.get(`/clinic/${clinicId}/settings/queue`);

export const updateQueueSettings = (clinicId, settings) =>
  api.put(`/clinic/${clinicId}/settings/queue`, settings);

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

export const getSettingsSummary = (clinicId) =>
  api.get(`/clinic/${clinicId}/settings/summary`);
