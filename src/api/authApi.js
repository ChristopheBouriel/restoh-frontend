import apiClient from './apiClient'

/**
 * Authentication API
 */

// Register a new user
export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData)
    return { success: true, ...response }
  } catch (error) {
    // Return full error structure including code and details from backend
    return {
      success: false,
      error: error.error || 'Registration error',
      code: error.code,
      details: error.details
    }
  }
}

// User login
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials)
    return { success: true, ...response }
  } catch (error) {
    // Return full error structure including code and details from backend
    return {
      success: false,
      error: error.error || 'Login error',
      code: error.code,
      details: error.details
    }
  }
}

// Logout (optional if no refresh tokens server-side)
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout')
    return { success: true }
  } catch (error) {
    // Even on error, consider logout successful on client-side
    return { success: true }
  }
}

// Refresh access token using refresh token cookie
// Note: This is mainly used for session restoration on app init
// The auto-refresh in apiClient interceptor handles most refresh cases
export const refreshToken = async () => {
  try {
    // Refresh token is sent automatically via HttpOnly cookie
    const response = await apiClient.post('/auth/refresh')
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || 'Error refreshing token',
      code: error.code
    }
  }
}

// Get current user info
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching profile' }
  }
}

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/auth/profile', profileData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating profile' }
  }
}

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error changing password' }
  }
}

// Delete account (GDPR)
// Options:
// - password: required
// - confirmCancelReservations: optional, set to true to confirm cancellation of active reservations
export const deleteAccount = async (password, options = {}) => {
  try {
    const response = await apiClient.delete('/auth/delete-account', {
      data: { password, ...options }
    })
    return { success: true, ...response }
  } catch (error) {
    return {
      success: false,
      error: error.error || error.message || 'Error deleting account',
      code: error.code,
      reservations: error.reservations || error.data?.reservations
    }
  }
}
