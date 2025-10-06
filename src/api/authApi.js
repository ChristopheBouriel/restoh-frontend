import apiClient from './apiClient'

/**
 * API d'authentification
 */

// Inscription d'un nouvel utilisateur
export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de l\'inscription' }
  }
}

// Connexion utilisateur
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur de connexion' }
  }
}

// Déconnexion (optionnel si pas de refresh tokens côté serveur)
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout')
    return { success: true }
  } catch (error) {
    // Même en cas d'erreur, on considère la déconnexion comme réussie côté client
    return { success: true }
  }
}

// Rafraîchir le token JWT
export const refreshToken = async (refreshToken) => {
  try {
    const response = await apiClient.post('/auth/refresh', { refreshToken })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors du rafraîchissement du token' }
  }
}

// Récupérer les infos de l'utilisateur connecté
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me')
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la récupération du profil' }
  }
}

// Mettre à jour le profil utilisateur
export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/auth/profile', profileData)
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la mise à jour du profil' }
  }
}

// Changer le mot de passe
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors du changement de mot de passe' }
  }
}

// Supprimer le compte (RGPD)
export const deleteAccount = async (password) => {
  try {
    const response = await apiClient.delete('/auth/account', {
      data: { password }
    })
    return { success: true, ...response }
  } catch (error) {
    return { success: false, error: error.error || 'Erreur lors de la suppression du compte' }
  }
}
