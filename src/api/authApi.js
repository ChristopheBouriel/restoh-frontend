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
    return { success: false, error: error.error || 'Registration error' }
  }
}

// User login
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Login error' }
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

// Refresh JWT token
export const refreshToken = async (refreshToken) => {
  try {
    const response = await apiClient.post('/auth/refresh', { refreshToken })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error refreshing token' }
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
export const deleteAccount = async (password) => {
  try {
    const response = await apiClient.delete('/auth/delete-account', {
      data: { password }
    })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error deleting account' }
  }
}
