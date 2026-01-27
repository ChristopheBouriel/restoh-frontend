import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import useAuthStore from '../store/authStore'

/**
 * AuthContext - React Context wrapper for Zustand auth store
 *
 * This exists because Zustand's useSyncExternalStore doesn't reliably
 * trigger re-renders on iOS WebKit/Safari. By using React Context,
 * we ensure proper re-rendering across all browsers.
 *
 * The actual state management still happens in Zustand (authStore),
 * but this Context acts as a bridge that React can reliably observe.
 */

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // Get initial state from Zustand store
  const store = useAuthStore()

  // Mirror the auth state in React state for reliable re-renders
  const [authState, setAuthState] = useState({
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    accessToken: store.accessToken,
  })

  // Subscribe to Zustand store changes and update React state
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      setAuthState({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        accessToken: state.accessToken,
      })
    })

    return unsubscribe
  }, [])

  // Also listen for custom auth-state-changed event (belt and suspenders)
  useEffect(() => {
    const handleAuthChange = () => {
      const state = useAuthStore.getState()
      setAuthState({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        error: state.error,
        accessToken: state.accessToken,
      })
    }

    window.addEventListener('auth-state-changed', handleAuthChange)
    return () => window.removeEventListener('auth-state-changed', handleAuthChange)
  }, [])

  // Wrap store actions to also trigger React state update
  const login = useCallback(async (credentials) => {
    const result = await store.login(credentials)
    // Force sync React state after login
    const state = useAuthStore.getState()
    setAuthState({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      accessToken: state.accessToken,
    })
    return result
  }, [store])

  const register = useCallback(async (userData) => {
    const result = await store.register(userData)
    const state = useAuthStore.getState()
    setAuthState({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      accessToken: state.accessToken,
    })
    return result
  }, [store])

  const logout = useCallback(async () => {
    await store.logout()
    const state = useAuthStore.getState()
    setAuthState({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      accessToken: state.accessToken,
    })
  }, [store])

  const updateProfile = useCallback(async (profileData) => {
    const result = await store.updateProfile(profileData)
    const state = useAuthStore.getState()
    setAuthState({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      accessToken: state.accessToken,
    })
    return result
  }, [store])

  const deleteAccount = useCallback(async (password, options) => {
    const result = await store.deleteAccount(password, options)
    const state = useAuthStore.getState()
    setAuthState({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      accessToken: state.accessToken,
    })
    return result
  }, [store])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return await store.changePassword(currentPassword, newPassword)
  }, [store])

  const fetchCurrentUser = useCallback(async () => {
    const result = await store.fetchCurrentUser()
    const state = useAuthStore.getState()
    setAuthState({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      accessToken: state.accessToken,
    })
    return result
  }, [store])

  const initializeAuth = useCallback(async () => {
    const result = await store.initializeAuth()
    const state = useAuthStore.getState()
    setAuthState({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      accessToken: state.accessToken,
    })
    return result
  }, [store])

  const clearError = useCallback(() => {
    store.clearError()
    setAuthState(prev => ({ ...prev, error: null }))
  }, [store])

  const value = {
    // State (from React state, not Zustand directly)
    ...authState,

    // Actions (wrapped to sync React state)
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    changePassword,
    fetchCurrentUser,
    initializeAuth,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
