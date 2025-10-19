import apiClient from './apiClient'

/**
 * Users API (Admin only)
 */

// Get all users (ADMIN)
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get('/users')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error fetching users' }
  }
}

// Update user (ADMIN) - only role and isActive
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, userData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error updating user' }
  }
}

// Delete user (ADMIN)
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/users/${userId}`)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Error deleting user' }
  }
}
