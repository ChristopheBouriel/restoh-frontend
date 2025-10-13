import { beforeEach, describe, it, expect, vi } from 'vitest'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

global.localStorage = mockLocalStorage

// Créer le store sans la persistance pour les tests
import { create } from 'zustand'

// Créer une version simplifiée du store pour les tests
const createTestUsersStore = () => create((set, get) => ({
  // État
  users: [],
  isLoading: false,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),

  // Initialiser en lisant depuis registered-users et en enrichissant avec les données admin
  initializeUsers: () => {
    // Nettoyer l'ancienne clé admin-users si elle existe
    if (localStorage.getItem('admin-users')) {
      localStorage.removeItem('admin-users')
    }
    
    const registeredUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
    const orders = JSON.parse(localStorage.getItem('admin-orders-v2') || '[]')
    const reservations = JSON.parse(localStorage.getItem('admin-reservations') || '[]')
    
    // Calculer des dates de base pour les comptes par défaut
    const today = new Date()
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
    
    // Comptes par défaut (admin et client test)
    const defaultUsers = [
      {
        id: 'admin',
        email: 'admin@restoh.fr',
        name: 'Administrator',
        role: 'admin',
        phone: '01 23 45 67 89',
        address: '456 Avenue de l\'Administration, 75008 Paris',
        isActive: true,
        emailVerified: true,
        createdAt: oneMonthAgo.toISOString(),
        lastLoginAt: today.toISOString(),
        password: 'hashed'
      },
      {
        id: 'client',
        email: 'client@example.com',
        name: 'Jean Dupont',
        role: 'user',
        phone: '06 12 34 56 78',
        address: '123 Rue de la République, 75001 Paris',
        isActive: true,
        emailVerified: true,
        createdAt: oneMonthAgo.toISOString(),
        lastLoginAt: today.toISOString(),
        password: 'hashed'
      }
    ]

    // Fusionner les utilisateurs par défaut avec les utilisateurs enregistrés
    const allBaseUsers = [...defaultUsers]
    
    // Ajouter les utilisateurs enregistrés qui ne sont pas déjà dans les defaults
    registeredUsers.forEach(regUser => {
      if (!allBaseUsers.find(u => u.email === regUser.email)) {
        allBaseUsers.push({
          ...regUser,
          phone: regUser.phone || '',
          address: regUser.address || '',
          isActive: regUser.isActive !== undefined ? regUser.isActive : true,
          emailVerified: regUser.emailVerified !== undefined ? regUser.emailVerified : false,
          lastLoginAt: regUser.lastLoginAt || null,
          createdAt: regUser.createdAt || new Date().toISOString()
        })
      }
    })

    // Enrichir chaque utilisateur avec ses statistiques d'activité
    const enrichedUsers = allBaseUsers.map(user => {
      // Calculer les commandes de l'utilisateur
      const userOrders = orders.filter(order => order.userId === user.id)
      const deliveredOrders = userOrders.filter(order => order.status === 'delivered')
      const totalSpent = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)

      // Calculer les réservations de l'utilisateur
      const userReservations = reservations.filter(reservation => reservation.userId === user.id)

      return {
        ...user,
        totalOrders: userOrders.length,
        totalSpent: totalSpent,
        totalReservations: userReservations.length
      }
    })

    set({ users: enrichedUsers })
  },

  // Sauvegarder les modifications dans registered-users (et garder les comptes par défaut séparés)
  saveUserChangesToStorage: (users) => {
    const defaultUserIds = ['admin', 'client']
    
    // Séparer les utilisateurs par défaut des utilisateurs enregistrés
    const updatedRegisteredUsers = users
      .filter(user => !defaultUserIds.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }))

    // Mettre à jour registered-users avec les nouvelles données
    localStorage.setItem('registered-users', JSON.stringify(updatedRegisteredUsers))
  },

  // Créer un nouvel utilisateur
  createUser: async (userData) => {
    set({ isLoading: true })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50)) // Raccourci pour les tests
      
      const newUser = {
        id: `user-${Date.now()}`,
        ...userData,
        role: 'user',
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        totalOrders: 0,
        totalSpent: 0,
        totalReservations: 0
      }
      
      const updatedUsers = [newUser, ...get().users]
      set({ users: updatedUsers, isLoading: false })
      get().saveUserChangesToStorage(updatedUsers)
      
      return { success: true, userId: newUser.id }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Mettre à jour le profil d'un utilisateur
  updateUser: async (userId, userData) => {
    set({ isLoading: true })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const updatedUsers = get().users.map(user =>
        user.id === userId 
          ? { ...user, ...userData, updatedAt: new Date().toISOString() }
          : user
      )
      
      set({ users: updatedUsers, isLoading: false })
      get().saveUserChangesToStorage(updatedUsers)
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Activer/désactiver un utilisateur
  toggleUserStatus: async (userId) => {
    set({ isLoading: true })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const updatedUsers = get().users.map(user =>
        user.id === userId 
          ? { ...user, isActive: !user.isActive, updatedAt: new Date().toISOString() }
          : user
      )
      
      set({ users: updatedUsers, isLoading: false })
      get().saveUserChangesToStorage(updatedUsers)
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Changer le rôle d'un utilisateur
  updateUserRole: async (userId, newRole) => {
    set({ isLoading: true })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const updatedUsers = get().users.map(user =>
        user.id === userId 
          ? { ...user, role: newRole, updatedAt: new Date().toISOString() }
          : user
      )
      
      set({ users: updatedUsers, isLoading: false })
      get().saveUserChangesToStorage(updatedUsers)
      
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { success: false, error: error.message }
    }
  },

  // Mettre à jour la dernière connexion
  updateLastLogin: (userId) => {
    const updatedUsers = get().users.map(user =>
      user.id === userId 
        ? { ...user, lastLoginAt: new Date().toISOString() }
        : user
    )
    
    set({ users: updatedUsers })
    get().saveUserChangesToStorage(updatedUsers)
  },

  // Rafraîchir les statistiques dynamiquement
  refreshUserStats: () => {
    get().initializeUsers()
  },

  // Getters
  getUserById: (userId) => {
    return get().users.find(user => user.id === userId)
  },

  getUsersByRole: (role) => {
    return get().users.filter(user => user.role === role)
  },

  getActiveUsers: () => {
    return get().users.filter(user => user.isActive)
  },

  getInactiveUsers: () => {
    return get().users.filter(user => !user.isActive)
  },

  getUnverifiedUsers: () => {
    return get().users.filter(user => !user.emailVerified)
  },

  searchUsers: (query) => {
    const lowercaseQuery = query.toLowerCase()
    return get().users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.phone?.includes(query)
    )
  },

  // Statistiques
  getUsersStats: () => {
    const users = get().users
    const activeUsers = users.filter(u => u.isActive)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const newUsersThisMonth = users.filter(u => {
      const createdDate = new Date(u.createdAt)
      return createdDate >= thirtyDaysAgo
    })

    const activeThisMonth = users.filter(u => {
      if (!u.lastLoginAt) return false
      const lastLogin = new Date(u.lastLoginAt)
      return lastLogin >= thirtyDaysAgo
    })
    
    return {
      total: users.length,
      active: activeUsers.length,
      inactive: users.length - activeUsers.length,
      admins: users.filter(u => u.role === 'admin').length,
      regularUsers: users.filter(u => u.role === 'user').length,
      verified: users.filter(u => u.emailVerified).length,
      unverified: users.filter(u => !u.emailVerified).length,
      newThisMonth: newUsersThisMonth.length,
      activeThisMonth: activeThisMonth.length,
      totalRevenue: users.reduce((sum, user) => sum + (user.totalSpent || 0), 0),
      totalOrders: users.reduce((sum, user) => sum + (user.totalOrders || 0), 0),
      totalReservations: users.reduce((sum, user) => sum + (user.totalReservations || 0), 0)
    }
  }
}))

describe('usersStore', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = createTestUsersStore()
    
    // Mock localStorage par défaut
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'registered-users') return '[]'
      if (key === 'admin-orders-v2') return '[]'
      if (key === 'admin-reservations') return '[]'
      if (key === 'admin-users') return null
      return null
    })
  })

  describe('Actions Principales CRUD', () => {
    it('should create a new user successfully', async () => {
      // D'abord initialiser le store pour avoir les users par défaut
      store.getState().initializeUsers()
      
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword'
      }

      const result = await store.getState().createUser(userData)

      expect(result.success).toBe(true)
      expect(result.userId).toBeDefined()
      expect(store.getState().users).toHaveLength(3) // 2 default + 1 new
      
      const newUser = store.getState().users[0] // Premier car ajouté au début
      expect(newUser.name).toBe('Test User')
      expect(newUser.email).toBe('test@example.com')
      expect(newUser.role).toBe('user')
      expect(newUser.isActive).toBe(true)
      expect(newUser.emailVerified).toBe(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('registered-users', expect.any(String))
    })

    it('should update user successfully', async () => {
      store.getState().initializeUsers()
      const updateData = { name: 'Updated Name', phone: '0987654321' }

      const result = await store.getState().updateUser('admin', updateData)

      expect(result.success).toBe(true)
      const updatedUser = store.getState().getUserById('admin')
      expect(updatedUser.name).toBe('Updated Name')
      expect(updatedUser.phone).toBe('0987654321')
      expect(updatedUser.updatedAt).toBeDefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should toggle user status successfully', async () => {
      store.getState().initializeUsers()
      const user = store.getState().getUserById('admin')
      const originalStatus = user.isActive

      const result = await store.getState().toggleUserStatus('admin')

      expect(result.success).toBe(true)
      const toggledUser = store.getState().getUserById('admin')
      expect(toggledUser.isActive).toBe(!originalStatus)
      expect(toggledUser.updatedAt).toBeDefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should update user role successfully', async () => {
      store.getState().initializeUsers()

      const result = await store.getState().updateUserRole('client', 'admin')

      expect(result.success).toBe(true)
      const updatedUser = store.getState().getUserById('client')
      expect(updatedUser.role).toBe('admin')
      expect(updatedUser.updatedAt).toBeDefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should update last login successfully', () => {
      store.getState().initializeUsers()
      const originalLogin = store.getState().getUserById('admin').lastLoginAt

      // Attendre un petit peu pour s'assurer que la date change
      const now = Date.now()
      vi.setSystemTime(now + 1000) // +1 seconde
      
      store.getState().updateLastLogin('admin')

      const updatedUser = store.getState().getUserById('admin')
      expect(updatedUser.lastLoginAt).not.toBe(originalLogin)
      expect(new Date(updatedUser.lastLoginAt).getTime()).toBeGreaterThan(new Date(originalLogin).getTime())
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      
      // Restaurer le temps
      vi.useRealTimers()
    })
  })

  describe('Initialisation et Logique Métier', () => {
    it('should initialize users with default users and enrichment', () => {
      const mockOrders = [
        { userId: 'admin', status: 'delivered', totalPrice: 25.50 },
        { userId: 'admin', status: 'pending', totalPrice: 15.00 },
        { userId: 'client', status: 'delivered', totalPrice: 35.75 }
      ]
      const mockReservations = [
        { userId: 'admin' },
        { userId: 'client' },
        { userId: 'client' }
      ]

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'registered-users') return '[]'
        if (key === 'admin-orders-v2') return JSON.stringify(mockOrders)
        if (key === 'admin-reservations') return JSON.stringify(mockReservations)
        if (key === 'admin-users') return 'old-data' // Pour tester le nettoyage
        return null
      })

      store.getState().initializeUsers()

      const users = store.getState().users
      expect(users).toHaveLength(2) // 2 default users
      
      // Check enrichissement admin
      const adminUser = users.find(u => u.id === 'admin')
      expect(adminUser.totalOrders).toBe(2)
      expect(adminUser.totalSpent).toBe(25.50) // Seulement les delivered
      expect(adminUser.totalReservations).toBe(1)
      
      // Check enrichissement client
      const clientUser = users.find(u => u.id === 'client')
      expect(clientUser.totalOrders).toBe(1)
      expect(clientUser.totalSpent).toBe(35.75)
      expect(clientUser.totalReservations).toBe(2)

      // Check nettoyage ancienne clé
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin-users')
    })

    it('should save user changes to localStorage correctly', () => {
      const testUsers = [
        { id: 'admin', name: 'Admin', role: 'admin' }, // Doit être filtré
        { id: 'client', name: 'Client', role: 'user' }, // Doit être filtré
        { id: 'user-123', name: 'Regular User', email: 'user@test.com', role: 'user', phone: '123456789' }
      ]

      store.getState().saveUserChangesToStorage(testUsers)

      // Check que seulement l'utilisateur non-par-défaut est sauvegardé
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'registered-users',
        expect.stringContaining('user-123')
      )
      
      // Check que les utilisateurs par défaut ne sont pas sauvegardés
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].id).toBe('user-123')
      expect(savedData[0].name).toBe('Regular User')
      expect(savedData[0].email).toBe('user@test.com')
      expect(savedData[0].role).toBe('user')
      expect(savedData[0].phone).toBe('123456789')
    })

    it('should merge registered users with default users', () => {
      const mockRegisteredUsers = [
        {
          id: 'user-456',
          email: 'newuser@test.com',
          name: 'New User',
          role: 'user',
          createdAt: '2024-01-15T10:00:00.000Z'
        }
      ]

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'registered-users') return JSON.stringify(mockRegisteredUsers)
        if (key === 'admin-orders-v2') return '[]'
        if (key === 'admin-reservations') return '[]'
        return null
      })

      store.getState().initializeUsers()

      const users = store.getState().users
      expect(users).toHaveLength(3) // 2 default + 1 registered
      
      const newUser = users.find(u => u.id === 'user-456')
      expect(newUser).toBeDefined()
      expect(newUser.name).toBe('New User')
      expect(newUser.isActive).toBe(true) // Valeur par défaut
      expect(newUser.emailVerified).toBe(false) // Valeur par défaut
    })

    it('should clean up old admin-users localStorage key', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'admin-users') return 'some-old-data'
        return '[]'
      })

      store.getState().initializeUsers()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin-users')
    })
  })

  describe('Getters et Filtres', () => {
    beforeEach(() => {
      // Setup test data
      store.setState({
        users: [
          { id: 'admin', name: 'Admin', email: 'admin@test.com', phone: '123456789', role: 'admin', isActive: true, emailVerified: true },
          { id: 'user1', name: 'John Doe', email: 'john@test.com', phone: '987654321', role: 'user', isActive: true, emailVerified: false },
          { id: 'user2', name: 'Jane Smith', email: 'jane@test.com', phone: '555666777', role: 'user', isActive: false, emailVerified: true },
          { id: 'user3', name: 'Bob Wilson', email: 'bob@test.com', phone: '111222333', role: 'user', isActive: true, emailVerified: false }
        ]
      })
    })

    it('should filter users correctly with all getters', () => {
      const { getUserById, getUsersByRole, getActiveUsers, getInactiveUsers } = store.getState()

      expect(getUserById('admin').name).toBe('Admin')
      expect(getUsersByRole('admin')).toHaveLength(1)
      expect(getUsersByRole('user')).toHaveLength(3)
      expect(getActiveUsers()).toHaveLength(3)
      expect(getInactiveUsers()).toHaveLength(1)
    })

    it('should search users by name, email, and phone', () => {
      const { searchUsers } = store.getState()

      expect(searchUsers('john')).toHaveLength(1)
      expect(searchUsers('john')[0].name).toBe('John Doe')
      
      expect(searchUsers('admin@test.com')).toHaveLength(1)
      expect(searchUsers('admin@test.com')[0].name).toBe('Admin')
      
      expect(searchUsers('555666777')).toHaveLength(1)
      expect(searchUsers('555666777')[0].name).toBe('Jane Smith')
      
      expect(searchUsers('test')).toHaveLength(4) // Tous ont 'test' dans l'email
      expect(searchUsers('nonexistent')).toHaveLength(0)
    })

    it('should get unverified users correctly', () => {
      const { getUnverifiedUsers } = store.getState()

      const unverified = getUnverifiedUsers()
      expect(unverified).toHaveLength(2)
      expect(unverified.map(u => u.name)).toEqual(['John Doe', 'Bob Wilson'])
    })
  })

  describe('Statistiques', () => {
    it('should calculate all user statistics correctly', () => {
      const testUsers = [
        { 
          id: 'admin', 
          role: 'admin', 
          isActive: true, 
          emailVerified: true,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 jours
          lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 jours
          totalSpent: 150.50,
          totalOrders: 5,
          totalReservations: 2
        },
        { 
          id: 'user1', 
          role: 'user', 
          isActive: true, 
          emailVerified: false,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 jours (hors période)
          lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 jours
          totalSpent: 75.25,
          totalOrders: 3,
          totalReservations: 1
        },
        { 
          id: 'user2', 
          role: 'user', 
          isActive: false, 
          emailVerified: true,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 jours
          lastLoginAt: null,
          totalSpent: 25.00,
          totalOrders: 1,
          totalReservations: 0
        }
      ]

      store.setState({ users: testUsers })

      const stats = store.getState().getUsersStats()

      expect(stats.total).toBe(3)
      expect(stats.active).toBe(2)
      expect(stats.inactive).toBe(1)
      expect(stats.admins).toBe(1)
      expect(stats.regularUsers).toBe(2)
      expect(stats.verified).toBe(2)
      expect(stats.unverified).toBe(1)
      expect(stats.newThisMonth).toBe(2) // admin et user2 créés dans les 30 jours
      expect(stats.activeThisMonth).toBe(2) // admin et user1 connectés dans les 30 jours
      expect(stats.totalRevenue).toBe(250.75) // 150.50 + 75.25 + 25.00
      expect(stats.totalOrders).toBe(9) // 5 + 3 + 1
      expect(stats.totalReservations).toBe(3) // 2 + 1 + 0
    })

    it('should handle empty users for statistics', () => {
      store.setState({ users: [] })

      const stats = store.getState().getUsersStats()

      expect(stats.total).toBe(0)
      expect(stats.active).toBe(0)
      expect(stats.inactive).toBe(0)
      expect(stats.admins).toBe(0)
      expect(stats.regularUsers).toBe(0)
      expect(stats.verified).toBe(0)
      expect(stats.unverified).toBe(0)
      expect(stats.newThisMonth).toBe(0)
      expect(stats.activeThisMonth).toBe(0)
      expect(stats.totalRevenue).toBe(0)
      expect(stats.totalOrders).toBe(0)
      expect(stats.totalReservations).toBe(0)
    })
  })

  describe('Management des Erreurs', () => {
    it('should handle errors in async actions and reset loading', async () => {
      // Simuler une erreur en mockant setTimeout pour throw
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn(() => {
        throw new Error('Test error')
      })

      const result = await store.getState().createUser({ name: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Test error')
      expect(store.getState().isLoading).toBe(false)

      // Restaurer setTimeout
      global.setTimeout = originalSetTimeout
    })
  })
})