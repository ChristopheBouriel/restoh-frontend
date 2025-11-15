import apiClient from './apiClient'

/**
 * Email API
 * Handles email verification and password reset flows
 */

// Send forgot password email
export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post('/email/forgot-password', { email })
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || 'Failed to send reset email',
      code: error.code,
      details: error.details
    }
  }
}

// Verify email with token
export const verifyEmail = async (token) => {
  try {
    const response = await apiClient.get(`/email/verify/${token}`)
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || 'Email verification failed',
      code: error.code,
      details: error.details
    }
  }
}

// Reset password with token
export const resetPassword = async (token, password) => {
  try {
    const response = await apiClient.post(`/email/reset-password/${token}`, { password })
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || 'Password reset failed',
      code: error.code,
      details: error.details
    }
  }
}

// Resend verification email
export const resendVerification = async (email) => {
  try {
    const response = await apiClient.post('/email/resend-verification', { email })
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || 'Failed to resend verification email',
      code: error.code,
      details: error.details
    }
  }
}
