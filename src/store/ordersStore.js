import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as ordersApi from '../api/ordersApi'
import { OrderService } from '../services/orders'

const useOrdersStore = create(
  persist(
    (set, get) => ({
      // State
      orders: [],
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Clear localStorage cache (useful after backend changes)
      clearCache: () => {
        set({ orders: [], error: null })
      },

      // Fetch orders based on role
      fetchOrders: async (isAdmin = false) => {
        // Admin always fetches fresh data, never use cache
        if (isAdmin) {
          // Clear state first to avoid showing stale data
          set({ orders: [], isLoading: true, error: null })

          try {
            const result = await ordersApi.getRecentOrders({ limit: 1000 })

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
            const errorMessage = error.error || 'Error loading orders'
            set({
              error: errorMessage,
              isLoading: false
            })
            return { success: false, error: errorMessage }
          }
        }

        // For non-admin users, check cache first
        const cachedOrders = get().orders
        if (cachedOrders.length > 0) {
          return { success: true }
        }

        // No cache, fetch from API
        set({ isLoading: true, error: null })

        try {
          const result = await ordersApi.getUserOrders()

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
          const errorMessage = error.error || 'Error loading orders'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Fetch specific order
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
          const errorMessage = error.error || 'Error loading order'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Create new order (called from cart)
      createOrder: async (orderData) => {
        set({ isLoading: true, error: null })

        try {
          // Note: Automatic payment logic (card = paid, cash = unpaid)
          // is now handled on the BACKEND
          const result = await ordersApi.createOrder(orderData)

          if (result.success) {
            // Add the new order to the store immediately
            set({
              orders: [result.data, ...get().orders],
              isLoading: false
            })
            return { success: true, orderId: result.data.id }
          } else {
            set({
              error: result.error,
              isLoading: false
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.error || 'Error creating order'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Update order status (admin)
      updateOrderStatus: async (orderId, newStatus) => {
        set({ isLoading: true, error: null })

        try {
          // Note: Automatic payment logic cash->paid when delivered
          // is now handled on the BACKEND
          const result = await ordersApi.updateOrderStatus(orderId, newStatus)

          if (result.success) {
            // Reload orders after update
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
          const errorMessage = error.error || 'Error updating status'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Delete order (admin)
      deleteOrder: async (orderId) => {
        set({ isLoading: true, error: null })

        try {
          const result = await ordersApi.deleteOrder(orderId)

          if (result.success) {
            // Remove order from local state
            set({
              orders: get().orders.filter(order => order.id !== orderId),
              isLoading: false
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
          const errorMessage = error.error || 'Error deleting order'
          set({
            error: errorMessage,
            isLoading: false
          })
          return { success: false, error: errorMessage }
        }
      },

      // Getters (local computations on loaded data)
      getOrdersByStatus: (status) => {
        return OrderService.filterByStatus(get().orders, status)
      },

      getOrdersByUser: (userId) => {
        return OrderService.filterByUser(get().orders, userId)
      },

      getTodaysOrders: () => {
        return OrderService.getTodaysOrders(get().orders)
      },

      // Statistics (computed locally)
      getOrdersStats: () => {
        return OrderService.calculateStats(get().orders)
      }
    }),
    {
      name: 'orders-storage-v2', // Changed name to force fresh cache
      partialize: (state) => ({
        orders: state.orders // Persist user's orders only
      }),
    }
  )
)

export default useOrdersStore
