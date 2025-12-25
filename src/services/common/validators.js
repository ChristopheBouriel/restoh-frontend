/**
 * Common validation functions
 * Shared across all services to ensure consistency
 *
 * Convention: All validators return { isValid: boolean, error: string|null }
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Invalid email format' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate French phone number format
 * Accepts: 06 12 34 56 78, 06.12.34.56.78, 0612345678, +33 6 12 34 56 78
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether the field is required (default: true)
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validatePhoneFrench = (phone, required = true) => {
  // If not required and empty, it's valid
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, error: 'Phone number is required' }
    }
    return { isValid: true, error: null }
  }

  // Remove all spaces, dots, dashes for validation
  const cleaned = phone.replace(/[\s.-]/g, '')

  // French format: 0X XX XX XX XX (10 digits starting with 0)
  // Or international: +33 X XX XX XX XX
  const frenchRegex = /^0[1-9]\d{8}$/
  const internationalRegex = /^\+33[1-9]\d{8}$/

  if (!frenchRegex.test(cleaned) && !internationalRegex.test(cleaned)) {
    return { isValid: false, error: 'Invalid phone format (e.g., 06 12 34 56 78)' }
  }

  return { isValid: true, error: null }
}
