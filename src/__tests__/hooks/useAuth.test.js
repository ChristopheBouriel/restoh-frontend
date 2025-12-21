import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'
import useAuthStore from '../../store/authStore'
import * as authApi from '../../api/authApi'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Mock the API (not the store!)
vi.mock('../../api/authApi')

// Mock external dependencies (toast and navigation are side effects)
vi.mock('react-hot-toast')
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}))

describe('useAuth Hook', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(toast.success).mockImplementation(() => {})
    vi.mocked(toast.error).mockImplementation(() => {})

    // Reset the real store state
    act(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    })
  })

  // 1. STATE AND COMPUTED PROPERTIES
  describe('State and Computed Properties', () => {
    it('should expose all auth state from store', () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' }

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should calculate isAdmin correctly when user role is admin', () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'Admin User', role: 'admin' }
        })
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isUser).toBe(false)
    })

    it('should calculate isUser correctly when user role is user', () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'Regular User', role: 'user' }
        })
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isUser).toBe(true)
      expect(result.current.isAdmin).toBe(false)
    })

    it('should return false for isAdmin and isUser when no user', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isUser).toBe(false)
    })
  })

  // 2. LOGIN
  describe('Login', () => {
    it('should handle successful login with toast and navigation', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@example.com', role: 'user' }

      authApi.login.mockResolvedValue({
        success: true,
        user: mockUser
      })
      authApi.getCurrentUser.mockResolvedValue({
        success: true,
        user: mockUser
      })

      const { result } = renderHook(() => useAuth())

      let loginResult
      await act(async () => {
        loginResult = await result.current.login({ email: 'john@example.com', password: 'password' })
      })

      expect(authApi.login).toHaveBeenCalledWith({ email: 'john@example.com', password: 'password' })
      expect(loginResult.success).toBe(true)
      expect(toast.success).toHaveBeenCalledWith('Successfully logged in!')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should handle failed login with error toast', async () => {
      authApi.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      })

      const { result } = renderHook(() => useAuth())

      let loginResult
      await act(async () => {
        loginResult = await result.current.login({ email: 'wrong@example.com', password: 'wrong' })
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Invalid credentials')
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should return error with details for InlineAlert without showing toast', async () => {
      authApi.login.mockResolvedValue({
        success: false,
        error: 'Account deleted',
        code: 'ACCOUNT_DELETED',
        details: { deletedAt: '2024-01-01' }
      })

      const { result } = renderHook(() => useAuth())

      let loginResult
      await act(async () => {
        loginResult = await result.current.login({ email: 'deleted@example.com', password: 'pass' })
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.code).toBe('ACCOUNT_DELETED')
      expect(loginResult.details).toEqual({ deletedAt: '2024-01-01' })
      // Toast should NOT be called when details are present (InlineAlert handles it)
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  // 3. REGISTRATION
  describe('Registration', () => {
    it('should handle successful registration with toast and navigation', async () => {
      const mockUser = { id: '1', name: 'New User', email: 'new@example.com', role: 'user' }

      authApi.register.mockResolvedValue({
        success: true,
        user: mockUser
      })
      authApi.getCurrentUser.mockResolvedValue({
        success: true,
        user: mockUser
      })

      const { result } = renderHook(() => useAuth())

      let registerResult
      await act(async () => {
        registerResult = await result.current.register({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        })
      })

      expect(authApi.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      })
      expect(registerResult.success).toBe(true)
      expect(toast.success).toHaveBeenCalledWith('Registration successful! Welcome!')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should handle failed registration with error toast', async () => {
      authApi.register.mockResolvedValue({
        success: false,
        error: 'Email already in use'
      })

      const { result } = renderHook(() => useAuth())

      let registerResult
      await act(async () => {
        registerResult = await result.current.register({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        })
      })

      expect(registerResult.success).toBe(false)
      expect(toast.error).toHaveBeenCalledWith('Email already in use')
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should return error with details without showing toast', async () => {
      authApi.register.mockResolvedValue({
        success: false,
        error: 'Email exists',
        code: 'EMAIL_ALREADY_EXISTS',
        details: { actions: ['login', 'forgot-password'] }
      })

      const { result } = renderHook(() => useAuth())

      let registerResult
      await act(async () => {
        registerResult = await result.current.register({
          name: 'Test',
          email: 'existing@example.com',
          password: 'pass'
        })
      })

      expect(registerResult.code).toBe('EMAIL_ALREADY_EXISTS')
      expect(registerResult.details.actions).toContain('login')
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  // 4. LOGOUT
  describe('Logout', () => {
    it('should handle logout with toast and navigation to home', async () => {
      // Set up authenticated state
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'John', role: 'user' },
          isAuthenticated: true
        })
      })

      authApi.logout.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.logout()
      })

      expect(toast.success).toHaveBeenCalledWith('Successfully logged out')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  // 5. PROFILE UPDATE
  describe('Profile Update', () => {
    it('should handle successful profile update with toast', async () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'John', email: 'john@example.com', role: 'user' },
          isAuthenticated: true
        })
      })

      authApi.updateProfile.mockResolvedValue({
        success: true,
        user: { id: '1', name: 'Updated Name', email: 'john@example.com', role: 'user' }
      })

      const { result } = renderHook(() => useAuth())

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile({ name: 'Updated Name' })
      })

      expect(authApi.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' })
      expect(updateResult.success).toBe(true)
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!')
    })

    it('should handle profile update failure with error toast', async () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'John', role: 'user' },
          isAuthenticated: true
        })
      })

      authApi.updateProfile.mockResolvedValue({
        success: false,
        error: 'Validation error'
      })

      const { result } = renderHook(() => useAuth())

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile({ name: '' })
      })

      expect(updateResult.success).toBe(false)
      expect(toast.error).toHaveBeenCalledWith('Validation error')
    })
  })

  // 6. DELETE ACCOUNT
  describe('Delete Account', () => {
    it('should handle successful account deletion with toast and navigation', async () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'John', role: 'user' },
          isAuthenticated: true
        })
      })

      authApi.deleteAccount.mockResolvedValue({
        success: true
      })

      const { result } = renderHook(() => useAuth())

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteAccount('password123')
      })

      expect(authApi.deleteAccount).toHaveBeenCalledWith('password123', {})
      expect(deleteResult.success).toBe(true)
      expect(toast.success).toHaveBeenCalledWith('Account deleted successfully')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should handle failed account deletion without toast (handled by modal)', async () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'John', role: 'user' },
          isAuthenticated: true
        })
      })

      authApi.deleteAccount.mockResolvedValue({
        success: false,
        error: 'Incorrect password',
        code: 'INVALID_PASSWORD'
      })

      const { result } = renderHook(() => useAuth())

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteAccount('wrongpass')
      })

      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toBe('Incorrect password')
      // No toast - modal handles the display
      expect(toast.error).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  // 7. CHANGE PASSWORD
  describe('Change Password', () => {
    it('should handle successful password change (no toast - handled by component)', async () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'John', role: 'user' },
          isAuthenticated: true
        })
      })

      authApi.changePassword.mockResolvedValue({
        success: true
      })

      const { result } = renderHook(() => useAuth())

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('oldPassword', 'newPassword')
      })

      expect(authApi.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword')
      expect(changeResult.success).toBe(true)
      // No toast for password change (component handles it)
      expect(toast.success).not.toHaveBeenCalled()
    })

    it('should return error details for failed password change (no toast)', async () => {
      act(() => {
        useAuthStore.setState({
          user: { id: '1', name: 'John', role: 'user' },
          isAuthenticated: true
        })
      })

      authApi.changePassword.mockResolvedValue({
        success: false,
        error: 'Current password is incorrect'
      })

      const { result } = renderHook(() => useAuth())

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('wrongOld', 'newPassword')
      })

      expect(changeResult.success).toBe(false)
      expect(changeResult.error).toBe('Current password is incorrect')
      // No toast for password change errors (component handles it)
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  // 8. CLEAR ERROR
  describe('Clear Error', () => {
    it('should clear error from store', () => {
      act(() => {
        useAuthStore.setState({ error: 'Some error' })
      })

      const { result } = renderHook(() => useAuth())

      expect(useAuthStore.getState().error).toBe('Some error')

      act(() => {
        result.current.clearError()
      })

      expect(useAuthStore.getState().error).toBeNull()
    })
  })
})
