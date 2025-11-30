/**
 * Contact validation functions
 * Compact style - main validation function with inline field validation
 *
 * Convention: All validators return { isValid: boolean, error(s) }
 */

import { validateEmail, validatePhoneFrench } from '../common/validators'

/**
 * Validate complete contact form data
 * @param {Object} data - Contact form data
 * @param {string} data.name - Name
 * @param {string} data.email - Email
 * @param {string} data.subject - Subject
 * @param {string} data.message - Message
 * @param {string} [data.phone] - Phone (optional)
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateContactForm = (data) => {
  const errors = {}

  // Name validation
  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required'
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  // Email validation (using common validator)
  const emailResult = validateEmail(data.email)
  if (!emailResult.isValid) {
    errors.email = emailResult.error
  }

  // Subject validation
  if (!data.subject || !data.subject.trim()) {
    errors.subject = 'Subject is required'
  }

  // Message validation
  if (!data.message || !data.message.trim()) {
    errors.message = 'Message is required'
  } else if (data.message.trim().length < 10) {
    errors.message = 'Message must contain at least 10 characters'
  } else if (data.message.trim().length > 5000) {
    errors.message = 'Message must not exceed 5000 characters'
  }

  // Phone validation (optional, using common validator)
  if (data.phone) {
    const phoneResult = validatePhoneFrench(data.phone, false)
    if (!phoneResult.isValid) {
      errors.phone = phoneResult.error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Check if contact form is complete (for enabling submit button)
 * @param {Object} data - Contact form data
 * @returns {boolean}
 */
export const isContactFormComplete = (data) => {
  return !!(
    data.name?.trim() &&
    data.name.trim().length >= 2 &&
    data.email?.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    data.subject?.trim() &&
    data.message?.trim().length >= 10
  )
}

/**
 * Validate reply text
 * @param {string} text - Reply text to validate
 * @param {number} maxLength - Maximum length (default: 1000)
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateReply = (text, maxLength = 1000) => {
  if (!text || !text.trim()) {
    return { isValid: false, error: 'Please write a message' }
  }

  if (text.length > maxLength) {
    return { isValid: false, error: `Message is too long (max ${maxLength} characters)` }
  }

  return { isValid: true, error: null }
}
