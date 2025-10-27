/**
 * Get today's date in local timezone (YYYY-MM-DD format)
 * This avoids timezone issues when comparing dates
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getTodayLocalDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Normalize a date string to YYYY-MM-DD format
 * Handles both ISO format dates (with time) and simple date strings
 * @param {string} dateString - Date string to normalize
 * @returns {string} Date in YYYY-MM-DD format, or empty string if invalid
 */
export const normalizeDateString = (dateString) => {
  if (!dateString) return ''
  return dateString.split('T')[0]
}
