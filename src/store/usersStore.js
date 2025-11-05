import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as usersApi from '../api/usersApi'

const useUsersStore = create(
  persist(
    (set, get) => ({
      // État
      users: [],
      isLoading: false,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      // Charger les utilisateurs depuis l'API
      initializeUsers: async () => {
        set({ isLoading: true })

        try {
          const result = await usersApi.getAllUsers()

          if (result.success) {
            set({
              users: result.data || [],
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Error loading users:', error)
          set({ isLoading: false })
        }
      },


      // Activer/désactiver un utilisateur
      toggleUserStatus: async (userId) => {
        set({ isLoading: true })

        try {
          // Find current user to get current status
          const user = get().users.find(u => u.id === userId || u._id === userId)
          if (!user) {
            throw new Error('User not found')
          }

          // Toggle isActive
          const result = await usersApi.updateUser(userId, {
            isActive: !user.isActive
          })

          if (result.success) {
            // Update local state
            const updatedUsers = get().users.map(u =>
              (u.id === userId || u._id === userId)
                ? { ...u, isActive: !u.isActive }
                : u
            )

            set({ users: updatedUsers, isLoading: false })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: result.error }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Changer le rôle d'un utilisateur
      updateUserRole: async (userId, newRole) => {
        set({ isLoading: true })

        try {
          // Update role via API
          const result = await usersApi.updateUser(userId, {
            role: newRole
          })

          if (result.success) {
            // Update local state
            const updatedUsers = get().users.map(user =>
              (user.id === userId || user._id === userId)
                ? { ...user, role: newRole }
                : user
            )

            set({ users: updatedUsers, isLoading: false })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: result.error }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Mettre à jour la dernière connexion (utilisé par authStore)
      updateLastLogin: (userId) => {
        const updatedUsers = get().users.map(user =>
          (user.id === userId || user._id === userId)
            ? { ...user, lastLoginAt: new Date().toISOString() }
            : user
        )

        set({ users: updatedUsers })
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
          if (!u.lastLogin) return false
          const lastLogin = new Date(u.lastLogin)
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