/**
 * Auth Validator - Validation functions for authentication
 * Pure functions for validating user credentials and registration data
 */

// ============ Constants ============

export const PASSWORD_MIN_LENGTH = 6
export const NAME_MIN_LENGTH = 1

// ============ Email Validation ============

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return { valid: false, error: 'Email is required' }
  }

  // Simple but effective email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}

// ============ Password Validation ============

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }
  }

  return { valid: true }
}

/**
 * Validate password confirmation matches
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password' }
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' }
  }

  return { valid: true }
}

/**
 * Validate password for change operation
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} { valid: boolean, errors: {} }
 */
export const validatePasswordChange = (currentPassword, newPassword) => {
  const errors = {}

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required'
  }

  const newPasswordValidation = validatePassword(newPassword)
  if (!newPasswordValidation.valid) {
    errors.newPassword = newPasswordValidation.error
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'New password must be different from current password'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============ Name Validation ============

/**
 * Validate user name
 * @param {string} name - Name to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' }
  }

  const trimmedName = name.trim()

  if (!trimmedName) {
    return { valid: false, error: 'Name is required' }
  }

  if (trimmedName.length < NAME_MIN_LENGTH) {
    return { valid: false, error: 'Name is too short' }
  }

  return { valid: true }
}

// ============ Registration Validation ============

/**
 * Validate complete registration data
 * @param {Object} data - Registration data { name, email, password, confirmPassword }
 * @returns {Object} { valid: boolean, errors: {} }
 */
export const validateRegistrationData = (data) => {
  const errors = {}

  // Validate name
  const nameValidation = validateName(data.name)
  if (!nameValidation.valid) {
    errors.name = nameValidation.error
  }

  // Validate email
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error
  }

  // Validate password
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error
  }

  // Validate password confirmation
  const matchValidation = validatePasswordMatch(data.password, data.confirmPassword)
  if (!matchValidation.valid) {
    errors.confirmPassword = matchValidation.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============ Login Validation ============

/**
 * Validate login credentials
 * @param {Object} credentials - Login data { email, password }
 * @returns {Object} { valid: boolean, errors: {} }
 */
export const validateLoginData = (credentials) => {
  const errors = {}

  // Validate email
  const emailValidation = validateEmail(credentials.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error
  }

  // Validate password (just check if present for login)
  if (!credentials.password) {
    errors.password = 'Password is required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============ Profile Validation ============

/**
 * Validate profile update data
 * @param {Object} data - Profile data { name, phone?, address? }
 * @returns {Object} { valid: boolean, errors: {} }
 */
export const validateProfileData = (data) => {
  const errors = {}

  // Validate name if provided
  if (data.name !== undefined) {
    const nameValidation = validateName(data.name)
    if (!nameValidation.valid) {
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
    valid: Object.keys(errors).length === 0,
    errors
  }
}
