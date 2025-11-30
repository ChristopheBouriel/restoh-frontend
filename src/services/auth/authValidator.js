/**
 * Auth Validator - Validation functions for authentication
 * Pure functions for validating user credentials and registration data
 *
 * Convention: All validators return { isValid: boolean, error: string|null }
 * For multiple errors: { isValid: boolean, errors: Object }
 */

// ============ Constants ============

export const PASSWORD_MIN_LENGTH = 6
export const NAME_MIN_LENGTH = 1

// ============ Email Validation ============

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' }
  }

  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return { isValid: false, error: 'Email is required' }
  }

  // Simple but effective email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  return { isValid: true, error: null }
}

// ============ Password Validation ============

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }
  }

  return { isValid: true, error: null }
}

/**
 * Validate password confirmation matches
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' }
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate password for change operation
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validatePasswordChange = (currentPassword, newPassword) => {
  const errors = {}

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required'
  }

  const newPasswordValidation = validatePassword(newPassword)
  if (!newPasswordValidation.isValid) {
    errors.newPassword = newPasswordValidation.error
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'New password must be different from current password'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// ============ Name Validation ============

/**
 * Validate user name
 * @param {string} name - Name to validate
 * @returns {{ isValid: boolean, error: string|null }}
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' }
  }

  const trimmedName = name.trim()

  if (!trimmedName) {
    return { isValid: false, error: 'Name is required' }
  }

  if (trimmedName.length < NAME_MIN_LENGTH) {
    return { isValid: false, error: 'Name is too short' }
  }

  return { isValid: true, error: null }
}

// ============ Registration Validation ============

/**
 * Validate complete registration data
 * @param {Object} data - Registration data { name, email, password, confirmPassword }
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateRegistrationData = (data) => {
  const errors = {}

  // Validate name
  const nameValidation = validateName(data.name)
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error
  }

  // Validate email
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  // Validate password
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error
  }

  // Validate password confirmation
  const matchValidation = validatePasswordMatch(data.password, data.confirmPassword)
  if (!matchValidation.isValid) {
    errors.confirmPassword = matchValidation.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// ============ Login Validation ============

/**
 * Validate login credentials
 * @param {Object} credentials - Login data { email, password }
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateLoginData = (credentials) => {
  const errors = {}

  // Validate email
  const emailValidation = validateEmail(credentials.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  // Validate password (just check if present for login)
  if (!credentials.password) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// ============ Profile Validation ============

/**
 * Validate profile update data
 * @param {Object} data - Profile data { name, phone?, address? }
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateProfileData = (data) => {
  const errors = {}

  // Validate name if provided
  if (data.name !== undefined) {
    const nameValidation = validateName(data.name)
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error
    }
  }

  // Validate phone if provided (basic validation)
  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    const phoneRegex = /^[0-9\s\-+()]{6,20}$/
    if (!phoneRegex.test(data.phone)) {
      errors.phone = 'Invalid phone number format'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
