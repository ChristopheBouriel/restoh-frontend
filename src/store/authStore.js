import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../api/authApi'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      // token: null, // NO LONGER NEEDED - Auth is handled by HTTP-only cookies
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // setToken: (token) => set({ token }), // NO LONGER NEEDED

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
              // token: result.token, // NO LONGER NEEDED - Cookie is set by server
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
            // Return complete error structure including code and details
            return {
              success: false,
              error: result.error,
              code: result.code,
              details: result.details
            }
          }
        } catch (error) {
          const errorMessage = error.error || 'Connection error'
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
            // IMPORTANT: Do NOT auto-login after registration
            // User must verify email first, then login manually
            // Clear any session created by backend
            try {
              await authApi.logout()
            } catch (e) {
              console.log('Logout after registration (expected):', e)
            }

            set({
              user: null, // Don't set user
              isAuthenticated: false, // Keep user logged out
              isLoading: false,
              error: null
            })
            return { success: true, email: result.user?.email }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            // Return complete error structure including code and details
            return {
              success: false,
              error: result.error,
              code: result.code,
              details: result.details
            }
          }
        } catch (error) {
          const errorMessage = error.error || 'Registration error'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        try {
          // Call logout API (to clear HTTP-only cookie on backend)
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
          // Continue with client-side logout anyway
        } finally {
          // Always clear local state
          set({
            user: null,
            // token: null, // NO LONGER NEEDED
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
          const errorMessage = error.error || 'Update error'
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
          const result = await authApi.changePassword(currentPassword, newPassword)

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
          const errorMessage = error.error || 'Password change error'
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
            // Logout user after account deletion
            set({
              user: null,
              // token: null, // NO LONGER NEEDED
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
          const errorMessage = error.error || 'Account deletion error'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Fetch current user profile (optional, useful at app load)
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
            // If cookie is no longer valid, logout
            set({
              user: null,
              // token: null, // NO LONGER NEEDED
              isAuthenticated: false,
              isLoading: false,
              error: null
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          set({
            user: null,
            // token: null, // NO LONGER NEEDED
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
        // token: state.token, // NO LONGER NEEDED - Don't persist token
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

export default useAuthStore
