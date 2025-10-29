import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'
import useAuthStore from '../../store/authStore'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Mocks
vi.mock('../../store/authStore')
vi.mock('react-hot-toast')
vi.mock('react-router-dom')

describe('useAuth Hook', () => {
  const mockNavigate = vi.fn()
  const mockAuthStore = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    changePassword: vi.fn(),
    clearError: vi.fn(),
    fetchCurrentUser: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)
    vi.mocked(toast.success).mockImplementation(() => {})
    vi.mocked(toast.error).mockImplementation(() => {})
  })

  // 1. ÉTAT ET CALCULS MÉTIER
  describe('State and Business Logic', () => {
    it('should expose all auth state from store', () => {
      const mockState = {
        ...mockAuthStore,
        user: { id: '1', name: 'John Doe', role: 'user' },
        token: 'mock-token',
        isAuthenticated: true
      }
      vi.mocked(useAuthStore).mockReturnValue(mockState)

      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toEqual(mockState.user)
      expect(result.current.token).toBe('mock-token')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should calculate isAdmin correctly when user role is admin', () => {
      const mockState = {
        ...mockAuthStore,
        user: { id: '1', name: 'Admin User', role: 'admin' }
      }
      vi.mocked(useAuthStore).mockReturnValue(mockState)

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isUser).toBe(false)
    })

    it('should calculate isUser correctly when user role is user', () => {
      const mockState = {
        ...mockAuthStore,
        user: { id: '1', name: 'Regular User', role: 'user' }
      }
      vi.mocked(useAuthStore).mockReturnValue(mockState)

      const { result } = renderHook(() => useAuth())

      expect(result.current.isUser).toBe(true)
      expect(result.current.isAdmin).toBe(false)
    })
  })

  // 2. ACTIONS DE CONNEXION/INSCRIPTION
  describe('Login and Registration Actions', () => {
    it('should handle successful login with toast and navigation', async () => {
      mockAuthStore.login.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth())

      let loginResult
      await act(async () => {
        loginResult = await result.current.login({ email: 'test@example.com', password: 'password' })
      })

      expect(mockAuthStore.login).toHaveBeenCalledWith({ 
        email: 'test@example.com', 
        password: 'password' 
      })
      expect(toast.success).toHaveBeenCalledWith('Successfully logged in!')
      expect(mockNavigate).toHaveBeenCalledWith('/')
      expect(loginResult).toBe(true)
    })

    it('should handle failed login with error toast', async () => {
      const mockErrorState = {
        ...mockAuthStore,
        error: 'Invalid credentials'
      }
      vi.mocked(useAuthStore).mockReturnValue(mockErrorState)
      mockAuthStore.login.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAuth())

      let loginResult
      await act(async () => {
        loginResult = await result.current.login({ email: 'wrong@example.com', password: 'wrong' })
      })

      expect(mockAuthStore.login).toHaveBeenCalledWith({ 
        email: 'wrong@example.com', 
        password: 'wrong' 
      })
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(loginResult).toBe(false)
    })

    it('should handle successful registration with toast and navigation', async () => {
      mockAuthStore.register.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth())

      let registerResult
      await act(async () => {
        registerResult = await result.current.register({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        })
      })

      expect(mockAuthStore.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      })
      expect(toast.success).toHaveBeenCalledWith('Registration successful! Welcome!')
      expect(mockNavigate).toHaveBeenCalledWith('/')
      expect(registerResult).toBe(true)
    })

    it('should handle failed registration with error toast', async () => {
      const mockErrorState = {
        ...mockAuthStore,
        error: 'Email already in use'
      }
      vi.mocked(useAuthStore).mockReturnValue(mockErrorState)
      mockAuthStore.register.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAuth())

      let registerResult
      await act(async () => {
        registerResult = await result.current.register({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        })
      })

      expect(toast.error).toHaveBeenCalledWith('Email already in use')
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(registerResult).toBe(false)
    })
  })

  // 3. ACTIONS DE DÉCONNEXION ET GESTION COMPTE
  describe('Logout and Account Management Actions', () => {
    it('should handle logout with toast and navigation to home', () => {
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.logout()
      })

      expect(mockAuthStore.logout).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Successfully logged out')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should handle successful profile update with toast', async () => {
      mockAuthStore.updateProfile.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth())

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
      })

      expect(mockAuthStore.updateProfile).toHaveBeenCalledWith({
        name: 'Updated Name',
        email: 'updated@example.com'
      })
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!')
      expect(updateResult).toBe(true)
    })

    it('should handle successful account deletion with toast and navigation', async () => {
      mockAuthStore.deleteAccount.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth())

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteAccount('password123')
      })

      expect(mockAuthStore.deleteAccount).toHaveBeenCalledWith('password123')
      expect(toast.success).toHaveBeenCalledWith('Account deleted successfully')
      expect(mockNavigate).toHaveBeenCalledWith('/')
      expect(deleteResult).toBe(true)
    })

    it('should handle successful password change', async () => {
      mockAuthStore.changePassword.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth())

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('oldPassword', 'newPassword')
      })

      expect(mockAuthStore.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword')
      expect(changeResult).toEqual({ success: true })
      // No toast for password change (handled by component)
      expect(toast.success).not.toHaveBeenCalled()
    })
  })

  // 4. ERROR HANDLING
  describe('Error Handling', () => {
    it('should handle profile update failure with error toast', async () => {
      const mockErrorState = {
        ...mockAuthStore,
        error: 'Validation error'
      }
      vi.mocked(useAuthStore).mockReturnValue(mockErrorState)
      mockAuthStore.updateProfile.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAuth())

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile({
          name: 'Invalid Data'
        })
      })

      expect(toast.error).toHaveBeenCalledWith('Validation error')
      expect(updateResult).toBe(false)
    })

    it('should return error details for failed password change', async () => {
      mockAuthStore.changePassword.mockResolvedValue({ 
        success: false, 
        error: 'Current password is incorrect' 
      })

      const { result } = renderHook(() => useAuth())

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('wrongPassword', 'newPassword')
      })

      expect(changeResult).toEqual({ 
        success: false,
        error: 'Current password is incorrect'
      })
      // No toast for password change errors (handled by component)
      expect(toast.error).not.toHaveBeenCalled()
    })

    it('should handle errors with fallback messages when store error is null', async () => {
      const mockErrorState = {
        ...mockAuthStore,
        error: null
      }
      vi.mocked(useAuthStore).mockReturnValue(mockErrorState)
      mockAuthStore.login.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAuth())

      let loginResult
      await act(async () => {
        loginResult = await result.current.login({ email: 'test@example.com', password: 'password' })
      })

      expect(toast.error).toHaveBeenCalledWith('Login error')
      expect(loginResult).toBe(false)
    })

    it('should pass through clearError function from store', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.clearError).toBe(mockAuthStore.clearError)
    })
  })
})