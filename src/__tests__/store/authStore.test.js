import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useAuthStore from '../../store/authStore'

// Mock API functions
vi.mock('../../api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn()
}))

// Get mocked API functions via dynamic import
let mockLogin, mockRegister, mockLogout, mockUpdateProfile, mockChangePassword, mockDeleteAccount, mockGetCurrentUser, mockRefreshToken

beforeAll(async () => {
  const authApi = await import('../../api/authApi')
  mockLogin = authApi.login
  mockRegister = authApi.register
  mockLogout = authApi.logout
  mockUpdateProfile = authApi.updateProfile
  mockChangePassword = authApi.changePassword
  mockDeleteAccount = authApi.deleteAccount
  mockGetCurrentUser = authApi.getCurrentUser
  mockRefreshToken = authApi.refreshToken
})

describe('Auth Store', () => {
  // Mock localStorage
  const mockLocalStorage = {
    store: {},
    getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
    setItem: vi.fn((key, value) => {
      mockLocalStorage.store[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete mockLocalStorage.store[key]
    }),
    clear: vi.fn(() => {
      mockLocalStorage.store = {}
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    // Reset API mocks with default success responses
    mockLogin.mockResolvedValue({
      success: true,
      accessToken: 'mock-access-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'client' }
    })
    mockRegister.mockResolvedValue({
      success: true,
      user: { id: '2', email: 'new@example.com', name: 'New User', role: 'client' }
    })
    mockLogout.mockResolvedValue({ success: true })
    mockUpdateProfile.mockResolvedValue({
      success: true,
      user: { id: '1', email: 'updated@example.com', name: 'Updated User', role: 'client' }
    })
    mockChangePassword.mockResolvedValue({ success: true })
    mockDeleteAccount.mockResolvedValue({ success: true })
    mockGetCurrentUser.mockResolvedValue({
      success: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'client' }
    })
    mockRefreshToken.mockResolvedValue({
      success: true,
      accessToken: 'new-access-token'
    })

    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 1. AUTHENTIFICATION LOGIN
  describe('Login Authentication', () => {
    it('should login successfully with registered user', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock API will return success (configured in beforeEach)
      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'client'
      })
      expect(result.current.isAuthenticated).toBe(true)
      // Token is now stored in HTTP-only cookies, not in state
      expect(loginResult.success).toBe(true)
    })

    it('should login successfully with admin account', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = {
        email: 'admin@restoh.fr',
        password: 'admin123'
      }

      // Mock admin login response
      mockLogin.mockResolvedValue({
        success: true,
        user: { id: 'admin', email: 'admin@restoh.fr', name: 'Administrator', role: 'admin' },
        token: 'admin-jwt-token'
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(result.current.user).toEqual({
        id: 'admin',
        email: 'admin@restoh.fr',
        name: 'Administrator',
        role: 'admin'
      })
      expect(result.current.isAuthenticated).toBe(true)
      // Token is now stored in HTTP-only cookies, not in state
      expect(loginResult.success).toBe(true)
    })

    it('should login successfully with client account', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = {
        email: 'client@example.com',
        password: 'client123'
      }

      // Mock client login response
      mockLogin.mockResolvedValue({
        success: true,
        user: { id: 'client', email: 'client@example.com', name: 'Client', role: 'user' },
        token: 'client-jwt-token'
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(result.current.user).toEqual({
        id: 'client',
        email: 'client@example.com',
        name: 'Client',
        role: 'user'
      })
      expect(result.current.isAuthenticated).toBe(true)
      // Token is now stored in HTTP-only cookies, not in state
      expect(loginResult.success).toBe(true)
    })

    it('should fail login with invalid credentials', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = {
        email: 'admin@restoh.fr',
        password: 'wrongpassword'
      }

      // Mock API to return error for invalid credentials with code and details
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        details: { attempts: 3 }
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Invalid credentials')
      expect(loginResult.code).toBe('INVALID_CREDENTIALS')
      expect(loginResult.details).toEqual({ attempts: 3 })
    })

    it('should handle unverified email on login', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = {
        email: 'unverified@example.com',
        password: 'password123'
      }

      // Mock API to return error for unverified email
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        details: { email: 'unverified@example.com' }
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Please verify your email before logging in')
      expect(loginResult.success).toBe(false)
      expect(loginResult.code).toBe('EMAIL_NOT_VERIFIED')
      expect(loginResult.details).toEqual({ email: 'unverified@example.com' })
    })
  })

  // 3. INSCRIPTION
  describe('Registration', () => {
    it('should register new user successfully WITHOUT auto-login (email verification required)', async () => {
      const { result } = renderHook(() => useAuthStore())

      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      }

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(userData)
      })

      expect(mockRegister).toHaveBeenCalledWith(userData)

      // IMPORTANT: Should call logout after registration to clear any session
      expect(mockLogout).toHaveBeenCalled()

      // User should NOT be logged in (must verify email first)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)

      // Should return success with email
      expect(registerResult.success).toBe(true)
      expect(registerResult.email).toBe('new@example.com')
    })

    it('should handle registration errors gracefully', async () => {
      const { result } = renderHook(() => useAuthStore())

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock API to return error with code and details
      mockRegister.mockResolvedValue({
        success: false,
        error: 'Email already exists',
        code: 'EMAIL_IN_USE',
        details: { field: 'email' }
      })

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(userData)
      })

      expect(mockRegister).toHaveBeenCalledWith(userData)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Email already exists')
      expect(registerResult.success).toBe(false)
      expect(registerResult.error).toBe('Email already exists')
      expect(registerResult.code).toBe('EMAIL_IN_USE')
      expect(registerResult.details).toEqual({ field: 'email' })
    })

    it('should continue with registration cleanup even if logout fails', async () => {
      const { result } = renderHook(() => useAuthStore())

      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      }

      // Mock logout to fail
      mockLogout.mockRejectedValue(new Error('Logout failed'))

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(userData)
      })

      // Registration should still succeed despite logout failure
      expect(mockRegister).toHaveBeenCalledWith(userData)
      expect(mockLogout).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(registerResult.success).toBe(true)
    })

    it('should handle network errors during registration', async () => {
      const { result } = renderHook(() => useAuthStore())

      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      }

      // Mock network error
      mockRegister.mockRejectedValue(new Error('Network error'))

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(userData)
      })

      expect(result.current.error).toBe('Registration error')
      expect(result.current.isAuthenticated).toBe(false)
      expect(registerResult.success).toBe(false)
      expect(registerResult.error).toBe('Registration error')
    })
  })

  // 4. GESTION PROFIL ET DÉCONNEXION
  describe('Profile Management and Logout', () => {
    it('should update user profile successfully', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial user
      act(() => {
        result.current.setUser({ id: '1', name: 'Original Name', email: 'original@example.com', role: 'client' })
      })

      const profileData = { name: 'Updated Name' }

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile(profileData)
      })

      expect(mockUpdateProfile).toHaveBeenCalledWith(profileData)
      expect(result.current.user).toEqual({
        id: '1',
        email: 'updated@example.com',
        name: 'Updated User',
        role: 'client'
      })
      expect(updateResult.success).toBe(true)
    })

    it('should logout user and clear all auth data', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set logged in user
      act(() => {
        result.current.setUser({ id: '1', name: 'Test User' })
        // Token is now stored in HTTP-only cookies, not in state
      })

      expect(result.current.isAuthenticated).toBe(true)

      await act(async () => {
        await result.current.logout()
      })

      expect(mockLogout).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      // Token is now stored in HTTP-only cookies, not in state
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  // 5. SUPPRESSION COMPTE
  describe('Account Deletion', () => {
    it('should delete user account successfully', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set logged in user
      act(() => {
        result.current.setUser({ id: '123', email: 'user@example.com', name: 'Test User' })
        // Token is now stored in HTTP-only cookies, not in state
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteAccount('password123')
      })

      expect(mockDeleteAccount).toHaveBeenCalledWith('password123', {})
      expect(result.current.user).toBeNull()
      // Token is now stored in HTTP-only cookies, not in state
      expect(result.current.isAuthenticated).toBe(false)
      expect(deleteResult.success).toBe(true)
    })

    it('should handle account deletion errors', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set logged in user
      act(() => {
        result.current.setUser({
          id: 'admin',
          email: 'admin@restoh.fr',
          name: 'Administrator'
        })
      })

      // Mock API to return error
      mockDeleteAccount.mockResolvedValue({
        success: false,
        error: 'Invalid password'
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteAccount('wrongpassword')
      })

      expect(mockDeleteAccount).toHaveBeenCalledWith('wrongpassword', {})
      expect(result.current.error).toBe('Invalid password')
      expect(deleteResult.success).toBe(false)
    })
  })

  // 6. CHANGEMENT MOT DE PASSE
  describe('Password Change Functionality', () => {
    it('should change password successfully', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set logged in user
      act(() => {
        result.current.setUser({ id: '123', email: 'user@example.com', name: 'Test User' })
      })

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('oldPassword', 'newPassword')
      })

      expect(mockChangePassword).toHaveBeenCalledWith('oldPassword', 'newPassword')
      expect(changeResult.success).toBe(true)
    })

    it('should handle password change with invalid current password', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set logged in user
      act(() => {
        result.current.setUser({ id: '123', email: 'user@example.com' })
      })

      // Mock API to return error for invalid password
      mockChangePassword.mockResolvedValue({
        success: false,
        error: 'Current password is incorrect'
      })

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('wrongPassword', 'newPassword')
      })

      expect(mockChangePassword).toHaveBeenCalledWith('wrongPassword', 'newPassword')
      expect(result.current.error).toBe('Current password is incorrect')
      expect(changeResult.success).toBe(false)
      expect(changeResult.error).toBe('Current password is incorrect')
    })
  })

  // 7. GESTION D'ERREURS ET CAS LIMITES
  describe('Error Handling and Edge Cases', () => {
    it('should handle login attempt for non-existent user', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }

      // Mock API to return user not found error
      mockLogin.mockResolvedValue({
        success: false,
        error: 'User not found'
      })

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockLogin).toHaveBeenCalledWith(credentials)
      expect(result.current.error).toBe('User not found')
      expect(result.current.isAuthenticated).toBe(false)
      expect(loginResult.success).toBe(false)
    })

    it('should handle network errors during login', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      // Mock API to throw network error
      mockLogin.mockRejectedValue(new Error('Network error'))

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(result.current.error).toBe('Connection error')
      expect(result.current.isAuthenticated).toBe(false)
      expect(loginResult.success).toBe(false)
    })
  })

  // 8. ACCESS TOKEN MANAGEMENT
  describe('Access Token Management', () => {
    it('should store accessToken after successful login', async () => {
      const { result } = renderHook(() => useAuthStore())

      const credentials = { email: 'test@example.com', password: 'password123' }

      await act(async () => {
        await result.current.login(credentials)
      })

      expect(result.current.accessToken).toBe('mock-access-token')
      expect(result.current.user).toBeDefined()
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear accessToken on logout', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Login first
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' })
      })

      expect(result.current.accessToken).toBe('mock-access-token')

      // Logout
      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.accessToken).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  // 9. SESSION INITIALIZATION (Refresh Token Flow)
  describe('Session Initialization', () => {
    it('should restore session successfully with initializeAuth', async () => {
      const { result } = renderHook(() => useAuthStore())

      let initResult
      await act(async () => {
        initResult = await result.current.initializeAuth()
      })

      expect(mockRefreshToken).toHaveBeenCalled()
      expect(mockGetCurrentUser).toHaveBeenCalled()
      expect(result.current.accessToken).toBe('new-access-token')
      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'client'
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(initResult.success).toBe(true)
    })

    it('should clear auth when refresh token is invalid', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        result.current.setAuth('old-token', { id: '1', name: 'Old User' })
      })

      // Mock refresh to fail
      mockRefreshToken.mockResolvedValue({
        success: false,
        error: 'Invalid refresh token',
        code: 'AUTH_INVALID_REFRESH_TOKEN'
      })

      let initResult
      await act(async () => {
        initResult = await result.current.initializeAuth()
      })

      expect(mockRefreshToken).toHaveBeenCalled()
      expect(mockGetCurrentUser).not.toHaveBeenCalled()
      expect(result.current.accessToken).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(initResult.success).toBe(false)
    })

    it('should clear auth when getCurrentUser fails after refresh', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Mock refresh success but getCurrentUser fails
      mockRefreshToken.mockResolvedValue({
        success: true,
        accessToken: 'new-access-token'
      })
      mockGetCurrentUser.mockResolvedValue({
        success: false,
        error: 'User not found'
      })

      let initResult
      await act(async () => {
        initResult = await result.current.initializeAuth()
      })

      expect(mockRefreshToken).toHaveBeenCalled()
      expect(mockGetCurrentUser).toHaveBeenCalled()
      expect(result.current.accessToken).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(initResult.success).toBe(false)
    })

    it('should handle network error during session initialization', async () => {
      const { result } = renderHook(() => useAuthStore())

      // Mock network error
      mockRefreshToken.mockRejectedValue({ error: 'Network error' })

      let initResult
      await act(async () => {
        initResult = await result.current.initializeAuth()
      })

      expect(result.current.accessToken).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(initResult.success).toBe(false)
    })
  })
})