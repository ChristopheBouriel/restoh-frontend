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
    clearError
  } = useAuthStore()

  const handleLogin = async (credentials) => {
    const result = await login(credentials)
    
    if (result.success) {
      toast.success('Connexion réussie !')
      navigate(ROUTES.HOME)
      return true
    } else {
      toast.error(error || 'Erreur de connexion')
      return false
    }
  }

  const handleRegister = async (userData) => {
    const result = await register(userData)
    
    if (result.success) {
      toast.success('Inscription réussie ! Bienvenue !')
      navigate(ROUTES.HOME)
      return true
    } else {
      toast.error(error || 'Erreur lors de l\'inscription')
      return false
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Déconnexion réussie')
    navigate(ROUTES.HOME)
  }

  const handleUpdateProfile = async (profileData) => {
    const result = await updateProfile(profileData)
    
    if (result.success) {
      toast.success('Profil mis à jour avec succès !')
      return true
    } else {
      toast.error(error || 'Erreur lors de la mise à jour')
      return false
    }
  }

  const handleDeleteAccount = async (password) => {
    const result = await deleteAccount(password)
    
    if (result.success) {
      toast.success('Compte supprimé avec succès')
      navigate(ROUTES.HOME)
      return true
    } else {
      toast.error(error || 'Erreur lors de la suppression du compte')
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

  // Utilitaires
  const isAdmin = user?.role === 'admin'
  const isUser = user?.role === 'user'
  
  return {
    // État
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