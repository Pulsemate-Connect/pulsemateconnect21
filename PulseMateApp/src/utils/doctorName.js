/**
 * fmtDoctorName — safely formats a doctor's display name.
 * Prevents double "Dr." prefix by checking if the name already starts with
 * "Dr", "Dr." or "Doctor" (case-insensitive).
 *
 * @param {string|null|undefined} name
 * @returns {string}
 */
export const fmtDoctorName = (name) => {
  if (!name) return 'Doctor';
  const t = name.trim();
  const lower = t.toLowerCase();
  if (
    lower.startsWith('dr.') ||
    lower.startsWith('dr ') ||
    lower === 'dr' ||
    lower.startsWith('doctor ')
  ) {
    return t;
  }
  return `Dr. ${t}`;
};

/**
 * stripDrPrefix — removes any "Dr.", "Dr", or "Doctor" prefix from a name.
 * Useful for storing clean names in DB.
 *
 * @param {string} name
 * @returns {string}
 */
export const stripDrPrefix = (name) => {
  if (!name) return '';
  return name.trim()
    .replace(/^(dr\.?\s*|doctor\s+)/i, '')
    .trim();
};
