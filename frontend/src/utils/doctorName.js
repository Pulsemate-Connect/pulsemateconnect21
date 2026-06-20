/**
 * fmtDoctorName — safely formats a doctor display name.
 * Prevents "Dr. Dr." by checking if the name already has the prefix.
 */
export const fmtDoctorName = (name) => {
  if (!name) return 'Doctor';
  const t = name.trim();
  const lower = t.toLowerCase();
  if (lower.startsWith('dr.') || lower.startsWith('dr ') || lower === 'dr' || lower.startsWith('doctor ')) {
    return t;
  }
  return `Dr. ${t}`;
};
