import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '../api/authApi'

// Helper to clear other stores' localStorage on logout
const clearAllStoresCache = () => {
  // Clear orders and reservations cache for security
  localStorage.removeItem('orders-storage-v2')
  localStorage.removeItem('reservations-storage-v3')
  localStorage.removeItem('contacts-storage')
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null, // Stored in memory only, NOT persisted (security)
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // Set access token (called after login or refresh)
      setAccessToken: (accessToken) => set({ accessToken }),

      // Set both auth data at once (after login or session restore)
      setAuth: (accessToken, user) => set({
        accessToken,
        user,
        isAuthenticated: true,
        error: null
      }),

      // Clear all auth state (logout or session expired)
      clearAuth: () => {
        clearAllStoresCache()
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          error: null
        })
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      login: async (credentials) => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.login(credentials)

          if (result.success) {
            // Store accessToken in memory (not persisted) and user data
            set({
              accessToken: result.accessToken,
              user: result.user,
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
          // Call logout API (revokes refresh token in database + clears cookies)
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
          // Continue with client-side logout anyway
        } finally {
          // Clear all auth state and cached data
          get().clearAuth()
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

      deleteAccount: async (password, options = {}) => {
        set({ isLoading: true, error: null })

        try {
          const result = await authApi.deleteAccount(password, options)

          if (result.success) {
            // Clear all auth state after account deletion
            get().clearAuth()
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            // Return full error info including code and reservations
            return {
              success: false,
              error: result.error,
              code: result.code,
              reservations: result.reservations
            }
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

      // Fetch current user profile (requires valid accessToken)
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
            // If session is no longer valid, clear auth
            get().clearAuth()
            set({ isLoading: false })
            return { success: false, error: result.error }
          }
        } catch (error) {
          // Session invalid, clear auth
          get().clearAuth()
          set({ isLoading: false })
          return { success: false, error: error.error }
        }
      },

      // Initialize auth on app startup (restore session from refresh token cookie)
      // This is called once when the app loads to restore the session
      initializeAuth: async () => {
        set({ isLoading: true, error: null })

        try {
          // Step 1: Try to refresh the access token using the refresh token cookie
          const refreshResult = await authApi.refreshToken()

          if (!refreshResult.success) {
            // No valid refresh token - user needs to login again
            get().clearAuth()
            set({ isLoading: false })
            return { success: false, error: 'No valid session' }
          }

          // Step 2: Store the new access token
          set({ accessToken: refreshResult.accessToken })

          // Step 3: Fetch user data with the new access token
          const userResult = await authApi.getCurrentUser()

          if (userResult.success) {
            set({
              user: userResult.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            // Failed to get user data - clear auth
            get().clearAuth()
            set({ isLoading: false })
            return { success: false, error: userResult.error }
          }
        } catch (error) {
          // Session restoration failed - clear auth
          get().clearAuth()
          set({ isLoading: false })
          return { success: false, error: error.error || 'Session restoration failed' }
        }
      }
    }),
    {
      name: 'auth-storage',
      // IMPORTANT: accessToken is NOT persisted (stored in memory only for security)
      // Only user info is persisted to localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
        // accessToken is intentionally excluded - it lives in memory only
      }),
    }
  )
)

export default useAuthStore
