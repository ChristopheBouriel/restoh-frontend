import { toast } from 'react-hot-toast'
import useOrdersStore from '../store/ordersStore'
import { useAuth } from './useAuth'

export const useOrders = () => {
  const { user } = useAuth()
  const {
    orders: allOrders,
    getOrdersByUser,
    updateOrderStatus,
    getOrdersStats
  } = useOrdersStore()

  // Filter orders for logged-in user only
  const userOrders = user ? getOrdersByUser(user.id) : []

  const handleCancelOrder = async (orderId) => {
    if (!user) {
      toast.error('You must be logged in to cancel an order')
      throw new Error('User not authenticated')
    }

    try {
      const result = await updateOrderStatus(orderId, 'cancelled')
      if (result.success) {
        toast.success('Order cancelled')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Error cancelling order')
      throw error
    }
  }

  const handleConfirmCancellation = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      handleCancelOrder(orderId).catch(error => {
        // Error already handled in handleCancelOrder with toast
        console.error('Order cancellation failed:', error)
      })
      return true
    }
    return false
  }

  // Price formatting
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Date formatting
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('fr-FR')
  }

  // Function to determine if an order can be cancelled
  const canCancelOrder = (order) => {
    const cancelableStatuses = ['pending', 'confirmed', 'preparing']
    return cancelableStatuses.includes(order.status)
  }

  // Function to get recent orders (last 30 days)
  const getRecentOrders = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return userOrders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= thirtyDaysAgo
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  return {
    // State - logged-in user's orders only
    orders: userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    recentOrders: getRecentOrders(),

    // Actions with error handling
    cancelOrder: handleConfirmCancellation,

    // Utilities
    formatPrice,
    formatDate,
    formatDateTime,
    canCancelOrder,

    // User statistics
    totalOrders: userOrders.length,
    deliveredOrders: userOrders.filter(o => o.status === 'delivered').length,
    pendingOrders: userOrders.filter(o => o.status === 'pending').length,
    cancelledOrders: userOrders.filter(o => o.status === 'cancelled').length,
    totalSpent: userOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalPrice, 0)
  }
}