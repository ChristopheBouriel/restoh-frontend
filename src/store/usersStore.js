import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as usersApi from '../api/usersApi'

const useUsersStore = create(
  persist(
    (set, get) => ({
      // État
      users: [],
      stats: null,
      isLoading: false,
      isLoadingStats: false,

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
            // Return full result with details and code for InlineAlert
            return result
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
            // Return full result with details and code for InlineAlert
            return result
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      // Supprimer un utilisateur
      deleteUser: async (userId) => {
        set({ isLoading: true })

        try {
          const result = await usersApi.deleteUser(userId)

          if (result.success) {
            // Remove user from local state
            const updatedUsers = get().users.filter(u =>
              u.id !== userId && u._id !== userId
            )

            set({ users: updatedUsers, isLoading: false })

            // Refresh stats after deletion
            get().fetchUsersStats()

            return { success: true }
          } else {
            set({ isLoading: false })
            // Return full result with details and code for InlineAlert
            return result
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

      // Charger les statistiques depuis l'API
      fetchUsersStats: async () => {
        set({ isLoadingStats: true })

        try {
          const result = await usersApi.getUsersStats()

          if (result.success) {
            set({
              stats: result.data,
              isLoadingStats: false
            })
          } else {
            set({ isLoadingStats: false })
          }
        } catch (error) {
          console.error('Error loading users stats:', error)
          set({ isLoadingStats: false })
        }
      },

      // Rafraîchir les statistiques dynamiquement
      refreshUserStats: () => {
        get().fetchUsersStats()
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
      }
    }),
    {
      name: 'users-storage',
      partialize: () => ({}), // Ne pas persister les users car ils sont recalculés dynamiquement
    }
  )
)

export default useUsersStore