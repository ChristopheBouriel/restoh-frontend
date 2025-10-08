import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../api/authApi'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // État
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (credentials) => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.login(credentials)

          if (result.success) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur de connexion'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.register(userData)

          if (result.success) {
            set({
              user: result.user,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de l\'inscription'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        try {
          // Appeler l'API de logout (pour invalider le token côté backend)
          await authApi.logout()
        } catch (error) {
          console.error('Erreur lors du logout:', error)
          // On continue quand même la déconnexion côté client
        } finally {
          // Toujours nettoyer l'état local
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
          })
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.updateProfile(profileData)

          if (result.success) {
            set({
              user: result.user,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la mise à jour'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.changePassword({ currentPassword, newPassword })

          if (result.success) {
            set({
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors du changement de mot de passe'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      deleteAccount: async (password) => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.deleteAccount({ password })

          if (result.success) {
            // Déconnecter l'utilisateur après suppression du compte
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la suppression du compte'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Récupérer le profil utilisateur actuel (optionnel, utile au chargement de l'app)
      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.getCurrentUser()

          if (result.success) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            // Si le token n'est plus valide, déconnecter
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          return { success: false, error: error.error }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

export default useAuthStore
