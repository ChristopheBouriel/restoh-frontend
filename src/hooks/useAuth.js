import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { ROUTES } from '../constants'

export const useAuth = () => {
  const navigate = useNavigate()
  const {
    user,
    token,
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
  } = useAuthStore()

  const handleLogin = async (credentials) => {
    const result = await login(credentials)

    if (result.success) {
      // Fetch complete user profile data after login
      await fetchCurrentUser()
      toast.success('Successfully logged in!')
      navigate(ROUTES.HOME)
      return true
    } else {
      toast.error(error || 'Login error')
      return false
    }
  }

  const handleRegister = async (userData) => {
    const result = await register(userData)

    if (result.success) {
      // Fetch complete user profile data after registration
      await fetchCurrentUser()
      toast.success('Registration successful! Welcome!')
      navigate(ROUTES.HOME)
      return true
    } else {
      toast.error(error || 'Registration error')
      return false
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
      return true
    } else {
      toast.error(error || 'Update error')
      return false
    }
  }

  const handleDeleteAccount = async (password) => {
    const result = await deleteAccount(password)
    
    if (result.success) {
      toast.success('Account deleted successfully')
      navigate(ROUTES.HOME)
      return true
    } else {
      toast.error(error || 'Error deleting account')
      return false
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