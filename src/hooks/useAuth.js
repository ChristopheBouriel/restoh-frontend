import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '../contexts/AuthContext'
import { ROUTES } from '../constants'

export const useAuth = () => {
  const navigate = useNavigate()
  const {
    user,
    accessToken: token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    changePassword,
    clearError,
    fetchCurrentUser
  } = useAuthContext()

  const handleLogin = async (credentials) => {
    const result = await login(credentials)

    if (result.success) {
      // Fetch complete user profile data after login
      await fetchCurrentUser()
      toast.success('Successfully logged in!')
      navigate(ROUTES.HOME)
      return { success: true }
    } else {
      // If backend returns details (e.g., ACCOUNT_DELETED, ACCOUNT_INACTIVE)
      if (result.details && Object.keys(result.details).length > 0) {
        // Return error with details for InlineAlert
        return result
      } else {
        // Simple error, show toast
        toast.error(result.error || error || 'Login error')
        return result
      }
    }
  }

  const handleRegister = async (userData) => {
    const result = await register(userData)

    if (result.success) {
      // Fetch complete user profile data after registration
      await fetchCurrentUser()
      toast.success('Registration successful! Welcome!')
      navigate(ROUTES.HOME)
      return { success: true }
    } else {
      // If backend returns details (e.g., EMAIL_ALREADY_EXISTS with actions)
      if (result.details && Object.keys(result.details).length > 0) {
        // Return error with details for InlineAlert
        return result
      } else {
        // Simple error, show toast
        toast.error(result.error || error || 'Registration error')
        return result
      }
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Successfully logged out')
    navigate(ROUTES.HOME)
  }

  const handleUpdateProfile = async (profileData) => {
    const result = await updateProfile(profileData)

    if (result.success) {
      toast.success('Profile updated successfully!')
      return { success: true }
    } else {
      // If backend returns details (e.g., validation errors)
      if (result.details && Object.keys(result.details).length > 0) {
        // Return error with details for InlineAlert
        return result
      } else {
        // Simple error, show toast
        toast.error(result.error || error || 'Update error')
        return result
      }
    }
  }

  const handleDeleteAccount = async (password, options = {}) => {
    const result = await deleteAccount(password, options)

    if (result.success) {
      toast.success('Account deleted successfully')
      navigate(ROUTES.HOME)
      return { success: true }
    } else {
      // Return full result for handling in modal (code, reservations, etc.)
      // Don't show toast here - let the modal handle the display
      return result
    }
  }

  const handleChangePassword = async (currentPassword, newPassword) => {
    const result = await changePassword(currentPassword, newPassword)
    
    if (result.success) {
      return { success: true }
    } else {
      return { success: false, error: result.error }
    }
  }

  // Utilities
  const isAdmin = user?.role === 'admin'
  const isUser = user?.role === 'user'

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isUser,

    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    deleteAccount: handleDeleteAccount,
    changePassword: handleChangePassword,
    clearError
  }
}