import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as ordersApi from '../api/ordersApi'

const useOrdersStore = create(
  persist(
    (set, get) => ({
      // État
      orders: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Récupérer les commandes selon le rôle
      fetchOrders: async (isAdmin = false) => {
        set({ isLoading: true, error: null })

        try {
          const result = isAdmin
            ? await ordersApi.getAllOrders()
            : await ordersApi.getUserOrders()

          if (result.success) {
            set({
              orders: result.data || [],
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
          const errorMessage = error.error || 'Erreur lors du chargement des commandes'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Récupérer une commande spécifique
      fetchOrderById: async (orderId) => {
        set({ isLoading: true, error: null })

        try {
          const result = await ordersApi.getOrderById(orderId)

          if (result.success) {
            set({ isLoading: false, error: null })
            return { success: true, order: result.data }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors du chargement de la commande'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Créer une nouvelle commande (appelé depuis le panier)
      createOrder: async (orderData) => {
        set({ isLoading: true, error: null })

        try {
          // Note: La logique de paiement automatique (card = paid, cash = unpaid)
          // est maintenant gérée côté BACKEND
          const result = await ordersApi.createOrder(orderData)

          if (result.success) {
            // Recharger les commandes après création
            await get().fetchOrders()
            set({ isLoading: false })
            return { success: true, orderId: result.data._id || result.data.id }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la création de la commande'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Mettre à jour le statut d'une commande (admin)
      updateOrderStatus: async (orderId, newStatus) => {
        set({ isLoading: true, error: null })

        try {
          // Note: La logique de paiement automatique cash->paid quand delivered
          // est maintenant gérée côté BACKEND
          const result = await ordersApi.updateOrderStatus(orderId, newStatus)

          if (result.success) {
            // Recharger les commandes après mise à jour
            await get().fetchOrders(true) // true = admin
            set({ isLoading: false })
            return { success: true }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Erreur lors de la mise à jour du statut'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Getters (calculs locaux sur les données chargées)
      getOrdersByStatus: (status) => {
        return get().orders.filter(order => order.status === status)
      },

      getOrdersByUser: (userId) => {
        return get().orders.filter(order =>
          order.userId === userId || order.user?._id === userId
        )
      },

      getTodaysOrders: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().orders.filter(order =>
          order.createdAt.startsWith(today)
        )
      },

      // Statistiques (calculées localement)
      getOrdersStats: () => {
        const orders = get().orders
        return {
          total: orders.length,
          pending: orders.filter(o => o.status === 'pending').length,
          confirmed: orders.filter(o => o.status === 'confirmed').length,
          preparing: orders.filter(o => o.status === 'preparing').length,
          ready: orders.filter(o => o.status === 'ready').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length,
          totalRevenue: orders
            .filter(o => ['delivered'].includes(o.status))
            .reduce((sum, order) => sum + order.totalAmount, 0)
        }
      }
    }),
    {
      name: 'orders-storage',
      partialize: (state) => ({
        orders: state.orders
      }),
    }
  )
)

export default useOrdersStore
