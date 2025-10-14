import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as ordersApi from '../api/ordersApi'

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

      // Helper to normalize order data from API
      normalizeOrder: (order) => {
        // Remove MongoDB _id from the spread to avoid conflicts
        const { _id, user, ...rest } = order

        return {
          ...rest,
          // ID normalization: use _id if present, fallback to id
          id: _id || order.id,
          // Price normalization
          totalPrice: order.totalPrice ?? 0,
          // User info normalization (handle both populated and plain formats)
          userId: order.userId || user?._id || 'unknown',
          userName: order.userName || user?.name || 'Unknown',
          userEmail: order.userEmail || user?.email || 'unknown@email.com',
          // Items normalization (ensure each item has normalized data)
          items: (order.items || []).map(item => ({
            ...item,
            id: item._id || item.id,
            // Remove _id from items to avoid conflicts
            _id: undefined
          })),
          // Remove _id from final object to avoid conflicts
          _id: undefined
        }
      },

      // Clear localStorage cache (useful after backend changes)
      clearCache: () => {
        set({ orders: [], error: null })
      },

      // Fetch orders based on role
      fetchOrders: async (isAdmin = false) => {
        set({ isLoading: true, error: null })

        try {
          const result = isAdmin
            ? await ordersApi.getAllOrders()
            : await ordersApi.getUserOrders()

          if (result.success) {
            const rawOrders = result.data || []
            const normalizedOrders = rawOrders.map(order => get().normalizeOrder(order))

            set({
              orders: normalizedOrders,
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
            // Normalize and add the new order to the store immediately
            const normalizedOrder = get().normalizeOrder(result.data)
            set({
              orders: [normalizedOrder, ...get().orders],
              isLoading: false
            })
            return { success: true, orderId: normalizedOrder.id }
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

      // Getters (local computations on loaded data)
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

      // Statistics (computed locally)
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
            .reduce((sum, order) => sum + order.totalPrice, 0)
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
