/**
 * Auth Service - Main orchestration class
 * Provides a unified interface for auth-related business logic
 */

import * as validator from './authValidator'

class AuthService {
  // ============ Validation Methods ============

  /**
   * Validate email format
   */
  validateEmail(email) {
    return validator.validateEmail(email)
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    return validator.validatePassword(password)
  }

  /**
   * Validate name
   */
  validateName(name) {
    return validator.validateName(name)
  }

  /**
   * Validate password match
   */
  validatePasswordMatch(password, confirmPassword) {
    return validator.validatePasswordMatch(password, confirmPassword)
  }

  /**
   * Validate complete registration data
   */
  validateRegistrationData(data) {
    return validator.validateRegistrationData(data)
  }

  /**
   * Validate login credentials
   */
  validateLoginData(credentials) {
    return validator.validateLoginData(credentials)
  }

  /**
   * Validate profile update data
   */
  validateProfileData(data) {
    return validator.validateProfileData(data)
  }

  /**
   * Validate password change
   */
  validatePasswordChange(currentPassword, newPassword) {
    return validator.validatePasswordChange(currentPassword, newPassword)
  }

  // ============ Helper Methods ============

  /**
   * Check if user is admin
   */
  isAdmin(user) {
    return user?.role === 'admin'
  }

  /**
   * Check if user is regular user
   */
  isUser(user) {
    return user?.role === 'user'
  }

  /**
   * Get user display name
   */
  getUserDisplayName(user) {
    if (!user) return 'Guest'
    return user.name || user.email?.split('@')[0] || 'User'
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(user) {
    if (!user) return '?'
    const name = user.name || user.email || ''
    const parts = name.split(/[\s@]/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return (parts[0]?.[0] || '?').toUpperCase()
  }
}

// Export singleton instance
export default new AuthService()
