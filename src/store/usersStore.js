import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUsersStore = create(
  persist(
    (set, get) => ({
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
            name: 'Administrateur',
            role: 'admin',
            phone: '01 23 45 67 89',
            address: '456 Avenue de l\'Administration, 75008 Paris',
            isActive: true,
            emailVerified: true,
            createdAt: oneMonthAgo.toISOString(),
            lastLoginAt: today.toISOString(),
            password: 'hashed' // Placeholder, vraie valeur dans authStore
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
            password: 'hashed' // Placeholder, vraie valeur dans authStore
          }
        ]

        // Merge default users with registered users
        const allBaseUsers = [...defaultUsers]

        // Add registered users that are not already in defaults
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
          const totalSpent = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

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
        const registeredUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
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

      // Créer un nouvel utilisateur (appelé depuis l'inscription - cette méthode est maintenant principalement pour l'admin)
      createUser: async (userData) => {
        set({ isLoading: true })
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500))
          
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
          await new Promise(resolve => setTimeout(resolve, 500))
          
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
          await new Promise(resolve => setTimeout(resolve, 500))
          
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
          await new Promise(resolve => setTimeout(resolve, 500))
          
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

      // Mettre à jour la dernière connexion (utilisé par authStore)
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
    }),
    {
      name: 'users-storage',
      partialize: () => ({}), // Ne pas persister les users car ils sont recalculés dynamiquement
    }
  )
)

export default useUsersStore