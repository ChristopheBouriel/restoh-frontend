import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useAuthStore from '../../store/authStore'

// Mock crypto functions
vi.mock('../../utils/crypto', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}))

// Get mocked functions via dynamic import
let mockHashPassword, mockVerifyPassword

beforeAll(async () => {
  const crypto = await import('../../utils/crypto')
  mockHashPassword = crypto.hashPassword
  mockVerifyPassword = crypto.verifyPassword
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
    
    // Reset crypto mocks
    mockHashPassword.mockResolvedValue('hashedPassword123')
    mockVerifyPassword.mockResolvedValue(true)
    
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 1. ÉTAT INITIAL ET ACTIONS SIMPLES
  describe('Initial State and Simple Actions', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should set user and update authentication status', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }

      act(() => {
        result.current.setUser(mockUser)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle error management correctly', () => {
      const { result } = renderHook(() => useAuthStore())
      const errorMessage = 'Test error message'

      act(() => {
        result.current.setError(errorMessage)
      })

      expect(result.current.error).toBe(errorMessage)

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  // 2. AUTHENTIFICATION LOGIN
  describe('Login Authentication', () => {
    it('should login successfully with registered user', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Mock registered user in localStorage
      const mockUsers = [{
        id: 1,
        email: 'registered@example.com',
        name: 'Registered User',
        password: 'hashedPassword123',
        role: 'user'
      }]
      mockLocalStorage.setItem('registered-users', JSON.stringify(mockUsers))
      
      const credentials = {
        email: 'registered@example.com',
        password: 'password123'
      }

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockVerifyPassword).toHaveBeenCalledWith('password123', 'hashedPassword123')
      expect(result.current.user).toEqual({
        id: 1,
        email: 'registered@example.com',
        name: 'Registered User',
        role: 'user'
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.token).toMatch(/^mock-jwt-token-/)
      expect(loginResult.success).toBe(true)
    })

    it('should login successfully with default admin account', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const credentials = {
        email: 'admin@restoh.fr',
        password: 'admin123'
      }

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockVerifyPassword).toHaveBeenCalledWith('admin123', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
      expect(result.current.user).toEqual({
        id: 'admin',
        email: 'admin@restoh.fr',
        name: 'Administrator',
        role: 'admin'
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(loginResult.success).toBe(true)
    })

    it('should login successfully with default client account', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      const credentials = {
        email: 'client@example.com',
        password: 'client123'
      }

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(mockVerifyPassword).toHaveBeenCalledWith('client123', '186474c1f2c2f735a54c2cf82ee8e87f2a5cd30940e280029363fecedfc5328c')
      expect(result.current.user).toEqual({
        id: 'client',
        email: 'client@example.com',
        name: 'Client',
        role: 'user'
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(loginResult.success).toBe(true)
    })

    it('should fail login with invalid credentials', async () => {
      const { result } = renderHook(() => useAuthStore())
      mockVerifyPassword.mockResolvedValue(false)
      
      const credentials = {
        email: 'admin@restoh.fr',
        password: 'wrongpassword'
      }

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Password incorrect')
      expect(loginResult.success).toBe(false)
    })
  })

  // 3. INSCRIPTION AVEC HACHAGE
  describe('Registration with Password Hashing', () => {
    it('should register new user successfully', async () => {
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

      expect(mockHashPassword).toHaveBeenCalledWith('password123')
      
      // Check que l'utilisateur a été ajouté au localStorage
      const storedUsers = JSON.parse(mockLocalStorage.getItem('registered-users') || '[]')
      expect(storedUsers).toHaveLength(1)
      expect(storedUsers[0]).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedPassword123',
        role: 'user'
      })

      expect(result.current.user).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
        role: 'user'
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(registerResult.success).toBe(true)
    })

    it('should handle registration errors gracefully', async () => {
      const { result } = renderHook(() => useAuthStore())
      mockHashPassword.mockRejectedValue(new Error('Hashing failed'))
      
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      let registerResult
      await act(async () => {
        registerResult = await result.current.register(userData)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Hashing failed')
      expect(registerResult.success).toBe(false)
    })
  })

  // 4. GESTION PROFIL ET DÉCONNEXION
  describe('Profile Management and Logout', () => {
    it('should update user profile successfully', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Définir un utilisateur initial
      const initialUser = { id: '1', name: 'Original Name', email: 'original@example.com' }
      act(() => {
        result.current.setUser(initialUser)
      })

      const profileData = { name: 'Updated Name' }

      let updateResult
      await act(async () => {
        updateResult = await result.current.updateProfile(profileData)
      })

      expect(result.current.user).toEqual({
        id: '1',
        name: 'Updated Name',
        email: 'original@example.com'
      })
      expect(updateResult.success).toBe(true)
    })

    it('should logout user and clear all auth data', () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Définir un utilisateur connecté
      act(() => {
        result.current.setUser({ id: '1', name: 'Test User' })
        result.current.setToken('test-token')
      })

      expect(result.current.isAuthenticated).toBe(true)

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  // 5. SUPPRESSION COMPTE AVEC RGPD
  describe('Account Deletion with GDPR Cleanup', () => {
    it('should delete registered user account and cleanup data', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Mock utilisateur enregistré
      const mockUsers = [{
        id: 123,
        email: 'user@example.com',
        name: 'Test User',
        password: 'hashedPassword123'
      }]
      mockLocalStorage.setItem('registered-users', JSON.stringify(mockUsers))
      
      // Mock données utilisateur à nettoyer
      mockLocalStorage.setItem('admin-orders-v2', JSON.stringify([
        { id: 1, userId: 123, userEmail: 'user@example.com', userName: 'Test User' }
      ]))
      mockLocalStorage.setItem('admin-reservations', JSON.stringify([
        { id: 1, userId: 123, userEmail: 'user@example.com', userName: 'Test User' }
      ]))
      
      // Définir l'utilisateur connecté
      act(() => {
        result.current.setUser({ id: 123, email: 'user@example.com', name: 'Test User' })
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteAccount('password123')
      })

      expect(mockVerifyPassword).toHaveBeenCalledWith('password123', 'hashedPassword123')
      
      // Check que l'utilisateur a été supprimé de registered-users
      const remainingUsers = JSON.parse(mockLocalStorage.getItem('registered-users') || '[]')
      expect(remainingUsers).toHaveLength(0)
      
      // Check l'anonymisation des commandes
      const anonymizedOrders = JSON.parse(mockLocalStorage.getItem('admin-orders-v2') || '[]')
      expect(anonymizedOrders[0]).toMatchObject({
        userId: 'deleted-user',
        userEmail: 'deleted@account.com',
        userName: 'User supprimé'
      })
      
      // Check la déconnexion
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(deleteResult.success).toBe(true)
    })

    it('should handle account deletion for default accounts', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Définir l'utilisateur admin par défaut
      act(() => {
        result.current.setUser({
          id: 'admin',
          email: 'admin@restoh.fr',
          name: 'Administrator'
        })
      })

      let deleteResult
      await act(async () => {
        deleteResult = await result.current.deleteAccount('admin123')
      })

      expect(mockVerifyPassword).toHaveBeenCalledWith('admin123', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(deleteResult.success).toBe(true)
    })
  })

  // 6. CHANGEMENT MOT DE PASSE
  describe('Password Change Functionality', () => {
    it('should change password for registered user', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Mock utilisateur enregistré
      const mockUsers = [{
        id: 123,
        email: 'user@example.com',
        name: 'Test User',
        password: 'oldHashedPassword'
      }]
      mockLocalStorage.setItem('registered-users', JSON.stringify(mockUsers))
      
      // Définir l'utilisateur connecté
      act(() => {
        result.current.setUser({ id: 123, email: 'user@example.com', name: 'Test User' })
      })

      // Mock des fonctions crypto
      mockVerifyPassword.mockResolvedValue(true) // Ancien mot de passe valide
      mockHashPassword.mockResolvedValue('newHashedPassword')

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('oldPassword', 'newPassword')
      })

      expect(mockVerifyPassword).toHaveBeenCalledWith('oldPassword', 'oldHashedPassword')
      expect(mockHashPassword).toHaveBeenCalledWith('newPassword')
      
      // Check que le mot de passe a été mis à jour dans localStorage
      const updatedUsers = JSON.parse(mockLocalStorage.getItem('registered-users') || '[]')
      expect(updatedUsers[0].password).toBe('newHashedPassword')
      
      expect(changeResult.success).toBe(true)
    })

    it('should migrate default account to registered user on password change', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Définir l'utilisateur admin par défaut
      act(() => {
        result.current.setUser({
          id: 'admin',
          email: 'admin@restoh.fr',
          name: 'Administrator',
          role: 'admin'
        })
      })

      mockHashPassword.mockResolvedValue('newHashedPassword')

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('admin123', 'newPassword')
      })

      expect(mockVerifyPassword).toHaveBeenCalledWith('admin123', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
      expect(mockHashPassword).toHaveBeenCalledWith('newPassword')
      
      // Check que l'utilisateur a été ajouté à registered-users
      const registeredUsers = JSON.parse(mockLocalStorage.getItem('registered-users') || '[]')
      expect(registeredUsers).toHaveLength(1)
      expect(registeredUsers[0]).toMatchObject({
        id: 'admin',
        email: 'admin@restoh.fr',
        name: 'Administrator',
        role: 'admin',
        password: 'newHashedPassword'
      })
      
      expect(changeResult.success).toBe(true)
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

      let loginResult
      await act(async () => {
        loginResult = await result.current.login(credentials)
      })

      expect(result.current.error).toBe('User non trouvé. Veuillez vous inscrire d\'abord.')
      expect(result.current.isAuthenticated).toBe(false)
      expect(loginResult.success).toBe(false)
    })

    it('should handle password change with invalid current password', async () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Mock utilisateur enregistré
      const mockUsers = [{
        id: 123,
        email: 'user@example.com',
        password: 'correctHashedPassword'
      }]
      mockLocalStorage.setItem('registered-users', JSON.stringify(mockUsers))
      
      act(() => {
        result.current.setUser({ id: 123, email: 'user@example.com' })
      })

      mockVerifyPassword.mockResolvedValue(false) // Password incorrect

      let changeResult
      await act(async () => {
        changeResult = await result.current.changePassword('wrongPassword', 'newPassword')
      })

      expect(result.current.error).toBe('Current password is incorrect')
      expect(changeResult.success).toBe(false)
      expect(changeResult.error).toBe('Current password is incorrect')
    })
  })
})